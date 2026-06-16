import pytest
import networkx as nx
from app import app, generate_nx_json, check_iso

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
    assert message == 'Different colors'

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
