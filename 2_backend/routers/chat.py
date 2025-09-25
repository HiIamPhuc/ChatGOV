import uuid
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from .requests import StartSessionRequest, ChatRequest
from .profile import _select_profile, _skeleton
from ..database import (
    get_user,
    save_user,
    get_session,
    save_session,
    serialize_chat_history,
    deserialize_chat_history,
)
from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    AIMessage,
    AIMessageChunk,
    SystemMessage,
)
from typing import Any, List
from ..graph import compile_graph, ChatState
from ..models import Session, User
import asyncio

router = APIRouter()


@router.post("/api/chat/start_session")
async def start_session(request: StartSessionRequest = Body(...)):
    user = get_user(request.user_id)
    print(user)
    if not user:
        user = User(id=request.user_id)  # Create a minimal user object if not found

    session_id = str(uuid.uuid4())

    session = Session(session_id=session_id, user_id=request.user_id, chat_history=[])
    save_session(session)

    user.sessions.append(session_id)
    save_user(user)  # No-op since save_user is a pass

    return {"session_id": session_id}


def ensure_message_obj(obj: Any) -> BaseMessage:
    """
    Change obj (can be dict or BaseMessage) -> BaseMessage instance.
    Make ensure chat_history always list[BaseMessage].
    """
    if isinstance(obj, BaseMessage):
        return obj

    # obj expected to be dict like {"role": "...", "content": "..."}
    if isinstance(obj, dict):
        role = (obj.get("role") or obj.get("type") or "").lower()
        content = obj.get("content", "")
        if role in ("user", "human", "humanmessage"):
            return HumanMessage(content=str(content))
        if role in ("ai", "assistant", "aimessage"):
            return AIMessage(content=str(content))
        if role in ("system",):
            return SystemMessage(content=str(content))
        # fallback
        return AIMessage(content=str(content))

    # fallback: stringify
    return AIMessage(content=str(obj))


@router.post("/api/chat/")
async def chat(request: ChatRequest = Body(...)):
    """
    Handle chat interactions with AI assistant for government services.

    This endpoint processes user messages, maintains conversation history,
    and streams AI responses in real-time using Server-Sent Events (SSE).

    Args:
        request (ChatRequest): Contains the chat message and session information
            - message (str): User's input message
            - session_id (str): Unique identifier for the chat session

    Returns:
        StreamingResponse: Real-time streaming response with AI-generated content
            - Content-Type: text/event-stream
            - Format: Server-Sent Events (SSE) with "data:" prefix
            - Ends with: "data: [DONE]" marker

    Workflow:
        1. Validates and retrieves the chat session from database
        2. Loads user profile for personalized responses
        3. Compiles the LangGraph workflow for AI processing
        4. Deserializes and normalizes chat history to BaseMessage objects
        5. Appends new user message to conversation history
        6. Streams AI response tokens in real-time via SSE
        7. Saves updated conversation history to database

    Note:
        - Uses async streaming for better user experience
        - Automatically handles message type conversion
        - Gracefully handles errors during AI processing
        - Maintains conversation context across requests
    """
    session_data = get_session(request.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        user_profile = _select_profile(session_data.user_id)
    except Exception:
        user_profile = {}

    graph = compile_graph()
    raw_history = deserialize_chat_history(session_data.chat_history) or []
    chat_history: List[BaseMessage] = [ensure_message_obj(m) for m in raw_history]

    # Append user message as HumanMessage
    user_msg = HumanMessage(content=request.message)
    chat_history.append(user_msg)

    initial_state: ChatState = {
        "messages": chat_history,
        "user_profile": user_profile,
    }  # type: ignore

    async def stream_response():
        buffer = ""
        try:
            async for item in graph.astream(initial_state, stream_mode="messages"):
                if isinstance(item, tuple) and len(item) >= 1:
                    token, *rest = item
                    if isinstance(token, AIMessageChunk):
                        token_content = token.content
                        if isinstance(token_content, list):
                            token_piece = "".join(map(str, token_content))
                        else:
                            token_piece = str(token_content)
                    else:
                        token_piece = str(token)

                    for line in token_piece.splitlines() or [""]:
                        yield f"data: {line}\n"
                    yield "\n"
                    buffer += token_piece
                    # loop flush
                    await asyncio.sleep(0)

                else:
                    state = item
                    if isinstance(state, dict) and state.get("messages"):
                        last = state["messages"][-1]
                        content = ""
                        if isinstance(last, BaseMessage):
                            # last.content có thể là str hoặc list
                            c = getattr(last, "content", "")
                            content = (
                                "".join(map(str, c)) if isinstance(c, list) else str(c)
                            )
                        elif isinstance(last, dict):
                            content = str(last.get("content", ""))
                        else:
                            content = str(last)
                        # stream whole content chunk (best-effort)
                        for line in content.splitlines() or [""]:
                            yield f"data: {line}\n"
                        yield "\n"
                        buffer += content
                        await asyncio.sleep(0)
                    else:
                        # nothing to emit this step
                        await asyncio.sleep(0)

            # emit marker [DONE] để client biết kết thúc
            yield "data: [DONE]\n\n"

            try:
                final_messages = initial_state.get("messages", [])  # type: ignore
                final_msgs_objs = [ensure_message_obj(m) for m in final_messages]

                if buffer:
                    final_msgs_objs.append(AIMessage(content=buffer))

                # serialize và save
                session_data.chat_history = serialize_chat_history(final_msgs_objs)
                save_session(session_data)
            except Exception:
                chat_history.append(AIMessage(content=buffer))
                session_data.chat_history = serialize_chat_history(chat_history)
                save_session(session_data)

        except Exception as e:
            for line in str(e).splitlines() or [""]:
                yield f"data: ERROR: {line}\n"
            yield "\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")
