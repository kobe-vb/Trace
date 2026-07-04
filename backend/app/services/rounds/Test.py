

from app.services.rounds.Round import Round


class Test(Round):
    
    def create_round(self):
        self.code = "test"
        
        for i in range(6):
            self.tips.append(f"tip {i + 1}")
    
    def is_correct_code(self, code: str) -> bool:
        return code == "test"