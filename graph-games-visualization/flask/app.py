import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
import uuid

app = Flask(__name__)
CORS(app)
games = {}

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

    V = G.number_of_nodes()
    E = G.number_of_edges()
    max_edges = V * V
    if E > max_edges:
        raise ValueError(f"Max edges number cannot be bigger than V*V!")
    if V == 0:
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

# checks partial isomorphism for graphs in EF game after every turn of both Spoiler and Duplicator
def check_iso(g1, g2, moves_g1, moves_g2):
    for i in range(len(moves_g1)):
        u_i = moves_g1[i]
        v_i = moves_g2[i]

        # 1st condition of iso: unary relations (colors) must be preserved
        if g1.nodes[u_i]['color'] != g2.nodes[v_i]['color']:
            return False, 'Different colors'
        
        for j in range(len(moves_g1)):
            u_j = moves_g1[j]
            v_j = moves_g2[j]
            has_edge_g1 = g1.has_edge(u_i, u_j)
            has_edge_g2 = g2.has_edge(v_i, v_j)

            # 2nd condition: binary relations (directed edge between selected nodes) must be preserved
            if has_edge_g1 != has_edge_g2:
                return False, 'Difference in edges'
            
            # 3rd condition: if one player reused a node, the second one has to do a similar move
            if (u_i == u_j) and (v_i != v_j): 
                return False, 'Equality error, G1 reused a node'
            if (u_i != u_j) and (v_i == v_j):
                return False, 'Equality error, G2 reused a node'
    
    return True, 'Duplicator survives'

# validates partial isomorphism with pebbles laying on vertices
# p1 and p2 are dictionaries {pebble_number: node_id}
def check_iso_pebbles(g1, g2, p1, p2):
    active_pebbles = []

    for p_id in p1:
        if p_id in p2:
            active_pebbles.append(p_id)
    
    for p_id in active_pebbles:
        u = p1[p_id]
        v = p2[p_id]
        
        # 1st condition of iso: unary relations (colors under pebbles) must be preserved
        if g1.nodes[u]['color'] != g2.nodes[v]['color']:
            return False, f'Different colors under pebble {p_id}'
        
        for p_id2 in active_pebbles:
            u2 = p1[p_id2]
            v2 = p2[p_id2]
            
            # 2nd condition: binary relations (directed edge between selected nodes) must be preserved
            if g1.has_edge(u, u2) != g2.has_edge(v, v2):
                return False, f'Difference in edges between pebbles {p_id} and {p_id2}'
           
            # 3rd condition: if one player reused a node, the second one has to do a similar move
            if (u == u2) and (v != v2): 
                return False, 'Equality error, G1 put more pebbles on a node'
            if (u != u2) and (v == v2):
                return False, 'Equality error, G2 put more pebbles on a node'
    
    return True, 'Duplicator survives'

# pebbles AI agent
def get_pebble_move(game):
    # pulling state from game object
    g1 = game['g1'] 
    g2 = game['g2']
    p1 = game['pebbles_g1']
    p2 = game['pebbles_g2']
    active_pebble = game['current_pebble']
    spoiler_graph = game['spoiler_choice_graph']
    # choosing which graph will AI play in current turn
    
    if spoiler_graph == 'g1':
        ai_graph = 'g2'
    else:
        ai_graph = 'g1'
    
    valid_moves = []
    best_move = None

    # greedy approach to survive the current round
    for v in game[ai_graph].nodes():
        test_p1 = dict(p1) 
        test_p2 = dict(p2)
        
        if ai_graph == 'g1': 
            test_p1[active_pebble] = v
        else: 
            test_p2[active_pebble] = v
        
        survives, _ = check_iso_pebbles(g1, g2, test_p1, test_p2)
        
        if survives:
            valid_moves.append(v)
    
    # randomly choosing best move from valid list 
    if valid_moves:
        best_move = random.choice(valid_moves)
    else:
        best_move = random.choice(list(game[ai_graph].nodes()))
    
    # adding that as a move to pebbles dictionary
    if ai_graph == 'g1':
        game['pebbles_g1'][active_pebble] = best_move
    else: 
        game['pebbles_g2'][active_pebble] = best_move
    
    return best_move, ai_graph

# EF game AI agent
def get_move(game):
    # pulling state from game object
    g1 = game['g1']
    g2 = game['g2']
    round = game['current_round']
    max_rounds = game['rounds']
    spoiler_graph = game['spoiler_choice_graph']
    # choosing which graph will AI play in current turn
    if spoiler_graph == 'g1':
        ai_graph = 'g2'
    else: 
        ai_graph = 'g1'
    
    valid_moves = []
    best_move = None

    # testing all possible moves, using minimax to choose best one
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
    
    # mitigating combinatoric explosion by selecting a node with the closest degree matching the Spoiler's move
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

    # adding that as a move to the history list
    if ai_graph == 'g1':
        game['moves_g1'].append(best_move)
    else:
        game['moves_g2'].append(best_move)
    
    return best_move, ai_graph

def duplicator_can_win(g1, g2, moves_g1, moves_g2, current_round, max_rounds):
    # if duplicator lasted all rounds, he wins
    if current_round == max_rounds:
        return True
    
    # recursively looking for an answer to all possible Spoiler moves
    for spoiler_graph in ['g1', 'g2']:
        if spoiler_graph == 'g1':
            s_graph = g1
        else: 
            s_graph = g2

        # simulation of next spoiler and duplicator moves
        for spoiler_node in s_graph.nodes():
            next_move1 = list(moves_g1)
            next_move2 = list(moves_g2)
            
            if spoiler_graph == 'g1':
                next_move1.append(spoiler_node)
            else:
                next_move2.append(spoiler_node)

            if spoiler_graph == 'g1':
                d_graph = g2
            else:
                d_graph = g1

            solution = False
            
            # we know the Spoiler move so we look for best Duplicator answer
            for duplicator_node in d_graph.nodes():
                test_move1 = list(next_move1)
                test_move2 = list(next_move2)

                if d_graph == g1:
                    test_move1.append(duplicator_node)
                else:
                    test_move2.append(duplicator_node)

                survives, _ = check_iso(g1, g2, test_move1, test_move2)
                
                if survives:
                    if duplicator_can_win(g1, g2, test_move1, test_move2, current_round + 1, max_rounds):
                        solution = True
                        break

            if not solution:
                return False
    
    return True

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
