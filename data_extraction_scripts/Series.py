class Series:
    ''' A class that represents a TV series

    Attributes
    id : int
        unique identificator
    name : str
        name of the series
    episode_length : int
        standard episode duration
    genre : array
        list of the series genres, we use only the first
    start_year : int
        the first year the series was aired
    end_year : int
        the last year the series was aired; 9999 => the series isn't over yet
    wh : double
        the average words/hour of the episodes
    descript : str
        a brief description of the series
    seasons : array
        the list of the seasons of this series
    '''


    id_ = 0
    name = ""
    episode_length = 0
    genre = []
    start_year = 0
    end_year = 0
    wh = 0
    description = ""
    seasons = []

    def __init__(self, id_=0, name="", episode_length=0, genre=[], \
                start_year=0, end_year=0, wh=0, description = "",
                folder = "", seasons=[]):
        self.id_ = id_
        self.name = name
        self.episode_length = episode_length
        self.genre = genre
        self.start_year = start_year
        self.end_year = end_year
        self.wh = wh
        self.description = description
        self.folder = folder
        self.seasons = seasons

    def __repr__(self):
        string = str(self.id_) + ". " + \
            self.name + \
            ", ep. length: " + str(self.episode_length) + \
            ", genre: " + str(self.genre) + \
            ", start year: " + str(self.start_year) + \
            ", end year: " + str(self.end_year) + \
            ", avg w/h: " + '%.2f' % self.wh + \
            ", description: " + str(self.description) + \
            ", folder: " + str(self.folder) + \
            ", seasons:\n"

        for season in self.seasons:
            string += str(season)
        string += "\n\n"

        return string
