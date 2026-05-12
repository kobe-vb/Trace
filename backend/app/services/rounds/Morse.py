

import itertools
import random

from app.services.rounds.Round import Round

class Morse(Round):
    
    def __init__(self, character: str):
                
        super().__init__(character)
        self.url: str = "/morse"
    
    def create_round(self):
        
        all_morse = ["".join(p) for p in itertools.product([*"._"], repeat=3)]
        morse = random.sample(all_morse, 6)
        pairs = []
        for i, mors in enumerate(morse):
            leter = chr(i + ord('a'))
            pairs.append(f"{leter}:{mors}")
            self.tips.append(f"de leter {leter} komt overeen met {mors.replace(".", "kort ").replace("_", "lang ")}")
        random.shuffle(self.tips)

        self.code = ",".join(pairs) + "|" + "".join(random.sample("abcdef", 6))
        
    def is_correct_code(self, code: str) -> bool:
        print(f"tips: {self.tips}, code: {code}, expected: {self.code}")
        return code == self.code.split("|")[1]

if __name__ == "__main__":
    r = Morse("test")
    print("code: ", r.code)
    print("tips:")
    for tip in r.tips:
        print("\t-", tip)
    
