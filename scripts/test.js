var yearStart = 2008;
var yearEnd = 2013;
var dataSuffix = "-Table1.csv";
var dataPrefix = "http://www.ecs.vuw.ac.nz/~stuart";
var redraw = dispRank;
window.onresize = delayedRedraw;
var width, height;
var years = [];
var teams = {};

function startTest() {
    loadGames();
    loadTeams();
    updateDims();
    redraw();
}

function loadGames(){
	for (var i = yearStart; i <= yearEnd; i++) {
        var dataLoc = "data/" + i + dataSuffix;
        d3.csv(dataLoc, function (games) {
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
}

function loadTeams(){
	d3.csv("data/Teams.csv",function(tms){
		tms.forEach(function(team){
			console.log(JSON.stringify(team));
			teams[team.Name]={
				name:team.Name,
				country:team.Country,
				color:team.Color,
				sColor:team.SColor
			};
		});
	});
}

function dispRank() {
    redraw = dispRank;
    var oldCanv = document.getElementById("canvas");
    if (oldCanv) oldCanv.parentNode.removeChild(oldCanv);
    
    var bigMargin = 50;
    var con = {x:bigMargin,y:bigMargin,w:width-bigMargin*2,h:height-bigMargin*2};
    
     var svg = d3.select("body").append("svg")
        .attr("id", "canvas")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + con.x + "," + con.y + ")");
    
    var gCon = {x:20,y:0,w:(con.w-bigMargin-20)*0.7,h:con.h-con.h*0.1};

    var xAxisScale = d3.scale.linear()
        .domain([0, 14])
        .range([0, gCon.w]);

    var yAxisScale = d3.scale.linear()
        .domain([11,1])
        .range([gCon.h, 0]);

    var xAxis = d3.svg.axis()
        .scale(xAxisScale)
        .tickValues(d3.range(1, 15))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yAxisScale)
        .tickValues(d3.range(1, 11))
        .orient("left");

    var graph = svg.append("g")
        .attr("class", "graph")
        .attr("transform", "translate(" +gCon.x +"," + gCon.y + ")");
    
    graph.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + gCon.h + ")")
        .call(xAxis);

    graph.append("g")
        .attr("class", "yAxis")
        .attr("transform", "translate(" + 0 + ",0)")
        .call(yAxis);
        
	graph.append("text")
   	 .attr("class", "axisLabel")
    	 .attr("text-anchor", "middle")
   	 .attr("y",0)
   	 .attr("x", (gCon.height-gCon.y)/2)
   	 .text("Team Ranking")
   	 .attr("transform", "rotate(-90)");
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