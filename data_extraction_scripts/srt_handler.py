import os
import io
import json
from Season import Season
from Episode import Episode
from utils import *


def compute_wh():

    series_dictionary = []
    with io.open("../data.json", 'w') as resFile:

        # we have to navigate through the series data that are stored like:
        # ../series/ID_SERIES-NAME/subs/SEASON-NUMBER/SUBTITLE.srt

        # run through each subdirectory of series folder
        for series_folder in sorted(next(os.walk('../series'))[1]):
            # series_folder is ID_SERIES-NAME, e.g. 00_SamuraiJack

            # gather series number
            # series = series_folder[:2]

            # save information about each series; these information are contained
            # in a spec file situated in the series' root folder
            current_series = extract_series_data_from_series_full_path(series_folder)

            # let's make sure that we start from scratch for each series
            current_series.seasons = []

            series_full_path = '../series/' + series_folder
            # series_full_path is
            # "../series/ID_SERIES-NAME", e.g. ../series/00_SamuraiJack
            # from this point we can open all the files we need

            # -------- extract w/h, episode title from the files

            # run through each subdirectory of series folders (i.e: seasons)
            for subs_folder in sorted(os.listdir(series_full_path + '/subs/')):
                # subs_folder is the folder containing the season-folders
                # that contain the subtitles and the episode titles

                # this control is necessary to avoid hidden files starting with .
                if not subs_folder.startswith('.') and not subs_folder.endswith('.csv'):
                    subs_full_path = series_full_path + '/subs/' + subs_folder
                    # gather season number
                    season = int(subs_folder[1:])

                    # create a new Season object
                    current_season = Season(int(season), [])

                    # let's make sure that we start from scratch for each season of the current series
                    current_season.episodes = []

                    # read the titles file
                    with open(subs_full_path + '/titles.txt') as titles_file:
                        titles = [x.strip() for x in titles_file.readlines()]

                    # operate on each season's episode
                    episode = 0
                    for subFile in sorted(os.listdir(subs_full_path)):
                        if not subFile.startswith('.'):
                            if subFile.endswith(".srt"):

                                with open(subs_full_path + '/' + subFile, encoding="utf-8") as f:
                                    episode += 1
                                    text = []

                                    # create a new Episode object
                                    current_episode = Episode(episode)

                                    for line in f.readlines():
                                        # discarding all the lines starting with a number
                                        if not line[0].isdigit():
                                            # filter blank lines
                                            if not re.match(r'^\s*$', line):
                                                # clean string of eventual html tags
                                                clean = re.compile('<.*?>')
                                                line = re.sub(clean, '', line)

                                                # clean string of closed captions
                                                clean = re.compile('\[.*?\]')
                                                line = re.sub(clean, '', line)
                                                clean = re.compile('\(.*?\)')
                                                line = re.sub(clean, '', line)

                                                # clean string of references on who's talking
                                                clean = re.compile('[a-zA-Z]*\:')
                                                line = re.sub(clean, '', line)

                                                # clean string of website links
                                                pattern = r'(?:https?:\/\/(www\.)?)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)'
                                                # thanks to https://stackoverflow.com/a/27755918
                                                if re.findall(pattern, line):
                                                    line = ""

                                                # an string of  things like "sync & correction"
                                                sync_strings = [ \
                                                'sync & correction by', \
                                                'sync, corrected by', \
                                                'synced and corrected by', \
                                                'sync and corrections by', \
                                                'synced & corrected by', \
                                                'Cleaned, corrected & sync adjusted by', \
                                                'BluRay resync by', \
                                                ', resync:', \
                                                'Resync for QRUS by', \
                                                'Resync for ABjEX by', \
                                                'Extracted & Re-synced & Corrected for']

                                                if any(x in line for x in sync_strings):
                                                    line = ""

                                                # clean string of new line characters
                                                text.append(line.rstrip('\r\n'))

                                    f.seek(0)
                                    runtime = get_runtime_from_file(f)

                                    # set the episode title
                                    current_episode.title = titles[episode-1]

                                    # set length of current episode
                                    current_episode.length = runtime

                                    # text may contain punctuation and other symbols
                                    # only actual words must be counted
                                    words_count = count_words(text)

                                    # in order to compute the actual words per hour, word count must be divided
                                    # by the episode length of each series
                                    words_hour = round((words_count * 60) / float(runtime), 2)

                                    # add words per hour to the current episode
                                    current_episode.wh = words_hour

                                    # add current episode to the current season
                                    current_season.episodes.append(current_episode)

                                    print_series_episode(current_series, season, episode)
                                    print("words count: " + str(words_count) + " - words/hour: " + str(words_hour) + "\n")

                    # compute the average w/h for the current season
                    current_season.wh = get_average_wh_for_season(current_season)

                    # add current season to the current series
                    current_series.seasons.append(current_season)

            # compute the average w/h for the current series
            current_series.wh = get_average_wh_for_series(current_series)


            # add the current series to the dictionary
            series_dictionary.append(current_series)

        # after the computation is finished, dump the dictionary into a json file
        resFile.write(str(json.dumps(series_dictionary, default=json_default, indent=2, ensure_ascii=False)))


compute_wh()
