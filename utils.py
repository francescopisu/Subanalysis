import csv
import re
from Series import Series


def count_words(list_of_strings):
    count = 0
    for line in list_of_strings:
        # using this regex to count actual words in a sentence
        # "hello \\\ marcus,, !how are.. you" -> 5 words
        count += len(re.findall(r'\w+', line))

    return count


def get_runtime_from_file(f):
    text_complete = f.readlines()

    # find the row index of the last dialogue
    j = -1
    while not '-->' in text_complete[j]:
        j = j-1

    #divide it and compute the runtime
    first_time = text_complete[j].split('-->')[0]
    hours= first_time.split(':')[0]
    minutes = first_time.split(':')[1]
    runtime = int(hours)*60 + int(minutes)
    
    return runtime

def extract_series_data_from_specs(specs):
    # save information about each series; these information are contained in a spec file situated in the
    # series' root folder
    current_series = Series()

    csv_reader = csv.DictReader(specs)
    for row in csv_reader:
        current_series.id_ = row['id']
        current_series.name = row['name']
        current_series.episode_length = int(row['length'])
        current_series.genre = row['genre']
        current_series.year = int(row['year'])

    return current_series

def extract_series_data_from_current_dir(current_dir):
    with open(current_dir + '/' + 'specs.csv') as specs:
        return extract_series_data_from_specs(specs)

def print_series_episode(series, season, episode):
    print(str(series.id_) + ". " + series.name + " - " + "s" + str(season) + "e" + str(episode))

