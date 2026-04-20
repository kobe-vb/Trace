

from app.services.Player import Player


class Game:
    def __init__(self):
        self.players: list[Player] = []
        self.stations: list[str] = []

    def set_players(self, players: list[str]):
        for player in players:
            self.players.append(Player(player))
    
    def add_station(self, station: str):
        self.stations.append(station)
        print(f"station added: {station}, total stations: {len(self.stations)}")
            
GAME = Game()