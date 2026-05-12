
import datetime

from pydantic import BaseModel


class Participant(BaseModel):
    id: str
    name: str


class Ranking(BaseModel):
    player_name: str
    partner_name: str | None = None
    player_character: str
    rounds_completed: int
    round_started_at: datetime.datetime
    