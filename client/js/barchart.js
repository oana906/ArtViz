window.onload = function () {
	exec();
};

function exec() {
	var endpoint = d3.select("#endpoint").property("value")
	var rawSparql = "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX yago:<http://dbpedia.org/class/yago/> PREFIX dbo:<http://dbpedia.org/ontology/> prefix rdfs:<http://www.w3.org/2000/01/rdf-schema#>SELECT ?artistL (COUNT(DISTINCT ?instance) AS ?count) WHERE { ?artist rdf:type yago:Painter110391653. ?artist rdfs:label ?artistL . ?instance dbo:author ?artist . FILTER(langMatches(lang(?artistL), \"EN\")) } GROUP BY ?artistL ORDER BY DESC(?count) LIMIT xxxxxx"
	var sparql = rawSparql.replace("xxxxxx", document.getElementById("Tens").value)
	console.log(sparql);
	d3sparql.query(endpoint, sparql, render)
}

function render(json) {
	var config = {
		"label_x": "Artist",
		"label_y": "# of Works",
		"var_x": "artistL",
		"var_y": "count",
		"width": document.getElementById("Tens").value * 50, // canvas width
		"height": 400, // canvas height
		"margin": 70, // canvas margin
		"selector": "#result"
	}
	d3sparql.barchart(json, config)
}