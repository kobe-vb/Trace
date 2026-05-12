

import random

from app.services.rounds.Round import Round


templates = [
            "# is beter dan niets",
            "niemand kiest ooit #",
            "op een dag staat # juist",
            "# is niet de verkeerde keuze",
        ]

meaning = {
    "L": ["links", "de eerste", "west"],
    "R": ["rechts", "de tweede", "oost"]
}


class GlassBridge(Round):
    
    def __init__(self, character: str):
        super().__init__(character)
        self.url: str = "/glazen-brug"
    
    def create_round(self):
        
        self.code = "".join(random.choices("LR", k=6))
        self.tips = list(self.code)
        for i in range(6):
            self.tips[i] = templates[i % len(templates)].replace("#", random.choice(meaning.get(self.tips[i], [self.tips[i]])))

if __name__ == "__main__":
    round = GlassBridge("test")
    print(round.code, round.tips)
