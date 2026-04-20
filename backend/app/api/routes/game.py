
from fastapi import APIRouter, Body

from app.services.Game import GAME


router = APIRouter()

@router.post("/set_players")
def set_players(payload: list[str] = Body(...)):
    GAME.set_players(payload)
    return

@router.post("/add_station")
def add_station(payload: str = Body(...)):
    GAME.add_station(payload)
    return


