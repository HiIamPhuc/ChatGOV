import os
from dotenv import load_dotenv

load_dotenv(
    dotenv_path="/home/aaronpham/Coding/AI_thuc_chien/AI_Wrapper-WebPage/2_backend/.env"
)

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("Please set GOOGLE_API_KEY in environment or .env file.")

if not os.getenv("LANGSMITH_API_KEY") or not os.getenv("LANGSMITH_TRACING"):
    raise ValueError(
        "Please set LANGSMITH_API_KEY and LANGSMITH_TRACING in environment or .env file."
    )

if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
    raise ValueError(
        "Please set SUPABASE_URL and SUPABASE_KEY in environment or .env file."
    )

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_TRACING = os.getenv("LANGSMITH_TRACING")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

WEBSITE_NAME = "Cổng Dịch vụ công Quốc gia"
