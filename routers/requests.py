from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    pass
    #user_id: str  # Should be the auth.users.id (UUID)


class ChatRequest(BaseModel):
    session_id: str
    message: str
