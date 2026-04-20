

class Game:
    def __init__(self, name, genre, platform):
        self.name = name
        self.genre = genre
        self.platform = platform

    def __str__(self):
        return f"{self.name} ({self.genre}) on {self.platform}"