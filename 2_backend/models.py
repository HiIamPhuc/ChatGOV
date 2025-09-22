# app/models.py
from typing import List, Optional
from pydantic import BaseModel
from langchain_core.messages import BaseMessage

class User(BaseModel):
    id: str  # Matches auth.users.id (UUID)
    email: Optional[str] = None  # Optional field from auth.users
    phone: Optional[str] = None  # Optional field from auth.users
    sessions: List[str] = []  # List of session_ids

class Session(BaseModel):
    session_id: str
    user_id: str  # References auth.users.id
    chat_history: List[dict] = []  # Serialized BaseMessage for storage

class Service(BaseModel):
    id: str
    service_id: str
    title: str
    url: str
    content: dict  # Changed to dict for JSON compatibility

class Message(BaseModel):
    role: str
    content: str
    type: Optional[str] = None  # For LangChain message types