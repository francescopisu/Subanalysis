from Episode import Episode


class Season:
    id_ = 1
    episodes = []

    def __init__(self, id_, episodes):
        self.id_ = id_
        self.episodes = episodes
    
    def __repr__(self):
        string = "Season " + str(self.id_) + ", episodes:\n"
        for episode in self.episodes:
            string += str(episode) 
            string += "; "
        string += "\n"
        
        return string
