// zoom types
const SERIES   = 1;
const SEASONS  = 2;
const EPISODES = 3;

// sorting types
const DESCENDING = false;
const ASCENDING  = true;

class Chart {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data;

        this.animation = false;
        this.lastTransform = null;

        // set the zoom, the sorting and the filters
        this.zoomLevel = SERIES;
        this.sortingParameter  = "id_";
        this.sortingType = ASCENDING;

        this.data.sort(this.dynamicSort(this.sortingParameter));
        console.log(this.data);

        this.extractGenres();
        this.wh_min = 0;
        this.wh_max = 13000;


        // extract the data and draw the chart
        this.extractElements();

        console.log(this.series);
        // console.log(this.seasons);
        // console.log(this.episodes);


        // draw everything
        this.draw();
    }

    // create a Set containing the different genres; it will be used when filtering.
    extractGenres(){
        this.genres = new Set();
        this.data.forEach(series => {
                series.genre.split(" ").forEach(item => this.genres.add(item))
        })
        // console.log([...this.genres].sort());
    }

    draw() {
        this.margin = {top: 20, right: 40, bottom: 70, left: 80};
        this.width = window.innerWidth*0.9 + this.margin.right + this.margin.left; //1020
        this.height = window.innerHeight*0.75 - this.margin.top - this.margin.bottom; //780
        this.extent = [[0,0], [this.width, this.height]]
        this.widthOffset = this.margin.right + this.margin.left;
        this.heightOffset = this.margin.top + this.margin.bottom + 200;

        var _this = this;

        // Interaction menu dimensions depend on svg
        // $(".interaction-menu").width(this.width - 150)
        // $(".content").width(this.width - 150)

        // Define svg Chart
        this.svgChart = d3.select("#svgChart");


        // Draw responsive svg chart
        this.svgChart.attr("preserveAspectRatio", "xMinYMin meet")
           .attr("viewBox", "0 0 " + (this.width + this.widthOffset) + " " + (this.height+this.heightOffset))
           .classed("svg-content-responsive", true)
           //.attr("transform","translate(" + this.margin.left + "," + this.margin.top + ")");

        // Append clip-path to defs which is appended to the chart
        this.svgChart.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", this.width + this.widthOffset)
        .attr("height", this.height + this.heightOffset);


        // Define and append to the chart a focus window
        this.focus = this.svgChart.append("g")
               .attr("class", "focus")
               .attr("transform","translate(" + this.margin.left + "," + this.margin.top + ")");


        this.zoom = d3.zoom()
            .scaleExtent(this.getScaleExtent())
            .translateExtent([[this.margin.left,this.margin.top], [this.width - this.margin.right, this.height - this.margin.top]])
            .extent([[this.margin.left,this.margin.top], [this.width - this.margin.right, this.height - this.margin.top]])
            .on("zoom", function() { _this.zoomed(_this); });

        this.svgChart.call(this.zoom)

        // create the other stuff
        this.createScalesAndAxes();
        this.addDataToBars();
        this.addBars();
        this.addAxes();

    }


    clear() {
         this.svgChart.selectAll("*").remove();
    }

    addDataToBars(){
        this.clipp = this.focus.append("g")
            .attr("clip-path", "url(#clip)");

        this.bars = this.clipp.selectAll(".bar")
                      .data(this.getCurrentData())
                      .enter();
    }

    createScalesAndAxes() {
        // calculate the scales for the axis

        this.x = d3.scaleBand()
            // .range([this.margin.left, this.width-this.margin.right])
            .range([0, this.width - this.margin.right])
            .domain(this.getCurrentData().map(item => item.id))
            //.padding(0.1);

        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, d3.max(this.episodes, function(d) { return d.wh; })]).nice();


        // define the axis
        this.xAxis = d3.axisBottom(this.x)
            .tickSizeOuter(0) // no ticks at the border
            .tickFormat("").tickSize(0); // initially no labels nor ticks

        this.yAxis = d3.axisLeft(this.y).ticks(10);

    }

    addAxes() {

        this.clipp.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + this.height + ")")
            //.attr('transform', 'translate('+ this.margin.left + ',' + (this.margin.top + this.height) + ')')
            .call(this.xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".5em");


        this.focus.append("g")
            .attr("class", "y-axis")
            //.attr('transform', 'translate('+ this.margin.left + ',' + (this.margin.top + this.height) + ')')
            //.attr('transform', 'translate(' + (this.margin.left + this.width) + ',' + this.margin.top +')'
            .attr("transform","translate(0,0)")
            .call(this.yAxis);

        this.focus
            .append("text")
            .attr("class", "title")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x",-this.height/2)
            .style("text-anchor", "middle")
            .text("Words per Hour");
    }


    addBars() {
        var x = this.x;
        var y = this.y;
        var height  = this.height;
        var _this   = this;
        var series  = this.series;
        var seasons = this.seasons;

        // Seleziono il tooltip in base al livello di zoom
        switch(this.zoomLevel) {
            case SERIES:   this.series_tooltip  = d3.select("#series-tooltip")
                                                    .style("opacity", 0); break;
            case SEASONS:  this.season_tooltip  = d3.select("#season-tooltip")
                                                    .style("opacity", 0); break;
            case EPISODES: this.episode_tooltip = d3.select("#episode-tooltip")
                                                    .style("opacity", 0); break;
        }

        // Bar animation enabled only the first time after:
        // a) loading
        // b) changing data.
        // Not enabled when resizing and redrawing the chart
        if(this.animation) {
            this.bars.append("rect")
            .attr("class", "bar")
            .attr("x", function(item) { return x(item.id); })
            .attr("width", this.x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .attr("fill", function(item) { return _this.getColor(item, _this);})
            .transition()
            .duration(500)
            //.delay(function(d,i){ return i*_this.getDelayValue()})
            .attr("y", function(item) { return y(item.wh); })
            .attr("height", function(item) { return height - y(item.wh); });

            this.bars.append("text")
            .attr("class", "series_labels")
            .text((item) => {
                return (item.is_central) ? series[item.series].name : "";
                })
            .attr('transform', (d,i)=>{
                return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+
                                     (_this.height+20)+'),'+ 'rotate(45)';})
            .transition()
            .duration(300)
            .attr('x', 0)
            .attr('y', 0)

            // if (this.zoomLevel > 1) {
            //     // series average w/h rectangle
            //     this.bars.append("rect")
            //     .attr("class", "series_line")
            //     .attr("x", function(item) { return x(item.id); })
            //     .attr("width", this.x.bandwidth())
            //     .attr("y", y(0))
            //     .attr("height", 0)
            //     .transition()
            //     .duration(500)
            //     //.delay(function(d,i){ return i*_this.getDelayValue()})
            //     .attr("y", (item) => { return y(series[item.series].wh); })
            //     .attr("height", (item) => { return height - y(series[item.series].wh); });
            // }

        } else { //animation allowed, i.e when changing data
            this.bars.append("rect")
            .attr("class", "bar")
            .attr("x", function(item) { return x(item.id); })
            .attr("width", this.x.bandwidth())
            .attr("fill", function(item) { return _this.getColor(item, _this);})
            .attr("y", function(item) { return y(item.wh); })
            .attr("height", function(item) { return height - y(item.wh); });

            this.bars.append("text")
            .attr("class", "series_labels")
            .text((item) => {
                return (item.is_central) ? series[item.series].name : "";
                })
            .attr('transform', (d,i)=>{
                return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+
                                     (_this.height+20)+'),'+ 'rotate(45)';})
            .attr('x', 0)
            .attr('y', 0)

            if (this.zoomLevel > 1) {
                // series average w/h rectangle
                this.bars.append("rect")
                .attr("class", "series_line")
                .attr("x", function(item) { return x(item.id); })
                .attr("width", this.x.bandwidth())
                //.delay(function(d,i){ return i*_this.getDelayValue()})
                .attr("y", (item) => { return y(series[item.series].wh); })
                .attr("height", 1);
                // .attr("height", (item) => { return height - y(series[item.series].wh); });
            }
        }


        // These operation are always allowed because they don't involve transitions
        d3.selectAll(".bar")
            .on("mouseover", function(item) { _this.showTooltip(item, _this); })
            .on("mouseout",  function(item) { _this.hideTooltip(item, _this); })


        // if (this.zoomLevel == 3) {
        //     // season average w/h line
        //     this.bars.append("rect")
        //     .attr("class", "season_line")
        //     .attr("x", (item) => { return x(item.id); })
        //     .attr("width", this.x.bandwidth()/2)
        //     .attr("y", (item) => { return y(series[item.series]
        //                                     .seasons_wh[item.season-1]); })
        //     .attr("height", 1);
        // }
    }



    extractElements(){
        var id_series  = 0;
        var id_season  = 0;
        var id_episode = 0;

        var series   = [];
        var seasons  = [];
        var episodes = [];

        this.data.forEach(single_series => {
            var episode_counter = 1;

            if (this.isSeriesAllowed(single_series)){
                // extract the series data
                series.push({
                    id: id_series,
                    name: single_series.name,
                    number: +single_series.id_,
                    // number: id_series,
                    wh: +single_series.wh,
                    episode_length: +single_series.episode_length,
                    start_year: single_series.start_year,
                    end_year: single_series.end_year,
                    logo_url: "posters/"+single_series.id_+".jpg",
                    series: id_series, // position in this.series
                    genre: single_series.genre,
                    description: single_series.description,
                    no_of_seasons: single_series.seasons.length,
                    is_central: true,
                    seasons_wh: []
                });

                // extract the seasons data
                single_series.seasons.forEach(season => {
                    seasons.push({
                        id: id_season++,
                        name: single_series.name,
                        start_year: single_series.start_year,
                        end_year: single_series.end_year,
                        number: +season.id_,
                        wh: +season.wh,
                        logo_url: "posters/"+single_series.id_+".jpg",
                        series: id_series, // position in this.series
                        no_of_episodes: season.episodes.length,
                        is_central: +season.id_ == Math.round(single_series.seasons.length/2)
                    });

                    series[id_series].seasons_wh.push(+season.wh);

                    // extract the episodes data

                    // episodes count
                    var n_episodes = single_series.seasons
                                        .map(season => season.episodes.length)
                                        .reduce((a,b)=>a+b);

                    season.episodes.forEach(episode => {
                        episode_counter++;
                        episodes.push({
                            id: id_episode++,
                            name: single_series.name,
                            start_year: single_series.start_year,
                            end_year: single_series.end_year,
                            number: +episode.id_,
                            wh: +episode.wh,
                            title: episode.title,
                            logo_url: "posters/"+single_series.id_+".jpg",
                            season: +season.id_,
                            series: id_series, // position in this.series
                            length: episode.length,
                            is_central: episode_counter == Math.round(n_episodes/2)
                        });
                    });
                });
                id_series++;
            }
        });

        this.series   = series;
        this.seasons  = seasons;
        this.episodes = episodes;
    }


    getNumberOfElements(){
        return (this.zoomLevel == SERIES)  ? this.series.length  :
               (this.zoomLevel == SEASONS) ? this.seasons.length :
                                             this.episodes.length;
    }

    getCurrentData(){
        return (this.zoomLevel == SERIES)  ? this.series  :
               (this.zoomLevel == SEASONS) ? this.seasons :
                                             this.episodes;
    }


    getScaleExtent() {
        return (this.zoomLevel == SERIES)  ? [1, 8]  :
               (this.zoomLevel == SEASONS) ? [1, 25] :
                                             [1, 100];
    }

    getColor(item, _this){
        var genre = _this.series[item.series].genre.split(" ")[0];

        if (genre == "Action")      return '#7570b3'; // viola
        if (genre == "Adventure")   return '#1b7837'; // verde
        if (genre == "Animation")   return '#a6cee3'; // celestino
        if (genre == "Biography")   return '#FFE4B5'; // giallino
        if (genre == "Comedy")      return '#1f78b4'; // blu
        if (genre == "Crime")       return '#000000'; // nero
        if (genre == "Documentary") return '#7fbf7b'; // verdino
        if (genre == "Drama")       return '#d95f02'; // arancione
        if (genre == "Fantasy")     return '#d95f02'; // arancione
        if (genre == "History")     return '#8B0000'; // rosso scuro
        if (genre == "Mystery")     return '#A9A9A9'; // grigio
        if (genre == "Romance")     return '#f0027f'; // rosa
        if (genre == "Sci-Fi")      return '#191970'; // blu scuro
        if (genre == "War")         return '#8B4513'; // marron

        return "#ffffff"
    }

    setTooltipText(item, _this){
        switch(_this.zoomLevel) {
            case SERIES:
                var str = (item.no_of_seasons == 1) ? "season" : "seasons";

                $(".series-number").html((item.id+1) + ". ")
                $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-" + item.end_year + ")"  +"</br>")
                $(".series-info").html(item.episode_length + "min | " + item.genre + " | " + + item.no_of_seasons + " " + str + "</br>")
                $(".series-summary").html(item.description + "</br>")
                $(".series-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
                break;

            case SEASONS:
                $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-" + item.end_year + ")"  +"</br>")
                $(".season-info").html("Season " + (item.number) + ", Episodes: " + item.no_of_episodes + "</br>")
                $(".season-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
                break;

            case EPISODES:
                $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-" + item.end_year + ")"  +"</br>")
                $(".episode-number").html((item.number) + ". ")
                $(".episode-title").html(item.title + "</br>")
                $(".episode-info").html("Season " + item.season + " | " + item.length + "min" + "</br>")
                $(".episode-wh").html("Words per Hour: " + "<b>" + item.wh + "</b>" + "</br>")
                break;
        }
    }

    showTooltip(item, _this){
        this.tooltip = (_this.zoomLevel == SERIES)  ? _this.series_tooltip :
                       (_this.zoomLevel == SEASONS) ? _this.season_tooltip :
                                                      _this.episode_tooltip;

        _this.tooltip.transition()
            .duration(50)
            .style("opacity", 0.9);

        // series tooltip content
        $(".series-poster").attr("src", item.logo_url)
        _this.setTooltipText(item, _this);

        _this.tooltip
            .style("left", function(){
                var x = d3.event.pageX;
                var w = 530;
                var i = window.innerWidth;
                return (( x+w < i ) ? x + 90 : i - w + 90) + "px"

            })
            .style("top", function(){
                var y = d3.event.pageY;
                var h = 200;
                var i = window.innerHeight;
                return (( y+h < i ) ? y-15 : i-h-15) + "px"
            })
    }

    hideTooltip(item, _this){
        _this.tooltip.transition()
          .duration(50)
          .style("opacity", 0);
        _this.tooltip
          .style("left", (-999999) + "px") //x
          .style("top", (-999999) + "px"); //y
    }

    // Nuova funzione per prendere il livello di zoom dal radio button selezionato
    // imposto zoomLevel e poi pulisco l'svg attuale prima di ridisegnarlo
    setZoomLevelAndData(zoomLevel) {
        this.zoomLevel = zoomLevel;
        // this.animation = true
        // remove the old bars
        this.focus.selectAll("*")
             //  .transition()
             //  .duration(300)
             //  .attr("y", 0)
             // .style("fill-opacity", 1e-6)
              .remove();

        // redraw the chart
        this.draw();

        // move the chart to the previous zoomed state
        this.zoomed(this);
    }

    zoomed(_this){
        if (d3.event) _this.lastTransform = d3.event.transform;

        if (_this.lastTransform){
            if (_this.zoomLevel == EPISODES && _this.lastTransform.k > 13 ||
                _this.zoomLevel == SEASONS  && _this.lastTransform.k > 2     ){
                // show labels and ticks only if the bars are big enough
                var labels = this.getCurrentData().map(item => item.number)
                this.xAxis.tickFormat((d, i) => { return labels[i] }).tickSize(3);
            }
            else {
                // hide labels and ticks
                _this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks
            }

            // move the bars
            _this.x.range([80, _this.width - _this.margin.right].map(d => _this.lastTransform.applyX(d)-80));
            _this.focus.selectAll("rect").attr("x", d => _this.x(d.id))
                     .attr("width", _this.x.bandwidth())


            _this.focus.selectAll(".x-axis").call(_this.xAxis);

            // move the series labels
            _this.focus.selectAll(".series_labels")
            .attr('transform', (d,i)=>{
                return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+(_this.height+20)+'),'+ 'rotate(45)';})
            .attr('x', 0)
            .attr('y', 0)
        }
    }


    // ----------- SORTING
    // this function returns a function used for sorting that property
    dynamicSort(property) {
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

    setSortingType(sortingType){
        this.sortingType = sortingType;
        this.sortData();
    }

    setSortingParameter(sortingParameter){
        this.sortingParameter = sortingParameter;
        this.sortData();
    }

    sortData(){
        if (this.sortingType == DESCENDING)
            this.data.sort(this.dynamicSort("-" + this.sortingParameter));
        else
            this.data.sort(this.dynamicSort(this.sortingParameter));

        this.clear();
        this.extractElements();
        this.draw();
        this.zoomed(this);
    }

    // ------------ FILTERING
    // returns true if the series respects all the filters
    isSeriesAllowed(series){
        // console.log(series.genre.split(" "))
        var genres = this.genres;

        // check if:
        // - the series w/h in inside the w/h limits
        // - the series year in inside the years limits TODO
        // - at least one genre of the series is present in the filters set
        return series.wh >= this.wh_min && series.wh <= this.wh_max &&
                series.genre.split(" ")
                            .reduce(
                                function(result, item) {
                                    return result || genres.has(item);
                                }, false)
    }

    // add or remove a filter from the filters set
    setFilterInFiltersSet(filterType, checked){
        if (checked) this.genres.add(filterType);
        else this.genres.delete(filterType);
        // console.log(this.genres);

        this.clear();
        this.extractElements();
        this.draw();
        this.zoomed(this);
    }

    setWhLimits(limits){
        this.wh_min = parseInt(limits.split(";")[0])
        this.wh_max = parseInt(limits.split(";")[1])

        this.clear();
        this.extractElements();
        this.draw();
        this.zoomed(this);
    }

    // reset filters
    resetFilters() {
        this.genres.clear();

        this.clear();
        this.extractElements();
        this.draw();
        this.zoomed(this);
    }

    // set all filters
    setAllFilters() {
        this.extractGenres();

        this.clear();
        this.extractElements();
        this.draw();
        this.zoomed(this);
    }
}
