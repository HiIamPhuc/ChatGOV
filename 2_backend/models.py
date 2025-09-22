from typing import List, Optional
from pydantic import BaseModel
from langchain_core.messages import BaseMessage

class User(BaseModel):
    user_id: str
    sessions: List[str] = []  # List of session_ids

class Session(BaseModel):
    session_id: str
    user_id: str
    chat_history: List[dict] = []  # Serialized BaseMessage for storage

class Service(BaseModel):
    id: int
    title: str
    url: str
    content: str  # Assuming 'content' as other contents
    # Add other fields from CSV as needed

class Message(BaseModel):
    role: str
    content: str
    type: Optional[str] = None  # For LangChain message types