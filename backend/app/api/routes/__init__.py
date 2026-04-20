from fastapi import APIRouter
from .game import router as game_router

api_router = APIRouter()

api_router.include_router(game_router, prefix="/game", tags=["game"])

