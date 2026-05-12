class Characters:
    
    def __init__(self):
        
        self.characters: list[str] = []
        self.character_index: int = 0
        self._load_characters()
    
    def _load_characters(self):
        
        with open("data/Characters.txt", "r") as f:
            self.characters = f.read().splitlines()
    
    def get_random_character(self) -> str:
        char = self.characters[self.character_index % len(self.characters)]
        self.character_index += 1
        return char