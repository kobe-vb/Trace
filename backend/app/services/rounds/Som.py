

import random

from app.services.rounds.Round import Round


templates = ["# appel in de kar",
             "een # tal per dag is gezond",
             "# in de hand is beter dan tien in de lucht",
             "ooit heb ik zeker # appels gegeten"]

class Som(Round):
    
    def create_round(self):
        
        for _ in range(6):
            self.tips.append(str(random.randint(-100, 100)))
        self.code = str(sum(int(tip) for tip in self.tips))
        for i in range(6):
            self.tips[i] = templates[i % len(templates)].replace("#", self.tips[i])


if __name__ == "__main__":
    round = Som("test")
    print(round.code, round.tips)