import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Path, Body
from pydantic import BaseModel, Field
from ..database import client, get_user, save_user, get_session, save_session, deserialize_chat_history
from ..models import Session

router = APIRouter()


class SessionOut(BaseModel):
    session_id: str
    user_id: str
    title: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_message_preview: Optional[str] = None
    messages_count: int = 0


class RenameRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


def _now_iso():
    return datetime.datetime.utcnow().isoformat() + "Z"


@router.get("/api/chat/sessions", response_model=List[SessionOut])
def list_sessions(user_id: str = Query(..., description="auth.users.id")):
    """
    Trả danh sách sessions của user. Không sửa API cũ.
    Lọc deleted=false, ưu tiên theo user.sessions nếu có; sort updated_at desc.
    """
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        sess_ids = user.sessions or []
        if sess_ids:
            resp = client.table("sessions").select(
                "*").in_("session_id", sess_ids).eq("deleted", False).execute()  # type: ignore
        else:
            resp = client.table("sessions").select(
                "*").eq("user_id", user_id).eq("deleted", False).execute()  # type: ignore

        rows = resp.data or []
        out: List[SessionOut] = []
        for r in rows:
            sid = r["session_id"]
            try:
                messages = deserialize_chat_history(
                    r.get("chat_history") or [])
            except Exception:
                messages = []
            out.append(SessionOut(
                session_id=sid,
                user_id=r.get("user_id"),
                title=r.get("title"),
                created_at=r.get("created_at"),
                updated_at=r.get("updated_at") or r.get("last_updated_at"),
                last_message_preview=(messages and str(
                    messages[-1].content)[:180]) or None,
                messages_count=len(messages),
            ))

        out.sort(key=lambda x: (x.updated_at or x.created_at or ""), reverse=True)
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)
                            or "Failed to list sessions")


@router.get("/api/chat/history")
def get_history(session_id: str = Query(...)):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        messages = deserialize_chat_history(sess.chat_history or [])
        return {
            "session_id": session_id,
            "messages": [
                {"role": getattr(m, "role", getattr(
                    m, "type", "assistant")), "content": m.content}
                for m in messages
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)
                            or "Failed to read history")


@router.put("/api/chat/sessions/{session_id}/title")
def rename_session(session_id: str = Path(...), payload: RenameRequest = Body(...)):
    try:
        if not get_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        client.table("sessions").update({"title": payload.title}).eq(
            "session_id", session_id).execute()  # type: ignore
        return {"ok": True, "session_id": session_id, "title": payload.title}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)
                            or "Failed to rename session")


@router.delete("/api/chat/sessions/{session_id}")
def delete_session(session_id: str = Path(...), user_id: str = Query(...)):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.sessions = [s for s in (user.sessions or []) if s != session_id]
        save_user(user)
        try:
            client.table("sessions").update({"deleted": True}).eq(
                "session_id", session_id).eq("user_id", user_id).execute()  # type: ignore
        except Exception:
            pass
        return {"ok": True, "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)
                            or "Failed to delete session")
