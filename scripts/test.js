var yearStart = 2008;
var yearEnd = 2013;
var dataSuffix = "-Table1.csv";
var dataPrefix = "http://www.ecs.vuw.ac.nz/~stuart";
var redraw = dispRank;
window.onresize = delayedRedraw;
var width, height;

function startTest() {
    years = [];
    for (var i = yearStart; i <= yearEnd; i++) {
        var dataLoc = "data/" + i + dataSuffix;
        var method = (i === 2009) ? d3.tsv : d3.csv;
        method(dataLoc, function (games) {
            games = games.filter(function (game) {
                return game.Date.lastIndexOf("BYES", 0) !== 0;
            });

            years.push(games.map(function (game) {
                var scoreSplit = game.Score.split("–");
                var time = game.time;
                return {
                    round: +game.Round,
                    date: (time) ? Date.parse(i + " " + game.Date + " " + game.Time) : Date.parse(i + " " + game.Date),
                    home: game["Home Team"],
                    away: game["Away Team"],
                    homePts: +scoreSplit[0],
                    awayPts: +scoreSplit[1],
                    venue: game.Venue
                }
            }));
        });
    };
    updateDims();
    redraw();
}

function dispRank() {
    redraw = dispRank;
    var oldCanv = document.getElementById("canvas");
    if (oldCanv) oldCanv.parentNode.removeChild(oldCanv);
    
    var bigMargin = 50;
    var con = {xS:bigMargin,xB:width-bigMargin,yS:bigMargin,yB:height-bigMargin,w:width-bigMargin*2,h:height-bigMargin*2};

    var xAxisScale = d3.scale.linear()
        .domain([1, 17])
        .range([0, con.w]);

    var yAxisScale = d3.scale.linear()
        .domain([0, 10])
        .range([con.h, 0]);

    var xAxis = d3.svg.axis()
        .scale(xAxisScale)
        .ticks(17)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yAxisScale)
        .ticks(10)
        .orient("left");

    var svg = d3.select("body").append("svg")
        .attr("id", "canvas")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + con.xS + "," + con.yS + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + con.h + ")")
        .call(xAxis);


    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + 0 + ",0)")
        .call(yAxis);
}

function dispGeo() {
    redraw = dispGeo;
}

function dispPred() {
    redraw = dispPred;
}

function dispExpl() {
    redraw = dispExpl;
}

function updateDims() {
    width = document.body.clientWidth;
    height = window.innerHeight - 120;
}

function changeSelected(toBeSelected) {
    [].forEach.call(document.getElementsByClassName("selectedButton"), function (el) {
        el.classList.remove("selectedButton");
    });
    toBeSelected.classList.add("selectedButton");
}


//Here downwards pretty much copied from CMS @ http://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed
function delayedRedraw() {
    delay(function () {
        updateDims();
        redraw();
    }, 500);
}

var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();