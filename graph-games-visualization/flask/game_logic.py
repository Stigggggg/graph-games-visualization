import random

# checks partial isomorphism for graphs in EF game after every turn of both Spoiler and Duplicator
def check_iso(g1, g2, moves_g1, moves_g2):
    for i in range(len(moves_g1)):
        u_i = moves_g1[i]
        v_i = moves_g2[i]
        color_g1 = g1.nodes[u_i]['color']
        color_g2 = g2.nodes[v_i]['color']

        # 1st condition of iso: unary relations (colors) must be preserved
        if color_g1 != color_g2:
            return False, f'Color mismatch, node {u_i} in G1 has different color than node {v_i} in G2.'
        
        for j in range(len(moves_g1)):
            u_j = moves_g1[j]
            v_j = moves_g2[j]
            has_edge_g1 = g1.has_edge(u_i, u_j)
            has_edge_g2 = g2.has_edge(v_i, v_j)

            # 2nd condition: binary relations (directed edge between selected nodes) must be preserved
            if has_edge_g1 and not has_edge_g2:
                return False, f'Structural mismatch, there is an edge from {u_i} to {u_j} in G1, but no corresponding edge from {v_i} to {v_j} in G2.'
            if not has_edge_g1 and has_edge_g2:
                return False, f'Structural mismatch, there is an edge from {v_i} to {v_j} in G2, but no corresponding edge from {u_i} to {u_j} in G1.'
            
            # 3rd condition: if one player reused a node, the second one has to do a similar move
            if (u_i == u_j) and (v_i != v_j): 
                return False, f'Equality error, node {u_i} was reused in G1.'
            if (u_i != u_j) and (v_i == v_j):
                return False, f'Equality error, node {v_i} was reused in G2.'
    
    return True, 'Isomorphism maintained! Duplicator matched the move successfully.'


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
        color_g1 = g1.nodes[u]['color']
        color_g2 = g2.nodes[v]['color']

        
        # 1st condition of iso: unary relations (colors under pebbles) must be preserved
        if color_g1 != color_g2:
            return False, f'Color mismatch, P{p_id} in G1 lies on a node with a different color than in G2.'
        
        for p_id2 in active_pebbles:
            u2 = p1[p_id2]
            v2 = p2[p_id2]
            has_edge_g1 = g1.has_edge(u, u2)
            has_edge_g2 = g2.has_edge(v, v2)
            
            # 2nd condition: binary relations (directed edge between selected nodes) must be preserved
            if has_edge_g1 and not has_edge_g2:
                return False, f'Structural mismatch, there is an edge between nodes under {p_id} and {p_id2} in G1, but no corresponding edge under these pebbles in G2.'
            if not has_edge_g1 and has_edge_g2:
                return False, f'Structural mismatch, there is an edge between nodes under {p_id} and {p_id2} in G2, but no corresponding edge under these pebbles in G1.'

            # 3rd condition: if one player reused a node, the second one has to do a similar move
            if (u == u2) and (v != v2): 
                return False, f'Equality error, P{p_id} and P{p_id2} are places on the same node in G1, but on different nodes in G2.'
            if (u != u2) and (v == v2):
                return False, f'Equality error, P{p_id} and P{p_id2} are places on the same node in G2, but on different nodes in G1.'
    
    return True, 'Isomorphism maintained! Duplicator matched the move successfully.'


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
            if spoiler_graph == 'g1' and spoiler_node in moves_g1:
                continue
            
            if spoiler_graph == 'g2' and spoiler_node in moves_g2:
                continue

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
                if d_graph == 'g1' and duplicator_node in next_move1:
                    continue
            
                if d_graph == 'g2' and duplicator_node in next_move2:
                    continue

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

def get_move(game):
    g1 = game['g1']
    g2 = game['g2']
    round = game['current_round']
    max_rounds = game['rounds']
    turn = game.get('turn', 'duplicator')

    if turn == 'spoiler':
        best_move = None
        best_graph = None

        for spoiler_graph_string in ['g1', 'g2']:
            if spoiler_graph_string == 'g1':
                spoiler_graph = g1
            else:
                spoiler_graph = g2
            
            spoiler_moves = game['moves_' + spoiler_graph_string]
            
            for v in spoiler_graph.nodes():
                if v in spoiler_moves:
                    continue
                
                test1 = list(game['moves_g1'])
                test2 = list(game['moves_g2'])

                if spoiler_graph_string == 'g1':
                    test1.append(v)
                else:
                    test2.append(v)
                
                can_duplicator_win = False
                
                if spoiler_graph_string == 'g1':
                    duplicator_graph_string = 'g2'
                else: 
                    duplicator_graph_string = 'g1'
                
                if duplicator_graph_string == 'g2':
                    duplicator_graph = g2
                    duplicator_moves = test2
                else: 
                    duplicator_graph = g1
                    duplicator_moves = test1
                
                for duplicator_v in duplicator_graph.nodes():
                    if duplicator_v in duplicator_moves:
                        continue

                    d_test1 = list(test1)
                    d_test2 = list(test2)

                    if duplicator_graph_string == 'g1':
                        d_test1.append(duplicator_v)
                    else:
                        d_test2.append(duplicator_v)
                    
                    survives, _ = check_iso(g1, g2, d_test1, d_test2)
                    if survives:
                        if duplicator_can_win(g1, g2, d_test1, d_test2, round, max_rounds):
                            can_duplicator_win = True
                            break
                
                if not can_duplicator_win:
                    best_move = v
                    best_graph = spoiler_graph_string
                    break
            
            if best_move is not None:
                break

        if best_move is None:
            best_graph = 'g1'
            possible = [n for n in g1.nodes() if n not in game['moves_g1']]
            if not possible:
                best_graph = 'g2'
                possible = [n for n in g2.nodes() if n not in game['moves_g2']]
            if possible:
                best_move = possible[0]
            else: 
                best_move = list(g1.nodes())[0]
        
        return best_move, best_graph

    else:
        spoiler_graph = game.get('spoiler_choice_graph', 'g1')
        if spoiler_graph == 'g1':
            ai_graph = 'g2'
        else:
            ai_graph = 'g1'
        ai_moves = game['moves_' + ai_graph]
        valid_moves = []
        best_move = None

        for v in game[ai_graph].nodes():
            if v in ai_moves:
                continue
            
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
                    last_move = game['moves_g1'][-1]
                else:
                    last_move = game['moves_g2'][-1]
            
                target_degree = game[spoiler_graph].degree[last_move]
                best_move = min(valid_moves, key=lambda n: abs(game[ai_graph].degree[n] - target_degree))
            else:
                possible = [n for n in game[ai_graph].nodes() if n not in ai_moves]
                if game['moves_g1'] and game['moves_g2']:
                    if spoiler_graph == 'g1':
                        last_move = game['moves_g1'][-1]
                    else:
                        last_move = game['moves_g2'][-1]
                    spoiler_color = game[spoiler_graph].nodes[last_move]['color']
                    same_color = [n for n in possible if game[ai_graph].nodes[n]['color'] == spoiler_color]
                    if same_color:
                        best_move = same_color[0]
                    else:
                        if possible:
                            best_move = possible[0]
                        else: 
                            best_move = list(game[ai_graph].nodes())[0]

        return best_move, ai_graph
                    
# pebbles AI agent
def get_pebble_move(game):
    g1 = game['g1'] 
    g2 = game['g2']
    p1 = game['pebbles_g1']
    p2 = game['pebbles_g2']
    turn = game.get('turn', 'duplicator')
    
    if turn == 'spoiler':
        best_node = None
        best_graph = None
        best_pebble = None
        k = game.get('k', 3)
        pebbles = [str(i) for i in range(1, k + 1)]
        
        # Spoiler testuje każdy kamyk i każdy węzeł, szukając szybkiej wygranej
        for s_graph_name in ['g1', 'g2']:
            s_graph = g1 if s_graph_name == 'g1' else g2
            for pebble_id in pebbles:
                for v in s_graph.nodes():
                    test_p1 = dict(p1) 
                    test_p2 = dict(p2)
                    
                    if s_graph_name == 'g1': test_p1[pebble_id] = v
                    else: test_p2[pebble_id] = v
                    
                    dup_can_survive = False
                    d_graph_name = 'g2' if s_graph_name == 'g1' else 'g1'
                    d_graph = g2 if d_graph_name == 'g2' else g1
                    
                    for dup_node in d_graph.nodes():
                        d_test_p1 = dict(test_p1)
                        d_test_p2 = dict(test_p2)
                        if d_graph_name == 'g1': d_test_p1[pebble_id] = dup_node
                        else: d_test_p2[pebble_id] = dup_node
                        
                        survives, _ = check_iso_pebbles(g1, g2, d_test_p1, d_test_p2)
                        if survives:
                            dup_can_survive = True
                            break
                    
                    if not dup_can_survive:
                        best_node = v
                        best_graph = s_graph_name
                        best_pebble = pebble_id
                        break
                if best_node is not None: break
            if best_node is not None: break
        
        # Jeśli Spoiler nie ma ruchu gwarantującego szybką wygraną (losowy wybór)
        if best_node is None:
            best_graph = 'g1'
            best_pebble = str(random.randint(1, k))
            best_node = random.choice(list(g1.nodes()))

        game['spoiler_choice_graph'] = best_graph
        game['current_pebble'] = best_pebble
        
        if best_graph == 'g1': game['pebbles_g1'][best_pebble] = best_node
        else: game['pebbles_g2'][best_pebble] = best_node
        
        return best_node, best_graph

    else:
        # LOGIKA DUPLIKATORA
        active_pebble = game['current_pebble']
        spoiler_graph = game['spoiler_choice_graph']
        ai_graph = 'g2' if spoiler_graph == 'g1' else 'g1'
        
        valid_moves = []
        best_move = None
        
        for v in game[ai_graph].nodes():
            test_p1 = dict(p1) 
            test_p2 = dict(p2)
            
            if ai_graph == 'g1': test_p1[active_pebble] = v
            else: test_p2[active_pebble] = v
            
            survives, _ = check_iso_pebbles(g1, g2, test_p1, test_p2)
            if survives:
                valid_moves.append(v)
        
        if valid_moves:
            last_spoiler = game['pebbles_g1'][active_pebble] if spoiler_graph == 'g1' else game['pebbles_g2'][active_pebble]
            target_degree = game[spoiler_graph].degree[last_spoiler]
            best_move = min(valid_moves, key=lambda n: abs(game[ai_graph].degree[n] - target_degree))
        else:
            # Desperacja - próba ratowania twarzy tym samym kolorem
            last_spoiler = game['pebbles_g1'][active_pebble] if spoiler_graph == 'g1' else game['pebbles_g2'][active_pebble]
            spoiler_color = game[spoiler_graph].nodes[last_spoiler]['color']
            same_color = [n for n in game[ai_graph].nodes() if game[ai_graph].nodes[n]['color'] == spoiler_color]
            best_move = same_color[0] if same_color else random.choice(list(game[ai_graph].nodes()))
        
        if ai_graph == 'g1': game['pebbles_g1'][active_pebble] = best_move
        else: game['pebbles_g2'][active_pebble] = best_move
        
        return best_move, ai_graph

    
    