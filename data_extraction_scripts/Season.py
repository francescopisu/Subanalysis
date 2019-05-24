from Episode import Episode


class Season:
    id_ = 1
    wh = 0
    episodes = []

    def __init__(self, id_, wh=0, episodes=[]):
        self.id_ = id_
        self.wh = wh
        self.episodes = episodes

    def __repr__(self):
        string = "Season " + str(self.id_) + \
            ", avg w/h: " + '%.2f' % self.wh + \
            ", episodes:\n"
        for episode in self.episodes:
            string += str(episode)
            string += "; "
        string += "\n"

        return string
