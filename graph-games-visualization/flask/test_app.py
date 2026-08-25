import pytest
import networkx as nx
from app import app, generate_nx_json, check_iso, check_iso_pebbles, get_move, games

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_missing_id_json():
    invalid_data = {
        "nodes": [{"color": "a"}],
        "edges": []
    }
    with pytest.raises(ValueError, match="id property"):
        generate_nx_json(invalid_data)

def test_different_colors():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='b')
    survives, message = check_iso(g1, g2, ['v1'], ['u1'])
    assert survives is False
    assert message == 'Color mismatch, node v1 in G1 has different color than node u1 in G2.'

def test_equality_error():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='a')
    survives, message = check_iso(g1, g2, ['v1', 'v1'], ['u1', 'u2'])
    assert survives is False
    assert 'Equality error' in message

def test_too_many_edges(client):
    response = client.post('/generate-ef', json={
        "source": "random",
        "n": 3,
        "m": 10,
        "mode": "human"
    })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'maximum number of edges is 9' in data['error']

def test_success_generate_ef(client):
    response = client.post('/generate-ef', json={
        "source": "random",
        "n": 3,
        "m": 4,
        "rounds": 5,
        "mode": "ai"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'game_id' in data
    assert 'g1' in data
    assert 'g2' in data
    assert len(data['g1']) > 0

def test_no_game(client):
    response = client.post('/move', json={
        "game_id": "dsdfdsfsdf",
        "graph_id": "g1",
        "node_id": "v1"
    })
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Game has ended or does not exist'

def test_missing_edge():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g1.add_node('v2', color='a')
    g1.add_edge('v1', 'v2')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='a')
    survives, message = check_iso(g1, g2, ['v1', 'v2'], ['u1', 'u2'])
    assert survives is False
    assert 'Structural mismatch' in message

def test_iso_maintained():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g1.add_node('v2', color='b')
    g1.add_edge('v1', 'v2')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='b')
    g2.add_edge('u1', 'u2')
    survives, message = check_iso(g1, g2, ['v1', 'v2'], ['u1', 'u2'])
    assert survives is True
    assert 'Isomorphism maintained' in message

def test_pebbles_mismatch():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g1.add_node('v2', color='a')
    g1.add_edge('v1', 'v2')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='a')
    p1 = {'1': 'v1', '2': 'v2'}
    p2 = {'1': 'u1', '2': 'u2'}
    survives, message = check_iso_pebbles(g1, g2, p1, p2)
    assert survives is False
    assert 'Structural mismatch' in message

def test_success_generate_pebbles(client):
    response = client.post('/generate-pebbles', json={
        'source': 'random',
        'n': 4,
        'm': 3,
        'mode': 'human'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'game_id' in data
    assert 'g1' in data
    assert 'g2' in data

def test_different_pebbles_used(client):
    game_id = "test-game-id"
    games[game_id] = {
        'g1': nx.DiGraph(),
        'g2': nx.DiGraph(),
        'k': 3,
        'pebbles_g1': {'1': 'v1'},
        'pebbles_g2': {},
        'turn': 'duplicator',
        'status': 'in progress',
        'current_pebble': '1',
        'spoiler_choice_graph': 'g1',
        'mode': 'human'
    }
    response = client.post('/move-pebble', json={
        'game_id': game_id,
        'graph_id': 'g2',
        'node_id': 'u1',
        'pebble_id': 2
    })
    assert response.status_code == 400
    assert 'You must use pebble 1' in response.get_json()['error']

def test_ai_spoiler_best_move():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g1.add_node('v2', color='c')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='b')
    game = {
        'g1': g1,
        'g2': g2,
        'current_round': 1,
        'rounds': 1,
        'turn': 'spoiler',
        'moves_g1': [],
        'moves_g2': []
    }
    best_move, best_graph = get_move(game)
    assert best_move == 'v2'
    assert best_graph == 'g1'

def test_duplicator_color_pick():
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g1.add_node('v2', color='b')
    g1.add_edge('v1', 'v2')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='b')
    game = {
        'g1': g1,
        'g2': g2,
        'current_round': 2,
        'rounds': 3,
        'turn': 'duplicator',
        'spoiler_choice_graph': 'g1',
        'moves_g1': ['v1', 'v2'],
        'moves_g2': ['u1']
    }
    best_move, best_graph = get_move(game)
    assert best_move == 'u2'

def test_game_analysis(client):
    game_id = 'test-analysis-id'
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    g1.add_node('v2', color='b')
    g1.add_node('v3', color='c')
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='b')
    g2.add_node('u3', color='c')
    games[game_id] = {
        'g1': g1,
        'g2': g2,
        'rounds': 3,
        'status': 'duplicator_won',
        'moves_g1': ['v1'],
        'moves_g2': ['u1']
    }
    response = client.post('/analyze-ef', json={
        'game_id': game_id
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['is_isomorphic'] is True
    assert data['winning'] == 'duplicator'
    assert len(data['history']) == 3