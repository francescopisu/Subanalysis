class Chart {
    constructor(opts) {
        // load in arguments from config object
        this.data = opts.data;
        this.element = opts.element;
        //console.log(this.data)

        this.zoomLevel = 2;

        this.extractElements();
        // console.log(this.series);
        // console.log(this.seasons);
        // console.log(this.episodes);

        // create the chart
        this.draw();
    }

    draw() {
        // define width, height and margin
        // this.width = this.element.offsetWidth;
        // this.height = this.width / 2;
        this.margin = {top: 20, right: 20, bottom: 70, left: 40};
        this.bar_width = 10;
        this.width = this.bar_width*this.getNumberOfElements() - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;

        // create the other stuff
        this.createScales();
        this.addAxes();
        this.addBars();
        // this.addLine();
    }

    createScales() {
        // calculate max and min for data
        this.x = d3.scale.ordinal().rangeBands([0, this.width], .05);
        this.y = d3.scale.linear().range([this.height, 0]);

        this.x.domain(this.getCurrentData().map(item => item.id))
        this.y.domain([0,13000])
    }

    addAxes() {
        // define the axis
        this.xAxis = d3.svg.axis()
            .scale(this.x)
            .orient("bottom");

        this.yAxis = d3.svg.axis()
            .scale(this.y)
            .orient("left")
            .ticks(10);

        // add the Y axis SVG element
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
                "translate(" + this.margin.left + "," + this.margin.top + ")");

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
           .append("g")
           .attr("transform",
                "translate(" + this.margin.left + "," + this.margin.top + ")");


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
          .attr("width", x.rangeBand())
          .attr("y", function(item) { return y(item.wh); })
          .attr("height", function(item) { return height - y(item.wh); });

        if (this.zoomLevel > 1) {
            // average w/h line
            var series = this.series;
            this.bars.append("rect")
                .attr("class", "bar_line")
                .attr("x", function(item) { return x(item.id); })
                .attr("width", x.rangeBand() + 2)
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

}
