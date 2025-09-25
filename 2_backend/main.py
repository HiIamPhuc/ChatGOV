from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import chat, graph, auth, profile, sessions
# from .config import llm, embeddings  # Ensure initialized; embeddings not used now, but keep for potential future

app = FastAPI()

# CORS settings
ALLOWED_ORIGINS = (os.getenv("CORS_ALLOW_ORIGINS")
                   or "http://localhost:5173").split(",")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,                 # để gửi cookie HttpOnly
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(graph.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(sessions.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Nothing specific
    yield
    # Shutdown: No cleanup needed for Supabase

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
