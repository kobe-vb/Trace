from fastapi import HTTPException, status
from app.services.Games import games
from app.services.Game import Game


def get_game(code: str) -> Game:
    """
    Dependency die een Game object ophaalt aan de hand van de code.
    Gooit een 404 als de game niet bestaat.
    """
    
    game = games.get_game(code)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game '{code}' niet gevonden"
        )
    return game
