var yearStart = 2008;
var yearEnd = 2013;
var dataSuffix = "-Table1.csv";
var dataPrefix = "http://www.ecs.vuw.ac.nz/~stuart";
var redraw = dispRank;
window.onresize = delayedRedraw;

function startTest() {
    var canvas = document.getElementById("canvas");
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    years = [];
    for (var i = yearStart; i <= yearEnd; i++) {
        var dataLoc = "data/" + i + dataSuffix;
        var year = [];
        d3.csv(dataLoc, function (games) {
            console.log(games.length);
            games = games.filter(function(game){return game.Date.lastIndexOf("BYES", 0) !== 0;});
            console.log(games.length);
            
            years.push(games.map(function(game){
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
    }
}

function dispRank() {
    redraw = dispRank;
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
    width = canvas.clientWidth;
    height = canvas.clientHeight;
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