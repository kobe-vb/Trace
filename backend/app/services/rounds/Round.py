class Round:
    def __init__(self, character: str):
        self.character: str = character
        self.tips: list[str] = []
        self._tip_index: int = 0
        self.code: str = ""
        self.url: str = "/basic"

        self.create_round()
    
    
    def create_round(self):
        raise NotImplementedError("create_round moet worden geïmplementeerd in subklassen")

    def reset_tips(self):
        self._tip_index = 0

    def get_tip(self) -> str:
        if self._tip_index >= len(self.tips):
            return "error: no more tips available"
        tip = self.tips[self._tip_index]
        self._tip_index += 1
        return tip

    def is_correct_code(self, code: str) -> bool:
        print(f"tips: {self.tips}, code: {code}, expected: {self.code}")
        return self.code == code