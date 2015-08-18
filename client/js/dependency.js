var w = 1000,
	h = 700,
	rx = w / 2,
	ry = h / 2,
	m0,
	rotate = 0;

var splines = [];

function update(datafile) {

	var cluster = d3.layout.cluster()
		.size([360, ry - 150])
		.sort(function (a, b) {
			return d3.ascending(a.key, b.key);
		});

	var bundle = d3.layout.bundle();

	var line = d3.svg.line.radial()
		.interpolate("bundle")
		.tension(.75)
		.radius(function (d) {
			return d.y;
		})
		.angle(function (d) {
			return d.x / 180 * Math.PI;
		});

	// Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
	var div = d3.select("#chart").insert("div", "h2")
		.style("top", "270px")
		.style("left", "-30px")
		.style("width", w + "px")
		.style("height", w + "px")
		.style("position", "absolute")
		.style("-webkit-backface-visibility", "hidden");

	var svg = div.append("svg:svg")
		.attr("width", w)
		.attr("height", w)
		.append("svg:g")
		.attr("transform", "translate(" + rx + "," + ry + ")");

	svg.append("svg:path")
		.attr("class", "arc")
		.attr("d", d3.svg.arc().outerRadius(ry - 150).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
		.on("mousedown", mousedown);

	d3.json(datafile, function (classes) {

		var nodes = cluster.nodes(packages.root(classes)),
			links = packages.imports(nodes),
			splines = bundle(links);

		var path = svg.selectAll("path.linku")
			.data(links)
			.enter().append("svg:path")
			.attr("class", function (d) {
				return "linku source-" + d.source.key + " target-" + d.target.key;
			})
			.attr("d", function (d, i) {
				return line(splines[i]);
			});

		svg.selectAll("g.node")
			.data(nodes.filter(function (n) {
				return !n.children;
			}))
			.enter().append("svg:g")
			.attr("class", "node")
			.attr("id", function (d) {
				return "node-" + d.key;
			})
			.attr("transform", function (d) {
				return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
			})
			.append("svg:text")
			.attr("dx", function (d) {
				return d.x < 180 ? 8 : -8;
			})
			.attr("dy", ".31em")
			.attr("text-anchor", function (d) {
				return d.x < 180 ? "start" : "end";
			})
			.attr("transform", function (d) {
				return d.x < 180 ? null : "rotate(180)";
			})
			.text(function (d) {
				return d.key.replace("_", " ").replace("_", " ").replace("_", " ");
			})
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)
			.on("click", displayInfo);

		d3.select("input[type=range]").on("change", function () {
			line.tension(this.value / 100);
			path.attr("d", function (d, i) {
				return line(splines[i]);
			});
		});
	});



	var bioportal = new SPARQL({
		apikey: "",
		endpoint: "http://dbpedia.org/sparql"
	});

	function onFailure(xhr, status) {
		console.log("error" + status);
		console.log(xhr);
		document.getElementById("infoLabel").innerHTML = "No information found.";
	}

	function onSuccess(json) {
		document.getElementById("infoPic").innerHTML = "";

		document.getElementById("infoText").innerHTML = "";
		document.getElementById("moreInfo").innerHTML = "";
		document.getElementById("similarTitle").innerHTML = "";
		document.getElementById("similarName").innerHTML = "";
		console.log(json);
		var pic, abs, l;
		for (var b in json.results.bindings) {

			pic = json.results.bindings[b][json.head.vars[1]];
			abs = json.results.bindings[b][json.head.vars[0]];
			link = json.results.bindings[b][json.head.vars[2]];
		}
		if (typeof (pic) !== "undefined") {
			var elem = document.createElement("img");
			elem.setAttribute("src", pic.value);
			elem.setAttribute("height", "240");
			elem.setAttribute("width", "160");
			document.getElementById("infoPic").appendChild(elem);

			document.getElementById("infoText").innerHTML = abs.value;
			document.getElementById("moreInfo").innerHTML = "<a href=\"" + link.value + "\">More info here</a>";
			document.getElementById("similarTitle").innerHTML = "Similar artist: ";
			document.getElementById("similarName").innerHTML = "Francisco Goya";
		} else {
			document.getElementById("infoLabel").innerHTML = "No information found.";
		}
	}

	function displayInfo(d) {
		var query_string = "select distinct ?abs ?tum ?u where {{ ?u rdfs:label \"" + d.key.replace("_", " ").replace("_", " ") + "\"@en. ?u rdf:type dbo:Artist. ?u rdfs:comment ?abs. ?u dbo:thumbnail ?tum. FILTER(langMatches(lang(?abs), \"EN\")). } UNION{ ?u rdfs:label \"" + d.key.replace("_", " ").replace("_", " ") + "\"@en. ?u rdf:type dbo:Artist. ?u rdfs:comment ?abs. FILTER(langMatches(lang(?abs), \"EN\")). } } LIMIT 1";
		document.getElementById("infoLabel").innerHTML = "";
		document.getElementById("infoLabel").innerHTML = d.key.replace("_", " ").replace("_", " ");
		console.log(query_string);
		bioportal.query(query_string).done(onSuccess).error(onFailure);

	}

	function mouse(e) {
		return [e.pageX - rx, e.pageY - ry];
	}

	function mousedown() {
		m0 = mouse(d3.event);
		d3.event.preventDefault();
	}


	function mouseover(d) {
		svg.selectAll("path.linku.target-" + d.key)
			.classed("target", true)
			.each(updateNodes("source", true));

		svg.selectAll("path.linku.source-" + d.key)
			.classed("source", true)
			.each(updateNodes("target", true));
	}

	function mouseout(d) {
		svg.selectAll("path.linku.source-" + d.key)
			.classed("source", false)
			.each(updateNodes("target", false));

		svg.selectAll("path.linku.target-" + d.key)
			.classed("target", false)
			.each(updateNodes("source", false));
	}

	function updateNodes(name, value) {
		return function (d) {
			if (value) this.parentNode.appendChild(this);
			svg.select("#node-" + d[name].key).classed(name, value);
		};
	}


}

update("http://quepy-test.appspot.com/geography");

d3.select("#dataset").on("change", function () {
	d3.select("#chart")
		.selectAll("svg")
		.remove();
	update(this.value);
});