		var bioportal = new SPARQL({
			apikey: "",
			endpoint: "http://www.dbpedia.org/sparql"
		});

		var laneLength;

		window.onload = function () {
			exec();
		};

		function myFunction() {
			exec();
		}

		function exec() {
			d3.select("body")
				.selectAll("svg")
				.remove();
			var sparql = "SELECT distinct ?artistLabel ?dob ?dod (group_concat(distinct ?fieldL; separator = \"%\") AS ?fieldLabel) (group_concat(distinct ?movementL; separator = \"%\") AS ?movLabel) (SAMPLE(?cl) AS ?countryL) (COUNT(DISTINCT ?instance) AS ?count) WHERE {?artistLink rdf:type yago:Painter110391653; rdfs:label ?artistLabel ; dbo:birthDate ?dob; dbo:birthPlace ?lob; dbo:deathDate ?dod; dbo:movement ?movement; dbo:field ?field. ?instance dbo:author ?artistLink. ?field rdfs:label ?fieldL. ?movement rdfs:label ?movementL. ?lob dbo:country ?country.?country rdfs:label ?cl. FILTER(langMatches(lang(?artistLabel ), \"EN\"))  FILTER(langMatches(lang(?movementL), \"EN\")) FILTER(langMatches(lang(?fieldL), \"EN\")) FILTER(langMatches(lang(?cl), \"EN\"))  } GROUP BY ?artistLabel ?dob ?dod ORDER BY DESC(?count) LIMIT " + document.getElementById("noArt").value;


			console.log(sparql);
			bioportal.query(sparql).done(onSuccess);
		}

		function calculate(i, j, map) {
			var total = 0;
			if (document.getElementById("year").checked == true) {
				total += 2 * yearSimilarity(map[i].birthDate.substring(0, 4), map[i].deathDate.substring(0, 4), map[j].birthDate.substring(0, 4), map[j].deathDate.substring(0, 4));
			}
			if (document.getElementById("location").checked == true) {
				total += 2 * locationSimilarity(map[i].birthplace, map[i].birthplace);
				console.log(map[i].birthplace + " " + map[i].birthplace + " " + locationSimilarity(map[i].birthplace, map[i].birthplace));
			}
			if (document.getElementById("mov").checked == true) {

				total += 4 * movementSimilarity(i, j, map);
			}
			if (document.getElementById("field").checked == true) {

				total += 3 * fieldSimilarity(i, j, map);
			}
			if (document.getElementById("year").checked == false && document.getElementById("mov").checked == false && document.getElementById("field").checked == false && document.getElementById("location").checked == false)
				alert("Please select a similarity metric");
			return total;
		}

		function locationSimilarity(loc1, loc2) {
			if (loc1 == loc2)
				return 1;
			else
				return 0;
		}

		function movementSimilarity(i, j, map) {
			var array1 = [],
				array2 = [];

			for (var ii = 0; ii < map[i].movLabel.split(";").length; ii++)
				array1.push(map[i].movLabel.split(";")[ii].trim());
			for (var jj = 0; jj < map[j].movLabel.split(";").length; jj++)
				array2.push(map[j].movLabel.split(";")[jj].trim());
			var selectedUnion = _.union(array1, array2);
			var selectedIntersection = _.intersection(array1, array2);

			return selectedIntersection.length / selectedUnion.length;
		}

		function fieldSimilarity(i, j, map) {
			var array1 = [],
				array2 = [];

			for (var ii = 0; ii < map[i].fieldLabel.split(";").length; ii++)
				array1.push(map[i].fieldLabel.split(";")[ii].trim());
			for (var jj = 0; jj < map[j].fieldLabel.split(";").length; jj++)
				array2.push(map[j].fieldLabel.split(";")[jj].trim());
			var selectedUnion = _.union(array1, array2);
			var selectedIntersection = _.intersection(array1, array2);

			return selectedIntersection.length / selectedUnion.length;
		}

		function yearSimilarity(artist1b, artist1d, artist2b, artist2d) {
			return (artist1b * artist2b + artist1d * artist2d) / (Math.sqrt(artist1b * artist1b + artist1d * artist1d) * Math.sqrt(artist2b * artist2b + artist2d * artist2d));
		}

		function onSuccess(json) {

			var artistLabel, dob, dod, fieldLabel, movLabel, birthLoc, deathLoc, count;
			var lane = 0;
			var mmap1 = {};
			var matrixx = [];
			var data;
			for (var b in json.results.bindings) {


				artistLabel = json.results.bindings[b][json.head.vars[0]].value;
				dob = json.results.bindings[b][json.head.vars[1]].value;
				dod = json.results.bindings[b][json.head.vars[2]].value;
				fieldLabel = json.results.bindings[b][json.head.vars[3]].value.replace(/%/g, '; ');;
				movLabel = json.results.bindings[b][json.head.vars[4]].value.replace(/%/g, '; ');
				birthLoc = json.results.bindings[b][json.head.vars[5]].value.replace(/%/g, '; ');

				count = json.results.bindings[b][json.head.vars[6]].value;

				if (lane % 10 == 0)
					data = "state";
				else
					data = "company";


				mmap1[lane] = {
					"name": artistLabel,
					"id": lane,
					"data": data,
					"birthDate": dob,
					"deathDate": dod,
					"birthplace": birthLoc,
					"movLabel": movLabel,
					"fieldLabel": fieldLabel,
					"count": count
				};
				lane++;

			}
			for (var i = 0; i < document.getElementById("noArt").value; i++) {
				matrixx[i] = [];
				for (var j = 0; j < document.getElementById("noArt").value; j++) {
					matrixx[i][j] = calculate(i, j, mmap1);
					if (i == j)
						matrixx[i][j] = 0;
					//matrixx[j][j] = 1;



				}
			}



			drawChords(matrixx, mmap1);
		}

		function drawChords(matrix, mmap) {
			var w = 780,
				h = 600,
				r1 = h / 2,
				r0 = r1 - 100;

			var fill = d3.scale.ordinal()
				.range(['#07a9e7', '#FFCA08', '#21d274']);

			d3.select("#color").on("click", function () {
				chord.flipColors();
			});

			var chord = d3.layout.chord()
				.padding(.02)
				.sortSubgroups(d3.descending)

			var arc = d3.svg.arc()
				.innerRadius(r0)
				.outerRadius(r0 + 20);

			var svg = d3.select("body").append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.append("svg:g")
				.attr("id", "circle")
				.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

			svg.append("circle")
				.attr("r", r0 + 20);

			var rdr = chordRdr(matrix, mmap);
			chord.matrix(matrix);

			var g = svg.selectAll("g.group")
				.data(chord.groups())
				.enter().append("svg:g")
				.attr("class", "group")
				.on("mouseover", mouseover)
				.on("mouseout", function (d) {
					d3.select("#tooltip").style("visibility", "hidden")
				});

			g.append("svg:path")
				.style("stroke", "black")
				.style("fill", function (d, i) {

					return fill(i);
				})
				.attr("d", arc);

			g.append("svg:text")
				.each(function (d) {
					d.angle = (d.startAngle + d.endAngle) / 2;
				})
				.attr("dy", ".35em")
				.style("font-family", "helvetica, arial, sans-serif")
				.style("font-size", "10px")
				.attr("text-anchor", function (d) {
					return d.angle > Math.PI ? "end" : null;
				})
				.attr("transform", function (d) {
					return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" + "translate(" + (r0 + 26) + ")" + (d.angle > Math.PI ? "rotate(180)" : "");
				})
				.text(function (d) {
					return rdr(d).gname;
				});

			var chordPaths = svg.selectAll("path.chord")
				.data(chord.chords())
				.enter().append("svg:path")
				.attr("class", "chord")
				.style("stroke", "black")
				.style("fill", function (d, i) {

					return fill(d.target.index);
				})
				.attr("d", d3.svg.chord().radius(r0))
				.on("mouseover", function (d) {
					d3.select("#tooltip")
						.style("visibility", "visible")
						.html(chordTip(rdr(d)))
						.style("top", function () {
							return (d3.event.pageY - 170) + "px"
						})
						.style("left", function () {
							return (d3.event.pageX - 100) + "px";
						})
				})
				.on("mouseout", function (d) {
					d3.select("#tooltip").style("visibility", "hidden")
				});

			function chordTip(d) {
				var p = d3.format(".1%"),
					q = d3.format(",f"),
					qq = d3.format(".1")
				return d.sname + " - " + d.tname + " similarity: " + qq(d.similarity);
			}

			function groupTip(d) {
				var p = d3.format(".1%"),
					q = d3.format(",f"),
					qq = d3.format(".1")
				return d.gname + " maximum similarity : " + qq(d.maxvalue) + " with " + d.sorceName;
			}

			function mouseover(d, i) {
				d3.select("#tooltip")
					.style("visibility", "visible")
					.html(groupTip(rdr(d)))
					.style("top", function () {
						return (d3.event.pageY - 80) + "px"
					})
					.style("left", function () {
						return (d3.event.pageX - 130) + "px";
					})

				chordPaths.classed("fade", function (p) {
					return p.source.index != i && p.target.index != i;
				});
			}
		}