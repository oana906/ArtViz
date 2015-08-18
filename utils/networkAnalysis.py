import networkx as nx   
from networkx.readwrite import json_graph
from operator import itemgetter
import json 
import sys

def read_in_edges(filename, info=True):
	g_orig = nx.read_edgelist(filename, create_using=nx.DiGraph())
	if info:
		print(nx.info(g_orig))
	return g_orig
	
def save_to_json(filename, graph):
	g = graph
	g_json = json_graph.node_link_data(g)
	json.dump(g_json, open(filename,'w'))

def report_node_data(graph, node=""):
	g = graph
	if len(node) == 0:
		print(g.nodes(data=True)[0])
	else:
		print([d for n,d in g.nodes_iter(data=True) if n==node])

def calculate_degree(graph):
	g = graph
	deg = nx.degree(g)
	nx.set_node_attributes(g,'degree',deg)
	return g, deg

def calculate_betweenness(graph):
	g = graph
	bc=nx.betweenness_centrality(g)
	nx.set_node_attributes(g,'betweenness',bc)
	return g, bc
	
def calculate_eigenvector_centrality(graph):  
	g = graph
	ec = nx.eigenvector_centrality(g)
	nx.set_node_attributes(g,'eigen_cent',ec)
	return g, ec

def calculate_degree_centrality(graph):
	g = graph
	dc = nx.degree_centrality(g)
	nx.set_node_attributes(g,'degree_cent',dc)
	degcent_sorted = sorted(dc.items(), key=itemgetter(1), reverse=True)
	for key,value in degcent_sorted[0:10]:
		print("Highest degree Centrality:", key, value)
	return graph, dc	

def trim_nodes_by_attribute_for_remaining_number(graph, attributelist, count):
	g = graph
	to_remove = len(graph.nodes()) - count - 2
	g.remove_nodes_from([x[0] for x in attributelist[0:to_remove]])
	print("Now graph has node count: ", len(g.nodes()))
	return g
		
def main():

	
	inputjsonfile = 'jsonArtist.json'

	edgesfile = 'edgeArtists.edgelist'
	
	g = read_in_edges(edgesfile) # my func will create a Digraph from node pairs.
	g, deg = calculate_degree(g)
	g, bet = calculate_betweenness(g)
	g, eigen = calculate_eigenvector_centrality(g)
	g, degcent = calculate_degree_centrality(g)

	report_node_data(g, node='flowingdata')
	report_node_data(g, node='infosthetics')

	undir_g = g.to_undirected()

	report_node_data(g, node='arnicas')
	report_node_data(g, node='flowingdata')
	report_node_data(g, node='infosthetics')

	eigen_sorted = sorted(eigen.items(), key=lambda kv:(-kv[1], kv[0]), reverse=False)

	outputjsonfile = 'full_nodes.json'
	save_to_json(outputjsonfile, g)
	
	small_graph = trim_nodes_by_attribute_for_remaining_number(g, eigen_sorted, 100)

	small_filename = "top_nodes.json"
	save_to_json(small_filename,small_graph )

	
if __name__ == '__main__':
    main()

