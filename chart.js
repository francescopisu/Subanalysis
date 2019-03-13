class Chart {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data; //data
        this.svgContainer = opts.element; //chart container div

        console.log(this.svgContainer)
        this.zoomLevel = 3;
        this.bar_width = 10;

        this.zoom = d3.zoom().on('zoom', this.zoomed.bind(null,this));

        this.extractElements();

        // draw the chart
        this.draw();
    }

    draw() {
        this.margin = {top: 20, right: 40, bottom: 70, left: 40};
        this.width = window.innerWidth - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;

        this.chartWidth = this.bar_width*this.getNumberOfElements();

        //d3.select("#svgChart").selectAll("*").remove();
        //d3.select("#svgY").selectAll("*").remove();

        // create the other stuff
        this.createScales();
        this.addAxes();
        this.addBars();

    }

    createScales() {
        // calculate max and min for data
        //this.x = d3.scale.ordinal().rangeBands([0, this.width], .05);
        // this.x = d3.scaleBand()
        //     .rangeRound([0, this.width])
        //     .domain(this.getCurrentData().map(item => item.id));

        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0,13000])

        this.x = d3.scaleBand()
            .domain(this.getCurrentData().map(item => item.id))
            .range([0, this.chartWidth]);
    }

    addAxes() {
        // define the axis
        this.xAxis = d3.axisBottom(this.x)
            //.scale(this.x)

        this.yAxis = d3.axisLeft(this.y)
            .ticks(10);

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
           .attr("width", this.width + this.margin.left + this.margin.right)
           .attr("height", this.height + this.margin.top + this.margin.bottom)
           .call(this.zoom)
           .append("g")
           .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")")

        // this.svgChart.append("defs").append("SVG:clipPath")
        //   .attr("id", "clip")
        //   .append("SVG:rect")
        //   .attr("width", this.chartWidth )
        //   .attr("height", this.height )
        //   .attr("x", 0)
        //   .attr("y", 0)


        // this.svgChart.append("rect")
        //   .attr("width", this.width)
        //   .attr("height", this.height)
        //   .style("fill", "none")
        //   .style("pointer-events", "all")
        //   .style("opacity", 0.0)
        //   .call(this.zoom);

        this.svgChart.append("g")
            .attr("class", "x axis")
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

        // Add bar chart
        this.bars = this.svgChart.selectAll("bar")
                      .data(this.getCurrentData())
                      .enter();

        // w/h bars
        this.bars.append("rect")
          .attr("class", "bar")
          .attr("x", function(item) { return x(item.id); })
          .attr("width", this.bar_width)
          .attr("y", function(item) { return y(item.wh); })
          .attr("height", function(item) { return height - y(item.wh); })




        if (this.zoomLevel > 1) {
            // average w/h line
            var series = this.series;
            this.bars.append("rect")
                .attr("class", "bar_line")
                .attr("x", function(item) { return x(item.id); })
                .attr("width", this.bar_width + 2)
                .attr("y", function(item) {
                    return y(series[item.series].wh); })
                .attr("height", function(item) { return 1; });
        }
    }


    extractElements(){
        var i = 0;

        var series = [];
        this.data.forEach(single_series => {
            series.push({
                id: i++,
                number: single_series.id_,
                wh: single_series.avg_wh,
                series: single_series.id_
            })
        });
        this.series = series;

        i = 0;
        var seasons = [];
        this.data.forEach(series => {
            series.seasons.forEach(season => {
                  seasons.push({
                    id: i++,
                    number: season.id_,
                    wh: season.avg_wh,
                    series: series.id_
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
                        number: episode.id_,
                        wh: episode.wh,
                        season: season.id_,
                        series: series.id_
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

    zoomed(_this) {
        // console.log("zoomed");

        var transform = d3.event.transform;
        transform.x = Math.min(0, transform.x);
        transform.x += _this.margin.left;
        transform.y = 0 + _this.margin.top;
        console.log(transform.toString())

        _this.svgChart.attr('transform', transform.toString());

        // _this.svgChart.attr('transform',
        // "translate(" + d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");


        // _this.svgChart.call(_this.xAxis.scale(d3.event.transform.rescaleX(_this.x)));

        // console.log(_this.getNumberOfElements())
    }

}
