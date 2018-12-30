import os
import re
import csv


def test():

    for subdir_first_level in sorted(next(os.walk('subs'))[1]):
        current_dir = 'subs/' + subdir_first_level
        # gather series number
        series = subdir_first_level[:2]

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

                            try:
                                with open(snd_current_dir + '/' + subFile, 'r', encoding='utf-8') as f:
                                    text = f.readlines()

                                    # find the row index of the last dialogue
                                    i = -1
                                    while not '-->' in text[i]:
                                        i = i-1

                                    #divide it and compute the runtime
                                    first_time = text[i].split('-->')[0]
                                    hours= first_time.split(':')[0]
                                    minutes = first_time.split(':')[1]
                                    runtime = int(hours)*60 + int(minutes)

                                    #print for errors
                                    if runtime < 10 or runtime > 120:
                                        print(subFile)
                                        print(runtime)

                            except UnicodeDecodeError:
                                print("error: " + subdir_first_level + " / " + subdir_second_level +  " - " + subFile)



test()
