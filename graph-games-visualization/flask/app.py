from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from graph_utils import generate_nx_graph, generate_nx_json, parse_to_cytoscape
from game_logic import check_iso, check_iso_pebbles, get_move, get_pebble_move

app = Flask(__name__)
CORS(app)
games = {}

# endpoint that initializes a new EF game and sets up random or file mode data
@app.route('/generate-ef', methods=['POST'])
def generate():
    data = request.json
    rounds = int(data.get('rounds', 3))
    mode = data.get('mode', 'human')
    source = data.get('source', 'random')

    # choosing a method for generating graphs based on a game mode received from payload
    if source == 'random':
        n = int(data.get('n'))
        m = int(data.get('m'))
        max_edges = n * n
        
        if m > max_edges:
            return jsonify({
                'error': f'Error: for {n} maximum number of edges is {max_edges}'
            }), 400
        
        g1 = generate_nx_graph(n, m)
        g2 = generate_nx_graph(n, m)
    
    elif source == 'file':
        custom_data = data.get('custom')
        
        if not custom_data or 'g1' not in custom_data or 'g2' not in custom_data:
            return jsonify({
                'error': 'Invalid JSON format.'
            }), 400
        
        try:
            g1 = generate_nx_json(custom_data['g1'])
            g2 = generate_nx_json(custom_data['g2'])
        except ValueError as e:
            return jsonify({
                'error': str(e)
            }), 400

    else:
        return jsonify({
            'error': 'Unknown source.'
        }), 400
    
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

    return jsonify({
        'game_id': game_id, 
        'g1': cyto_g1, 
        'g2': cyto_g2
    })

# endpoint that initializes a new pebbles game allocating the k-pebbles parameter
@app.route('/generate-pebbles', methods=['POST'])
def generate_pebbles():
    data = request.json
    k = int(data.get('k', 3))
    mode = data.get('mode', 'human')
    source = data.get('source', 'random')

   # choosing a method for generating graphs based on a game mode received from payload
    if source == 'random':
        n = int(data.get('n'))
        m = int(data.get('m'))
        max_edges = n * n
        
        if m > max_edges:
            return jsonify({
                'error': f'Error: for {n} maximum number of edges is {max_edges}'
            }), 400
        
        g1 = generate_nx_graph(n, m)
        g2 = generate_nx_graph(n, m)
    
    elif source == 'file':
        custom_data = data.get('custom')
        
        if not custom_data or 'g1' not in custom_data or 'g2' not in custom_data:
            return jsonify({
                'error': 'Invalid JSON format.'
            }), 400
        
        try:
            g1 = generate_nx_json(custom_data['g1'])
            g2 = generate_nx_json(custom_data['g2'])
        except ValueError as e:
            return jsonify({
                'error': str(e)
            }), 400

    else:
        return jsonify({
            'error': 'Unknown source.'
        }), 400
    
    cyto_g1 = parse_to_cytoscape(g1)
    cyto_g2 = parse_to_cytoscape(g2)
    game_id = str(uuid.uuid4())
    games[game_id] = {
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

    return jsonify({
        'game_id': game_id, 
        'g1': cyto_g1, 
        'g2': cyto_g2
    })

# EF game controller, handles state changes, triggers agents and evaluates win conditions
@app.route('/move', methods=['POST'])
def move():
    data = request.json
    game_id = data.get('game_id')
    graph_id = data.get('graph_id')
    node_id = data.get('node_id')
    game = games.get(game_id)
    
    if not game or game['status'] != 'in progress':
        return jsonify({
            'error': 'Game has ended or does not exist'
        }), 400

    if game['turn'] == 'spoiler':

        game['spoiler_choice_graph'] = graph_id

        if graph_id == 'g1': 
            game['moves_g1'].append(node_id)
        else: 
            game['moves_g2'].append(node_id)
            
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
                    'moves_g1': game['moves_g1'], 
                    'moves_g2': game['moves_g2']
                })
                
            return jsonify({
                'status': 'ok', 
                'message': f"AI matched with {ai_node} in {ai_graph}. Next round!",
                'moves_g1': game['moves_g1'], 
                'moves_g2': game['moves_g2']
            })
            
        else:
            game['turn'] = 'duplicator'
            return jsonify({
                'status': 'ok', 'message': 'Waiting for duplicator to play',
                'moves_g1': game['moves_g1'], 
                'moves_g2': game['moves_g2']
            })
            
    elif game['turn'] == 'duplicator':
        if game['mode'] == 'ai': 
            return jsonify({
                'error': 'It is AI turn!'
            }), 400
        if graph_id == game['spoiler_choice_graph']: 
            return jsonify({
                'error': 'Duplicator has to play the other graph'
            }), 400
            
        if graph_id == 'g1': 
            game['moves_g1'].append(node_id)
        else: 
            game['moves_g2'].append(node_id)
    
        survives, message = check_iso(game['g1'], game['g2'], game['moves_g1'], game['moves_g2'])
        
        if not survives:
            game['status'] = 'spoiler_wins'
            return jsonify({
                'status': 'game_over', 
                'winner': 'spoiler', 
                'reason': message,
                'moves_g1': game['moves_g1'], 
                'moves_g2': game['moves_g2']
            })
            
        game['current_round'] += 1
        game['turn'] = 'spoiler'
        
        if game['current_round'] > game['rounds']:
            game['status'] = 'duplicator_won'
            return jsonify({
                'status': 'game_over', 
                'winner': 'duplicator', 
                'reason': 'Duplicator survived for all rounds',
                'moves_g1': game['moves_g1'], 
                'moves_g2': game['moves_g2']
            })
        
        return jsonify({
            'status': 'ok', 
            'message': 'Next round, waiting for spoiler to play',
            'moves_g1': game['moves_g1'], 
            'moves_g2': game['moves_g2']
        })

# pebbles game controller, handles state changes, triggers agents and evaluates win conditions
@app.route('/move-pebble', methods=['POST'])
def move_pebble():
    data = request.json
    game_id = data.get('game_id')
    graph_id = data.get('graph_id')
    node_id = data.get('node_id') 
    pebble_id = str(data.get('pebble_id'))
    game = games.get(game_id)
    
    if not game or game['status'] != 'in progress': 
        return jsonify({
            'error': 'Game ended'
        }), 400

    if game['turn'] == 'spoiler':
        game['spoiler_choice_graph'] = graph_id
        game['current_pebble'] = pebble_id
        
        if graph_id == 'g1': 
            game['pebbles_g1'][pebble_id] = node_id
        else: 
            game['pebbles_g2'][pebble_id] = node_id
            
        if game['mode'] == 'ai':
            ai_node, ai_graph = get_pebble_move(game)
            survives, message = check_iso_pebbles(game['g1'], game['g2'], game['pebbles_g1'], game['pebbles_g2'])
            
            if not survives:
                game['status'] = 'spoiler_wins'
                return jsonify({
                    'status': 'game_over', 
                    'winner': 'spoiler', 
                    'reason': message, 
                    'p1': game['pebbles_g1'], 
                    'p2': game['pebbles_g2']
                })
                
            game['turn'] = 'spoiler' 
            return jsonify({
                'status': 'ok', 
                'message': f"AI placed pebble {pebble_id} on {ai_node}.", 
                'p1': game['pebbles_g1'], 
                'p2': game['pebbles_g2']
            })
            
        else:
            game['turn'] = 'duplicator'
            return jsonify({
                'status': 'ok', 
                'message': 'Waiting for duplicator', 
                'p1': game['pebbles_g1'], 
                'p2': game['pebbles_g2']
            })
            
    elif game['turn'] == 'duplicator':
        if game['mode'] == 'ai': 
            return jsonify({
                'error': 'AI turn!'
            }), 400
        
        if graph_id == game['spoiler_choice_graph']: 
            return jsonify({
                'error': 'Play on the other graph'
            }), 400
        
        if pebble_id != game['current_pebble']: 
            return jsonify({
                'error': f'You must use pebble {game["current_pebble"]}'
            }), 400
            
        if graph_id == 'g1': 
            game['pebbles_g1'][pebble_id] = node_id
        else: 
            game['pebbles_g2'][pebble_id] = node_id
    
        survives, message = check_iso_pebbles(game['g1'], game['g2'], game['pebbles_g1'], game['pebbles_g2'])
        
        if not survives:
            game['status'] = 'spoiler_wins'
            return jsonify({
                'status': 'game_over', 
                'winner': 'spoiler', 
                'reason': message, 
                'p1': game['pebbles_g1'], 
                'p2': game['pebbles_g2']
            })
            
        game['turn'] = 'spoiler'
        return jsonify({
            'status': 'ok', 
            'message': 'Waiting for spoiler', 
            'p1': game['pebbles_g1'], 
            'p2': game['pebbles_g2']
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
