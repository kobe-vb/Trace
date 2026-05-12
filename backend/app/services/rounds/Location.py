

import random

from app.services.rounds.Round import Round


locations: dict[str, str] = {
    "scouts cafe": "Cara",
    "balke container": "Balken",
}


class Location(Round):
        
    def create_round(self):
        
        self.tips = "code hant op in de".split()
        location = random.choice(list(locations.keys()))
        self.code = locations[location]
        self.tips.append(location)
        
        
if __name__ == "__main__":
    round = Location("test")
    print(round.code, round.tips)