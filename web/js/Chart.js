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

        this.lastTransform = null;
        this.t = d3.transition().duration(500);

        // set the zoom, the sorting and the filters
        this.zoomLevel = SERIES;
        this.sortingParameter  = "id_";
        this.sortingType = ASCENDING;

        // bar transitions flag
        this.transitions = true;

        this.data.sort(this.dynamicSort(this.sortingParameter));
        console.log(this.data);

        this.extractGenres();
        this.wh_min = 0;
        this.wh_max = 13000;
        this.year_min = 1950;
        this.year_max = 2019;


        // extract the data and draw the chart
        this.extractElements();

        console.log(this.series);

        // draw everything
        this.draw();
    }

    // create a Set containing the different genres; it will be used when filtering.
    extractGenres(){
        this.genres = new Set();
        this.data.forEach(series => {
                series.genre.split(" ").forEach(item => this.genres.add(item))
        })
    }

    draw() {
        this.margin = {top: 20, right: 40, bottom: 70, left: 80};
        this.width = window.innerWidth*0.9 + this.margin.right + this.margin.left; //1020
        this.height = window.innerHeight*0.75 - this.margin.top - this.margin.bottom; //780
        this.extent = [[0,0], [this.width, this.height]]
        this.widthOffset = this.margin.right + this.margin.left;
        this.heightOffset = this.margin.top + this.margin.bottom + 200;

        var _this = this;

        // Define svg Chart
        this.svgChart = d3.select("#svgChart");


        // Draw responsive svg chart
        this.svgChart.attr("preserveAspectRatio", "xMinYMin meet")
           .attr("viewBox", "0 0 " + (this.width + this.widthOffset) + " " + (this.height+this.heightOffset))
           .classed("svg-content-responsive", true)

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
        this.addBars();
    }


    clear() {
         this.svgChart.selectAll("*").remove();
    }

    createScalesAndAxes() {
        // calculate the scales for the axis

        this.x = d3.scaleBand()
            .range([0, this.width - this.margin.right])

        this.y = d3.scaleLinear()
            .range([this.height, 0])

        // define the axis
        this.xAxis = d3.axisBottom(this.x)
            .tickSizeOuter(0) // no ticks at the border
            .tickFormat("").tickSize(0); // initially no labels nor ticks

        this.yAxis = d3.axisLeft(this.y).ticks(10);
        this.clipp = this.focus.append("g")
            .attr("clip-path", "url(#clip)");
    }

    setAxes() {

        // set the axes domain
        this.x.domain(this.getCurrentData().map(item => item.id))
        this.y.domain([0, d3.max(this.episodes, function(d) { return d.wh; })]).nice();


        this.clipp.select(".x-axis").call(this.xAxis);

        // remove the old x-axis
        this.clipp.select(".x-axis").remove();
        // append the new x-axis
        this.clipp.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".5em");

        // remove the old y-axis and the title
        this.focus.select(".y-axis").remove();
        this.focus.select(".title").remove();

        // append the new x-axis
        this.focus.append("g")
            .attr("class", "y-axis")
            .style("font", "15px times")
            .attr("transform","translate(0,0)")
            .call(this.yAxis);

        // append the new text
        this.focus
            .append("text")
            .attr("class", "title")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
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

        // tooltip selection based on zoom level
        switch(this.zoomLevel) {
            case SERIES:   this.series_tooltip  = d3.select("#series-tooltip")
                                                    .style("opacity", 0); break;
            case SEASONS:  this.season_tooltip  = d3.select("#season-tooltip")
                                                    .style("opacity", 0); break;
            case EPISODES: this.episode_tooltip = d3.select("#episode-tooltip")
                                                    .style("opacity", 0); break;
        }

        this.setAxes();

        // JOIN new data with old elements
        this.bars = this.clipp.selectAll(".bar")
        .data(this.getCurrentData(), function(d){ return d.id; });

        this.seriesLabels = this.clipp.selectAll(".series_label")
        .data(this.getCurrentData(), function(d){ return d.id; });

        this.seriesLines = this.clipp.selectAll(".series_line")
        .data(this.getCurrentData(), function(d){ return d.id; });

        // bar transitions are displayed only on loading and zoom level changes
        // 0ms duration means the transitions won't be visible
        var duration = (this.transitions) ? 500 : 0;

        // EXIT old elements not present in new data
        this.bars.exit()
        .transition().duration(duration)
        .attr("y", function(d) {
          return height;
        }) // old elements which are leaving the chart, their y position transitions to the xaxis
        .attr("height", function(d) {
          return 0;
        }) // old elements which are leaving the chart, therir height trasnitions to 0
        .remove();

        this.seriesLabels.exit().remove()
        this.seriesLines.exit().remove()

        

        // UPDATE old elements present in new data
        this.bars.transition().duration(duration)
        .attr("x", function(d) {
          return x(d.id);
          }) // old elememnts in new data transition to their new position
        .attr("width", x.bandwidth())
        .attr("y", function(d) {
          return y(d.wh)
        }) // old elememnts in new data transition to their y position
        .attr("height", function(d, i) {
          return height - y(d.wh)
        }); // old elememnts in new data transition to their correct height

        this.seriesLabels.transition().duration(duration)
        .attr('transform', (d)=>{
            return 'translate( '+(_this.x(d.id) +_this.x.bandwidth()/2)+' , '+
                                 (_this.height+20)+'),'+ 'rotate(45)';})
        .attr('x', 0)
        .attr('y', 0)

        this.seriesLines.transition().duration(duration)
        .attr("x", function(d) {
          return x(d.id);
          }) // old elememnts in new data transition to their new position
        .attr("width", x.bandwidth())
        .attr("y", function(d) {
          return y(d.wh_series)
        }) // old elememnts in new data transition to their y position


        // ENTER new elements present in new data
        this.bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(item) { return x(item.id); })
        .attr("width", x.bandwidth())
        .attr("y", y(0))
        .attr("height", 0)
        .attr("fill", function(item) { return _this.getColor(item, _this);})
        .transition().duration(duration)
        //.delay(function(d,i){ return i*_this.getDelayValue()})
        .attr("y", function(item) { return y(item.wh); })
        .attr("height", function(item) { return height - y(item.wh); })

        
        // labels with the series name
        this.seriesLabels.enter().append("text")
        .attr("class", "series_label")
        .text((item) => { return (item.is_central) ? item.name : ""; })
        .attr('transform', (d)=>{
                            return 'translate( '+(_this.x(d.id) +_this.x.bandwidth()/2)+' , '+
                                 (_this.height+20)+'),'+ 'rotate(45)';})
        .attr("x", 0)
        .attr('y', 0)

        // series average w/h line
        if (this.zoomLevel > 1) {
            this.seriesLines.enter().append("rect")
            .attr("class", "series_line")
            .attr("fill", "black")
            .attr("x", function(item) { return x(item.id); })
            .attr("width", this.x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .transition().duration(duration)
            .attr("y", (item) => { return y(item.wh_series); })
            .attr("height", 1);
        }


        // These operation are always allowed because they don't involve transitions
        d3.selectAll(".bar")
            .on("mouseover", function(item) { _this.showTooltip(item, _this); })
            .on("mouseout",  function(item) { _this.hideTooltip(item, _this); })

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
                    id: +single_series.id_,
                    name: single_series.name,
                    number: +single_series.id_,
                    wh: +single_series.wh,
                    episode_length: +single_series.episode_length,
                    start_year: single_series.start_year,
                    end_year: single_series.end_year,
                    logo_url: "assets/posters/"+single_series.id_+".jpg",
                    series: id_series, // position in this.series
                    genre: single_series.genre.split(" ")[0],
                    description: single_series.description,
                    no_of_seasons: single_series.seasons.length,
                    is_central: true
                });

                // extract the seasons data
                single_series.seasons.forEach(season => {
                    seasons.push({
                        id: ((+single_series.id_)*1000000) +
                            ((+season.id_)*1000),
                        name: single_series.name,
                        start_year: single_series.start_year,
                        end_year: single_series.end_year,
                        number: +season.id_,
                        wh: +season.wh,
                        logo_url: "assets/logos/original/"+single_series.id_+".png",
                        no_of_episodes: season.episodes.length,
                        wh_series: +single_series.wh,
                        genre: single_series.genre.split(" ")[0],
                        is_central: +season.id_ == Math.round(single_series.seasons.length/2)
                    });

                    // extract the episodes data

                    // episodes count
                    var n_episodes = single_series.seasons
                                        .map(season => season.episodes.length)
                                        .reduce((a,b)=>a+b);

                    season.episodes.forEach(episode => {
                        episode_counter++;
                        episodes.push({
                            id: ((+single_series.id_)*1000000) +
                                ((+season.id_)*1000) +
                                (+episode.id_),
                            name: single_series.name,
                            start_year: single_series.start_year,
                            end_year: single_series.end_year,
                            number: +episode.id_,
                            wh: +episode.wh,
                            title: episode.title,
                            logo_url: "assets/logos/original/"+single_series.id_+".png",
                            season: +season.id_,
                            wh_series: +single_series.wh,
                            genre: single_series.genre.split(" ")[0],
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
        var genre = item.genre;

        if (genre == "Action")      return '#B36FAF'; // viola
        if (genre == "Adventure")   return '#5B9279'; // verde
        if (genre == "Animation")   return '#ACEBFF'; // celestino
        if (genre == "Biography")   return '#F1D38D'; // giallino
        if (genre == "Comedy")      return '#0075F2'; // blu acceso
        if (genre == "Crime")       return '#F6B540'; // giallo
        if (genre == "Documentary") return '#7fbf7b'; // verdino
        if (genre == "Drama")       return '#EF7161'; // arancione
        if (genre == "Fantasy")     return '#BCB6FF'; // lilla
        if (genre == "History")     return '#DD0426'; // rosso scuro
        if (genre == "Mystery")     return '#9197AE'; // grigio
        if (genre == "Romance")     return '#D8ACB9'; // rosa
        if (genre == "Sci-Fi")      return '#5762D5'; // iris
        if (genre == "War")         return '#576757'; // verde militare

        return "#ffffff"
    }

    setTooltipText(item, _this){
        // the series name it's the same for every tooltip
        // set it according to the start-end values
        if (item.start_year == item.end_year)
            $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + ")"  +"</br>")
        else if (item.end_year == 9999)
            $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-)"  +"</br>")
        else
            $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-" + item.end_year + ")"  +"</br>")

        switch(_this.zoomLevel) {
            case SERIES:
                var str = (item.no_of_seasons == 1) ? "season" : "seasons";

                $(".series-poster").attr("src", item.logo_url)
                $(".series-number").html((item.id+1) + ". ")
                $(".series-info").html(item.episode_length + "min | " + item.genre + " | " + + item.no_of_seasons + " " + str + "</br>")
                $(".series-summary").html(item.description + "</br>")
                $(".series-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
                break;

            case SEASONS:

                $(".series-logo").attr("src", item.logo_url)
                $(".season-info").html("Season " + (item.number) + ", Episodes: " + item.no_of_episodes + "</br>")
                $(".season-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
                break;

            case EPISODES:

                $(".series-logo").attr("src", item.logo_url)
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

    /* This function gets zoom level from the selected radion button. Then, it sets
    zoomLevel and redraws the bars*/
    setZoomLevelAndData(zoomLevel) {
        this.transitions = true;
        this.zoomLevel = zoomLevel;

        this.extractElements();
        this.addBars();
    }

    zoomed(_this){
        if (d3.event) _this.lastTransform = d3.event.transform;

        if (_this.lastTransform){
            _this.setTicksAndLabels();

            // move the bars
            _this.x.range([80, _this.width - _this.margin.right].map(d => _this.lastTransform.applyX(d)-80));
            _this.clipp.selectAll("rect").attr("x", d => _this.x(d.id))
                     .attr("width", _this.x.bandwidth())


            _this.clipp.selectAll(".x-axis").call(_this.xAxis);

            // move the series labels
            _this.clipp.selectAll(".series_label")
            .attr('transform', (d)=>{
                return 'translate( '+(_this.x(d.id) +_this.x.bandwidth()/2)+' , '+(_this.height+20)+'),'+ 'rotate(45)';})
            .attr('x', 0)
            .attr('y', 0)
        }
    }

    setTicksAndLabels(){
        if (this.zoomLevel == EPISODES && this.lastTransform.k > 13 ||
            this.zoomLevel == SEASONS  && this.lastTransform.k > 2     ){
            // show labels and ticks only if the bars are big enough
            var labels = this.getCurrentData().map(item => item.number)
            this.xAxis.tickFormat((d, i) => { return labels[i] }).tickSize(3);
        }
        else {
            // hide labels and ticks
            this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks
        }
    }

    // ----------- SORTING
    // returns a function used for sorting on that property
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

        this.extractElements();
        this.addBars();
    }

    // ------------ FILTERING
    // returns true if the series respects all the filters
    isSeriesAllowed(seriesFromJson){
        // check whether:
        // - w/h is inside the w/h limits
        // - year is inside the years limits TODO
        // - genre is present in the filters set
        return (seriesFromJson.wh >= this.wh_min && seriesFromJson.wh <= this.wh_max) &&
               (seriesFromJson.start_year <= this.year_max &&
                seriesFromJson.end_year   >= this.year_min) &&
                this.genres.has(seriesFromJson.genre.split(" ")[0]);
                /*(seriesFromJson.genre.split(" ")
                            .reduce(
                                function(result, item) {
                                    return result || genres.has(item);
                                }, false))*/
    }

    // add or remove a filter from the filters set
    setFilterInFiltersSet(filterType, checked){
        if (checked) this.genres.add(filterType);
        else this.genres.delete(filterType);

        this.extractElements();
        this.addBars();
    }

    setWhLimits(limits){
        this.wh_min = parseInt(limits.split(";")[0])
        this.wh_max = parseInt(limits.split(";")[1])

        this.extractElements();
        this.addBars();

    }

    setYearLimits(limits){
        this.year_min = parseInt(limits.split(";")[0])
        this.year_max = parseInt(limits.split(";")[1])


        this.extractElements();
        this.addBars();
    }

    // reset filters
    resetFilters() {
        this.genres.clear();

        this.extractElements();
        this.addBars();
    }

    // set all filters
    setAllFilters() {
        this.extractGenres();

        this.extractElements();
        this.addBars();
    }
}
