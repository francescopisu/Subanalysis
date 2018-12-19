import os
import re



def compute_wh():
    # opening the results file
    with open('results.csv', "w+") as resFile:
        # run through each subdirectory of subs folder (i.e: tv series)
        for subdir_first_level in sorted(next(os.walk('subs'))[1]):
            current_dir = 'subs/' + subdir_first_level
            # gather series number
            series = subdir_first_level[:2]

            # run through each subdirectory of series folders (i.e: seasons)
            for subdir_second_level in sorted(os.listdir(current_dir)):
                if not subdir_second_level.startswith('.'):
                    snd_current_dir = current_dir + '/' + subdir_second_level
                    # gather season number
                    season = subdir_second_level[2]

                    # operate on each season's episode
                    episode = 0
                    for subFile in sorted(os.listdir(snd_current_dir)):
                        if not subFile.startswith('.'):
                            if subFile.endswith(".srt"):
                                with open(snd_current_dir + '/' + subFile, "r") as f:
                                    episode += 1
                                    text = []
                                    for line in f.readlines():
                                        if not line[0].isdigit():
                                            # filter blank lines
                                            if not re.match(r'^\s*$', line):
                                                # clean string from new line characters
                                                text.append(line.rstrip('\r\n'))
                                    # text must be cleared of punctuation and other symbols
                                    words_count = count_words(text)
                                    resFile.write('series, season, episode, w/h')
                                    resFile.write(series + ',' + str(season) + ',' + str(episode) + ',' + str(words_count / float(60)))
                                    resFile.write('\n')


def count_words(list_of_strings):
    count = 0
    for line in list_of_strings:
        # the sub line is not counted if it starts with \
        if line[0] != '\\':
            count += len(re.findall(r'\w+', line))

    return count

compute_wh()