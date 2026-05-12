from app.schemas.schemas import Participant, Ranking
from app.services.Player import Player
from app.services.PairingService import PairingService
from app.services.StationService import StationService

import asyncio
import functools

def locked(method):
    @functools.wraps(method)
    async def wrapper(self, *args, **kwargs):
        async with self._lock:
            return await method(self, *args, **kwargs)
    return wrapper

class Game:
    def __init__(self):
        
        self._lock = asyncio.Lock()
        self.players: dict[str, Player] = {}
        self.pairing = PairingService()
        self.stations = StationService()
                
    @locked
    async def add_station(self, station: str):
        self.stations.add_station(station)
    
    @locked
    async def get_player_station(self, player_name: str) -> str | None:
        return self.stations.get_player_station(player_name)
    
    @locked
    async def get_player_round(self, player_name: str) -> str | None:
        return self.players[player_name].round_index

    @locked
    async def get_player_code(self, player_name: str) -> str | None:
        return self.players[player_name].round.code

    @locked
    async def set_players(self, participants: list[Participant]):
        for participant in participants:
            self.players[participant.id] = Player(participant.name)
        self._start_game()

    def _start_game(self):
        for id in self.players.keys():
            self.pairing.add_to_queue(id, self.players)
            self.stations.move_player_to_next_station(id)

    # --- Gameplay ---

    @locked
    async def get_player_tip(self, player_id: str) -> str:
        return self.players[player_id].get_tip()

    @locked
    async def submit_code(self, player_id: str, code: str) -> bool:
        player = self.players[player_id]
        if player.round.is_correct_code(code):
            self._progress_to_next_round(player_id)
            return True
        return False

    @locked
    async def get_redirect_url(self, player_id: str, station: str) -> str:
        if not self.stations.is_player_at_station(player_id, station):
            return f"/error?station={station}"

        self.stations.move_player_to_next_station(player_id)

        player = self.players[player_id]

        if player.round_index >= 10:
            return f"/win?station={station}&player_name={player.name}"
        if player.have_all_tips():
            return f"/code/{player.round.url}?station={station}&player={player_id}"
        return f"/tips?station={station}&player={player_id}"

    def _progress_to_next_round(self, player_id: str):
        
        player: Player = self.players[player_id]
        partner_id: str | None = player.previous_partners[-1] if player.previous_partners else None
        
        self.pairing.add_to_queue(player_id, self.players)
        
        if not player.has_partner or not partner_id:
            return
        self.pairing.add_to_queue(partner_id, self.players)
        
    def get_ranking(self) -> list[Ranking]:
        ranking: list[Ranking] = []
        for player in self.players.values():
            ranking.append(Ranking(
            player_name=player.name,
            partner_name=self.players[player.previous_partners[-1]].name if (player.previous_partners and player.has_partner) else None,
            player_character=player.round.character if player.round else "",
            rounds_completed=player.round_index,
            round_started_at=player.round_started_at
            ))
            
        return sorted(ranking, key=lambda r: (-r.rounds_completed, r.round_started_at))

    @locked
    async def reset_tips(self, player_id: str):
        
        player = self.players[player_id]
        player.reset_tips()
        if not player.has_partner:
            return
        
        partner_id = player.previous_partners[-1]
        partner = self.players[partner_id]
        partner.reset_tips()
