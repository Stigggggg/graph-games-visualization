import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx

app = Flask(__name__)
CORS(app)

def generate_nx_graph(n, m):
    G = nx.DiGraph()
    colors = ['a', 'b', 'c', 'd', 'e', 'f']

    nodes = []
    for i in range(1, n + 1):
        nodes.append(f'v{i}')
    for node in nodes:
        G.add_node(node, color=random.choice(colors))
    
    added_edges = 0
    while added_edges < m:
        u = random.choice(nodes)
        v = random.choice(nodes)
        if not G.has_edge(u, v):
            edge_color = random.choice(colors)
            G.add_edge(u, v, color=edge_color)
            added_edges += 1
    
    return G

def parse_to_cytoscape(G):
    elements = []

    for node, data in G.nodes(data=True):
        elements.append({'data': {'id': node, 'color': data['color']}})
    for u, v, data in G.edges(data=True):
        elements.append({
           'data': {
               'id': f'{u}->{v}',
               'source': u,
               'target': v,
               'color': data['color']
           } 
        })
    
    return elements

@app.route('/generate-ef', methods=['POST'])
def generate():
    data = request.json
    n = int(data.get('n'))
    m = int(data.get('m'))
    max_edges = n * n
    if m > max_edges:
        return jsonify({'error': f'Error: for {n} maximum number of edges is {max_edges}'}), 400
    
    g1 = generate_nx_graph(n, m)
    g2 = generate_nx_graph(n, m)
    cyto_g1 = parse_to_cytoscape(g1)
    cyto_g2 = parse_to_cytoscape(g2)

    return jsonify({'g1': cyto_g1, 'g2': cyto_g2})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

    