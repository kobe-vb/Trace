from __future__ import annotations
from datetime import datetime
import random
from typing import TYPE_CHECKING

from app.services.rounds import get_all_rounds, get_groupQuiz_rounds

if TYPE_CHECKING:
    from app.services.rounds.Round import Round


class Player:
    def __init__(self, name: str, mode: str = "classic"):
        self.name: str = name
        self.mode: str = mode  # "classic" of "groupQuiz"

        self.previous_partners: list[str] = []
        self.has_partner: bool = False
        
        self.tip_index: int = 0
        self.has_character: bool = False
        
        self.possible_rounds: list[type[Round]] = self._load_rounds()
        self.round: Round | None = None
        self.round_index: int = 0
        self.round_started_at = datetime.now()
        
        self.left_game: bool = False
        

    def _load_rounds(self) -> list:
        if self.mode == "groupQuiz":
            return get_groupQuiz_rounds().copy()
        return get_all_rounds().copy()

    def reset_tips(self):
        self.tip_index = 0
        self.has_character = False
        if self.round:
            self.round.reset_tips()
    
    def set_partner(self, partner_id: str):
        self.previous_partners.append(partner_id)
        self.has_partner = True

    def start_new_round(self, character: str):
        self._next_round()
        
        if not self.possible_rounds:
            self.possible_rounds = self._load_rounds()
        
        round_class = random.choice(self.possible_rounds)
        self.round = round_class(character)
        self.possible_rounds.remove(round_class)
        self.has_partner = False

    def set_round(self, round: Round):
        self._next_round()
        self.round = round
        if round.__class__ in self.possible_rounds:
            self.possible_rounds.remove(round.__class__)
    
    def _next_round(self):
        self.round_index += 1
        self.tip_index = 0
        self.has_character = False
        self.round_started_at = datetime.now()

    def get_tip(self) -> str:
        if not self.has_character:
            self.has_character = True
            return self.round.character

        tip = self.round.get_tip()
        self.tip_index += 1
        return tip

    def have_all_tips(self) -> bool:
        
        if not self.round:
            return False
        if self.round.out_of_tips:
            return True
        if self.tip_index >= ((len(self.round.tips) // 2) + (len(self.round.tips) % 2)): # half of the tips
            return True
        return False