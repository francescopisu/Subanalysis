from load_json import *


def get_upper_value_for_wh_in_season(season):
    return max(episode.wh for episode in season.episodes)


def get_lower_value_for_wh_in_season(season):
    return min(episode.wh for episode in season.episodes)


def get_upper_value_for_wh_in_season_in_series(series):
    return max(get_upper_value_for_wh_in_season(season) for season in series.seasons)


def get_lower_value_for_wh_in_season_in_series(series):
    return min(get_lower_value_for_wh_in_season(season) for season in series.seasons)


def test_json():
    data = load_json('data.json')

    for series in data:
        print "\n", series.id_, series.name, \
            "- avg w/h:", get_average_wh_for_series(series), \
            "- min:", get_lower_value_for_wh_in_season_in_series(series), \
            "- max:", get_upper_value_for_wh_in_season_in_series(series)


test_json()
