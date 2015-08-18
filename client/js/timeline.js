var bioportal = new SPARQL({
	apikey: "",
	endpoint: "http://www.dbpedia.org/sparql"
});
window.onload = function () {
	exec();
};

function exec() {
	d3.select("#container")
		.selectAll("svg")
		.remove();
	var sparql = "SELECT distinct ?artistLabel ?artistLink ?dob (SAMPLE(?lobl) as ?lob) ?dod (SAMPLE(?lodl) as ?lod) (COUNT(DISTINCT ?instance) AS ?count) (group_concat(distinct ?arty;separator=\"||\") as ?artyear) (group_concat(distinct ?artl;separator=\"||\") as ?artlabel)  WHERE { ?artistLink rdf:type yago:Painter110391653; rdfs:label ?artistLabel ; dbo:abstract ?artistAbstract; dbo:birthDate ?dob; dbo:birthPlace ?lobs; dbo:deathDate?dod; dbo:deathPlace ?lods. ?instance dbo:author ?artistLink; rdfs:label ?artl; dbp:year ?arty. ?lobs rdfs:label ?lobl. ?lods rdfs:label ?lodl FILTER(langMatches(lang(?artl), \"EN\")) FILTER(langMatches(lang(?artistLabel ), \"EN\")) FILTER(langMatches(lang(?lobl), \"EN\")) FILTER(langMatches(lang(?lodl), \"EN\")) FILTER(langMatches(lang(?artistAbstract), \"EN\")) FILTER (( ?dob <=xsd:dateTime( '" + document.getElementById("to").value + "-01-01T00:00:00Z') && ?dob>= xsd:dateTime('" + document.getElementById("from").value + "-01-01T00:00:00Z') )||( ?dod <=xsd:dateTime( '" + document.getElementById("to").value + "-01-01T00:00:00Z') && ?dod>= xsd:dateTime('" + document.getElementById("from").value + "-01-01T00:00:00Z') )) } GROUP BY ?artistLabel ?artistLink ?dob ?dod ?artistAbstract ORDER BY DESC(?count) LIMIT " + document.getElementById("top").value;
	console.log(sparql);
	bioportal.query(sparql).done(onSuccess);
}

function onSuccess(json) {

	var id, aLabel, aLink, dob, lob, dod, lod, artlink,
		artlabel = [],
		artyear = [];
	var taskArray = [];

	var total = [];
	var lane = 0;
	for (var b in json.results.bindings) {
		aLabel = json.results.bindings[b][json.head.vars[0]];
		aLink = json.results.bindings[b][json.head.vars[1]];
		dob = json.results.bindings[b][json.head.vars[2]];
		lob = json.results.bindings[b][json.head.vars[3]];
		dod = json.results.bindings[b][json.head.vars[4]];
		lod = json.results.bindings[b][json.head.vars[5]];
		//console.log(json.results.bindings[b][json.head.vars[7]]);
		artlink = json.results.bindings[b][json.head.vars[7]].value.split("||");
		//console.log(":::::" + artlink);
		artlabel = json.results.bindings[b][json.head.vars[8]].value.split("||");
		if (dob.value.split("-")[0] > document.getElementById("from").value && dob.value.split("-")[0] < document.getElementById("to").value) {
			taskArray.push({
				"type": aLabel.value,
				"task": "Birth",
				"startTime": parseInt(dob.value.split("-")[0]) + "", //year/month/day
				"endTime": parseInt(dob.value.split("-")[0]) + 1 + "",
				"details": aLink.value

			});
		}
		if (dod.value.split("-")[0] > document.getElementById("from").value && dod.value.split("-")[0] < document.getElementById("to").value) {
			taskArray.push({
				"type": aLabel.value,
				"task": "Death",
				"startTime": parseInt(dod.value.split("-")[0]) + "", //year/month/day
				"endTime": parseInt(dod.value.split("-")[0]) + 1 + "",
				"details": aLink.value

			});
		}
		for (var i = 0; i < artlink.length; i++) {
			console.log(":::::" + artlink);
			if (artlink[i].match(/\d+/g))
				if (artlink[i].indexOf("circa") || artlink[i].indexOf("c. ")) {
					if (artlink[i].slice(-4) > document.getElementById("from").value && artlink[i].slice(-4) < document.getElementById("to").value) {
						taskArray.push({
							"type": aLabel.value,
							"task": "Art created",
							"startTime": parseInt(artlink[i].slice(-4)) + "", //year/month/day
							"endTime": parseInt(artlink[i].slice(-4)) + 1 + "",
							"details": aLink.value + "\n"


						});
					}
					//console.log(aLink.value + lane + "0.5" + i + " " + artlink[i].slice(-4));
				} else
			if (artlink[i].indexOf("-")) {
				if (parseInt(artlink[i].substring(0, 4)) > document.getElementById("from").value && parseInt(artlink[i].substring(0, 4)) < document.getElementById("to").value) {
					taskArray.push({
						"type": aLabel.value,
						"task": "Art created",
						"startTime": parseInt(artlink[i].substring(0, 4)) + "", //year/month/day
						"endTime": parseInt(artlink[i].substring(0, 4)) + 1 + "",
						"details": aLink.value + "\n"

					});
				}
			}
		}

		lane++;

	}
	console.log(taskArray);




	var w = 1300;
	var h = taskArray.length * 30;
	console.log(h);

	var svg = d3.selectAll(".svg")
		//.selectAll("svg")
		.append("svg")
		.attr("width", w)
		.attr("height", h)
		.attr("class", "svg");

	var dateFormat = d3.time.format("%Y");

	var timeScale = d3.time.scale()
		.domain([d3.min(taskArray, function (d) {
				return dateFormat.parse(d.startTime);
			}),
                 d3.max(taskArray, function (d) {
				return dateFormat.parse(d.endTime);
			})])
		.range([0, w - 200]);

	var categories = new Array();

	for (var i = 0; i < taskArray.length; i++) {
		categories.push(taskArray[i].type);
	}

	var catsUnfiltered = categories; //for vert labels

	categories = checkUnique(categories);


	makeGant(taskArray, w, h);


	function makeGant(tasks, pageWidth, pageHeight) {

		var barHeight = 20;
		var gap = barHeight + 4;
		var topPadding = 30;
		var sidePadding = 115;

		var colorScale = d3.scale.linear()
			.domain([0, categories.length])
			.range(["#3399cc", "#ffff00"])
			.interpolate(d3.interpolateHcl);

		makeGrid(sidePadding, topPadding, pageWidth, pageHeight);
		drawRects(tasks, gap, topPadding, sidePadding, barHeight, colorScale, pageWidth, pageHeight);
		vertLabels(gap, topPadding, sidePadding, barHeight, colorScale);

	}


	function drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {

		var bigRects = svg.append("g")
			.selectAll("rect")
			.data(theArray)
			.enter()
			.append("rect")
			.attr("x", 0)
			.attr("y", function (d, i) {
				return i * theGap + theTopPad - 2;
			})
			.attr("width", function (d) {
				return w - theSidePad / 2;
			})
			.attr("height", theGap)
			.attr("stroke", "none")
			.attr("fill", function (d) {
				for (var i = 0; i < categories.length; i++) {
					if (d.type == categories[i]) {
						return d3.rgb(theColorScale(i));
					}
				}
			})
			.attr("opacity", 0.2);


		var rectangles = svg.append('g')
			.selectAll("rect")
			.data(theArray)
			.enter();


		var innerRects = rectangles.append("rect")
			.attr("rx", 3)
			.attr("ry", 3)
			.attr("x", function (d) {
				return timeScale(dateFormat.parse(d.startTime)) + theSidePad;
			})
			.attr("y", function (d, i) {
				return i * theGap + theTopPad;
			})
			.attr("width", function (d) {
				return (timeScale(dateFormat.parse(d.endTime)) - timeScale(dateFormat.parse(d.startTime)));
			})
			.attr("height", theBarHeight)
			.attr("stroke", "none")
			.attr("fill", function (d) {
				for (var i = 0; i < categories.length; i++) {
					if (d.type == categories[i]) {
						return d3.rgb(theColorScale(i));
					}
				}
			})


		var rectText = rectangles.append("text")
			.text(function (d) {
				return d.task;
			})
			.attr("x", function (d) {
				return (timeScale(dateFormat.parse(d.endTime)) - timeScale(dateFormat.parse(d.startTime))) / 2 + timeScale(dateFormat.parse(d.startTime)) + theSidePad;
			})
			.attr("y", function (d, i) {
				return i * theGap + 14 + theTopPad;
			})
			.attr("font-size", 12)
			.style("font-weight", "bold")
			.attr("text-anchor", "middle")
			.attr("text-height", theBarHeight)
			.attr("fill", "#fff")
			.attr("stroke", "#00f")
			.attr("stroke-width", ".5px");


		rectText.on('mouseover', function (e) {
			// console.log(this.x.animVal.getItem(this));
			var tag = "";

			if (d3.select(this).data()[0].details != undefined) {
				tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
					"Type: " + d3.select(this).data()[0].type + "<br/>" +
					"Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
					"Ends: " + d3.select(this).data()[0].endTime + "<br/>" +
					"Details: " + d3.select(this).data()[0].details;
			} else {
				tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
					"Type: " + d3.select(this).data()[0].type + "<br/>" +
					"Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
					"Ends: " + d3.select(this).data()[0].endTime;
			}
			var output = document.getElementById("tag");

			var x = w / 2 + "px";
			var y = h / 2 + "px";
			console.log(x + " " + y);
			output.innerHTML = tag;
			output.style.top = y;
			output.style.left = x;
			output.style.display = "block";
		}).on('mouseout', function () {
			var output = document.getElementById("tag");
			output.style.display = "none";
		});


		innerRects.on('mouseover', function (e) {
			//console.log(this);
			var tag = "";

			if (d3.select(this).data()[0].details != undefined) {
				tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
					"Type: " + d3.select(this).data()[0].type + "<br/>" +
					"Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
					"Ends: " + d3.select(this).data()[0].endTime + "<br/>" +
					"Details: " + d3.select(this).data()[0].details;
			} else {
				tag = "Task: " + d3.select(this).data()[0].task + "<br/>" +
					"Type: " + d3.select(this).data()[0].type + "<br/>" +
					"Starts: " + d3.select(this).data()[0].startTime + "<br/>" +
					"Ends: " + d3.select(this).data()[0].endTime;
			}
			var output = document.getElementById("tag");

			var x = w / 2 + "px";
			var y = h / 2 + "px";
			console.log(x + " " + y);

			output.innerHTML = tag;
			output.style.top = y;
			output.style.left = x;
			output.style.display = "block";
		}).on('mouseout', function () {
			var output = document.getElementById("tag");
			output.style.display = "none";

		});



	}


	function makeGrid(theSidePad, theTopPad, w, h) {

		var xAxis = d3.svg.axis()
			.scale(timeScale)
			.orient('bottom')
			.ticks(d3.time.years, 1)
			.tickSize(-h + theTopPad + 20, 0, 0)
			.tickFormat(d3.time.format('%y'));

		var grid = svg.append('g')
			.attr('class', 'grid')
			.attr('transform', 'translate(' + 110 + ', ' + (h - 50) + ')')
			.call(xAxis)
			.selectAll("text")
			.style("text-anchor", "middle")
			.attr("fill", "#000")
			.attr("stroke", "none")
			.attr("font-size", 8)
			.attr("dy", "1em");

	}

	function vertLabels(theGap, theTopPad, theSidePad, theBarHeight, theColorScale) {
		var numOccurances = new Array();
		var prevGap = 0;

		for (var i = 0; i < categories.length; i++) {
			numOccurances[i] = [categories[i], getCount(categories[i], catsUnfiltered)];
		}

		var axisText = svg.append("g") //without doing this, impossible to put grid lines behind text
			.selectAll("text")
			.data(numOccurances)
			.enter()
			.append("text")
			.text(function (d) {
				return d[0];
			})
			.attr("x", 2)
			.attr("y", function (d, i) {
				if (i > 0) {
					for (var j = 0; j < i; j++) {
						prevGap += numOccurances[i - 1][1];
						// console.log(prevGap);
						return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
					}
				} else {
					return d[1] * theGap / 2 + theTopPad;
				}
			})
			.attr("font-size", 10)
			.attr("text-anchor", "start")
			.attr("text-height", 14)
			.attr("fill", function (d) {
				for (var i = 0; i < categories.length; i++) {
					if (d[0] == categories[i]) {
						//  console.log("true!");
						return d3.rgb(theColorScale(i)).darker();
					}
				}
			});

	}

	//from this stackexchange question: http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript
	function checkUnique(arr) {
		var hash = {},
			result = [];
		for (var i = 0, l = arr.length; i < l; ++i) {
			if (!hash.hasOwnProperty(arr[i])) { //it works with objects! in FF, at least
				hash[arr[i]] = true;
				result.push(arr[i]);
			}
		}
		return result;
	}

	//from this stackexchange question: http://stackoverflow.com/questions/14227981/count-how-many-strings-in-an-array-have-duplicates-in-the-same-array
	function getCounts(arr) {
		var i = arr.length, // var to loop over
			obj = {}; // obj to store results
		while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
		return obj;
	}

	// get specific from everything
	function getCount(word, arr) {
		return getCounts(arr)[word] || 0;
	}
}