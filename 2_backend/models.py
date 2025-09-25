from typing import List, Optional
from pydantic import BaseModel


class User(BaseModel):
    id: str  # Matches auth.users.id (UUID)
    email: Optional[str] = None  # Optional field from auth.users
    phone: Optional[str] = None  # Optional field from auth.users
    sessions: List[str] = []  # List of session_ids

    def user_profile(self):
        return f"""User information:\n
        - ID: {self.id}\n
        - Email: {self.email if self.email else 'N/A'}\n
        - Phone: {self.phone if self.phone else 'N/A'}\n
        """


class Session(BaseModel):
    session_id: str
    user_id: str  # References auth.users.id
    chat_history: List[dict] = []  # Serialized BaseMessage for storage


class Service(BaseModel):
    id: str
    service_id: str
    title: str
    url: str
    content: dict


class Message(BaseModel):
    role: str
    content: str
    type: Optional[str] = None
