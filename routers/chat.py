from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, AIMessageChunk
import uuid
import json
from fastapi import APIRouter, HTTPException, Body, Request
from fastapi.responses import StreamingResponse
from routers.requests import StartSessionRequest, ChatRequest
from routers.profile import _select_profile, _skeleton, _get_current_user
from database import (
    get_user,
    save_user,
    get_session,
    save_session,
    serialize_chat_history,
    deserialize_chat_history,
)
from graph import compile_graph, ChatState
from models import Session, User

router = APIRouter()


@router.post("/api/chat/start_session")
async def start_session(request: Request, _: StartSessionRequest = Body(None)):
    uid, _ = _get_current_user(request)

    user = get_user(uid) or User(id=uid)
    session_id = str(uuid.uuid4())

    session = Session(session_id=session_id, user_id=uid, chat_history=[])
    save_session(session)

    user.sessions.append(session_id)
    save_user(user)

    return {"session_id": session_id}


@router.post("/api/chat/")
async def chat(request: Request, payload: ChatRequest = Body(...)):
    uid, _ = _get_current_user(request)
    
    session_data = get_session(payload.session_id)
    if not session_data or session_data.user_id != uid:
        raise HTTPException(status_code=404, detail="Session not found")

    # Hồ sơ người dùng (nếu có)
    try:
        user_profile = _select_profile(session_data.user_id)
    except Exception:
        user_profile = {}

    graph = compile_graph()

    chat_history = deserialize_chat_history(session_data.chat_history)
    user_message = {"role": "user", "content": payload.message, "type": "human"}

    initial_state: ChatState = {
        "messages": chat_history + [user_message],
        "user_profile": user_profile,
    }

    async def stream_response():
        final_state = None

        # Chuẩn hoá message objects để graph không nhận dict lẫn BaseMessage
        try:
            normalized_msgs = [
                _ensure_message_obj(m) for m in initial_state["messages"]
            ]  # type: ignore
            initial_state["messages"] = normalized_msgs  # type: ignore
        except Exception:
            pass

        last_streamed_text = ""

        async for step in graph.astream(initial_state, stream_mode="values"):
            final_state = step
            if final_state and final_state.get("messages"):
                last_message = final_state["messages"][-1]
                full_text = _extract_text(last_message, ai_only=True)
                if full_text is None:
                    continue

                # Chỉ stream phần mới (delta)
                if len(full_text) > len(last_streamed_text):
                    delta = full_text[len(last_streamed_text) :]
                    last_streamed_text = full_text

                    # Gửi JSON để FE dễ ghép chuỗi
                    chunk = {"delta": delta}
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

        if not final_state:
            yield f"data: {HTTPException(status_code=500, detail='Graph execution failed').detail}\n\n"
            return

        # Lưu lịch sử chat
        try:
            final_msgs = [_ensure_message_obj(m) for m in final_state["messages"]]
            session_data.chat_history = serialize_chat_history(final_msgs)
            save_session(session_data)
        except Exception:
            session_data.chat_history = serialize_chat_history(final_state["messages"])
            save_session(session_data)

        # Kết thúc stream
        try:
            yield "data: [DONE]\n\n"
        except Exception:
            pass

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# === Helpers ===
def _ensure_message_obj(obj):
    """dict/BaseMessage -> BaseMessage"""
    if isinstance(obj, BaseMessage):
        return obj
    if isinstance(obj, dict):
        role = (obj.get("role") or obj.get("type") or "").lower()
        content = obj.get("content", "")
        if role in ("user", "human", "humanmessage"):
            return HumanMessage(content=str(content))
        if role in ("ai", "assistant", "aimessage"):
            return AIMessage(content=str(content))
        return AIMessage(content=str(content))
    return AIMessage(content=str(obj))


def _extract_text(msg, ai_only: bool = False) -> str | None:
    """Lấy text hiển thị từ nhiều kiểu (AIMessage, AIMessageChunk, dict...)."""
    try:
        if isinstance(msg, AIMessageChunk):
            c = getattr(msg, "content", "")
            return "".join(map(str, c)) if isinstance(c, list) else str(c or "")
        if isinstance(msg, BaseMessage):
            if ai_only and not isinstance(msg, AIMessage):
                return None
            c = getattr(msg, "content", "")
            return "".join(map(str, c)) if isinstance(c, list) else str(c or "")
        if isinstance(msg, dict):
            if ai_only:
                t = (msg.get("type") or msg.get("role") or "").lower()
                if t not in ("ai", "assistant"):
                    return None
            c = msg.get("content", "")
            return "".join(map(str, c)) if isinstance(c, list) else str(c or "")
    except Exception:
        return None
    return None
