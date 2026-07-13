from __future__ import annotations
from typing import TYPE_CHECKING

from app.services.Characters import Characters
from app.services.Logger import log

if TYPE_CHECKING:
    from app.services.Player import Player


class PairingService:
    def __init__(self):
        self.queue: list[str] = []
        self.characters: Characters = Characters()
    
    def clear(self):
        self.queue.clear()
        self.characters.clear()
    

    def _add_to_queue(self, player_id: str, players: dict[str, Player], with_round: bool = True):

        if players[player_id].left_game:
            if player_id in self.queue:
                self.queue.remove(player_id)
            return None

        partner_name = self._find_partner(player_id, players)

        if partner_name:
            self.queue.remove(partner_name)
            print(f"{player_id}: Found partner {partner_name}\t Queue is now: {self.queue}")
            self._do_pairing(player_id, partner_name, players)
            return partner_name

        # Geen partner gevonden → in queue, maak eigen round aan
        if player_id not in self.queue:
            self.queue.append(player_id)
        print(f"{player_id}: no partner found.\t Queue is now: {self.queue}")
        if with_round:
            players[player_id].start_new_round(self.characters.get_random_character())
        return None

    def add_to_queue(self, player_id: str, players: dict[str, Player]):
        self._add_to_queue(player_id, players, with_round=True)

    def add_lonly_player_to_queue(self, player_id: str, players: dict[str, Player]):
        self._add_to_queue(player_id, players, with_round=False)

    def _find_partner(self, player_id: str, players: dict[str, Player]) -> str | None:
        player = players[player_id]

        for candidate in self.queue:
            if candidate == player_id:
                continue
            if players[candidate].left_game:
                continue
            if players[candidate].tip_index >= 1:
                return candidate
            if candidate not in player.previous_partners:
                return candidate
        
        if len(self.queue) >= len(players) / 2:
            return self.queue[0]  # fallback: pair with first in queue

        return None
    
    def _do_pairing(self, player_id: str, partner_id: str, players: dict[str, Player]):
        player = players[player_id]
        partner = players[partner_id]

        player.set_partner(partner_id)
        partner.set_partner(player_id)

        # Speler deelt de round van de partner die al in de queue zat
        player.set_round(partner.round)