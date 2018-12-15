import os
import re


def compute_wh():
    # run through each subdirectory of subs folder (i.e: tv series)
    for subdir_first_level in next(os.walk('subs'))[1]:
        current_dir = 'subs/' + subdir_first_level

        # run through each subdirectory of series folders (i.e: seasons)
        for subdir_second_level in os.listdir(current_dir):
            if not subdir_second_level.startswith('.'):
                snd_current_dir = current_dir + '/' + subdir_second_level

                # save the results for each season
                with open(snd_current_dir + '/results.txt', "w+") as resFile:
                    # operate on each season's file
                    for subFile in os.listdir(snd_current_dir):
                        if not subFile.startswith('.'):
                            if subFile.endswith(".srt"):
                                with open(snd_current_dir + '/' + subFile, "r") as f:
                                    text = []
                                    words_count = 0
                                    for line in f.readlines():
                                        if not line[0].isdigit():
                                            if not re.match(r'^\s*$', line):
                                                text.append(line.rstrip('\r\n'))
                                    # text must be cleared of punctuation and other symbols
                                    words_count = count_words(text)
                                    resFile.write(str(words_count))
                                    resFile.write(',')
                                    resFile.write(str(words_count / float(60)))
                                    resFile.write('\n')


def count_words(list_of_strings):
    count = 0
    for line in list_of_strings:
        count += len(re.findall(r'\w+', line))

    return count

compute_wh()