from flask import Blueprint, request, jsonify
import uuid
import networkx as nx
from store import games
from graph_utils import generate_nx_graph, generate_nx_json, parse_to_cytoscape, build_custom_graph
from game_logic import check_iso_pebbles, get_pebble_move

pebbles_blueprint = Blueprint('pebbles_endpoints', __name__)

# endpoint that initializes a new pebbles game allocating the k-pebbles parameter
@pebbles_blueprint.route('/generate-pebbles', methods=['POST'])
def generate_pebbles():
    data = request.json
    k = int(data.get('k', 3))
    mode = data.get('mode', 'human')
    source = data.get('source', 'random')

   # choosing a method for generating graphs based on a game mode received from payload
    if source == 'random':
        if 'g1' in data and 'g2' in data:
            g1 = build_custom_graph(data['g1'])
            g2 = build_custom_graph(data['g2'])
        else:
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
        'current_pebble': None,
        'history': []
    }

    return jsonify({
        'game_id': game_id,
        'g1': cyto_g1,
        'g2': cyto_g2
    })

# pebbles game controller, handles state changes, triggers agents and evaluates win conditions
@pebbles_blueprint.route('/move-pebble', methods=['POST'])
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
            game['turn'] = 'duplicator'
            ai_node, ai_graph = get_pebble_move(game)
            survives, message = check_iso_pebbles(game['g1'], game['g2'], game['pebbles_g1'], game['pebbles_g2'])
            game['history'].append({
                'pebble_id': pebble_id,
                'g1_node': game['pebbles_g1'].get(pebble_id),
                'g2_node': game['pebbles_g2'].get(pebble_id)
            })

            if not survives:
                game['status'] = 'spoiler_won'
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

        if 'history' not in game:
            game['history'] = []

        game['history'].append({
            'pebble_id': pebble_id,
            'g1_node': game['pebbles_g1'].get(pebble_id),
            'g2_node': game['pebbles_g2'].get(pebble_id)
        })

        if not survives:
            game['status'] = 'spoiler_won'
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

# Pebbles analysis endpoint, tells which player has a winning strategy
# and makes an AI simulation of moves
@pebbles_blueprint.route('/analyze-pebbles', methods=['POST'])
def analyze_pebbles():
    data = request.json
    game_id = data.get('game_id')
    game = games.get(game_id)

    if not game:
        return jsonify({
            'error': 'Game not found'
        }), 400

    g1 = game['g1']
    g2 = game['g2']
    k = game.get('k', 3)
    is_iso = nx.is_isomorphic(g1, g2)

    if is_iso:
        winning = 'duplicator'
    else:
        winning = 'spoiler'

    user_history = game.get('history', [])
    rounds_played = len(user_history)
    total_rounds = max(rounds_played, k + 1)

    if game['status'] in ['spoiler_won', 'duplicator_won']:
        total_rounds = rounds_played

    history = []
    sim_game = {
        'g1': g1,
        'g2': g2,
        'k': k,
        'pebbles_g1': {},
        'pebbles_g2': {},
        'mode': 'ai',
        'status': 'in progress',
        'current_pebble': None,
        'spoiler_choice_graph': None
    }

    ai_survived = True

    for i in range(total_rounds):
        round_info = {
            'round': i + 1,
            'played_by_user': i < rounds_played
        }

        if i < rounds_played:
            user_move = user_history[i]
            round_info['g1_node'] = f"{user_move['g1_node']} (P{user_move['pebble_id']})"
            round_info['g2_node'] = f"{user_move['g2_node']} (P{user_move['pebble_id']})"

        if ai_survived:
            sim_game['turn'] = 'spoiler'
            ai_spoiler_node, ai_spoiler_graph = get_pebble_move(sim_game)
            sim_game['turn'] = 'duplicator'
            ai_duplicator_node, ai_duplicator_graph = get_pebble_move(sim_game)
            pebble_used = sim_game['current_pebble']

            if ai_spoiler_graph == 'g1':
                optimal_move_g1 = ai_spoiler_node
            else:
                optimal_move_g1 = ai_duplicator_node

            if ai_spoiler_graph == 'g2':
                optimal_move_g2 = ai_spoiler_node
            else:
                optimal_move_g2 = ai_duplicator_node

            round_info['optimal_g1'] = f"{optimal_move_g1} (P{pebble_used})"
            round_info['optimal_g2'] = f"{optimal_move_g2} (P{pebble_used})"
            survives, _ = check_iso_pebbles(g1, g2, sim_game['pebbles_g1'], sim_game['pebbles_g2'])

            if not survives:
                ai_survived = False
        else:
            round_info['optimal_g1'] = '-'
            round_info['optimal_g2'] = '-'

        history.append(round_info)

    cyto_g1 = parse_to_cytoscape(g1)
    cyto_g2 = parse_to_cytoscape(g2)

    return jsonify({
        'status': 'ok',
        'is_isomorphic': is_iso,
        'winning': winning,
        'rounds_played': rounds_played,
        'total_rounds': total_rounds,
        'history': history,
        'game_status': game['status'],
        'g1_elements': cyto_g1,
        'g2_elements': cyto_g2
    })