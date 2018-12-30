import os
import re
import csv
from Series import Series


def compute_wh():
    # opening the results file
    with open('results.csv', "w+") as resFile:
        resFile.write('series_id,series_name,season,episode,wh,words_count\n')
        # run through each subdirectory of subs folder (i.e: tv series)
        for subdir_first_level in sorted(next(os.walk('subs'))[1]):
            current_dir = 'subs/' + subdir_first_level
            # gather series number
            series = subdir_first_level[:2]

            # save information about each series; these information are contained in a spec file situated in the
            # series' root folder
            current_series = Series()
            with open(current_dir + '/' + 'specs.csv') as specs:
                csv_reader = csv.DictReader(specs)
                for row in csv_reader:
                    current_series.name = row['name']
                    current_series.episode_length = int(row['length'])
                    current_series.genre = row['genre']
                    current_series.year = int(row['year'])

                # run through each subdirectory of series folders (i.e: seasons)
                for subdir_second_level in sorted(os.listdir(current_dir)):
                    # this control is necessary to avoid hidden files starting with .
                    if not subdir_second_level.startswith('.') and not subdir_second_level.endswith('.csv'):
                        snd_current_dir = current_dir + '/' + subdir_second_level
                        # gather season number
                        season = subdir_second_level[2]

                        # operate on each season's episode
                        episode = 0
                        for subFile in sorted(os.listdir(snd_current_dir)):
                            if not subFile.startswith('.'):
                                if subFile.endswith(".srt"):
                                    print("extracting: " + subFile)
                                    with open(snd_current_dir + '/' + subFile) as f:
                                        episode += 1
                                        text = []
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

                                                    # clean string of new line characters
                                                    text.append(line.rstrip('\r\n'))

                                        # text may contain punctuation and other symbols
                                        # only actual words must be counted
                                        words_count = count_words(text)

                                        # in order to compute the actual words per hour, word count must be divided
                                        # by the episode length of each series
                                        words_hour = round((words_count * 60) / float(current_series.episode_length), 2)

                                        resFile.write(series + ',' + current_series.name + ',' + str(season) + ',' + str(episode) + ',' +
                                                      str(words_hour) + ',' + str(words_count))
                                        resFile.write('\n')
                                        print("count: " + str(words_count) + " - hour:" + str(words_hour))


def count_words(list_of_strings):
    count = 0
    for line in list_of_strings:
        # using this regex to count actual words in a sentence
        # "hello \\\ marcus,, !how are.. you" -> 5 words
        count += len(re.findall(r'\w+', line))

    return count

compute_wh()
