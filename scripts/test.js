var yearStart = 2008;
var yearEnd = 2013;
var dataSuffix = "-Table1.csv";
var dataPrefix = "http://www.ecs.vuw.ac.nz/~stuart/";

function startTest() {
    years = [];
    for (var i = yearStart; i <= yearEnd; i++) {
        var dataLoc = "data/" + i + dataSuffix;
        d3.text(dataLoc, function (datasetText) {
            var parsedCSV = d3.csv.parse(datasetText, function (d) {
                var scoreSplit = d.Score.split("–");
                var time = d.time;
                return {
                    round: +d.Round,
                    date: (time) ? Date.parse(i+" "+d.Date+" "+d.Time) : Date.parse(i+" "+d.Date),
                    home: d["Home Team"],
                    away: d["Away Team"],
                    homePts: +scoreSplit[0],
                    awayPts: +scoreSplit[1],
                    venue: d.Venue
                };
            });
            years.push(parsedCSV);
        });
    }
}

function dispRank(){
}

function dispGeo(){
}

function dispPred(){
}

function dispExpl(){
}

function changeSelected(toBeSelected){
    [].forEach.call(document.getElementsByClassName("selectedButton"), function (el) {
        el.classList.remove("selectedButton");
    });
    toBeSelected.classList.add("selectedButton");
}