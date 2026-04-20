from app.schemas.schemas import GameSettings, Player, PlayerName, Question, RoleInfo
from app.services.Game import Game

class Games:
    def __init__(self):
        self.games: dict[str, Game] = {}
        self.number_of_games = 0
    
    def clean_inactive_games(self):
        inactive = [code for code, game in self.games.items() if game.is_inactive()]
        for code in inactive:
            self.remove_game(code)
    
    def remove_game(self, code: str):
        print(f"Removing game {code}")
        if code in self.games:
            del self.games[code]
    
    def _generate_game_code(self):
        self.number_of_games += 1
        return f"{self.number_of_games - 1:03d}"

    def create_game(self, players: list[PlayerName], settings: GameSettings, roles: list[RoleInfo], questions: list[Question]) -> str:
        self.clean_inactive_games()
        code = self._generate_game_code()
        game = Game(code, players, settings, roles, questions)
        self.games[code] = game
        return code
    
    def is_valid_game_code(self, code: str) -> bool:
        return code in self.games
    
    def get_game(self, code: str) -> Game | None:
        return self.games.get(code)

games: Games = Games()