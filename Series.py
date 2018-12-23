class Series:
    name = ""
    episode_length = 0
    genre = [""]
    year = ""

    def __init__(self, name="", episode_length=0, genre=[""], year=""):
        self.name = name
        self.episode_length = episode_length
        self.genre = genre
        self.year = year

