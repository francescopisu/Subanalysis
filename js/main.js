const url_data = "https://raw.githubusercontent.com/francescopisu/subanalysis/master/data.json"
var controller;


d3.json(url_data, (error, json_data) => {
    if (error) throw error;

    // create the chart
    controller = new Controller({
        element: document.querySelector('.chart-container'),
        data: json_data });
});

var toggleWidth;
var width_;
const ctrlPanelContainer = $(".control-panel-container");
const genWrap = $(".general-wrapper");
const chartWrapper = $(".chart-wrapper")
const toggleCtrlPanel = $(".toggle-control-panel");

$('.toggle-tour').click(function() {
  if($(".control-panel-container").is(":visible"))
    tour.restart();
});

// zoom level handler
$('input[name="zoomLevel"]').on('change', function (e) {
    // set the chosen zoomLevel via radio buttons
    controller.setZoomLevelAndData(Number(e.target.value));
});


toggleCtrlPanel[0].setAttribute("data-value", "<")

// Manages expansion/collapse of control panel
function collapseControlPanel() {

  symbol = ctrlPanelContainer.is(":visible") ? ">" : "<";
  toggleCtrlPanel[0].setAttribute("data-value", symbol);

  // determino la dimensione da dare a chart wrapper in base alla dimensione
  // dello schermo (e quindi in base alla larghezza del menù)
  width_ = document.documentElement.clientWidth > 1650 ? genWrap.width() - 463 :
                                                         genWrap.width() - 324 ;

  // se il menù è collassato chart wrapper assume il 90% del parent (general-wrapper)
  // altrimenti lo spazio rimanente dato dalla differenza tra la larghezza del parent
  // general-wrapper e il menù
  toggleWidth = ctrlPanelContainer.is(":visible") ? "90%" : String(width_);

  height = ctrlPanelContainer.is(":visible") ? "81%" : "72%";
  $('.chart-container').css("height", height)

  ctrlPanelContainer.animate({width: 'toggle' });
  chartWrapper.animate({ width: toggleWidth });
}

// NUOVA: Attach a click handler to the toggle button
toggleCtrlPanel.click( collapseControlPanel );


// NUOVA: resizes the chart and redraws it if the window dimensions change
$(window).resize( () => {
    controller.chart.transitions = false;

    controller.chart.width = window.innerWidth;
    controller.chart.height = window.innerHeight;

    // idem come sopra
    width_ = document.documentElement.clientWidth > 1650 ? genWrap.width() - 463 :
                                                           genWrap.width() - 324 ;

    // se il menù è visibile chart-wrapper assume lo spazio rimamente dalla differenza
    // tra la larghezza del parent general-wrapper e la dimensione del menù
    // Altrimenti assume il 90% della larghezza del parent general-wrapper
    toggleWidth = ctrlPanelContainer.is(":visible") ? String(width_) : "90%";

    chartWrapper.css({'width': toggleWidth });

    controller.chart.clear();
    controller.chart.draw(controller.extractElements());

    // re enable transitions after the changes
    controller.chart.transitions = true;
});


// ------------ SORT
// sorting parameter handler
$('input[name="sorting-parameter"]').on('change', (e) => {
  controller.setSortingParameter(e.target.value)
});

const toggle = document.getElementById('container-switch');
const toggleContainer = document.getElementById('toggle-container');
let toggleNumber = ASCENDING;

toggle.addEventListener('click', function() {
  toggleNumber = !toggleNumber;
  if (toggleNumber == ASCENDING) {
      toggleContainer.style.clipPath = 'inset(0 50% 0 0)';
      toggleContainer.style.backgroundColor = '#a6cee3';
  } else {
    toggleContainer.style.clipPath = 'inset(0 0 0 50%)';
    toggleContainer.style.backgroundColor = '#d95f02';
  }
  controller.setSortingType(toggleNumber);
});

// ------------ FILTERS
$(".year-multi-range").ionRangeSlider({
        type: "double",
        skin: "flat",
        min: 1950,
        max: 2019,
        from: 1950,
        to: 2019,
        grid: false
});

$(".wh-multi-range").ionRangeSlider({
        type: "double",
        skin: "flat",
        min: 0,
        max: 13000,
        from: 0,
        to: 13000,
        grid: true
});

// set the sorting parameter via radio buttons
$('input[name="genre-filter"]').on('change', (e) => {
    controller.setFilterInFiltersSet(e.target.id, e.target.checked); })

// set the w/h limits
$('input[name="wh-multi-range"]').on('change', (e) => {
    controller.setWhLimits(e.target.value); })

// set the years limits
$('input[name="year-multi-range"]').on('change', (e) => {
    controller.setYearLimits(e.target.value); })

// reset checkboxes
$("#reset").on("click", (e) => {
    $('input[type="checkbox"]').prop('checked', false);
    e.preventDefault();

    controller.resetFilters();
})

// check all checkboxes
$("#check-all").on("click", (e) => {
    $('input[type="checkbox"]').prop('checked', true );
    e.preventDefault();

    controller.setAllFilters();
})

// delete half of the series... randomly
$("#snap_button").on("click", (e) => {
    controller.snap();
})
