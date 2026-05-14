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

def generate_nx_json(data):
    G = nx.DiGraph()
    for node in data.get('nodes', []):
        G.add_node(node['id'], color=node['color'])
    for edge in data.get('edges', []):
        G.add_edge(edge['source'], edge['target'], color=edge.get('color', 'a'))
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

def check_iso_pebbles(g1, g2, p1, p2):
    active_pebbles = [pid for pid in p1 if pid in p2]
    
    for pid in active_pebbles:
        u = p1[pid]
        v = p2[pid]
        if g1.nodes[u]['color'] != g2.nodes[v]['color']:
            return False, f'Different colors under pebble {pid}'
        for pid2 in active_pebbles:
            u2 = p1[pid2]
            v2 = p2[pid2]
            if g1.has_edge(u, u2) != g2.has_edge(v, v2):
                return False, f'Difference in edges between pebbles {pid} and {pid2}'
            if (u == u2) != (v == v2):
                return False, 'Equality error (two pebbles on one node, but not on the other)'

    return True, 'Duplicator survives'

def get_pebble_move(game):
    g1, g2 = game['g1'], game['g2']
    p1, p2 = game['pebbles_g1'], game['pebbles_g2']
    active_pebble = game['current_pebble']
    spoiler_graph = game['spoiler_choice_graph']
    if spoiler_graph == 'g1':
        ai_graph_str = 'g2'
    else:
        ai_graph_str = 'g1'
    if ai_graph_str == 'g1':
        ai_graph = g2
    else:
        ai_graph = g1
    valid_moves = []

    for v in ai_graph.nodes():
        test_p1, test_p2 = dict(p1), dict(p2)
        if ai_graph_str == 'g1': 
            test_p1[active_pebble] = v
        else: 
            test_p2[active_pebble] = v
        survives, _ = check_iso_pebbles(g1, g2, test_p1, test_p2)
        if survives:
            valid_moves.append(v)
    
    if valid_moves:
        best_move = random.choice(valid_moves)
    else:
        best_move = random.choice(list(ai_graph.nodes()))
    if ai_graph_str == 'g1':
        game['pebbles_g1'][active_pebble] = best_move
    else: 
        game['pebbles_g2'][active_pebble] = best_move
    
    return best_move, ai_graph_str

def get_move(game):
    spoiler_graph = game['spoiler_choice_graph']
    if spoiler_graph == 'g1':
        ai_graph = 'g2'
    else: 
        ai_graph = 'g1'
    
    g1 = game['g1']
    g2 = game['g2']
    round = game['current_round']
    max_rounds = game['rounds']
    valid_moves = []
    best_move = None

    for v in game[ai_graph].nodes():
        test1 = list(game['moves_g1'])
        test2 = list(game['moves_g2'])
        if ai_graph == 'g1':
            test1.append(v)
        else:
            test2.append(v)
        survives, _ = check_iso(g1, g2, test1, test2)
        if survives:
            valid_moves.append(v)
            if duplicator_can_win(g1, g2, test1, test2, round, max_rounds):
                best_move = v
                break
    if best_move is None:
        if valid_moves:
            if spoiler_graph == 'g1':
                last_spoiler = game['moves_g1'][-1]
            else:
                last_spoiler = game['moves_g2'][-1]
            target_degree = game[spoiler_graph].degree[last_spoiler]
            best_move = min(valid_moves, key=lambda n: abs(game[ai_graph].degree[n] - target_degree))
        else:
            best_move = random.choice(list(game[ai_graph].nodes()))

    if ai_graph == 'g1':
        game['moves_g1'].append(best_move)
    else:
        game['moves_g2'].append(best_move)
    
    return best_move, ai_graph

# currently AI, todo: rewrite during formatting
def duplicator_can_win(g1, g2, moves_g1, moves_g2, current_round, max_rounds):
    # Warunek stopu: udało się dotrwać do końca
    if current_round == max_rounds:
        return True
        
    # Symulacja ruchu Spoilera
    # Spoiler szuka chociaż jednego ruchu, który ZNISZCZY Duplikatora
    for spoiler_graph in ['g1', 'g2']:
        s_graph = g1 if spoiler_graph == 'g1' else g2
        for spoiler_node in s_graph.nodes():
            
            next_m1 = list(moves_g1)
            next_m2 = list(moves_g2)
            
            if spoiler_graph == 'g1':
                next_m1.append(spoiler_node)
            else:
                next_m2.append(spoiler_node)
                
            # Symulacja odpowiedzi Duplikatora
            d_graph_str = 'g2' if spoiler_graph == 'g1' else 'g1'
            d_graph = g2 if d_graph_str == 'g2' else g1
            
            found_response = False
            for dup_node in d_graph.nodes():
                test_m1 = list(next_m1)
                test_m2 = list(next_m2)
                
                if d_graph_str == 'g1':
                    test_m1.append(dup_node)
                else:
                    test_m2.append(dup_node)
                    
                # Czy ten hipotetyczny ruch jest legalny?
                survives, _ = check_iso(g1, g2, test_m1, test_m2)
                if survives:
                    # Jeśli tak, wchodzimy głębiej w drzewo (kolejna runda)
                    if duplicator_can_win(g1, g2, test_m1, test_m2, current_round + 1, max_rounds):
                        found_response = True
                        break # Znaleziono obronę na ten atak Spoilera!
                        
            # Jeśli Duplikator nie ma odpowiedzi na ten atak Spoilera, to strategia upada
            if not found_response:
                return False 
                
    # Jeśli Duplikator obronił się przed KAŻDYM hipotetycznym atakiem Spoilera
    return True

@app.route('/generate-ef', methods=['POST'])
def generate():
    data = request.json
    rounds = int(data.get('rounds', 3))
    mode = data.get('mode', 'human')
    source = data.get('source', 'random')

    if source == 'random':
        n = int(data.get('n'))
        m = int(data.get('m'))
        max_edges = n * n
        if m > max_edges:
            return jsonify({'error': f'Error: for {n} maximum number of edges is {max_edges}'}), 400
        g1 = generate_nx_graph(n, m)
        g2 = generate_nx_graph(n, m)
    elif source == 'file':
        custom_data = data.get('custom')
        if not custom_data or 'g1' not in custom_data or 'g2' not in custom_data:
            return jsonify({'error': 'Invalid JSON format.'}), 400
        g1 = generate_nx_json(custom_data['g1'])
        g2 = generate_nx_json(custom_data['g2'])
    else:
        return jsonify({'error': 'Unknown source.'}), 400
    
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
        game['spoiler_choice_graph'] = graph_id
        if graph_id == 'g1': game['moves_g1'].append(node_id)
        else: game['moves_g2'].append(node_id)
            
        if game['mode'] == 'ai':
            ai_node, ai_graph = get_move(game)
            survives, message = check_iso(game['g1'], game['g2'], game['moves_g1'], game['moves_g2'])
            
            if not survives:
                game['status'] = 'spoiler_wins'
                return jsonify({
                    'status': 'game_over', 
                    'winner': 'spoiler', 
                    'reason': f"AI chose {ai_node} in {ai_graph}. {message}",
                    'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
                })
                
            game['current_round'] += 1
            game['turn'] = 'spoiler' 
            
            if game['current_round'] > game['rounds']:
                game['status'] = 'duplicator_won'
                return jsonify({
                    'status': 'game_over', 
                    'winner': 'duplicator (AI)', 
                    'reason': f"AI chose {ai_node} in {ai_graph} and survived all rounds!",
                    'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
                })
                
            return jsonify({
                'status': 'ok', 
                'message': f"AI matched with {ai_node} in {ai_graph}. Next round!",
                'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
            })
            
        else:
            game['turn'] = 'duplicator'
            return jsonify({
                'status': 'ok', 'message': 'Waiting for duplicator to play',
                'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
            })
            
    elif game['turn'] == 'duplicator':
        if game['mode'] == 'ai': return jsonify({'error': 'It is AI turn!'}), 400
        if graph_id == game['spoiler_choice_graph']: return jsonify({'error': 'Duplicator has to play the other graph'}), 400
            
        if graph_id == 'g1': game['moves_g1'].append(node_id)
        else: game['moves_g2'].append(node_id)
    
        survives, message = check_iso(game['g1'], game['g2'], game['moves_g1'], game['moves_g2'])
        if not survives:
            game['status'] = 'spoiler_wins'
            return jsonify({
                'status': 'game_over', 'winner': 'spoiler', 'reason': message,
                'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
            })
            
        game['current_round'] += 1
        game['turn'] = 'spoiler'
        
        if game['current_round'] > game['rounds']:
            game['status'] = 'duplicator_won'
            return jsonify({
                'status': 'game_over', 'winner': 'duplicator', 'reason': 'Duplicator survived for all rounds',
                'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
            })
        
        return jsonify({
            'status': 'ok', 'message': 'Next round, waiting for spoiler to play',
            'moves_g1': game['moves_g1'], 'moves_g2': game['moves_g2']
        })

@app.route('/generate-pebbles', methods=['POST'])
def generate_pebbles():
    data = request.json
    k = int(data.get('k', 3))
    mode = data.get('mode', 'human')
    source = data.get('source', 'random')

    if source == 'random':
        n = int(data.get('n'))
        m = int(data.get('m'))
        if m > n * n:
            return jsonify({'error': 'Too many edges'}), 400
        g1, g2 = generate_nx_graph(n, m), generate_nx_graph(n, m)
    elif source == 'file':
        custom_data = data.get('custom')
        g1, g2 = generate_nx_json(custom_data['g1']), generate_nx_json(custom_data['g2'])

    game_id = str(uuid.uuid4())
    games[game_id] = {
        'type': 'pebbles',
        'g1': g1,
        'g2': g2,
        'k': k,
        'pebbles_g1': {},
        'pebbles_g2': {},
        'turn': 'spoiler',
        'status': 'in progress',
        'mode': mode,
        'current_pebble': None
    }

    return jsonify({'game_id': game_id, 'g1': parse_to_cytoscape(g1), 'g2': parse_to_cytoscape(g2)})

@app.route('/move-pebble', methods=['POST'])
def move_pebble():
    data = request.json
    game_id, graph_id, node_id, pebble_id = data.get('game_id'), data.get('graph_id'), data.get('node_id'), str(data.get('pebble_id'))
    game = games.get(game_id)
    
    if not game or game['status'] != 'in progress': return jsonify({'error': 'Game ended'}), 400

    if game['turn'] == 'spoiler':
        game['spoiler_choice_graph'] = graph_id
        game['current_pebble'] = pebble_id
        
        if graph_id == 'g1': game['pebbles_g1'][pebble_id] = node_id
        else: game['pebbles_g2'][pebble_id] = node_id
            
        if game['mode'] == 'ai':
            ai_node, ai_graph = get_pebble_move(game)
            survives, message = check_iso_pebbles(game['g1'], game['g2'], game['pebbles_g1'], game['pebbles_g2'])
            
            if not survives:
                game['status'] = 'spoiler_wins'
                return jsonify({'status': 'game_over', 'winner': 'spoiler', 'reason': message, 'p1': game['pebbles_g1'], 'p2': game['pebbles_g2']})
                
            game['turn'] = 'spoiler' 
            return jsonify({'status': 'ok', 'message': f"AI placed pebble {pebble_id} on {ai_node}.", 'p1': game['pebbles_g1'], 'p2': game['pebbles_g2']})
            
        else:
            game['turn'] = 'duplicator'
            return jsonify({'status': 'ok', 'message': 'Waiting for duplicator', 'p1': game['pebbles_g1'], 'p2': game['pebbles_g2']})
            
    elif game['turn'] == 'duplicator':
        if game['mode'] == 'ai': return jsonify({'error': 'AI turn!'}), 400
        if graph_id == game['spoiler_choice_graph']: return jsonify({'error': 'Play on the other graph'}), 400
        if pebble_id != game['current_pebble']: return jsonify({'error': f'You must use pebble {game["current_pebble"]}'}), 400
            
        if graph_id == 'g1': game['pebbles_g1'][pebble_id] = node_id
        else: game['pebbles_g2'][pebble_id] = node_id
    
        survives, message = check_iso_pebbles(game['g1'], game['g2'], game['pebbles_g1'], game['pebbles_g2'])
        if not survives:
            game['status'] = 'spoiler_wins'
            return jsonify({'status': 'game_over', 'winner': 'spoiler', 'reason': message, 'p1': game['pebbles_g1'], 'p2': game['pebbles_g2']})
            
        game['turn'] = 'spoiler'
        return jsonify({'status': 'ok', 'message': 'Waiting for spoiler', 'p1': game['pebbles_g1'], 'p2': game['pebbles_g2']})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

    