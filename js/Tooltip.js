class Tooltip {
    constructor(){
        this.setZoomLevel(SERIES);
    }

    setZoomLevel(zoomLevel){
        this.zoomLevel = zoomLevel;

        switch(this.zoomLevel) {
            case SERIES:   this.series_tooltip  = d3.select("#series-tooltip")
                                                    .style("opacity", 0); break;
            case SEASONS:  this.season_tooltip  = d3.select("#season-tooltip")
                                                    .style("opacity", 0); break;
            case EPISODES: this.episode_tooltip = d3.select("#episode-tooltip")
                                                    .style("opacity", 0); break;
        }

    }

    setTooltipText(item){
        // the series name it's the same for every tooltip
        // set it according to the start-end values
        if (item.start_year == item.end_year)
            $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + ")"  +"</br>")
        else if (item.end_year == 9999)
            $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-)"  +"</br>")
        else
            $(".series-name").html("<b>" + item.name + "</b>" + " (" + item.start_year + "-" + item.end_year + ")"  +"</br>")

        switch(this.zoomLevel) {
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

    showTooltip(item){
        this.tooltip = (this.zoomLevel == SERIES)  ? this.series_tooltip :
                       (this.zoomLevel == SEASONS) ? this.season_tooltip :
                                                     this.episode_tooltip;

        this.tooltip.transition()
            .duration(50)
            .style("opacity", 0.9);

        // series tooltip content
        this.setTooltipText(item);

        this.tooltip
            .style("left", function(){
                var x = d3.event.pageX;
                var w = 530;
                var i = window.innerWidth;
                return (( x+w < i ) ? x + 90 : i - w + 90) + "px"

            })
            .style("top", function(){
                var y = d3.event.pageY;
                var h = 200;
                return (( y-h-50 < 0 ) ? y+h+50 : y-15) + "px"
            })
    }

    hideTooltip(item){
        this.tooltip.transition()
          .duration(50)
          .style("opacity", 0);
        this.tooltip
          .style("left", (-999999) + "px") //x
          .style("top", (-999999) + "px"); //y
    }

}
