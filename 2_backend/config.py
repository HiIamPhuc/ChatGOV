import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="./2_backend/.env")

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("Please set GOOGLE_API_KEY in environment or .env file.")

if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
    raise ValueError(
        "Please set SUPABASE_URL and SUPABASE_KEY in environment or .env file."
    )

MODE = os.getenv("MODE", "dev")  # 'dev' or 'prod'

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

WEBSITE_NAME = "Cổng Dịch vụ công Bộ Công an"
WEBSITE_URL = "https://dichvucong.bocongan.gov.vn/"