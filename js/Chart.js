class Chart {
    constructor(dataForBars) {
        // bar transitions flag
        this.transitions = true;

        // default scaleExtent
        this.scaleExtent = [1, 8];

        // default transition delay
        this.delay = 10;

        // flag
        this.drawSeriesLine = false;

        // flags used for showing the labels and the ticks in the x-axis
        this.showLabelsAndTicks = false;
        this.kZoomFactorMin = 9999;

        this.tooltip = new Tooltip();

        // draw everything
        this.draw(dataForBars);
    }

    // setters
    setDelay(delay)             { this.delay              = delay;       }

    setScaleExtent(scaleExtent) { this.scaleExtent        = scaleExtent; }

    setDrawSeriesLine(flag)     { this.drawSeriesLine     = flag;        }

    setShowLabelsAndTicks(flag) { this.showLabelsAndTicks = flag;        }

    setKZoomFactorMin(value)    { this.kZoomFactorMin     = value;       }


    draw(dataForBars) {
        this.margin = {top: 20, right: 40, bottom: 70, left: 80};
        this.width = window.innerWidth*0.9 + this.margin.right + this.margin.left; //1020
        this.height = window.innerHeight*0.75 - this.margin.top - this.margin.bottom; //780
        this.extent = [[0,0], [this.width, this.height]]
        this.widthOffset = this.margin.right + this.margin.left;
        this.heightOffset = this.margin.top + this.margin.bottom + 200;

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
               // .attr("data-intro","This is the main chart. The quantity \"Words per Hour\" tells you how many words the characters say in 60 minutes.")
               // .attr("data-step", 2)
               .attr("transform","translate(" + this.margin.left + "," + this.margin.top + ")");



        // create the other stuff
        this.createScalesAndAxes();
        this.addBars(dataForBars);
    }

    // remove everything from the chart
    clear() {
         this.svgChart.selectAll("*").remove();
    }

    // calculate the scales for the axis
    createScalesAndAxes() {

        this.x = d3.scaleBand()
            .range([0, this.width - this.margin.right])

        this.y = d3.scaleLinear()
            .range([this.height, 0])

        // define the axis
        this.xAxis = d3.axisBottom(this.x)
            .tickSizeOuter(0) // no ticks at the border
            .tickFormat("").tickSize(0); // initially no labels nor ticks

        this.yAxis = d3.axisLeft(this.y).ticks(10);
        this.clipp = this.focus.append("g").attr("clip-path", "url(#clip)");

    }

    setAxes(dataForBars) {

        // set the axes domain
        this.x.domain(dataForBars.map(item => item.id))
        this.y.domain([0, d3.max(dataForBars, d => d.wh )]).nice();


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
            .attr("id", "y-axis")
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

        // var y_element = document.getElementById("y-axis");
        // y_element.setAttribute("data-intro",
        //     "This is the main chart. The quantity \"Words per Hour\" \
        //     tells you how many words the characters say in 60 minutes.")
        // y_element.setAttribute("data-step", 2);
    }


    addBars(dataForBars) {
        var x = this.x;
        var y = this.y;
        var height  = this.height;

        // bar transitions are displayed only on loading and zoom level changes
        // 0ms duration means the transitions won't be visible
        var duration = (this.transitions) ? 500 : 0;



        // set the axes
        this.setAxes(dataForBars);


        // ******* JOIN new data with old elements
        this.bars = this.clipp.selectAll(".bar")
                                .data(dataForBars, d => d.id);

        this.seriesLabels = this.clipp.selectAll(".series_label")
                                .data(dataForBars, d => d.id);

        this.seriesLines = this.clipp.selectAll(".series_line")
                                .data(dataForBars, d => d.id);

        // ******* EXIT old elements not present in new data
        // old elements which are leaving the chart:
        //  - their y position transitions to the xaxis
        //  - therir height trasnitions to 0
        this.bars.exit()
            .transition().duration(duration)
            .attr("y", d => height )
            .attr("height", 0)
            .remove();

        this.seriesLabels.exit().remove()
        this.seriesLines .exit().remove()



        // ******* UPDATE old elements present in new data
        // old elememnts in new data transition to their new position
        this.bars.transition()
            .duration(duration)
            .delay((d, i) => i * this.delay)
            .attr("x", d => x(d.id) )
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.wh))
            .attr("height", (d, i) => height - y(d.wh));

        this.seriesLabels.transition()
            .duration(duration)
            .delay((d, i) => i * this.delay)
            .attr('transform', (d)=>{
                return 'translate( '+(x(d.id) + x.bandwidth()/2)+' , '+
                                     (height+20)+'),'+ 'rotate(45)';})
            .attr('x', 0)
            .attr('y', 0)

        this.seriesLines.transition()
            .duration(duration)
            .delay((d, i) => i * this.delay)
            .attr("x", d => x(d.id) )
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.wh_series) );


        // ******* ENTER new elements present in new data
        // with a transition from 0 to their position
        this.bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", item => x(item.id))
            .attr("width", x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .attr("fill", item => getColor(item))
            .transition().duration(duration)
            .attr("y", item => y(item.wh))
            .attr("height", item => height - y(item.wh))


        // labels with the series name
        this.seriesLabels.enter().append("text")
            .attr("class", "series_label")
            .text(item => (item.is_central) ? item.name : "")
            .attr('transform', d => 'translate(' + (x(d.id)+x.bandwidth()/2) +
                                        ' , ' + (height+20) + '),' + 'rotate(45)' )
            .attr("x", 0)
            .attr('y', 0)

        // draw a line representing the series w/h
        if (this.drawSeriesLine) {
            this.seriesLines.enter()
                .append("rect")
                .attr("class", "series_line")
                .attr("fill", "black")
                .attr("x", item => x(item.id))
                .attr("width", this.x.bandwidth())
                .attr("y", y(0))
                .attr("height", 0)
                .transition().duration(duration)
                .attr("y", item => y(item.wh_series))
                .attr("height", 1);
        }


        // update the zoom function
        this.svgChart.call(
            d3.zoom()
            .scaleExtent(this.scaleExtent)
            .translateExtent([ [this.margin.left, this.margin.top],
                               [this.width - this.margin.right,
                                this.height - this.margin.top]      ])
            .extent([ [this.margin.left,this.margin.top],
                      [this.width - this.margin.right,
                       this.height - this.margin.top]     ])
            .on("zoom", _ => this.zoomed(dataForBars))
        );

        // These operation are always allowed because they don't involve transitions
        d3.selectAll(".bar")
            .on("mouseover", (item) => this.tooltip.showTooltip(item) )
            .on("mouseout",  (item) => this.tooltip.hideTooltip(item) )

    }




    zoomed(dataForBars){
        var transform = d3.event.transform;

        if (this.showLabelsAndTicks && transform.k > this.kZoomFactorMin){
            // show labels and ticks only if the bars are big enough
            var labels = dataForBars.map(item => item.number)
            this.xAxis.tickFormat((d, i) => labels[i]).tickSize(3);
        }
        else {
            // hide labels and ticks
            this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks
        }

        // move the bars
        this.x.range([this.margin.left, this.width - this.margin.right]
                      .map(d => transform.applyX(d) - this.margin.left));
        this.clipp.selectAll("rect").attr("x", d => this.x(d.id))
                 .attr("width", this.x.bandwidth())


        this.clipp.select(".x-axis").call(this.xAxis);

        // move the series labels
        this.clipp.selectAll(".series_label")
        .attr('transform', (d)=>{
            return 'translate( '+(this.x(d.id)+this.x.bandwidth()/2) +
                           ' , '+(this.height+20) + '),' + 'rotate(45)';})
        .attr('x', 0)
        .attr('y', 0)
    }
}



function getColor(item){
    if (item.genre == "Action")      return '#B36FAF'; // viola
    if (item.genre == "Adventure")   return '#5B9279'; // verde
    if (item.genre == "Animation")   return '#ACEBFF'; // celestino
    if (item.genre == "Biography")   return '#F1D38D'; // giallino
    if (item.genre == "Comedy")      return '#0075F2'; // blu acceso
    if (item.genre == "Crime")       return '#F6B540'; // giallo
    if (item.genre == "Documentary") return '#7fbf7b'; // verdino
    if (item.genre == "Drama")       return '#EF7161'; // arancione
    if (item.genre == "Fantasy")     return '#BCB6FF'; // lilla
    if (item.genre == "History")     return '#DD0426'; // rosso scuro
    if (item.genre == "Mystery")     return '#9197AE'; // grigio
    if (item.genre == "Romance")     return '#D8ACB9'; // rosa
    if (item.genre == "Sci-Fi")      return '#5762D5'; // iris
    if (item.genre == "War")         return '#576757'; // verde militare

    return "#000000"
}
