

import random

from app.services.rounds.Round import Round


class Patroon(Round):
    
    def __init__(self, character: str):
        super().__init__(character)
        self.url: str = "/patroon"
    
    def create_round(self):
        
        all_coords = [f"{l}{n}" for l in "ABCD" for n in range(1, 5)]
        selected = random.sample(all_coords, 3)

        self.tips = list("".join(selected))
        self.code = "-".join(selected)

if __name__ == "__main__":
    round = Patroon("test")
    print(round.code, round.tips)