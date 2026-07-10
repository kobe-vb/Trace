class Characters:
    
    def __init__(self):
        
        self.characters: list[str] = []
        self.character_index: int = 0
    
    def clear(self):
        self.character_index = 0
    
    async def set_characters(self, characters: list[str]):
        self.characters = characters
        print(f"Characters set: {self.characters}")
    
    def get_random_character(self) -> str:
        
        if not self.characters:
            return "Unknown"
        char = self.characters[self.character_index % len(self.characters)]
        self.character_index += 1
        return char