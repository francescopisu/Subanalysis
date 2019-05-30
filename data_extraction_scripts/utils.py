import csv
import re
from Series import Series


def count_words(list_of_strings):
    ''' extract the number of words present in the text passed.
    Parameters
    ----------
    list_of_strings : array
        The text from subtitle, where each line is a genuine one

    Returns
    -------
    count : int
        the number of words present in the text passed.
    """
    '''

    count = 0
    for line in list_of_strings:
        # using this regex to count actual words in a sentence
        # "hello \\\ marcus,, !how are.. you" -> 5 words
        count += len(re.findall(r'\w+', line))

    return count


def get_runtime_from_file(f):
    ''' extracts the episode duration from the subtitle file f, by taking the
        timestamp of the last dialogue.
    Parameters
    ----------
    f : file
        The subtitle file, already opened

    Returns
    ----------
    runtime : int
        the episode duration, in minutes
    '''

    # read each line of the file
    text_complete = f.readlines()

    # find the row index of the last dialogue: going backwards, find the first
    # line that contains the string "-->" because it means that this row
    # contains the timestamp. e.g. 00:59:55,070 --> 01:00:00,890

    # start from the last row
    j = -1
    while not '-->' in text_complete[j]:
        # keep going backwards until you find the right line
        j -= 1

    # split the line and compute the runtime
    # e.g. text_complete = 00:59:55,070 --> 01:00:00,890
    first_time = text_complete[j].split('-->')[0]
    # now, first_time = 00:59:55,070

    # extract hours and minutes and count them
    hours = first_time.split(':')[0]
    minutes = first_time.split(':')[1]
    runtime = int(hours) * 60 + int(minutes)

    return runtime


def extract_series_data_from_specs(specs):
    ''' extracts the information about each series, contained in a .csv file
        situated in the series' root folder

    Parameters
    ----------
    specs : file
        the .csv file containing the series' information

    Returns
    ----------
    current_series : Series
        an object initialized with the information extracted
    '''

    # create an empty series
    current_series = Series()

    # read the data from the csv and assign it to current_series
    csv_reader = csv.DictReader(specs)
    for row in csv_reader:
        current_series.name = row['name']
        current_series.episode_length = int(row['length'])
        current_series.genre = row['genre']
        current_series.start_year = int(row['start_year'])
        current_series.end_year = int(row['end_year'])

    return current_series


def extract_series_data_from_series_folder(series_folder):
    ''' creats and returns a series with its specifications.

    Parameters
    ----------
    series_full_path : str
        the name of the series folder

    Returns
    ----------
    current_series : Series
        an object initialized with the information extracted
    '''

    # first, extract the series data from the specs.csv file
    with open('../series/' + series_folder + '/specs.csv') as specs:
        current_series = extract_series_data_from_specs(specs)

    # then, extract the description from the description.txt file
    with open('../series/' + series_folder + '/description.txt') as desc:
        current_series.description = desc.readline()

    # set the ID as the first two numbers of series_folder
    current_series.id_    = int(series_folder[:2])

    # set the name of the folder, used when loading the images
    current_series.folder = series_folder

    return current_series

def print_series_episode(series, season, episode):
    ''' prints the series' and season's episode.

    Parameters
    ----------
    series : Series
        the series of the episode
    season : Season
        the season of the episode
    episode : Episode
        the episode
    '''

    print(str(series.id_) + ". " + series.name + " - " + "s" + str(season) + \
        "e" + str(episode))


def json_default(object):
    ''' converts a custom object to JSON '''
    return object.__dict__


def get_average_wh_for_series(series):
    ''' extract the average words/hour of the series

    Parameters
    ----------
    series : Series
        the series object

    Returns
    ---------
    words/hour : float
        the average words/hour of the series
    '''

    # accumulator for the words/hour of the episodes
    acc_wh = 0.0

    # episodes counter
    ep_count = 0

    # sum the w/h for each episode for each season
    for season in series.seasons:
        acc_wh += sum(episode.wh for episode in season.episodes)
        ep_count += len(season.episodes)

    # a standard "average" computation, i.e. sum divided by the n. of elements
    return float(acc_wh)/ep_count


def get_average_wh_for_season(season):
    ''' extract the average words/hour of the season

    Parameters
    ----------
    season : Season
        the season object

    Returns
    ---------
    words/hour : float
        the average words/hour of the season
    '''

    # a standard "average" computation, i.e. sum divided by the n. of elements
    return sum(ep.wh for ep in season.episodes) / float(len(season.episodes))
