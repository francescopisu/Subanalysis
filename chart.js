class Chart {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data; //data
        console.log(this.data);

        this.zoomLevel = 3;
        // this.bar_width = 3;

        this.extractElements();

        // draw the chart
        this.draw();
    }

    draw() {
        this.margin = {top: 20, right: 40, bottom: 70, left: 40};
        this.width = window.innerWidth*0.9 - this.margin.left - this.margin.right;
        // this.width = this.bar_width*this.getNumberOfElements()
        //     - this.margin.left - this.margin.right + 150;
        this.height = 500 - this.margin.top - this.margin.bottom;
        this.extent = [[0,0], [this.width, this.height]]

        // this.chartWidth = this.bar_width*this.getNumberOfElements();

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
        this.addBars();

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

        this.yAxis = d3.axisLeft(this.y).ticks(10);

        // add the Y axis to the SVG element
        this.svgY = d3.select("#svgY")
            .attr("width", this.margin.left)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .style("position","fixed")
            .style("left","0")
            .style("top","auto")
            .style("overflow-y","scroll")
            .style("background-color","white")
            .append("g")
            .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")")


        this.svgY.append("g")
            .attr("class", "y axis")
            .call(this.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 5)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Words/hour");

        this.svgChart = d3.select("#svgChart")
           .style("overflow-x","scroll")
           // .attr("width", this.width + this.margin.left + this.margin.right)
           .attr("width", this.width)
           .attr("height", this.height + this.margin.top + this.margin.bottom)
           // .call(this.zoom)
           .append("g")
           .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")")

        this.svgChart.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".9em");

    }


    addBars() {
        var x = this.x;
        var y = this.y;
        var height = this.height;
        var _this = this;
        var series = this.series;
        var seasons = this.seasons;

        // tooltip
        this.div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add bar chart
        this.bars = this.svgChart.selectAll("bar")
                      .data(this.getCurrentData())
                      .enter();

        // w/h bars
        this.bars.append("rect")
          .attr("class", "bar")
          .attr("class", function(item) { return "s"+item.series.toString(); })
          .attr("x", function(item) { return x(item.id); })
          .attr("width", this.x.bandwidth())
          // cristi
          // .attr("y", function(item) { return y(Math.max(item.wh, series[item.series].wh)); })
          // .attr("height", function(item) { return height - y(Math.abs(series[item.series].wh-item.wh)); })
          // normale
          .attr("y", function(item) { return y(item.wh); })
          .attr("height", function(item) { return height - y(item.wh); })
          .attr("fill", function(item) { return _this.getColor(item, _this);})
          .on("mouseover", function(item) { _this.showTooltip(item, _this); })
          .on("mouseout",  function(item) { _this.hideTooltip(item, _this); });

        // season average w/h line
        this.bars.append("rect")
        .attr("class", "season_line")
        .attr("x", function(item) { return x(item.id); })
        .attr("width", this.x.bandwidth()/2)
        .attr("y", function(item) {
          return y(_this.data[item.series].seasons[item.season-1].avg_wh); })
          .attr("height", function(item) { return 1; });

        // series average w/h rectangle
        this.bars.append("rect")
        .attr("class", "series_line")
        .attr("x", function(item) { return x(item.id); })
        .attr("width", this.x.bandwidth())
        .attr("y", function(item) {
          return y(series[item.series].wh); })
          .attr("height", function(item) { return height - y(series[item.series].wh); });
    }


    extractElements(){
        var i = 0;

        var series = [];
        this.data.forEach(single_series => {
            series.push({
                id: i++,
                number: +single_series.id_,
                wh: +single_series.avg_wh,
                series: +single_series.id_
            })
        });
        this.series = series;

        i = 0;
        var seasons = [];
        this.data.forEach(series => {
            series.seasons.forEach(season => {
                  seasons.push({
                    id: i++,
                    number: +season.id_,
                    wh: +season.avg_wh,
                    series: +series.id_
                  })
            });
        });
        this.seasons = seasons;

        i = 0;
        var episodes = [];
        this.data.forEach(series => {
            series.seasons.forEach(season => {
                season.episodes.forEach(episode => {
                    episodes.push({
                        id: i++,
                        number: +episode.id_,
                        wh: +episode.wh,
                        season: +season.id_,
                        series: +series.id_
                    })
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

        return colorArray[item.series];
    }

    getTooltipText(item, _this){
        return  _this.data[item.series].name + "<br/>"
                + "S" + item.season + "E" + item.number + "<br/>"
                + "w/h: " + item.wh;
    }

    showTooltip(item, _this){
        _this.div.transition()
          .duration(50)
          .style("opacity", .9);
        _this.div.html(_this.getTooltipText(item, _this))
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
    }

    hideTooltip(item, _this){
        _this.div.transition()
          .duration(50)
          .style("opacity", 0);
    }


    zoomed(_this) {
        // console.log("zoomed");
        if (d3.event.transform.k > 13){
            // show labels and ticks
            var labels = this.getCurrentData().map(item => item.number)
            this.xAxis.tickFormat(function(d, i) { return labels[i] }).tickSize(5);

        }
        else {
            // hide labels and ticks
            this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks
        }
        // _this.x.range([_this.margin.left, _this.width - _this.margin.right].map(d => d3.event.transform.applyX(d)));
        _this.x.range([0, _this.width - _this.margin.right].map(d => d3.event.transform.applyX(d)));
        _this.svgChart.selectAll("rect").attr("x", d => _this.x(d.id))
                 .attr("width", _this.x.bandwidth());
        _this.svgChart.selectAll(".x-axis").call(_this.xAxis);
    }

}
