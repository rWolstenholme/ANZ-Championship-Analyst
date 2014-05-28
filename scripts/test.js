var yearStart = 2008;
var yearEnd = 2013;
var dataSuffix = "-Table1.csv";
var dataPrefix = "http://www.ecs.vuw.ac.nz/~stuart";
var redraw = dispRank;
window.onresize = delayedRedraw;
var width, height;
var years = [];
var teams = {};
var teamNames = [];

function startTest() {
    loadTeams();
}

function loadYear(yearNumber) {
    var dataLoc = "data/" + yearNumber + dataSuffix;
    d3.csv(dataLoc, function (games) {
        games = games.filter(function (game) {
            return game.Date.lastIndexOf("BYES", 0) !== 0;
        });
        var year = ({
            year: yearNumber,
            games: (games.map(function (game) {
                var scoreSplit = game.Score.replace(/\(\d+[-–]\d+\)|draw/,"").split(/[-–]/);
                if(scoreSplit[1]==undefined) console.log(game);
                var time = game.time;
                return {
                    round: +game.Round,
                    date: (time) ? Date.parse(yearNumber + " " + game.Date + " " + game.Time) : Date.parse(yearNumber + " " + game.Date),
                    home: game["Home Team"],
                    away: game["Away Team"],
                    homePts: +scoreSplit[0],
                    awayPts: +scoreSplit[1],
                    venue: game.Venue
                }
            }))
        });
        performAnalysis(year);
        years.push(year);
        if (yearNumber < yearEnd) loadYear(yearNumber + 1);
        else{
            updateDims();
            redraw();
        }
    });
}

function performAnalysis(year) {
    var games = year.games;
    var tms = {};
    teamNames.forEach(function (team){
        var newTeam = {};
        newTeam["score"] = 0;
        newTeam["rounds"] = [0,0];
        tms[team] = newTeam;
    });
    
    games.forEach(function (game) {
        var homeTeam = tms[game.home];
        var awayTeam = tms[game.away];
        
        if(isNaN(game.homePts)||isNaN(game.awayPts)){console.log(game);}
        
        if(game.round in homeTeam["rounds"]) homeTeam["rounds"][game.round] += game.homePts;
        else homeTeam["rounds"][game.round] = game.homePts + homeTeam["score"];
        
        if(game.round in awayTeam["rounds"]) awayTeam["rounds"][game.round] += game.awayPts;
        else awayTeam["rounds"][game.round] = game.homePts + awayTeam["score"];
        
        homeTeam["score"] += game.homePts;
        awayTeam["score"] += game.awayPts;

        if(game.homePts>game.awayPts){
            teams[game.home].homeWins++;
            teams[game.away].awayLosses++;
        }
        else{
            teams[game.home].homeLosses++;
            teams[game.away].awayWins++;
        }
    });
    year["teams"] = tms;
}

function loadTeams(listOfTeams) {
    d3.csv("data/Teams.csv", function (tms) {
        tms.forEach(function (team) {
            teams[team.Name] = {
                name: team.Name,
                country: team.Country,
                color: team.Color,
                sColor: team.SColor,
                homeWins: 0,
                homeLosses: 0,
                awayWins: 0,
                awayLosses: 0
            };
            teamNames.push(team.Name);
        });
        loadYear(yearStart);
    });
}

function dispRank() {
    redraw = dispRank;
    var oldCanv = document.getElementById("canvas");
    if (oldCanv) oldCanv.parentNode.removeChild(oldCanv);

    var bigMargin = 50;
    var con = {
        x: bigMargin,
        y: bigMargin,
        w: width - bigMargin * 2,
        h: height - bigMargin * 2
    };

    var svg = d3.select("body").append("svg")
        .attr("id", "canvas")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + con.x + "," + con.y + ")");

    var gCon = {
        x: 20,
        y: 0,
        w: (con.w - bigMargin - 20) * 0.7,
        h: con.h - con.h * 0.1
    };

    var xAxisScale = d3.scale.linear()
        .domain([0, 14])
        .range([0, gCon.w]);

    var maxY = 0;
    teamNames.forEach(function(name){
        maxY = Math.max(years[0].teams[name].score,maxY);
    });
    var yAxisScale = d3.scale.linear()
        .domain([0,maxY])
        .range([gCon.h, 0]);

    var xAxis = d3.svg.axis()
        .scale(xAxisScale)
        .tickValues(d3.range(1, 15))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yAxisScale)
        .orient("left");

    var graph = svg.append("g")
        .attr("class", "graph")
        .attr("transform", "translate(" + gCon.x + "," + gCon.y + ")");

    graph.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + gCon.h + ")")
        .call(xAxis);

    graph.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 + ",0)")
        .call(yAxis);

    graph.append("text")
        .attr("class", "axisLabel")
        .attr("text-anchor", "middle")
        .attr("y", -40)
        .attr("x", (gCon.y - gCon.h) / 2)
        .text("Team Ranking")
        .attr("transform", "rotate(-90)");

    graph.append("text")
        .attr("class", "axisLabel")
        .attr("text-anchor", "middle")
        .attr("y", gCon.h + 50)
        .attr("x", (gCon.w - gCon.x) / 2)
        .text("Round");

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