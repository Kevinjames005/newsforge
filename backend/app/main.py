from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes.generation import router as generation_router
from app.api.routes.articles import router as articles_router

app = FastAPI(title="NewsForge AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generation_router)
app.include_router(articles_router)


@app.get("/health")
def health():
    return {"status": "ok"}
