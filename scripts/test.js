var yearStart = 2008;
var yearEnd = 2013;
var dataSuffix = "-Table1.csv";
var dataPrefix = "http://www.ecs.vuw.ac.nz/~stuart";
var redraw = dispExpl;
window.onresize = delayedRedraw;
var width, height;
var years = [];
var teams = {};
var teamNames = [];
var selYear = 0;
var hConf = false;
var lConf = false;
var filter = 0;
var explYear = 0;
var explRound = 1;

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
                var isDraw = game.Score.indexOf("draw") != -1;
                var scoreSplit = game.Score.replace(/\(\d+[-–]\d+\)|draw/, "").split(/[-–]/);
                var time = game.time;
                return {
                    round: +game.Round,
                    date: (time) ? Date.parse(yearNumber + " " + game.Date + " " + game.Time) : Date.parse(yearNumber + " " + game.Date),
                    home: game["Home Team"],
                    away: game["Away Team"],
                    homePts: +scoreSplit[0],
                    awayPts: +scoreSplit[1],
                    venue: game.Venue,
                    draw: isDraw
                }
            }))
        });
        performAnalysis(year);
        years.push(year);
        if (yearNumber < yearEnd) loadYear(yearNumber + 1);
        else {
            updateDims();
            redraw();
        }
    });
}

function performAnalysis(year) {
    var games = year.games;
    var tms = d3.map();
    teamNames.forEach(function (team) {
        var newTeam = {};
        newTeam["score"] = 0;
        newTeam["rounds"] = [0, 0];
        tms.set(team, newTeam);
    });
    year.finals = [];
    year.rounds = [];
    year.aus = {
        score: 0,
        wins: 0,
        finals: 0
    };
    year.nz = {
        score: 0,
        wins: 0,
        finals: 0
    };

    games.forEach(function (game) {
        if(year.rounds[game.round]===undefined) year.rounds[game.round] = [];
        year.rounds[game.round].push(game);
        
        var homeTeam = tms.get(game.home);
        var awayTeam = tms.get(game.away);
        var hCountry = (teams[game.home].country === "Australia") ? year.aus : year.nz;
        var aCountry = (teams[game.away].country === "Australia") ? year.aus : year.nz;
        if (game.round == 15) {
            hCountry.finals++;
            aCountry.finals++;
        }
        hCountry.score += game.homePts;
        aCountry.score += game.awayPts;

        if (game.round >= 15) {
            var winnerName = (game.homePts > game.awayPts) ? game.home : game.away;
            year.finals.push(game.home);
            year.finals.push(game.away);
            year.finals.push(winnerName);
        }

        /*if (game.round in homeTeam["rounds"]) homeTeam["rounds"][game.round] += game.homePts;
        else homeTeam["rounds"][game.round] = game.homePts + homeTeam["score"];

        if (game.round in awayTeam["rounds"]) awayTeam["rounds"][game.round] += game.awayPts;
        else awayTeam["rounds"][game.round] = game.homePts + awayTeam["score"];

        homeTeam["score"] += game.homePts;
        awayTeam["score"] += game.awayPts;*/

        if (game.draw) {
            if (game.round in homeTeam["rounds"]) homeTeam["rounds"][game.round] += 1;
            else homeTeam["rounds"][game.round] = 1 + homeTeam["score"];
            if (game.round in awayTeam["rounds"]) awayTeam["rounds"][game.round] += 1;
            else awayTeam["rounds"][game.round] = 1 + awayTeam["score"];
            homeTeam["score"] += 1;
            awayTeam["score"] += 1;
        } else if (game.homePts > game.awayPts) {
            if (game.round in homeTeam["rounds"]) homeTeam["rounds"][game.round] += 2;
            else homeTeam["rounds"][game.round] = 2 + homeTeam["score"];
            homeTeam["score"] += 2;
            teams[game.home].homeWins++;
            teams[game.home].winsAgainst[game.away]++;
            teams[game.away].awayLosses++;
            hCountry.wins++;
        } else {
            if (game.round in awayTeam["rounds"]) awayTeam["rounds"][game.round] += 2;
            else awayTeam["rounds"][game.round] = 2 + awayTeam["score"];
            awayTeam["score"] += 2;
            teams[game.home].homeLosses++;
            teams[game.home].winsAgainst[game.home]++;
            teams[game.away].awayWins++;
            aCountry.wins++;
        }
    });
    year["teams"] = tms;

    tms.values().forEach(function (tm) {
        d3.range(1, 15).forEach(function (index) {
            if (isNaN(tm.rounds[index])) tm.rounds[index] = tm.rounds[index - 1];
        });
    });

    tms.values().forEach(function (tm) {
        tm.graphPts = d3.zip(d3.range(0, (year.year === 2011) ? 13 : 15), tm.rounds);
    });
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
                awayLosses: 0,
                winsAgainst: {}
            };
            teamNames.push(team.Name);
        });
        teamNames.forEach(function (name) {
            teamNames.forEach(function (other) {
                teams[name].winsAgainst[other] = 0;
            });
        });
        loadYear(yearStart);
    });
}

function dispRank() {
    var year = years[selYear];

    redraw = dispRank;

    var bigMargin = 50;
    var con = {
        x: bigMargin,
        y: bigMargin,
        w: width - bigMargin * 2,
        h: height - bigMargin * 2
    };

    document.getElementById("content").innerHTML = "";
    var svg = d3.select("#content").append("svg")
        .attr("id", "canvas")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + con.x + "," + con.y + ")");

    var gCon = {
        x: 20,
        y: 0,
        w: (con.w - bigMargin - 20) * 0.6,
        h: con.h - con.h * 0.1
    };

    var fCon = {
        x: gCon.w + 120,
        y: 0,
        w: con.w - gCon.w - 160,
        h: con.h - con.h * 0.1
    };

    var xAxisScale = d3.scale.linear()
        .domain([0, (selYear + yearStart === 2011) ? 12 : 14])
        .range([0, gCon.w]);

    var maxY = 0;
    year.teams.values().forEach(function (tm) {
        maxY = Math.max(tm.rounds[14], maxY);
    });

    var yAxisScale = d3.scale.linear()
        .domain([0, maxY])
        .range([gCon.h, 0]);

    var xAxis = d3.svg.axis()
        .scale(xAxisScale)
        .tickValues(d3.range(1, (selYear + yearStart === 2011) ? 13 : 15))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yAxisScale)
        .orient("left");

    var graph = svg.append("g")
        .attr("id", "graph")
        .attr("transform", "translate(" + gCon.x + "," + gCon.y + ")");

    var finals = svg.append("g")
        .attr("id", "figure")
        .attr("transform", "translate(" + fCon.x + "," + fCon.y + ")");

    var iconSize = fCon.w / 8;
    var vSpacing = iconSize * 2;

    addLine(finals, fCon.w / 12 * 5, 0, fCon.w / 12 * 5, vSpacing / 2, true);
    addText(finals, fCon.w / 12 * 5, 0, iconSize, "1st");
    var isLeft = year.finals[9] === year.finals[11];
    addLine(finals, fCon.w / 12 * 5, vSpacing / 2, fCon.w / 6, vSpacing, isLeft);
    addLine(finals, fCon.w / 12 * 5, vSpacing / 2, fCon.w / 3 * 2, vSpacing, !isLeft);
    var textPos = (!isLeft) ? fCon.w / 6 : fCon.w / 3 * 2;
    addText(finals, textPos, vSpacing, iconSize, "2nd");

    addLine(finals, fCon.w / 6, vSpacing, fCon.w / 6, vSpacing * 2.5, true);
    isLeft = year.finals[0] === year.finals[2];
    addLine(finals, fCon.w / 3, vSpacing * 3, fCon.w / 6, vSpacing * 2.5, !isLeft);
    addLine(finals, 0, vSpacing * 3, fCon.w / 6, vSpacing * 2.5, isLeft);

    addLine(finals, fCon.w / 6 * 5, vSpacing * 2, fCon.w / 6 * 5, vSpacing * 2.5, true);
    isLeft = year.finals[3] === year.finals[5];
    addLine(finals, fCon.w / 3 * 2, vSpacing * 3, fCon.w / 6 * 5, vSpacing * 2.5, isLeft);
    addLine(finals, fCon.w, vSpacing * 3, fCon.w / 6 * 5, vSpacing * 2.5, !isLeft);
    textPos = (!isLeft) ? fCon.w / 3 * 2 : fCon.w;
    addText(finals, textPos, vSpacing * 3, iconSize, "4th");

    isLeft = year.finals[6] === year.finals[8];
    textPos = (!isLeft) ? fCon.w / 2 : fCon.w / 6 * 5;
    addText(finals, textPos, vSpacing * 2, iconSize, "3rd");
    addLine(finals, fCon.w / 3 * 2, vSpacing * 1.5, fCon.w / 6 * 5, vSpacing * 2, !isLeft);
    addLine(finals, fCon.w / 3 * 2, vSpacing * 1.5, fCon.w / 2, vSpacing * 2, isLeft);

    addIcon(finals, fCon.w / 12 * 5, 0, iconSize, year.finals[11]);
    addIcon(finals, fCon.w / 6, vSpacing, iconSize, year.finals[2]);
    addIcon(finals, fCon.w / 6 * 5, vSpacing * 2, iconSize, year.finals[5]);
    addIcon(finals, 0, vSpacing * 3, iconSize, year.finals[0]);
    addIcon(finals, fCon.w / 3, vSpacing * 3, iconSize, year.finals[1]);
    addIcon(finals, fCon.w / 3 * 2, vSpacing * 3, iconSize, year.finals[3]);
    addIcon(finals, fCon.w, vSpacing * 3, iconSize, year.finals[4]);

    addLine(finals, fCon.w / 2, vSpacing * 2, fCon.w / 6, vSpacing * 2.5, false);
    addLine(finals, fCon.w / 3 * 2, vSpacing, fCon.w / 3 * 2, vSpacing * 1.5, true);
    addIcon(finals, fCon.w / 2, vSpacing * 2, iconSize, year.finals[6]);
    addIcon(finals, fCon.w / 3 * 2, vSpacing, iconSize, year.finals[8]);



    graph.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + gCon.h + ")")
        .call(xAxis);

    graph.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 + ",0)")
        .call(yAxis);

    var line = d3.svg.line()
        .x(function (d) {
            return xAxisScale(d[0]);
        })
        .y(function (d) {
            return yAxisScale(d[1]);
        });



    var team = graph.selectAll(".team")
        .data(teamNames)
        .enter().append("g")
        .attr("class", "team");

    /*var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, gCon.w / 2])
        .html(function (d) {
            alert("yo");
            return d;
        });
    graph.call(tip);*/
    var tip = d3.select("#content").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    team.append("path")
        .attr("class", "graphLine")
        .attr("d", function (d) {
            return line(year.teams.get(d).graphPts);
        })
        .style("stroke", function (d) {
            return "#" + teams[d].color;
        })
        .on("mouseover", function (d) {
            tip.transition()
                .duration(200)
                .style("opacity", .9);
            tip.text("test")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    graph.append("text")
        .attr("class", "axisLabel")
        .attr("text-anchor", "middle")
        .attr("y", -40)
        .attr("x", (gCon.y - gCon.h) / 2)
        .text("Team Score")
        .attr("transform", "rotate(-90)");

    graph.append("text")
        .attr("class", "axisLabel")
        .attr("text-anchor", "middle")
        .attr("y", gCon.h + 50)
        .attr("x", (gCon.w - gCon.x) / 2)
        .text("After Round");

    d3.select("#content").append("input")
        .attr("type", "range")
        .attr("name", "Year")
        .attr("min", yearStart)
        .attr("max", yearEnd)
        .attr("id", "yearSlide")
        .attr("onChange", "selYear = this.value-yearStart;redraw();")
        .attr("oninput", "document.getElementById('yearLabel').innerHTML = this.value;")
        .attr("value", yearStart + selYear);


    document.getElementById("content").innerHTML += "<span id='yearLabel'>" + (yearStart + selYear) + "</span>";
}

function addIcon(f, x, y, s, n) {
    f.append("svg:image")
        .attr('x', x - s / 2)
        .attr('y', y - s / 2)
        .attr('width', s)
        .attr('height', s)
        .attr("xlink:href", "images/icons-small/" + n + ".png")
        .append("svg:title")
        .text(n);
}

function addLine(f, x1, y1, x2, y2, isRed) {
    var col = (isRed) ? "rgb(255,0,0)" : "rgb(0,0,0)";
    f.append("svg:line")
        .attr("class", "finalLine")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .style("stroke", col);
}

function addText(f, x, y, s, place) {
    f.append("text")
        .attr("class", "placing")
        .attr("text-anchor", "right")
        .attr("dominant-baseline", "middle")
        .attr("y", y)
        .attr("x", x - s)
        .text(place);
}

function dispGeo() {
    redraw = dispGeo;
    document.getElementById("content").innerHTML = "";
    var bigMargin = 50;
    var con = {
        x: bigMargin,
        y: bigMargin,
        w: width - bigMargin * 2,
        h: height - bigMargin * 2
    };
    var svg = d3.select("#content").append("svg")
        .attr("id", "canvas")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + con.x + "," + con.y + ")");
    svg.append("image")
        .attr("x", con.w / 2)
        .attr("y", "0")
        .attr("width", con.w / 2)
        .attr("height", con.h)
        .attr("xlink:href", "images/au.svg");
    svg.append("image")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", con.w / 2)
        .attr("height", con.h)
        .attr("xlink:href", "images/nz.svg");

    var spacing = con.h / 10;
    var box = {
        w: con.w / 2,
        h: con.h / 10,
        x: con.w * 0.25
    };

    makeBox(svg, box.x, spacing, box.w, box.h, "points", "Points Scored");
    makeBox(svg, box.x, spacing * 3, box.w, box.h, "wins", "Wins");
    makeBox(svg, box.x, spacing * 5, box.w, box.h, "finalists", "Teams Playing in Finals");

    d3.select("#content").append("input")
        .attr("type", "range")
        .attr("name", "Year")
        .attr("min", yearStart)
        .attr("max", yearEnd)
        .attr("id", "yearSlide")
        .attr("onChange", "updateBoxes(" + box.w + ",this.value-yearStart);")
        .attr("oninput", "document.getElementById('yearLabel').innerHTML = this.value;")
        .attr("value", selYear);


    document.getElementById("content").innerHTML += "<span id='yearLabel'>" + (yearStart + selYear) + "</span>";

    updateBoxes(box.w, selYear);
}

function makeBox(f, x, y, w, h, id, txt) {
    f.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", w)
        .attr("height", h)
        .attr("class", "geoBox");
    f.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("height", h)
        .attr("width", 0)
        .attr("class", "geoPc")
        .attr("id", id);
    f.append("text")
        .attr("class", "geoTxt")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("y", y + h / 2)
        .attr("x", x + w / 2)
        .text(txt);
    f.append("text")
        .attr("class", "geoTxt")
        .attr("id", id + "LText")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("y", y + h / 2)
        .attr("x", x + 20)
        .text("0");
    f.append("text")
        .attr("class", "geoTxt")
        .attr("id", id + "RText")
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("y", y + h / 2)
        .attr("x", x + w - 20)
        .text("0");
}

function updateBoxes(w, y) {
    //alert(y);
    d3.select("#points")
        .transition()
        .attr("width", w * (years[y].nz.score / (years[y].nz.score + years[y].aus.score)));
    d3.select("#pointsLText").text(years[y].nz.score);
    d3.select("#pointsRText").text(years[y].aus.score);
    d3.select("#wins")
        .transition()
        .attr("width", w * (years[y].nz.wins / (years[y].nz.wins + years[y].aus.wins)));
    d3.select("#winsLText").text(years[y].nz.wins);
    d3.select("#winsRText").text(years[y].aus.wins);
    d3.select("#finalists")
        .transition()
        .attr("width", w * (years[y].nz.finals / (years[y].nz.finals + years[y].aus.finals)));
    d3.select("#finalistsLText").text(years[y].nz.finals);
    d3.select("#finalistsRText").text(years[y].aus.finals);
}

function dispPred() {
    redraw = dispPred;

    var content = document.getElementById("content");

    content.innerHTML = '<div id="filterBar"><select id="filterSel" name="Filter Select" onChange="filter=this.value;redraw()"> <option value="0" selected="selected">No Filter</option><option value="1" >inc Australian</option><option value="2" >inc New Zealand</option><option value="3" >Australia vs New Zealand</option><option value="4" >Australia vs Australia</option><option value="5" >New Zealand vs New Zealand</option></select><span><input id="hConf" name="High Confidence" class="checkbox" type="checkbox" value="1"  onChange="hConf=this.checked;redraw()"/><label class="choice">High Confidence</label><input id="lConf" name="Close Competitors" class="checkbox" type="checkbox" value="1" onChange="lConf=this.checked;redraw()"/><label class="choice">Close Competitors</label></span> </div> ';

    document.getElementById("filterSel")[filter].selected = true;
    document.getElementById("hConf").checked = hConf;
    document.getElementById("lConf").checked = lConf;

    var body = document.body,
        tbl = document.createElement('table');
    tbl.setAttribute("id", "predictions");
    tbl.setAttribute("class", "sortable pure-table pure-table-bordered");
    var header = tbl.createTHead().insertRow();
    header.insertCell(-1).innerHTML = "Team 1";
    header.insertCell(-1).innerHTML = "Home Advantage (%)";
    header.insertCell(-1).innerHTML = "Win Rate (%)";
    header.insertCell(-1).innerHTML = "Team 2";
    header.insertCell(-1).innerHTML = "Home Advantage (%)";
    header.insertCell(-1).innerHTML = "Win Rate (%)";
    header.insertCell(-1).innerHTML = "Probable Winner";
    header.insertCell(-1).innerHTML = "Confidence (%)";
    var unsort = header.insertCell(-1);
    unsort.innerHTML = "History";
    unsort.setAttribute("class", "sorttable_nosort");

    var tbody = tbl.createTBody();

    for (var i = 0; i < 9; i++) {
        for (var j = i + 1; j < 10; j++) {

            var t1 = teamNames[i];
            var t2 = teamNames[j];
            var team1 = teams[t1];
            var team2 = teams[t2];

            switch (parseInt(filter)) {
            case 1:
                if (team1.country != "Australia" && team2.country != "Australia") continue;
                break;
            case 2:
                if (team1.country != "New Zealand" && team2.country != "New Zealand") continue;
                break;
            case 3:
                if (team1.country === team2.country) continue;
                break;
            case 4:
                if (team1.country != "Australia" || team2.country != "Australia") continue;
                break;
            case 5:
                if (team1.country != "New Zealand" || team2.country != "New Zealand") continue;
                break;
            }
            var winsCompared = teams[t1].winsAgainst[t2] - teams[t2].winsAgainst[t1];
            var confidence = Math.abs(winsCompared) * 1.0 / (teams[t1].winsAgainst[t2] + teams[t2].winsAgainst[t1]);
            if (hConf && confidence < 0.7) continue;
            if (lConf && confidence > 0.3) continue;

            var row = tbody.insertRow(-1);
            row.insertCell(-1).innerHTML = t1;
            var homeWinRate = teams[t1].homeWins / (teams[t1].homeWins + teams[t1].homeLosses);
            var awayWinRate = teams[t1].awayWins / (teams[t1].awayWins + teams[t1].awayLosses);
            row.insertCell(-1).innerHTML = ((homeWinRate - awayWinRate) * 100).toFixed(0);
            var winRate = (teams[t1].homeWins + teams[t1].awayWins) / (teams[t1].homeWins + teams[t1].homeLosses + teams[t1].awayWins + teams[t1].awayLosses);
            row.insertCell(-1).innerHTML = (winRate * 100).toFixed(0);
            row.insertCell(-1).innerHTML = t2;
            homeWinRate = teams[t2].homeWins / (teams[t2].homeWins + teams[t2].homeLosses);
            awayWinRate = teams[t2].awayWins / (teams[t2].awayWins + teams[t2].awayLosses);
            winRate = (teams[t2].homeWins + teams[t2].awayWins) / (teams[t2].homeWins + teams[t2].homeLosses + teams[t2].awayWins + teams[t2].awayLosses);
            row.insertCell(-1).innerHTML = ((homeWinRate - awayWinRate) * 100).toFixed(0);
            row.insertCell(-1).innerHTML = (winRate * 100).toFixed(0);

            row.insertCell(-1).innerHTML = ((winsCompared == 0) ? "Undecided" : (winsCompared > 0) ? t1 : t2);

            row.insertCell(-1).innerHTML = (confidence * 100).toFixed(0);
            row.insertCell(-1).innerHTML = "Based on " + teams[t1].winsAgainst[t2] + "-" + teams[t2].winsAgainst[t1];
        }
    }
    sorttable.makeSortable(tbl);
    content.appendChild(tbl);
}

function dispExpl() {
    redraw = dispExpl;
    document.getElementById("content").innerHTML = "";
    var bigMargin = 50;
    var con = {
        x: bigMargin,
        y: bigMargin,
        w: width - bigMargin * 2,
        h: height - bigMargin * 2
    };
    var svg = d3.select("#content").append("svg")
        .attr("id", "canvas")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + ((con.w / 2) + con.x) + "," + ((con.h / 2) + con.y) + ")");
    svg.append("g")
        .attr("id", "explLines");
    for (var i = 0; i < 10; i++) {
        var teamName = teamNames[i];
        var team = teams[teamName];
        drawSeg(svg, con.h, i, team.color, teamName);
    }
    document.getElementById("content").innerHTML+="<ul id='yearSel'><li class='yearBut' onClick='explYear=0;updExpl();'>2008</li><li class='yearBut' onClick='explYear=1;updExpl();'>2009</li><li class='yearBut' onClick='explYear=2;updExpl();'>2010</li><li class='yearBut' onClick='explYear=3;updExpl();'>2011</li><li class='yearBut' onClick='explYear=4;updExpl();'>2012</li><li class='yearBut' onClick='explYear=5;updExpl();'>2013</li></ul>";
    document.getElementById("content").innerHTML+="<ul id='roundSel'><li class='roundBut' onClick='explRound=1;updExpl();'>1</li><li class='roundBut' onClick='explRound=2;updExpl();'>2</li><li class='roundBut' onClick='explRound=3;updExpl();'>3</li><li class='roundBut' onClick='explRound=4;updExpl();'>4</li><li class='roundBut' onClick='explRound=5;updExpl();'>5</li><li class='roundBut' onClick='explRound=6;updExpl();'>6</li><li class='roundBut' onClick='explRound=7;updExpl();'>7</li><li class='roundBut' onClick='explRound=8;updExpl();'>8</li><li class='roundBut' onClick='explRound=9;updExpl();'>9</li><li class='roundBut' onClick='explRound=10;updExpl();'>10</li><li class='roundBut' onClick='explRound=11;updExpl();'>11</li><li class='roundBut' onClick='explRound=12;updExpl();'>12</li><li class='roundBut' onClick='explRound=13;updExpl();'>13</li><li class='roundBut' onClick='explRound=14;updExpl();'>14</li><li class='roundBut' onClick='explRound=15;updExpl();'>15</li><li class='roundBut' onClick='explRound=16;updExpl();'>16</li><li class='roundBut' onClick='explRound=17;updExpl();'>17</li></ul>";
    updExpl();
}

function updExpl(){
    var lines = d3.select("#explLines");
    d3.selectAll(".gameLine").remove();
    //lines.empty();
    var round = years[explYear].rounds[explRound];
    round.forEach(function(game){
        var loser = teamNames.indexOf(game.home);
        var winner = teamNames.indexOf(game.away);
        if(game.homePts>game.awayPts){
            var t = loser;
            loser = winner;
            winner = t;
        };
        drawGameLine(lines,loser,winner);
    });
}

function drawGameLine(lines,loser,winner){
    var h = document.getElementById("canvas").getAttribute("height");
    var lineRadius = h / 10 * 6.25 / 2;
    var angle1 = (loser-2)/5*Math.PI;
    var angle2 = (winner-2)/5*Math.PI;
    var x1 = Math.cos(angle1)*lineRadius;
    var y1 = Math.sin(angle1)*lineRadius;
    var x2 = Math.cos(angle2)*lineRadius;
    var y2 = Math.sin(angle2)*lineRadius;
    var x3 = x1*0.1+x2*0.9;
    var y3 = y1*0.1+y2*0.9;
    var x4 = x1*0.9+x2*0.1;
    var y4 = y1*0.9+y2*0.1;
     lines.append("svg:line")
        .attr("class", "gameLine")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2);
    lines.append("svg:line")
        .attr("class", "gameLine winnerLine")
        .attr("x1", x3)
        .attr("y1", y3)
        .attr("x2", x2)
        .attr("y2", y2);
    lines.append("svg:line")
        .attr("class", "gameLine loserLine")
        .attr("x1", x4)
        .attr("y1", y4)
        .attr("x2", x1)
        .attr("y2", y1);
}

function drawSeg(f, h, i, col, nam) {
    var arc = d3.svg.arc()
        .innerRadius(h / 10 * 7.5 / 2)
        .outerRadius(h / 10 * 8 / 2)
        .startAngle(Math.PI / 5 * i)
        .endAngle(Math.PI / 5 * (i + 1));
    f.append("svg:path")
        .style("fill", "#" + col)
        .attr("d", arc)
    .attr("class","seg");

    var angle = (i-2)/5*Math.PI;
    var rad = h/10*9.5/2;
    
    addIcon(f,Math.cos(angle)*rad,Math.sin(angle)*rad,h/9,nam);
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