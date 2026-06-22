import random
import networkx as nx

# generates a NetworkX random directed graph 
def generate_nx_graph(n, m):
    G = nx.DiGraph()
    colors = ['a', 'b', 'c']

    nodes = []
    for i in range(1, n + 1):
        nodes.append(f'v{i}') # convention: nodes' id is v_i

    for node in nodes:
        G.add_node(node, color=random.choice(colors))
    
    added_edges = 0
    while added_edges < m:
        u = random.choice(nodes)
        v = random.choice(nodes)
        if not G.has_edge(u, v):
            edge_color = random.choice(colors)
            # edges identified by source->target pairs
            G.add_edge(u, v, color=edge_color)
            added_edges += 1
    
    return G

# modification of a function above, parses a .json file to a NetworkX directed graph (used in file and draw mode)
def generate_nx_json(data):
    G = nx.DiGraph()

    for node in data.get('nodes', []):
        node_data = node.get('data', node)
        if 'id' not in node_data:
            raise ValueError('All nodes must have an id property')
        node_pos = node.get('position', None)
        G.add_node(node_data['id'], color=node_data.get('color', 'a'), position=node_pos)

    for edge in data.get('edges', []):
        edge_data = edge.get('data', edge)
        if 'source' not in edge_data or 'target' not in edge_data:
            raise ValueError("All edges must specify 'source' and 'target' nodes!")
        G.add_edge(edge_data['source'], edge_data['target'], color=edge_data.get('color', 'a'))

    vertices = G.number_of_nodes()
    edges= G.number_of_edges()
    max_edges = vertices * vertices
    if edges > max_edges:
        raise ValueError(f"Max edges number cannot be bigger than V*V!")
    if vertices == 0:
        raise ValueError("Graphs must contain at least one node!")

    return G

# parses nx.DiGraph() into cytoscape constructor format following these rules:
# graph must be a list called 'elements' and its keys must be dictionaries with 'data' as a key
# id is obligatory to a vertice, in edges we add a custom one
def parse_to_cytoscape(G):
    elements = []

    for node, data in G.nodes(data=True):
        node_dict = {
            'data': {
                'id': node,
                'color': data.get('color', 'a')
            }
        }
        if 'position' in data and data['position'] is not None:
            node_dict['position'] = data['position']
        elements.append(node_dict)

    for u, v, data in G.edges(data=True):
        elements.append({
           'data': {
               'id': f'{u}->{v}',
               'source': u,
               'target': v,
               'color': data.get('color', 'a')
           } 
        })
    
    return elements