import random


class StationService:
    def __init__(self):
        self.stations: dict[str, list[str]] = {}

    def add_station(self, station: str):
        self.stations[station] = []

    def move_player_to_next_station(self, player_id: str):
        current_station: str = self._remove_player_from_current_station(player_id)
        target = self._get_least_crowded_station(exclude=current_station)
        self.stations[target].append(player_id)

    def is_player_at_station(self, player_id: str, station: str) -> bool:
        print(self.stations)
        return player_id in self.stations.get(station, [])
    
    def get_player_station(self, player_id: str) -> str | None:
        for station, players in self.stations.items():
            if player_id in players:
                return station
        return None

    def _remove_player_from_current_station(self, player_id: str) -> str | None:
        for station, players in self.stations.items():
            if player_id in players:
                players.remove(player_id)
                return station
        return None

    def _get_least_crowded_station(self, exclude: str | None = None) -> str:
        if not self.stations:
            raise ValueError("No stations available")

        total = sum(len(p) for p in self.stations.values())
        average = total / len(self.stations)

        below_average = [s for s, p in self.stations.items() if len(p) < average and s != exclude]
        if below_average:
            return random.choice(below_average)

        pool = [s for s, p in self.stations.items() if s != exclude]
        if not pool:
            raise ValueError("No stations available to move to")
        return random.choice(pool)