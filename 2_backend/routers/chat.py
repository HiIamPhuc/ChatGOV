import uuid
from fastapi import APIRouter, HTTPException, Body
from .requests import StartSessionRequest, ChatRequest
from ..database import get_user, save_user, get_session, save_session, serialize_chat_history, deserialize_chat_history
from ..graph import compile_graph, MessagesState
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
    
    graph = compile_graph()
    
    chat_history = deserialize_chat_history(session_data.chat_history)
    user_message = {"role": "user", "content": request.message, "type": "human"}
    
    initial_state: MessagesState = {
        "messages": chat_history + [user_message],
    }
    final_state = []
    for step in graph.stream(initial_state, stream_mode="values"):
        final_state = step
    
    if not final_state:
        raise HTTPException(status_code=500, detail="Graph execution failed")
    
    ai_response = final_state["messages"][-1].content if final_state["messages"][-1].type == "ai" else "No response generated."
    
    # Update and save chat history
    session_data.chat_history = serialize_chat_history(final_state["messages"])
    save_session(session_data)
    
    return {"response": ai_response}