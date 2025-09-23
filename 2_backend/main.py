from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routers import chat, graph
# from .config import llm, embeddings  # Ensure initialized; embeddings not used now, but keep for potential future

app = FastAPI()

app.include_router(chat.router)
app.include_router(graph.router)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Nothing specific
    yield
    # Shutdown: No cleanup needed for Supabase

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)