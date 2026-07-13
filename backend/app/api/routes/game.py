from contextlib import asynccontextmanager
from typing import Annotated
import io

import csv
from fastapi import APIRouter, Body, Depends, FastAPI, Request, UploadFile, File, HTTPException

from app.schemas.schemas import Participant, Ranking
from app.services.Game import Game
from app.services.Logger import log
from app.services.rounds.GroupQuiz import GroupQuiz, ParticipantData

@asynccontextmanager
async def lifespan(app: FastAPI):
    game = Game()
    
    await game.add_station("station 1")
    await game.add_station("station 2")
    # await game.add_station("station 3")
    
    # await game.set_players([Participant(id="1", name="Player 1"), Participant(id="2", name="Player 2"), Participant(id="3", name="Player 3"), Participant(id="4", name="Player 4"), Participant(id="5", name="Player 5")], mode="classic")

    app.state.game = game
    yield

async def get_game(request: Request) -> Game:
    return request.app.state.game

GameDep = Annotated[Game, Depends(get_game)]


router = APIRouter()


@router.post("/set_players")
async def set_players(payload: list[Participant], mode: str = "classic", game: GameDep = None):
    print("Setting players:", payload, "mode:", mode)
    await game.set_players(payload, mode=mode)


@router.post("/add_station")
async def add_station(payload: str = Body(...), game: GameDep = None):
    await game.add_station(payload)
    
@router.post("/set_characters")
async def set_characters(payload: list[str], game: GameDep = None):
    await game.set_characters(payload)

@router.get("/get_redirect_url/{player_id}/{station}")
async def get_redirect_url(player_id: str, station: str, game: GameDep = None):
    return await game.get_redirect_url(player_id, station)
    
@router.get("/tip/{player_id}")
async def get_tip(player_id: str, game: GameDep = None):
    tip = await game.get_player_tip(player_id)
    await log(f"Player {player_id} received tip: {tip}")
    return tip


@router.get("/next_station/{player_id}")
async def next_station(player_id: str, game: GameDep = None):
    return await game.get_player_station(player_id)


@router.get("/round/{player_id}")
async def get_round(player_id: str, game: GameDep = None):
    return await game.get_player_round(player_id)


@router.get("/code/{player_id}")
async def get_code(player_id: str, game: GameDep = None):
    return await game.get_player_code(player_id)


@router.post("/submit_code/{player_name}")
async def submit_code(player_name: str, payload: str = Body(...), game: GameDep = None):
    return await game.submit_code(player_name, payload)

@router.get("/ranking", response_model=list[Ranking])
async def get_ranking(game: GameDep = None):
    return game.get_ranking()

@router.post("/reset/tips/{player_id}")
async def reset_tips(player_id: str, game: GameDep = None):
    await game.reset_tips(player_id)

@router.post("/leave/{player_id}")
async def leave_game(player_id: str, game: GameDep = None):
    await game.leave_game(player_id)

@router.get("/verify_partner/{player_id}/{scanned_id}")
async def verify_partner(player_id: str, scanned_id: str, game: GameDep = None):
    return await game.verify_partner(player_id, scanned_id)


@router.post("/upload_participants")
async def upload_participants(file: UploadFile = File(...)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Alleen .csv bestanden worden ondersteund")

    contents = await file.read()

    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV heeft geen headers")

    # eerste 3 kolommen vast: tijdstempel, naam, geslacht
    # rest = vragen
    base_fields = reader.fieldnames[:3]
    question_headers = reader.fieldnames[3:]

    participants = []

    for row in reader:
        name = (row.get(base_fields[1]) or "").strip()
        if not name:
            continue

        gender = (row.get(base_fields[2]) or "M").strip().upper()

        answers = {}
        for question in question_headers:
            val = row.get(question)
            if val:
                answers[question] = val.strip()

        participants.append(
            ParticipantData(
                name=name,
                gender=gender,
                answers=answers
            )
        )

    GroupQuiz.set_participants(participants)

    return {"count": len(participants), "names": [p.name for p in participants]}