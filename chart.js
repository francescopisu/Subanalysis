class Chart {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data; //data
        console.log(this.data);

        //this.zoomLevel = 3;
        // this.getZoomLevel();
        this.zoomLevel = 1;

        this.zoomHappened = false;
        this.dataChangedAfterZoomHappened = false;
        this.lastTransform = null;

        // this.bar_width = 3;

        this.extractElements();

        // draw the chart
        this.draw();
    }

    draw() {
        this.margin = {top: 20, right: 40, bottom: 70, left: 60};
        this.width = window.innerWidth*0.9 - this.margin.left - this.margin.right ; //1020
        // this.width = this.bar_width*this.getNumberOfElements()
        //     - this.margin.left - this.margin.right + 150;
        this.height = 500 - this.margin.top - this.margin.bottom; //780
        this.extent = [[0,0], [this.width, this.height]]

        // this.chartWidth = this.bar_width*this.getNumberOfElements();

        var _this = this;


        this.svgChart = d3.select("#svgChart")
        this.zoom = d3.zoom()
            .scaleExtent([1, 100])
            .translateExtent(this.extent)
            .extent(this.extent)
            .on("zoom", function() {
                _this.zoomHappened = true;
                _this.zoomed(_this);
            });

        this.svgChart.call(this.zoom)


        // this.getZoomLevel(_this);
        // create the other stuff
        this.createScales();
        this.addAxes();
        this.addBars();
        this.adjustDimensions();

    }

    createScales() {
        // calculate max and min for data

        // this.x = d3.scaleBand()
        //     .domain(this.getCurrentData().map(item => item.id))
        //     .range([0, this.chartWidth]);

        this.x = d3.scaleBand()
            // .range([this.margin.left, this.width-this.margin.right])
            .range([0, this.width - this.margin.right])
            .domain(this.getCurrentData().map(item => item.id))
            .padding(0.1);

        // this.x2 = d3.scaleBand()
        //     .range([0, this.width - this.margin.right])
        //     .domain(this.series.map(item => this.data[item.series].name))
        //     .padding(0.1)

        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, d3.max(this.episodes, function(d) { return d.wh; })]).nice();
    }

    addAxes() {
        // define the axis
        this.xAxis = d3.axisBottom(this.x).tickSizeOuter(0)
            //.scale(this.x)

        // var labels = this.getCurrentData().map(item => item.number)
         // console.log(labels)
         // this.xAxis.tickFormat(function(d, i) { return labels[i] })
        this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks

        //this.xAxis2 = d3.axisBottom(this.x2).tickSizeOuter(0)


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
           // .attr("width", this.width + this.margin.left + this.margin.right)
           .attr("width", this.width)
           .attr("height", this.height + this.margin.top + this.margin.bottom)
           // .call(this.zoom)
           // .style("position","fixed")
           // .style("top","15%")
           // .style("left", "15%")
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
              // .attr("dy", "1em")
              .style("text-anchor", "middle")
              .text("Words per Hour");
    }


    addBars() {
        var x = this.x;
        var y = this.y;
        var height = this.height;
        var _this = this;
        var series = this.series;
        var seasons = this.seasons;

        // tooltip
        // this.div = d3.select("body").append("div")
        //     .attr("class", "tooltip")
        //     .style("opacity", 0);

        this.tooltip = d3.select("#tooltip-span")
            .style("opacity", 0)

        // Selection
        this.bars = this.svgChart.selectAll(".bar")
                      .data(this.getCurrentData())
                      .enter();

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


        // // series labels w/ transitions
        // this.bars.append("text")
        //     .attr("class", "series_labels")
        //     .attr('transform', (d,i)=>{
        //         return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+(_this.height+20)+'),'+ 'rotate(45)';})
        //     .transition()
        //     .duration(500)
        //     .text((item) => {
        //         return item.is_central ? _this.data[item.series].name : "";
        //         })
        //     .attr('transform', (d,i)=>{
        //         return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+(_this.height+20)+'),'+ 'rotate(45)';})
        //     .attr('x', 0)
        //     .attr('y', 0)

        this.bars.append("text")
            .attr("class", "series_labels")
            .text((item) => {
                return item.is_central ? _this.data[item.series].name : "";
                })
            .attr('transform', (d,i)=>{
                return 'translate( '+(_this.x(i) +_this.x.bandwidth()/2)+' , '+(_this.height+20)+'),'+ 'rotate(45)';})
            .transition()
            .duration(300)
            .attr('x', 0)
            .attr('y', 0)



        if (this.zoomLevel == 3) {
            // season average w/h line
            this.bars.append("rect")
            .attr("class", "season_line")
            .attr("x", function(item) { return x(item.id); })
            .attr("width", this.x.bandwidth()/2)
            .attr("y", function(item) {
                  return y(_this.data[item.series].seasons[item.season-1].avg_wh); })
            .attr("height", function(item) { return 1; });
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
            .attr("y", function(item) {
                  return y(series[item.series].wh); })
            .attr("height", function(item) {
                    return height - y(series[item.series].wh);
                    });

            // vecchio codice
            // this.bars.append("rect")
            // .attr("class", "series_line")
            // .attr("x", function(item) { return x(item.id); })
            // .attr("y", function(item) {
                  // return y(series[item.series].wh); })
            // .attr("height", 0)
            // .transition()
            // .duration(550)
            // .attr("x", function(item) { return x(item.id); })
            // .attr("width", this.x.bandwidth())
            // .attr("y", function(item) {
                  // return y(series[item.series].wh); })
            // .attr("height", function(item) {
                    // return height - y(series[item.series].wh);
                    // });
        }
    }

    // Per qualche motivo va fatto dopo draw()
    adjustDimensions() {
        d3.select("#svgChart").attr("height", 650)
                              .attr("width", this.width + 90);

        d3.select("#svgY").attr("height", 650);
    }

    getDelayValue() {
        switch(this.zoomLevel) {
            case 1:
                return  9;
                break;
            case 2:
                return 5;
                break;
            case 3:
                return 0.4;
                break;
        };
    }

    extractElements(){
        var i = 0;

        var series = [];
        this.data.forEach(single_series => {
            series.push({
                id: i++,
                name: single_series.name,
                number: +single_series.id_,
                wh: +single_series.avg_wh,
                logo_url: "logos/original/"+single_series.id_+".png",
                series: +single_series.id_,
                genre: single_series.genre,
                is_central: true
            })
        });
        this.series = series;

        i = 0;
        var seasons = [];
        this.data.forEach(series => {
            var season_counter = 1;
            series.seasons.forEach(season => {
                  seasons.push({
                    id: i++,
                    number: +season.id_,
                    wh: +season.avg_wh,
                    logo_url: "logos/original/"+series.id_+".png",
                    series: +series.id_,
                    is_central: season_counter == Math.round(series.seasons.length/2)
                  })
                  season_counter++;
            });
        });
        this.seasons = seasons;

        i = 0;
        var episodes = [];
        this.data.forEach(series => {
            var episode_counter = 1;
            series.seasons.forEach(season => {
                // episodes count
                var n_episodes = series.seasons
                    .map(season => season.episodes.length)
                    .reduce((a,b)=>a+b);

                season.episodes.forEach(episode => {
                    episodes.push({
                        id: i++,
                        number: +episode.id_,
                        wh: +episode.wh,
                        logo_url: "logos/original/"+series.id_+".png",
                        season: +season.id_,
                        series: +series.id_,
                        is_central: episode_counter == Math.round(n_episodes/2)
                    })
                    episode_counter++;
                });
            });
        });
        this.episodes = episodes;
    }


    getNumberOfElements(){
        if (this.zoomLevel == 1)
            return this.series.length;
        else if (this.zoomLevel == 2)
            return this.seasons.length;
        else
            return this.episodes.length;

    }

    getCurrentData(){
        if (this.zoomLevel == 1)
            return this.series;
        else if (this.zoomLevel == 2)
            return this.seasons;
        else
            return this.episodes;
    }


    getColor(item, _this){
        var colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
          '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
          '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
          '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
          '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
          '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
          '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
          '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
          '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
          '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

        var genre = _this.series[item.series].genre.split(" ")[0]; // c'è uno spazio all'inizio
        // console.log(genre)

        if (genre == "Action") return '#7570b3'; // viola
        if (genre == "Adventure") return '#1b7837'; // verde
        if (genre == "Animation") return '#a6cee3'; // celestino
        if (genre == "Biography") return '#FFE4B5'; // giallino
        if (genre == "Comedy") return '#1f78b4'; // blu
        if (genre == "Crime") return '#000000'; // nero
        if (genre == "Documentary") return '#7fbf7b'; // verdino
        if (genre == "Drama") return '#d95f02'; // arancione
        if (genre == "Fantasy") return '#d95f02'; // arancione
        if (genre == "History") return '#8B0000'; // rosso scuro
        if (genre == "Mistery") return '#A9A9A9'; // grigio
        if (genre == "Romance") return '#f0027f'; // rosa
        if (genre == "Sci-Fi") return '#191970'; // blu scuro
        if (genre == "War") return '#8B4513'; // marron


        return "#ffffff"

    }

    getTooltipText(item, _this){
        if (_this.zoomLevel == 1)
            return "Words per Hour: " + "<b>"+ (Math.round(item.wh * 100) / 100) + "</b>";

        else if (_this.zoomLevel == 2)
            return "Season " + item.number + "<br/>"
                + "Words per Hour: " + "<b>"+ (Math.round(item.wh * 100) / 100) + "</b>";

        else if (_this.zoomLevel == 3)
            return "Season " + item.season + ", Episode " + item.number + "<br/>"
                    + "Words per Hour: " + "<b>"+ (Math.round(item.wh * 100) / 100) + "</b>";
    }

    showTooltip(item, _this){
        // console.log(item.logo_url)
        _this.tooltip.transition()
          .duration(50)
          .style("opacity", 0.9);

        // console.log(item)
        $(".series-logo").attr("src", item.logo_url)
        $(".tooltip-text").html(_this.getTooltipText(item, _this))

        _this.tooltip
          .style("left", (d3.event.pageX  + 80) + "px")
          .style("top", (d3.event.pageY - 35) + "px");
    }

    hideTooltip(item, _this){
        _this.tooltip.transition()
          .duration(50)
          .style("opacity", 0);
    }

    // Nuova funzione per prendere il livello di zoom dal radio button selezionato
    // imposto zoomLevel e poi pulisco l'svg attuale prima di ridisegnarlo
    changeData(_this) {
            // remove the old bars
            _this.svgChart.selectAll("*").remove();
            _this.svgY.selectAll("*").remove();

            // redraw the chart
            _this.draw();

            // move the chart to the previous zoomed state
            if (_this.lastTransform != null) _this.zoomed(_this);

    }


    zoomed(_this){
        if (d3.event) _this.lastTransform = d3.event.transform;

        if (_this.zoomLevel == 3 && _this.lastTransform.k > 13 ||
            _this.zoomLevel == 2 && _this.lastTransform.k > 2 ){
            // show labels and ticks
            var labels = this.getCurrentData().map(item => item.number)
            this.xAxis.tickFormat(function(d, i) { return labels[i] }).tickSize(3);
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
