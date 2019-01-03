from Episode import Episode


class Season:
    id_ = 1
    episodes = []

    def __init__(self, id_, episodes):
        self.id_ = id_
        self.episodes = episodes
