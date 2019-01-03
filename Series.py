class Series:
    id_ = 0
    name = ""
    episode_length = 0
    genre = []
    year = ""
    seasons = []

    def __init__(self, id_=0, name="", episode_length=0, genre=[], year="", seasons=[]):
        self.id_ = id_
        self.name = name
        self.episode_length = episode_length
        self.genre = genre
        self.year = year
        self.seasons = seasons

