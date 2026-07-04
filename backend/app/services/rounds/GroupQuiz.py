from __future__ import annotations
import random
from dataclasses import dataclass

from app.services.rounds.Round import Round


@dataclass
class ParticipantData:
    name: str
    gender: str  # "M" of "V"
    answers: dict[str, str]  # question -> answer


class GroupQuiz(Round):

    _participants: list[ParticipantData] = []

    @classmethod
    def set_participants(cls, participants: list[ParticipantData]):
        print(f"Setting participants: {participants}")
        cls._participants = participants

    @classmethod
    def has_participants(cls) -> bool:
        return len(cls._participants) > 0

    def __init__(self, character: str):
        self.correct_code: str = ""
        super().__init__(character)        
        self.url: str = "/groupQuiz"

    def create_round(self):
        if not self._participants:
            self.tips = ["Geen deelnemersdata geladen"]
            self.code = "error: no participants"
            return

        person = random.choice(self._participants)

        if not person.answers:
            self.tips = ["Geen antwoorden beschikbaar"]
            self.code = "error: no answers"
            return

        question, answer = random.choice(list(person.answers.items()))

        self.tips = [f"vraag = \"{question}\"", f"antwoord = \"{answer}\""]
        self.code = self._generate_code(person)
        self.correct_code = person.name

        print(f"Generated code: {self.code}, correct code: {self.correct_code}, id: {id(self)}")

    def _generate_code(self, person: ParticipantData) -> str:
        
        same_gender: list[ParticipantData] = [p for p in self._participants if p.gender == person.gender and p.name != person.name]
        if len(same_gender) < 2:
            same_gender = [p for p in self._participants if p.name != person.name]
        options: list[str] = [person.name] + [p.name for p in random.sample(same_gender, min(2, len(same_gender)))]
        random.shuffle(options)
        return "|".join(options)

    def is_correct_code(self, code: str) -> bool:
        print(f"Checking code: {code} against correct code: {self.correct_code}, options: {self.code}, id: {id(self)}")
        return code == self.correct_code