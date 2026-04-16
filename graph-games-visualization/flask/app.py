import random
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def generate_random_graph(n, m):
    colors = ['a', 'b', 'c', 'd', 'e', 'f']
    elements = []
    current_edges = set()
    added_edges = 0
    
    for i in range(1, n + 1):
        v_id = f'v{i}'
        color = random.choice(colors)
        elements.append({'data': {'id': v_id, 'color': color}})
    
    while added_edges < m:
        source_id = f'v{random.randint(1, n)}'
        target_id = f'v{random.randint(1, n)}'
        key = f'{source_id} -> {target_id}'
        if key in current_edges:
            continue
        edge_color = random.choice(colors)
        elements.append({'data': {'id': key, 'source': source_id, 'target': target_id, 'color': edge_color}})
        current_edges.add(key)
        added_edges += 1
    
    return elements

@app.route('/generate-ef', methods=['POST'])
def generate():
    data = request.json
    n = int(data.get('n'))
    m = int(data.get('m'))

    max_edges = n * n
    if (m > max_edges):
        return jsonify({'error': f'Error: for ${n} maximum number of edges is ${max_edges}'}), 400
    g1 = generate_random_graph(n, m)
    g2 = generate_random_graph(n, m)

    return jsonify({'g1': g1, 'g2': g2})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

    