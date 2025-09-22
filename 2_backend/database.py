from typing import List, Optional
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY
from .models import User, Session, Service
from langchain_core.messages import message_to_dict, messages_from_dict, BaseMessage

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_user(user_id: str) -> Optional[User]:
    # Query auth.users table directly
    response = client.auth.admin.get_user_by_id(user_id)
    if response.user:
        return User(id=response.user.id, email=response.user.email, phone=response.user.phone)
    return None

def save_user(user: User):
    # No need to save to custom table; auth.users is managed by Supabase Auth
    pass

def get_session(session_id: str) -> Optional[Session]:
    response = client.table('sessions').select('*').eq('session_id', session_id).execute()
    if response.data:
        return Session(**response.data[0])
    return None

def save_session(session: Session):
    data = session.dict()
    client.table('sessions').upsert(data).execute()

# Helpers for chat history serialization
def serialize_chat_history(history: List[BaseMessage]) -> List[dict]:
    return [message_to_dict(msg) for msg in history]

def deserialize_chat_history(serialized: List[dict]) -> List[BaseMessage]:
    return [messages_from_dict(d) for d in serialized]

# For services (fuzzy search handled in tools)
def get_services_with_similarity(query: str, threshold: float = 0.3, limit: int = 5) -> List[Service]:
    select_query = f"*, similarity(title, '{query}') as sim"
    response = client.table('services').select(select_query).gt('sim', threshold).order('sim', desc=True).limit(limit).execute()
    return [Service(**item) for item in response.data]