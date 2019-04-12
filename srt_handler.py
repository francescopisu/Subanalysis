import os
import io
import json
from Season import Season
from Episode import Episode
from utils import *


def compute_wh():


    with open('descriptions.txt') as descriptions_file:
        descriptions = [x.strip() for x in descriptions_file.readlines()]
    description_index = 0

    series_dictionary = []
    with io.open("data.json", 'w') as resFile:

        # run through each subdirectory of subs folder (i.e: tv series)
        for subdir_first_level in sorted(next(os.walk('subs'))[1]):
            current_dir = 'subs/' + subdir_first_level
            # gather series number
            series = subdir_first_level[:2]

            # save information about each series; these information are contained in a spec file situated in the
            # series' root folder
            current_series = extract_series_data_from_current_dir(current_dir)

            # let's make sure that we start from scratch for each series
            current_series.seasons = []

            # run through each subdirectory of series folders (i.e: seasons)
            for subdir_second_level in sorted(os.listdir(current_dir)):
                # this control is necessary to avoid hidden files starting with .
                if not subdir_second_level.startswith('.') and not subdir_second_level.endswith('.csv'):
                    snd_current_dir = current_dir + '/' + subdir_second_level
                    # gather season number
                    season = int(subdir_second_level[1:])

                    # create a new Season object
                    current_season = Season(int(season), [])

                    # let's make sure that we start from scratch for each season of the current series
                    current_season.episodes = []

                    # read the titles file
                    with open('subs/'+subdir_first_level+'/'+subdir_second_level+'/titles.txt') as titles_file:
                        titles = [x.strip() for x in titles_file.readlines()]

                    # operate on each season's episode
                    episode = 0
                    for subFile in sorted(os.listdir(snd_current_dir)):
                        if not subFile.startswith('.'):
                            if subFile.endswith(".srt"):

                                with open(snd_current_dir + '/' + subFile, encoding="utf-8") as f:
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

                                                clean = re.compile('\[.*?\]')
                                                line = re.sub(clean, '', line)

                                                clean = re.compile('\(.*?\)')
                                                line = re.sub(clean, '', line)

                                                # clean string of references on who's talking
                                                clean = re.compile('[a-zA-Z]*\:')
                                                line = re.sub(clean, '', line)

                                                # clean string of website links
                                                clean = re.compile('www.*')
                                                line = re.sub(clean, '', line)

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

            # set the series description
            current_series.description = descriptions[description_index]
            description_index += 1

            # add the current series to the dictionary
            series_dictionary.append(current_series)

        # after the computation is finished, dump the dictionary into a json file
        resFile.write(str(json.dumps(series_dictionary, default=json_default, indent=4, ensure_ascii=False)))


compute_wh()
