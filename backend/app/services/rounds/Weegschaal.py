import random
from fractions import Fraction
from timeit import timeit
from app.services.rounds.Round import Round

from ortools.sat.python import cp_model


def find_balance(weights, min_objects=6, max_count=5):
    """
    Zoek een oplossing voor:

        x1*w1 + x2*w2 + ... + xn*wn = 0

    waar:
        - xi != 0
        - xi kan positief of negatief zijn
        - |xi| = aantal keer gebruikt
        - som(|xi|) >= min_objects

    Args:
        weights: lijst van positieve integers
        min_objects: minimum totaal aantal gebruikte objecten
        max_count: maximum herhalingen per object

    Returns:
        dict met oplossing of None
    """

    model = cp_model.CpModel()

    n = len(weights)

    # xi ∈ [-max_count, max_count] \ {0}
    xs = []
    abs_xs = []

    for i in range(n):
        x = model.NewIntVar(-max_count, max_count, f"x{i}")
        abs_x = model.NewIntVar(1, max_count, f"abs_x{i}")

        # abs(x)
        model.AddAbsEquality(abs_x, x)

        # x != 0
        model.Add(x != 0)

        xs.append(x)
        abs_xs.append(abs_x)

    # balans vergelijking
    model.Add(
        sum(xs[i] * weights[i] for i in range(n)) == 0
    )

    # minimum aantal objecten gebruikt
    model.Add(sum(abs_xs) >= min_objects)

    # optioneel:
    # minimaliseer totaal aantal objecten
    model.Minimize(sum(abs_xs))

    solver = cp_model.CpSolver()

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    result = []

    for i, w in enumerate(weights):
        x = solver.Value(xs[i])
        result.append(x)
    return result



OBJECTS = {
    "anker":   "⚓",
    "veer":    "🪶",
    "steen":   "🪨",
    "munt":    "🪙",
    "emmer":   "🪣",
    "sleutel": "🔑",
}

NAMES = list(OBJECTS.keys())

# Zinnen met 2 objecten: verhouding a:b
RATIO_TEMPLATES = [
    "De {a} weegt {n} keer zo veel als de {b}",
    "Voor elke {b} heb je {n} {a}s nodig om te balanceren",
    "Eén {a} tikt aan als {n} {b}s op de schaal",
    "{n} {b}s wegen precies evenveel als één {a}",
]

# Zinnen met 3 objecten: a + b == c  (of a == b + c)
COMBO_TEMPLATES = [
    "De {a} en de {b} samen wegen evenveel als de {c}",
    "Leg de {a} naast de {b} en je hebt het gewicht van een {c}",
    "Een {c} weegt precies evenveel als een {a} en een {b} bij elkaar",
]

# Zinnen: a == b  (zelfde gewicht)
EQUAL_TEMPLATES = [
    "De {a} en de {b} wegen precies hetzelfde",
    "Op de schaal maakt het niet uit: {a} of {b}, het is gelijk",
    "Wissel de {a} en de {b} maar van kant — de balans verandert niet",
]


class Weegschaal(Round):

    def __init__(self, character: str):
        
        self.weights = {name: 1 for name in NAMES}
        
        super().__init__(character)
        self.url: str = "/weegschaal"
        
    
    def _generate_ratio_tip(self, name: str, index: int) -> tuple[int, str]:
        other_name = random.choice(NAMES[:index])
        n = random.randint(2, 3)
        tip = random.choice(RATIO_TEMPLATES).format(a=name, b=other_name, n=n)
        weight = n * self.weights[other_name]
        return weight, tip
    
    def _generate_equal_tip(self, name: str, index: int) -> tuple[int, str]:
        other_name = random.choice(NAMES[:index])
        tip = random.choice(EQUAL_TEMPLATES).format(a=name, b=other_name)
        weight = self.weights[other_name]
        return weight, tip

    def _generate_combo_tip(self, name: str, index: int) -> tuple[int, str]:
        other_names = random.sample(NAMES[:index], 2)
        tip = random.choice(COMBO_TEMPLATES).format(a=other_names[0], b=other_names[1], c=name)
        weight = self.weights[other_names[0]] + self.weights[other_names[1]]
        return weight, tip
        
    def _generate_weight_and_tip(self, name: str, index: int) -> tuple[int, str]:
        func = random.choice([self._generate_ratio_tip, self._generate_equal_tip, self._generate_combo_tip])
        return func(name, index)

    def _generate_code(self):
        
        def get_closest_weight_name(target: int) -> str:
            closest_name = None
            closest_diff = float("inf")
            for name in NAMES:
                diff = self.weights[name] - target
                if diff < closest_diff:
                    closest_diff = diff
                    closest_name = name
            return closest_name
        
        left: list[str] = NAMES[:3]
        right: list[str] = NAMES[3:]
        
        left_weights = sum(self.weights[name] for name in left)
        right_weights = sum(self.weights[name] for name in right)
        
        while left_weights != right_weights:
            if left_weights > right_weights:
                delta = left_weights - right_weights
                name = get_closest_weight_name(delta)
                right.append(name)
                right_weights += self.weights[name]
            else:
                delta = right_weights - left_weights
                name = get_closest_weight_name(delta)
                left.append(name)
                left_weights += self.weights[name]
        self.code = ",".join(left) + " = " + ",".join(right)

    def create_round(self):
        
        self.tips.append(random.choice(EQUAL_TEMPLATES).format(a="anker", b="kilo bloem"))
        self.weights["veer"], tip = self._generate_ratio_tip("veer", 1)
        self.tips.append(tip)
        
        for i, name in enumerate(NAMES[2::]):
            self.weights[name], tip = self._generate_weight_and_tip(name, i + 2)
            self.tips.append(tip)
        
        result = find_balance(list(self.weights.values()), min_objects=6, max_count=5)
        left = []
        right = []
        for i, r in enumerate(result):
            if r < 0:
                for _ in range(abs(r)):
                    left.append(NAMES[i])
            else:
                for _ in range(r):
                    right.append(NAMES[i])
        self.code = ",".join(left) + " = " + ",".join(right)

        random.shuffle(self.tips)

    def is_correct_code(self, code: str) -> bool:
        left = code.split(" = ")[0].split(",")
        right = code.split(" = ")[1].split(",")
        left_weight = sum(self.weights[name] for name in left)
        right_weight = sum(self.weights[name] for name in right)
        print(f"left: {left}, left_weight: {left_weight}, right: {right}, right_weight: {right_weight}, self.weights: {self.weights}")
        return left_weight == right_weight


if __name__ == "__main__":
    r = Weegschaal("test")
    print("Oplossing:", r.code)
    print("Gewichten:")
    for name in NAMES:
        print(f" - {name}: {r.weights[name]}")
    print("\nTips:")
    for t in r.tips:
        print(" -", t)
    
    # def generate_round():
    #     r = Weegschaal("test")
    
    # t = timeit(
    # "generate_round()",
    # globals=globals(),
    # number=1000)
    
    # print(f"Gemiddelde tijd per ronde: {t / 1000:.4f} seconden")
