import json
from Season import Season
from Episode import Episode
from utils import *


def load_json(json_file_name):
    with open(json_file_name) as f:
        raw_data = json.load(f)
    
    data = []    
    # run through each series and load the data
    for raw_series in raw_data.get("series"):
        seasons = []
        
        # first, read the seasons
        for raw_season in raw_series.get("seasons"):
            episodes = []
            
            # read and create each episode
            for raw_episode in raw_season.get("episodes"):
                # create the episode and add it to the episode list
                episodes.append(Episode(\
                    raw_episode.get("id_"), \
                    raw_episode.get("length"), \
                    raw_episode.get("wh"))
                    )
            
            # add the season to the season list
            seasons.append( Season (raw_season.get("id_"), episodes) )
                    
        #create the series and add it to the data list 
        data.append( Series( \
            raw_series.get('id_'), \
            raw_series.get('name'), \
            raw_series.get('episode_length'), \
            raw_series.get('genre'), \
            raw_series.get('year'), \
            seasons)
        )

    return data
