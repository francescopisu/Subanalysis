
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

        // draw everything
        this.draw(dataForBars);
    }

    setDelay(delay){
        this.delay = delay;
    }

    setScaleExtent(scaleExtent){
        this.scaleExtent = scaleExtent;
    }

    setDrawSeriesLine(flag){
        this.drawSeriesLine = flag;
    }

    draw(dataForBars) {
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
            .scaleExtent(this.scaleExtent)
            .translateExtent([[this.margin.left,this.margin.top], [this.width - this.margin.right, this.height - this.margin.top]])
            .extent([[this.margin.left,this.margin.top], [this.width - this.margin.right, this.height - this.margin.top]])
            .on("zoom", function() { _this.zoomed(_this); });

        this.svgChart.call(this.zoom)

        // create the other stuff
        this.createScalesAndAxes();
        this.addBars(dataForBars);
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


    addBars(dataForBars) {
        var x = this.x;
        var y = this.y;
        var height  = this.height;
        var _this   = this;

        // bar transitions are displayed only on loading and zoom level changes
        // 0ms duration means the transitions won't be visible
        var duration = (this.transitions) ? 500 : 0;
        // little delay for smooth transitions
        // var delay    = (this.zoomLevel == SERIES)  ? 10 :
        //                (this.zoomLevel == SEASONS) ? 5  :
        //                                              0.5;
        var delay = 10;

        // // tooltip selection based on zoom level
        // switch(this.zoomLevel) {
        //     case SERIES:   this.series_tooltip  = d3.select("#series-tooltip")
        //                                             .style("opacity", 0); break;
        //     case SEASONS:  this.season_tooltip  = d3.select("#season-tooltip")
        //                                             .style("opacity", 0); break;
        //     case EPISODES: this.episode_tooltip = d3.select("#episode-tooltip")
        //                                             .style("opacity", 0); break;
        // }

        this.setAxes(dataForBars);

        // ******* JOIN new data with old elements
        this.bars = this.clipp.selectAll(".bar")
                                .data(dataForBars, d => d.id);

        this.seriesLabels = this.clipp.selectAll(".series_label")
                                .data(dataForBars, d => d.id);

        this.seriesLines = this.clipp.selectAll(".series_line")
                                .data(dataForBars, d => d.id);

        // ******* EXIT old elements not present in new data
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



        // ******* UPDATE old elements present in new data
        this.bars.transition().duration(duration).delay((d, i) => i * delay)
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

        this.seriesLabels.transition().duration(duration).delay((d, i) => i * delay)
        .attr('transform', (d)=>{
            return 'translate( '+(x(d.id) + x.bandwidth()/2)+' , '+
                                 (height+20)+'),'+ 'rotate(45)';})
        .attr('x', 0)
        .attr('y', 0)

        this.seriesLines.transition().duration(duration).delay((d, i) => i * delay)
        .attr("x", function(d) {
          return x(d.id);
          }) // old elememnts in new data transition to their new position
        .attr("width", x.bandwidth())
        .attr("y", function(d) {
          return y(d.wh_series)
        }) // old elememnts in new data transition to their y position


        // ******* ENTER new elements present in new data
        this.bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", item => x(item.id))
        .attr("width", x.bandwidth())
        .attr("y", y(0))
        .attr("height", 0)
        .attr("fill", item => _this.getColor(item))
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
            this.seriesLines.enter().append("rect")
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


        // These operation are always allowed because they don't involve transitions
        // d3.selectAll(".bar")
        //     .on("mouseover", function(item) { _this.showTooltip(item, _this); })
        //     .on("mouseout",  function(item) { _this.hideTooltip(item, _this); })

    }



    getColor(item){
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

    // setTooltipText(item, _this){
    //     // the series name it's the same for every tooltip
    //     // set it according to the start-end values
    //     if (item.start_year == item.end_year)
    //         $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + ")"  +"</br>")
    //     else if (item.end_year == 9999)
    //         $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-)"  +"</br>")
    //     else
    //         $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-" + item.end_year + ")"  +"</br>")
    //
    //     switch(_this.zoomLevel) {
    //         case SERIES:
    //             var str = (item.no_of_seasons == 1) ? "season" : "seasons";
    //
    //             $(".series-poster").attr("src", item.logo_url)
    //             $(".series-number").html((item.id+1) + ". ")
    //             $(".series-info").html(item.episode_length + "min | " + item.genre + " | " + + item.no_of_seasons + " " + str + "</br>")
    //             $(".series-summary").html(item.description + "</br>")
    //             $(".series-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
    //             break;
    //
    //         case SEASONS:
    //
    //             $(".series-logo").attr("src", item.logo_url)
    //             $(".season-info").html("Season " + (item.number) + ", Episodes: " + item.no_of_episodes + "</br>")
    //             $(".season-avg-wh").html("Average W/h: " + "<b>" + (Math.round(item.wh * 100) / 100) + "</b>")
    //             break;
    //
    //         case EPISODES:
    //
    //             $(".series-logo").attr("src", item.logo_url)
    //             $(".episode-number").html((item.number) + ". ")
    //             $(".episode-title").html(item.title + "</br>")
    //             $(".episode-info").html("Season " + item.season + " | " + item.length + "min" + "</br>")
    //             $(".episode-wh").html("Words per Hour: " + "<b>" + item.wh + "</b>" + "</br>")
    //             break;
    //     }
    // }
    //
    // showTooltip(item, _this){
    //     this.tooltip = (_this.zoomLevel == SERIES)  ? _this.series_tooltip :
    //                    (_this.zoomLevel == SEASONS) ? _this.season_tooltip :
    //                                                   _this.episode_tooltip;
    //
    //     _this.tooltip.transition()
    //         .duration(50)
    //         .style("opacity", 0.9);
    //
    //     // series tooltip content
    //
    //
    //     _this.setTooltipText(item, _this);
    //
    //     _this.tooltip
    //         .style("left", function(){
    //             var x = d3.event.pageX;
    //             var w = 530;
    //             var i = window.innerWidth;
    //             return (( x+w < i ) ? x + 90 : i - w + 90) + "px"
    //
    //         })
    //         .style("top", function(){
    //             var y = d3.event.pageY;
    //             var h = 200;
    //             var i = window.innerHeight;
    //             return (( y+h < i ) ? y-15 : i-h-15) + "px"
    //         })
    // }
    //
    // hideTooltip(item, _this){
    //     _this.tooltip.transition()
    //       .duration(50)
    //       .style("opacity", 0);
    //     _this.tooltip
    //       .style("left", (-999999) + "px") //x
    //       .style("top", (-999999) + "px"); //y
    // }

    zoomed(_this){
        var transform = d3.event.transform;

        if (this.zoomLevel == EPISODES && transform.k > 13 ||
            this.zoomLevel == SEASONS  && transform.k > 2     ){
            // show labels and ticks only if the bars are big enough
            var labels = this.getCurrentData().map(item => item.number)
            this.xAxis.tickFormat((d, i) => labels[i]).tickSize(3);
        }
        else {
            // hide labels and ticks
            this.xAxis.tickFormat("").tickSize(0); // no labels nor ticks
        }

        // move the bars
        _this.x.range([0, _this.width - _this.margin.right].map(d => transform.applyX(d)));
        _this.clipp.selectAll("rect").attr("x", d => _this.x(d.id))
                 .attr("width", _this.x.bandwidth())


        _this.clipp.select(".x-axis").call(_this.xAxis);

        // move the series labels
        _this.clipp.selectAll(".series_label")
        .attr('transform', (d)=>{
            return 'translate( '+(_this.x(d.id)+_this.x.bandwidth()/2) +
                           ' , '+(_this.height+20) + '),' + 'rotate(45)';})
        .attr('x', 0)
        .attr('y', 0)
    }


}
