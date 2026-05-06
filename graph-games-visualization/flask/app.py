import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
import uuid

app = Flask(__name__)
CORS(app)
games = {}

def generate_nx_graph(n, m):
    G = nx.DiGraph()
    colors = ['a', 'b', 'c']

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

def check_iso(g1, g2, moves_g1, moves_g2):
    for i in range(len(moves_g1)):
        u_i = moves_g1[i]
        v_i = moves_g2[i]

        if g1.nodes[u_i]['color'] != g2.nodes[v_i]['color']:
            return False, 'Different colors'
        
        for j in range(len(moves_g1)):
            u_j = moves_g1[j]
            v_j = moves_g2[j]
            has_edge_g1 = g1.has_edge(u_i, u_j)
            has_edge_g2 = g2.has_edge(v_i, v_j)
            if has_edge_g1 != has_edge_g2:
                return False, 'Difference in edges'
            if (u_i == u_j) != (v_i == v_j):
                return False, 'Equality error'
    
    return True, 'Duplicator survives'

def get_move(game):
    spoiler_graph = game['spoiler_choice_graph']
    if spoiler_graph == 'g1':
        ai_graph = 'g2'
    else: 
        ai_graph = 'g1'
    
    nodes = list(game[ai_graph].nodes())
    choice = random.choice(nodes)
    if ai_graph == 'g1':
        game['moves_g1'].append(choice)
    else:
        game['moves_g2'].append(choice)
    
    return choice, ai_graph

@app.route('/generate-ef', methods=['POST'])
def generate():
    data = request.json
    n = int(data.get('n'))
    m = int(data.get('m'))
    rounds = int(data.get('rounds', 3))
    mode = data.get('mode', 'human')
    max_edges = n * n
    if m > max_edges:
        return jsonify({'error': f'Error: for {n} maximum number of edges is {max_edges}'}), 400
    
    g1 = generate_nx_graph(n, m)
    g2 = generate_nx_graph(n, m)
    cyto_g1 = parse_to_cytoscape(g1)
    cyto_g2 = parse_to_cytoscape(g2)
    game_id = str(uuid.uuid4())
    games[game_id] = {
        'g1': g1,
        'g2': g2,
        'rounds': rounds,
        'current_round': 1,
        'moves_g1': [],
        'moves_g2': [],
        'turn': 'spoiler',
        'status': 'in progress',
        'mode': mode
    }

    return jsonify({'game_id': game_id, 'g1': cyto_g1, 'g2': cyto_g2})


@app.route('/move', methods=['POST'])
def move():
    data = request.json
    game_id = data.get('game_id')
    graph_id = data.get('graph_id')
    node_id = data.get('node_id')
    game = games.get(game_id)
    
    if not game or game['status'] != 'in progress':
        return jsonify({'error': 'Game has ended or does not exist'}), 400

    if game['turn'] == 'spoiler':
        # 1. Rejestrujemy ruch człowieka
        game['spoiler_choice_graph'] = graph_id
        if graph_id == 'g1':
            game['moves_g1'].append(node_id)
        else:
            game['moves_g2'].append(node_id)
            
        # --- 4. ZMIANA PRZEPŁYWU TUR DLA PvE ---
        if game['mode'] == 'ai':
            # AI gra natychmiast
            ai_node, ai_graph = get_move(game)
            
            # Od razu sprawdzamy kto wygrał rundę
            survives, message = check_iso(game['g1'], game['g2'], game['moves_g1'], game['moves_g2'])
            
            if not survives:
                game['status'] = 'spoiler_wins'
                return jsonify({
                    'status': 'game_over', 
                    'winner': 'spoiler', 
                    'reason': f"AI chose {ai_node} in {ai_graph}. {message}"
                })
                
            game['current_round'] += 1
            # Kolejna runda, więc ruch znów wraca do człowieka
            game['turn'] = 'spoiler' 
            
            if game['current_round'] > game['rounds']:
                game['status'] = 'duplicator_won'
                return jsonify({
                    'status': 'game_over', 
                    'winner': 'duplicator (AI)', 
                    'reason': f"AI chose {ai_node} in {ai_graph} and survived all rounds!"
                })
                
            return jsonify({
                'status': 'ok', 
                'message': f"AI matched with {ai_node} in {ai_graph}. Next round!"
            })
            
        # Jeśli tryb to PvP, działamy normalnie
        else:
            game['turn'] = 'duplicator'
            return jsonify({'status': 'ok', 'message': 'Waiting for duplicator to play'})
            
    elif game['turn'] == 'duplicator':
        # Zabezpieczenie: jeśli to tryb PvE, człowiek nie może tu wejść
        if game['mode'] == 'ai':
            return jsonify({'error': 'It is AI turn!'}), 400
            
        if graph_id == game['spoiler_choice_graph']:
            return jsonify({'error': 'Duplicator has to play the other graph'}), 400
            
        if graph_id == 'g1':
            game['moves_g1'].append(node_id)
        else:
            game['moves_g2'].append(node_id)
    
        survives, message = check_iso(game['g1'], game['g2'], game['moves_g1'], game['moves_g2'])
        if not survives:
            game['status'] = 'spoiler_wins'
            return jsonify({'status': 'game_over', 'winner': 'spoiler', 'reason': message})
            
        game['current_round'] += 1
        game['turn'] = 'spoiler'
        
        if game['current_round'] > game['rounds']:
            game['status'] = 'duplicator_won'
            return jsonify({'status': 'game_over', 'winner': 'duplicator', 'reason': 'Duplicator survived for all rounds'})
        
        return jsonify({'status': 'ok', 'message': 'Next round, waiting for spoiler to play'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

    