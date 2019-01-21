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
    
    def __repr__(self):
        string = str(self.id_) + ". " + \
            self.name + ", ep. length: " + \
            str(self.episode_length) + ", genre: " + \
            str(self.genre) + ", year: " + \
            str(self.year) + ", seasons:\n"
            
        for season in self.seasons:
            string += str(season)
        string += "\n\n"
        
        return string

