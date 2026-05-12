

import itertools
import random

from app.services.rounds.Round import Round


from abc import ABC, abstractmethod

COLOR_CODES = {
    "r": "rood",
    "b": "blauw",
    "y": "geel",
    "g": "groen",
    "w": "wit",
}

OPTIONS = list(COLOR_CODES.keys())
LENGTH = 6
ALL_COMBINATIONS = ["".join(p) for p in itertools.product(OPTIONS, repeat=LENGTH)]

class Constraint(ABC):
    @abstractmethod
    def is_valid(self, code: str) -> bool:
        pass

    @abstractmethod
    def to_text(self) -> str:
        pass
    

class PositionConstraint(Constraint):
    def __init__(self):
        self.char = random.choice(OPTIONS)
        self.index = random.randint(0, LENGTH - 1)

    def is_valid(self, code: str) -> bool:
        return code[self.index] == self.char

    def to_text(self) -> str:
        return f"{COLOR_CODES[self.char]} staat op positie {self.index + 1}"


class CountConstraint(Constraint):
    def __init__(self):
        self.char = random.choice(OPTIONS)
        self.count = random.randint(1, 2)

    def is_valid(self, code: str) -> bool:
        return code.count(self.char) == self.count

    def to_text(self) -> str:
        return f"{COLOR_CODES[self.char]} komt {self.count} keer voor"


class NotInCodeConstraint(Constraint):
    def __init__(self):
        self.char = random.choice(OPTIONS)

    def is_valid(self, code: str) -> bool:
        return self.char not in code

    def to_text(self) -> str:
        return f"{COLOR_CODES[self.char]} zit niet in de code"


class OrderConstraint(Constraint):
    def __init__(self):
        self.char1, self.char2 = random.sample(OPTIONS, 2)

    def is_valid(self, code: str) -> bool:
        if self.char1 not in code or self.char2 not in code:
            return False
        return code.index(self.char1) < code.index(self.char2)

    def to_text(self) -> str:
        return f"{COLOR_CODES[self.char1]} komt voor {COLOR_CODES[self.char2]} in de code"


class Mastermind(Round):
    
    def __init__(self, character: str):
        
        self.constraints: list[Constraint] = []
        super().__init__(character)
        self.url: str = "/mastermind"
    
    def _generate_constraints(self):
        
        self.constraints.clear()
        constraint_classes = [cls for cls in Constraint.__subclasses__() if cls is not Constraint]
        for _ in range(LENGTH):
            constraint_type = random.choice(constraint_classes)
            constraint = constraint_type()
            if constraint.to_text() in [c.to_text() for c in self.constraints]:
                self._generate_constraints()
                return
            self.constraints.append(constraint)
            
            
    def create_round(self):
        
        done = False
        while not done:
            self._generate_constraints()
            for code in ALL_COMBINATIONS:
                if all(constraint.is_valid(code) for constraint in self.constraints):
                    self.code = code
                    done = True
                    break
        
        self.tips = [c.to_text() for c in self.constraints]
    
    def is_valid_code(self, code: str) -> bool:
        return all(constraint.is_valid(code) for constraint in self.constraints)


if __name__ == "__main__":
    round = Mastermind("test")
    print(round.code, ":", sep="")
    for tip in round.tips:
        print("\t-", tip)