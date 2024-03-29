// zoom types
const SERIES   = 1;
const SEASONS  = 2;
const EPISODES = 3;

// sorting types
const DESCENDING = false;
const ASCENDING  = true;


class Controller {
    /** this class handles the user interactions and provides the data to the
        chart. It also handles the zoom level so that Chart doesn't do that. */

    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data;

        // set the zoom, the sorting and the filters
        this.zoomLevel = SERIES;
        this.sortingParameter  = "id_";
        this.sortingType = ASCENDING;

        // sort the data in the default mode
        this.data.sort(dynamicSort(this.sortingParameter));
        console.log(this.data);

        // set the filters
        this.extractGenres();
        this.wh_min = 0;
        this.wh_max = 13000;
        this.year_min = 1950;
        this.year_max = 2019;

        // set the snap noBottomBorder
        this.snapped = false;

        // extract the data and draw the chart
        this.chart = new Chart(this.extractElements());
    }

    extractGenres(){
        // create a Set containing the different genres;
        // it will be used when filtering.
        this.genres = new Set();
        this.data.forEach(series => {
                series.genre.split(" ").forEach(item => this.genres.add(item))
        })
    }


    extractElements(){
        // extracts the data array for the Chart

        var dataForBars = [];

        switch (this.zoomLevel) {
            case SERIES: // extract the series data
                this.data.forEach(single_series => {
                    if (this.isSeriesAllowed(single_series)){
                        dataForBars.push({
                            id: +single_series.id_,
                            name: single_series.name,
                            number: +single_series.id_,
                            wh: +single_series.wh,
                            episode_length: +single_series.episode_length,
                            start_year: single_series.start_year,
                            end_year: single_series.end_year,
                            logo_url: "series/"+single_series.folder+"/poster.jpg",
                            genre: single_series.genre.split(" ")[0],
                            description: single_series.description,
                            no_of_seasons: single_series.seasons.length,
                            is_central: true
                        });
                    }
                })
                break;

            case SEASONS: // extract the seasons data
                this.data.forEach(single_series => {
                    if (this.isSeriesAllowed(single_series)){
                        single_series.seasons.forEach(season => {
                            dataForBars.push({
                                id: ((+single_series.id_)*1000000) +
                                    ((+season.id_)*1000),
                                name: single_series.name,
                                start_year: single_series.start_year,
                                end_year: single_series.end_year,
                                number: +season.id_,
                                wh: +season.wh,
                                logo_url: "series/"+single_series.folder+"/logo_original.png",
                                no_of_episodes: season.episodes.length,
                                wh_series: +single_series.wh,
                                genre: single_series.genre.split(" ")[0],
                                is_central: +season.id_ == Math.round(single_series.seasons.length/2)
                            });
                        })
                    }
                })
                break;

            case EPISODES: // extract the episodes data
                this.data.forEach(single_series => {
                    if (this.isSeriesAllowed(single_series)){
                        // count the episodes, it will be used for the label
                        var n_episodes = single_series.seasons
                                        .map(season => season.episodes.length)
                                        .reduce((a,b)=>a+b);
                        var episode_counter = 0;

                        single_series.seasons.forEach(season => {
                            season.episodes.forEach(episode => {
                                episode_counter++;
                                dataForBars.push({
                                    id: ((+single_series.id_)*1000000) +
                                        ((+season.id_)*1000) +
                                        (+episode.id_),
                                    name: single_series.name,
                                    start_year: single_series.start_year,
                                    end_year: single_series.end_year,
                                    number: +episode.id_,
                                    wh: +episode.wh,
                                    title: episode.title,
                                    logo_url: "series/"+single_series.folder+"/logo_original.png",
                                    season: +season.id_,
                                    wh_series: +single_series.wh,
                                    genre: single_series.genre.split(" ")[0],
                                    length: episode.length,
                                    is_central: episode_counter == Math.round(n_episodes/2)
                                });
                            });
                        })
                    }
                })
                break;

            default:
                console.log("ERROR: wrong zoom level")
                this.dataForBars = [];
        }

        return dataForBars;
    }


    /* This function gets zoom level from the selected radion button. Then, it sets
    zoomLevel and redraws the bars*/
    setZoomLevelAndData(zoomLevel) {
        this.zoomLevel = zoomLevel;

        this.chart.tooltip.setZoomLevel(zoomLevel);
        this.chart.transitions = true;
        this.chart.setDrawSeriesLine((zoomLevel != SERIES));
        this.chart.setShowLabelsAndTicks((zoomLevel != SERIES));

        // the k-zoom-factor is used for showing the ticks and the labels
        // in the bars; each visualiztion has its limits.
        var kZoomFactorMin = (zoomLevel == SERIES)  ? 9999 :
                             (zoomLevel == SEASONS) ? 2    :
                                                      13   ;
        this.chart.setKZoomFactorMin(kZoomFactorMin);

        // the scale extent is the maximum level of zoom
        var scaleExtent = (zoomLevel == SERIES)  ? [1, 8]  :
                          (zoomLevel == SEASONS) ? [1, 25] :
                                                   [1, 100];
        this.chart.setScaleExtent(scaleExtent);

        // delay in the transitions: since the episodes are much more than the
        // series, we need a shorter delay
        var delay = (zoomLevel == SERIES)  ? 10 :
                    (zoomLevel == SEASONS) ? 5  :
                                             0.5;
        this.chart.setDelay(delay);

        // add the data to the chart
        this.chart.addBars(this.extractElements());
    }


    // ----------- SORTING
    setSortingType(sortingType){
        // sorts in the ascending or descending way

        this.sortingType = sortingType;
        this.sortData();
    }

    setSortingParameter(sortingParameter){
        // orders the data according to the sortingParameter, e.g. by Name

        this.sortingParameter = sortingParameter;
        this.sortData();
    }

    sortData(){
        // sorts the data and shows it

        if (this.sortingType == DESCENDING)
            this.data.sort(dynamicSort("-" + this.sortingParameter));
        else
            this.data.sort(dynamicSort(this.sortingParameter));

        this.chart.addBars(this.extractElements());
    }

    // ------------ FILTERING
    isSeriesAllowed(seriesFromJson){
        // returns true if the series respects all the filters

        // check whether:
        // - w/h is inside the w/h limits
        // - year is inside the years limits TODO
        // - genre is present in the filters set
        return (seriesFromJson.wh >= this.wh_min && seriesFromJson.wh <= this.wh_max) &&
               (seriesFromJson.start_year <= this.year_max &&
                seriesFromJson.end_year   >= this.year_min) &&
                this.genres.has(seriesFromJson.genre.split(" ")[0]);
    }

    setFilterInFiltersSet(filterType, checked){
        // add or remove a filter from the filters set

        if (checked) this.genres.add(filterType);
        else this.genres.delete(filterType);

        this.chart.addBars(this.extractElements());
    }

    setWhLimits(limits){
        // sets the limits of the words/hour

        this.wh_min = parseInt(limits.split(";")[0])
        this.wh_max = parseInt(limits.split(";")[1])

        this.chart.addBars(this.extractElements());
    }

    setYearLimits(limits){
        // sets the limits of the year

        this.year_min = parseInt(limits.split(";")[0])
        this.year_max = parseInt(limits.split(";")[1])

        this.chart.addBars(this.extractElements());
    }

    resetFilters() {
        // resets the genre filters

        this.genres.clear();
        this.chart.addBars(this.extractElements());
    }

    setAllFilters() {
        // set all the genre filters

        this.extractGenres();
        this.chart.addBars(this.extractElements());
    }

    snap(){
        // delete half of the series... randomly

        if (!this.snapped)
            // if the snap is not already happened,
            // delete half of the series!
            this.chart.addBars(
                this.extractElements()
                .filter(item => Math.random() > 0.5)
            )
        else
            // restore the series
            this.chart.addBars(this.extractElements());

        this.snapped = !this.snapped;
    }

}

function dynamicSort(property) {
    // returns a function used for sorting on that property
    // many thanks to Ege Özcan https://stackoverflow.com/a/4760279
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
