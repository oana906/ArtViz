#!/usr/bin/env python
# coding: utf-8

import bottle
from bottle import template, request
import os

import quepy
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper("http://dbpedia.org/sparql")
dbpedia = quepy.install("dbpedia")
bottle.debug(True)
quepy.set_loglevel("DEBUG")

@bottle.route("/")
def index():
    return template("index")

@bottle.post("/result<query>", method='GET')
def result(query):
    q = query;
    target, query, metadata = dbpedia.get_query(q)
    if isinstance(metadata, tuple):
        query_type = metadata[0]
        metadata = metadata[1]
    else:
        query_type = metadata
        metadata = None
    if query is None:
        return "100"
 
    if target.startswith("?"):
        target = target[1:]
    if query:
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()
        if not results["results"]["bindings"]:
            return "200"
    
    return results
     
bottle.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5005)))
#bottle.run(server='gae')

