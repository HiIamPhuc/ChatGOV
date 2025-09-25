import uuid
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from .requests import StartSessionRequest, ChatRequest
from .profile import _select_profile, _skeleton
from ..database import get_user, save_user, get_session, save_session, serialize_chat_history, deserialize_chat_history
from ..graph import compile_graph, ChatState
from ..models import Session, User

router = APIRouter()

@router.post("/api/chat/start_session")
async def start_session(request: StartSessionRequest = Body(...)):
    user = get_user(request.user_id)
    print(user)
    if not user:
        user = User(id=request.user_id)  # Create a minimal user object if not found
    
    session_id = str(uuid.uuid4())
    
    session = Session(
        session_id=session_id,
        user_id=request.user_id,
        chat_history=[]
    )
    save_session(session)
    
    user.sessions.append(session_id)
    save_user(user)  # No-op since save_user is a pass
    
    return {"session_id": session_id}

@router.post("/api/chat/")
async def chat(request: ChatRequest = Body(...)):
    session_data = get_session(request.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get user profile for personalization using the profile module
    try:
        user_profile = _select_profile(session_data.user_id)
    except:
        user_profile = {}
    
    graph = compile_graph()
    
    chat_history = deserialize_chat_history(session_data.chat_history)
    user_message = {"role": "user", "content": request.message, "type": "human"}
    
    initial_state: ChatState = {
        "messages": chat_history + [user_message],
        "user_profile": user_profile
    }

    async def stream_response():
        final_state = None
        async for step in graph.astream(initial_state, stream_mode="values"):
            final_state = step
            if final_state and final_state["messages"]:
                # Yield the latest AI message content as it updates
                last_message = final_state["messages"][-1]
                if last_message.type == "ai":
                    yield f"data: {last_message.content}\n\n"
        
        if not final_state:
            yield f"data: {HTTPException(status_code=500, detail='Graph execution failed').detail}\n\n"
            return
        
        # Update and save chat history after streaming
        session_data.chat_history = serialize_chat_history(final_state["messages"])
        save_session(session_data)

    return StreamingResponse(stream_response(), media_type="text/event-stream")