class Chart {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data; //data
        console.log(this.data);

        // 1 = series, 2 = seasons, 3 = episodes. Start from the series
        this.zoomLevel = 1;

        this.lastTransform = null;

        // extract the data and draw the chart
        this.extractElements();
        this.draw();
    }

    draw() {
        this.margin = {top: 20, right: 40, bottom: 70, left: 60};
        this.width = window.innerWidth*0.9 - this.margin.left - this.margin.right ; //1020
        this.height = 500 - this.margin.top - this.margin.bottom; //780
        this.extent = [[0,0], [this.width, this.height]]

        var _this = this;

        this.svgChart = d3.select("#svgChart")
        this.zoom = d3.zoom()
            .scaleExtent([1, 100])
            .translateExtent(this.extent)
            .extent(this.extent)
            .on("zoom", function() { _this.zoomed(_this); });

        this.svgChart.call(this.zoom)

        // create the other stuff
        this.createScales();
        this.addAxes();
        this.addDataToBars();
        this.addBars();
        this.adjustDimensions();
    }

    addDataToBars(){
        // Selection
        this.bars = this.svgChart.selectAll(".bar")
                      .data(this.getCurrentData())
                      .enter();
    }

    createScales() {
        // calculate the scales for the axis

        this.x = d3.scaleBand()
            // .range([this.margin.left, this.width-this.margin.right])
            .range([0, this.width - this.margin.right])
            .domain(this.getCurrentData().map(item => item.id))
            .padding(0.1);

        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, d3.max(this.episodes, function(d) { return d.wh; })]).nice();
    }

    addAxes() {
        // define the axis
        this.xAxis = d3.axisBottom(this.x)
            .tickSizeOuter(0) // no ticks at the border
            .tickFormat("").tickSize(0); // initially no labels nor ticks

        this.yAxis = d3.axisLeft(this.y).ticks(10);

        // add the Y axis to the SVG element
        this.svgY = d3.select("#svgY")
            .attr("width", this.margin.left+1)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .style("position","fixed")
            .style("overflow-y","scroll")
            .style("background-color","white")
            .append("g")
            .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")")


        this.svgChart = d3.select("#svgChart")
           .style("overflow-x","scroll")
           .attr("width", this.width)
           .attr("height", this.height + this.margin.top + this.margin.bottom)
           .append("g")
           .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")")

        this.svgY.append("g")
            .attr("class", "y-axis")
            .call(this.yAxis)

        this.svgY.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - this.margin.left - 20)
          .attr("x",0 - (this.height / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Words per hour");

        this.svgChart.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".5em");

        // text label for the y axis
        this.svgY.append("text")
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

        // tooltip
        // this.div = d3.select("body").append("div")
        //     .attr("class", "tooltip")
        //     .style("opacity", 0);


        // Seleziono il tooltip in base al livello di zoom
        switch(this.zoomLevel) {
            case 1: this.series_tooltip  = d3.select("#series-tooltip")
                                             .style("opacity", 0); break;
            case 2: this.season_tooltip  = d3.select("#season-tooltip")
                                             .style("opacity", 0); break;
            case 3: this.episode_tooltip = d3.select("#episode-tooltip")
                                             .style("opacity", 0); break;
        }

        // Old tooltip
        // this.tooltip = d3.select("#tooltip-span")
        //     .style("opacity", 0)

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

        d3.selectAll(".bar")
        .on("mouseover", function(item) { _this.showTooltip(item, _this); })
        .on("mouseout",  function(item) { _this.hideTooltip(item, _this); })

        this.bars.append("text")
            .attr("class", "series_labels")
            .text((item) => {
                return (item.is_central) ? _this.data[item.series].name : "";
                })
            .attr('transform', (d,i)=>{
                return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+
                                     (_this.height+20)+'),'+ 'rotate(45)';})
            .transition()
            .duration(300)
            .attr('x', 0)
            .attr('y', 0)


        if (this.zoomLevel == 3) {
            // season average w/h line
            this.bars.append("rect")
            .attr("class", "season_line")
            .attr("x", (item) => { return x(item.id); })
            .attr("width", this.x.bandwidth()/2)
            .attr("y", (item) => { return y(_this.data[item.series].seasons[item.season-1].avg_wh); })
            .attr("height", 1);
        }

        if (this.zoomLevel > 1) {
            // series average w/h rectangle
            this.bars.append("rect")
            .attr("class", "series_line")
            .attr("x", function(item) { return x(item.id); })
            .attr("width", this.x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .transition()
            .duration(500)
            //.delay(function(d,i){ return i*_this.getDelayValue()})
            .attr("y", (item) => { return y(series[item.series].wh); })
            .attr("height", (item) => { return height - y(series[item.series].wh); });
        }
    }

    // Per qualche motivo va fatto dopo draw()
    adjustDimensions() {
        d3.select("#svgChart").attr("height", 650)
                              .attr("width", this.width + 90);

        d3.select("#svgY").attr("height", 650);
    }

    getDelayValue() {
        return (this.zoomLevel == 1) ? 9  :
               (this.zoomLevel == 2) ? 5  :
                                       0.4;
    }

    extractElements(){
        var id_series = 0;
        var id_season = 0;
        var id_episode = 0;

        var series = [];
        var seasons = [];
        var episodes = [];

        this.data.forEach(single_series => {
            var episode_counter = 1;

            // extract the series data
            series.push({
                id: id_series++,
                name: single_series.name,
                number: +single_series.id_,
                wh: +single_series.avg_wh,
                episode_length: +single_series.episode_length,
                year: single_series.year,
                logo_url: "posters/"+single_series.id_+".jpg",
                series: +single_series.id_,
                genre: single_series.genre,
                description: single_series.description,
                no_of_seasons: single_series.seasons.length,
                is_central: true
            });

            // extract the seasons data
            single_series.seasons.forEach(season => {
                seasons.push({
                    id: id_season++,
                    number: +season.id_,
                    wh: +season.avg_wh,
                    logo_url: "posters/"+single_series.id_+".jpg",
                    series: +single_series.id_,
                    no_of_episodes: season.episodes.length,
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
                        id: id_episode++,
                        number: +episode.id_,
                        wh: +episode.wh,
                        title: episode.title,
                        logo_url: "posters/"+single_series.id_+".jpg",
                        season: +season.id_,
                        series: +single_series.id_,
                        length: episode.length,
                        is_central: episode_counter == Math.round(n_episodes/2)
                    });
                });
            });
        });

        this.series   = series;
        this.seasons  = seasons;
        this.episodes = episodes;
    }


    getNumberOfElements(){
        return (this.zoomLevel == 1) ? this.series.length  :
               (this.zoomLevel == 2) ? this.seasons.length :
                                       this.episodes.length;
    }

    getCurrentData(){
        return (this.zoomLevel == 1) ? this.series  :
               (this.zoomLevel == 2) ? this.seasons :
                                       this.episodes;
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
        if (genre == "Mistery")     return '#A9A9A9'; // grigio
        if (genre == "Romance")     return '#f0027f'; // rosa
        if (genre == "Sci-Fi")      return '#191970'; // blu scuro
        if (genre == "War")         return '#8B4513'; // marron

        return "#ffffff"
        // return "#000000"
    }

    setTooltipText(item, _this){
        // OLD
        // if (_this.zoomLevel == 1) //inietto negli span del tooltip le informazioni
        //     return "Words per Hour: " + "<b>"+ (Math.round(item.wh * 100) / 100) + "</b>";

        // else if (_this.zoomLevel == 2)
        //     return "Season " + item.number + "<br/>"
        //         + "Words per Hour: " + "<b>"+ (Math.round(item.wh * 100) / 100) + "</b>";

        // else if (_this.zoomLevel == 3)
        //     return "Season " + item.season + ", Episode " + item.number + "<br/>"
        //             + "Words per Hour: " + "<b>"+ (Math.round(item.wh * 100) / 100) + "</b>";

        // NEW

        switch(_this.zoomLevel) {
            case 1: // Series
                var str = (item.no_of_seasons == 1) ? "season" : "seasons";

                $(".series-number").html((item.id+1) + ". ")
                $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.year + ")"  +"</br>")
                $(".series-info").html(item.episode_length + "min | " + item.genre + " | " + + item.no_of_seasons + " " + str + "</br>")
                $(".series-summary").html(item.description + "</br>")
                $(".series-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
                break;

            case 2: // Season
                $(".season-info").html("Season " + (item.number) + ", Episodes: " + item.no_of_episodes + "</br>")
                $(".season-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
                break;

            case 3: // Episode
                $(".episode-number").html((item.number) + ". ")
                $(".episode-title").html(item.title + "</br>")
                $(".episode-info").html("Season " + item.season + " | " + item.length + "min" + "</br>")
                $(".episode-wh").html("Words per Hour: " + "<b>" + item.wh + "</b>" + "</br>")
                break;
        }
    }

    showTooltip(item, _this){
        this.tooltip = (_this.zoomLevel == 1) ? _this.series_tooltip :
                       (_this.zoomLevel == 2) ? _this.season_tooltip :
                                                _this.episode_tooltip;

        _this.tooltip.transition()
            .duration(50)
            .style("opacity", 0.9);

        // series tooltip content
        $(".series-poster").attr("src", item.logo_url)
        _this.setTooltipText(item, _this);

        _this.tooltip
            // .style("left",  (d3.event.pageX  - 90) + "px") //x
            .style("left", function(){
                var x = d3.event.pageX;
                var w = 530;
                var i = window.innerWidth;
                return (( x+w < i ) ? x + 90 : i - w + 90) + "px"

            })
            // .style("top", (d3.event.pageY - 35) + "px"); //y
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
    changeData(_this) {
            // remove the old bars
            _this.svgChart.selectAll("*")
                  .transition(d3.transition().duration(750))
                  .attr("y", 60)
                  .style("fill-opacity", 1e-6)
                  .remove();
            _this.svgY.selectAll("*").remove();

            // redraw the chart
            _this.draw();

            // move the chart to the previous zoomed state
            if (_this.lastTransform != null) _this.zoomed(_this);

    }


    dropDown(_this, e){
        console.log(e.target.value)

        // seleziona le prime 10 serie, giusto per testarlo a cazzo
        var i=0;
        var series = []
        this.data.forEach(single_series => {
            if (single_series.id_ < 10){
                series.push({
                    id: i++,
                    name: single_series.name,
                    number: +single_series.id_,
                    wh: +single_series.avg_wh,
                    episode_length: +single_series.episode_length,
                    year: single_series.year,
                    logo_url: "posters/"+single_series.id_+".jpg",
                    series: +single_series.id_,
                    genre: single_series.genre,
                    description: single_series.description,
                    no_of_seasons: single_series.seasons.length,
                    is_central: true
                })
            }
        });
        _this.series = series;

        _this.changeData(_this);
    }

    zoomed(_this){
        if (d3.event) _this.lastTransform = d3.event.transform;

        if (_this.zoomLevel == 3 && _this.lastTransform.k > 13 ||
            _this.zoomLevel == 2 && _this.lastTransform.k > 2     ){
            // show labels and ticks
            var labels = this.getCurrentData().map(item => item.number)
            this.xAxis.tickFormat((d, i) => { return labels[i] }).tickSize(3);
        }
        else {
            // hide labels and ticks
            this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks
        }

        // move the bars
        _this.x.range([0, _this.width - _this.margin.right].map(d => _this.lastTransform.applyX(d)));
        _this.svgChart.selectAll("rect").attr("x", d => _this.x(d.id))
                 .attr("width", _this.x.bandwidth())

        _this.svgChart.selectAll(".x-axis").call(_this.xAxis);

        // move the series labels
        _this.svgChart.selectAll(".series_labels")
        .attr('transform', (d,i)=>{
            return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+(_this.height+20)+'),'+ 'rotate(45)';})
        .attr('x', 0)
        .attr('y', 0)
    }

}
