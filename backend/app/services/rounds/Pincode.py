

import random

from app.services.rounds.Round import Round


class PinCode(Round):
    
    def create_round(self):
        
        self.code = "".join(random.choices("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", k=6))
        self.tips = list(self.code)

if __name__ == "__main__":
    round = PinCode("test")
    print(round.code, round.tips)
