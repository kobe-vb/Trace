from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Body, Depends, FastAPI, Request

from app.schemas.schemas import Participant, Ranking
from app.services.Game import Game
from app.services.Logger import log

@asynccontextmanager
async def lifespan(app: FastAPI):
    game = Game()
    
    # TODO: clean up
    await game.add_station("station 1")
    await game.add_station("station 2")
    await game.add_station("station 3")
    
    player: list[Participant] = []
    for i in range(5):
        player.append(Participant(id=str(i), name=f"Player {i}"))
    await game.set_players(player)
    app.state.game = game
    yield

async def get_game(request: Request) -> Game:
    return request.app.state.game

GameDep = Annotated[Game, Depends(get_game)]


router = APIRouter()


@router.post("/set_players")
async def set_players(payload: list[Participant], game: GameDep = None):
    print("Setting players:", payload)
    await game.set_players(payload)


@router.post("/add_station")
async def add_station(payload: str = Body(...), game: GameDep = None):
    await game.add_station(payload)


@router.get("/get_redirect_url/{player_name}/{station}")
async def get_redirect_url(player_name: str, station: str, game: GameDep = None):
    redirect_url = await game.get_redirect_url(player_name, station)
    print(f"Redirect URL for player {player_name} at station {station}: {redirect_url}")
    return redirect_url


@router.get("/tip/{player_name}")
async def get_tip(player_name: str, game: GameDep = None):
    tip = await game.get_player_tip(player_name)
    await log(f"Player {player_name} received tip: {tip}")
    return tip


@router.get("/next_station/{player_name}")
async def next_station(player_name: str, game: GameDep = None):
    return await game.get_player_station(player_name)


@router.get("/round/{player_name}")
async def get_round(player_name: str, game: GameDep = None):
    return await game.get_player_round(player_name)


@router.get("/code/{player_name}")
async def get_code(player_name: str, game: GameDep = None):
    return await game.get_player_code(player_name)


@router.post("/submit_code/{player_name}")
async def submit_code(player_name: str, payload: str = Body(...), game: GameDep = None):
    return await game.submit_code(player_name, payload)

@router.get("/ranking", response_model=list[Ranking])
async def get_ranking(game: GameDep = None):
    return game.get_ranking()

@router.post("/reset/tips/{player_id}")
async def reset_tips(player_id: str, game: GameDep = None):
    await game.reset_tips(player_id)