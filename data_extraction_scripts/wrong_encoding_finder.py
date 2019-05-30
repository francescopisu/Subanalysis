import os
import re
import csv


def find_wrong_encoding():
    ''' runs all over the subtitles and prints the ones that are not encoded
        in utf-8. The method used for running all over the files is the same as
        the one used in srt_handler.py
    '''


    for series_folder in sorted(next(os.walk('../series'))[1]):
        series_full_path = '../series/' + series_folder

        for subs_folder in sorted(os.listdir(series_full_path + '/subs/')):

            if not subs_folder.startswith('.') and not subs_folder.endswith('.csv'):
                subs_full_path = series_full_path + '/subs/' + subs_folder

            for subFile in sorted(os.listdir(subs_full_path)):
                if not subFile.startswith('.'):
                    if subFile.endswith(".srt"):

                        # try to open the file in utf-8
                        try:
                            with open(subs_full_path + '/' + subFile, encoding="utf-8") as f:
                                text = f.read()

                        except UnicodeDecodeError:
                            # if there is an error, print the file name
                            print("error: " + subdir_first_level + " / " + subdir_second_level +  " - " + subFile)


find_wrong_encoding()
