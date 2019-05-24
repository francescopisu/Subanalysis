import os
import re
import csv


def find_wrong_encoding():

    for series_folder in sorted(next(os.walk('../series'))[1]):
        series_full_path = '../series/' + series_folder

        # run through each subdirectory of series folders (i.e: seasons)
        for subs_folder in sorted(os.listdir(series_full_path + '/subs/')):
        # this control is necessary to avoid hidden files starting with .
            if not subs_folder.startswith('.') and not subs_folder.endswith('.csv'):
                subs_full_path = series_full_path + '/subs/' + subs_folder

            for subFile in sorted(os.listdir(subs_full_path)):
                if not subFile.startswith('.'):
                    if subFile.endswith(".srt"):

                        try:
                            with open(subs_full_path + '/' + subFile, encoding="utf-8") as f:
                                text = f.read()
                            # print(subs_full_path + '/' + subFile)
                        except UnicodeDecodeError:
                            print("error: " + subdir_first_level + " / " + subdir_second_level +  " - " + subFile)


find_wrong_encoding()
