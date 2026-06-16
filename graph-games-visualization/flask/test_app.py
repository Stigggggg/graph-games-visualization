import pytest
import networkx as nx
# Importujemy instancję naszej aplikacji i kluczowe funkcje z app.py
from app import app, generate_nx_json, check_iso

# 1. FIXTURE: Środowisko testowe dla zapytań HTTP
# Pozwala nam "udawać" przeglądarkę i uderzać na endpointy bez włączania serwera
@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

# --- TESTY LOGIKI BIZNESOWEJ (UNIT TESTS) ---

def test_generate_nx_json_missing_id():
    """Testuje, czy parser odrzuca grafy bez zdefiniowanego ID węzła."""
    invalid_data = {
        "nodes": [{"color": "a"}], # Brak klucza 'id'
        "edges": []
    }
    with pytest.raises(ValueError, match="id property"):
        generate_nx_json(invalid_data)

def test_check_iso_different_colors():
    """Testuje pierwszą regułę izomorfizmu: kolory wierzchołków muszą się zgadzać."""
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    
    g2 = nx.DiGraph()
    g2.add_node('u1', color='b') # Inny kolor
    
    survives, message = check_iso(g1, g2, ['v1'], ['u1'])
    
    assert survives is False
    assert message == 'Different colors'

def test_check_iso_equality_error():
    """Testuje trzecią regułę izomorfizmu: zakaz asymetrycznego ponownego użycia węzła."""
    g1 = nx.DiGraph()
    g1.add_node('v1', color='a')
    
    g2 = nx.DiGraph()
    g2.add_node('u1', color='a')
    g2.add_node('u2', color='a')
    
    # Spoiler wybiera 2x ten sam wierzchołek, a Duplikator wybiera dwa RÓŻNE
    survives, message = check_iso(g1, g2, ['v1', 'v1'], ['u1', 'u2'])
    
    assert survives is False
    assert 'Equality error' in message

# --- TESTY INTEGRACYJNE API (ENDPOINTS) ---

def test_generate_ef_too_many_edges(client):
    """
    Testuje zabezpieczenie matematyczne: API musi rzucić błąd 400, 
    jeśli m > V*V. Dla 3 wierzchołków maks to 9 krawędzi.
    """
    response = client.post('/generate-ef', json={
        "source": "random",
        "n": 3,
        "m": 10, # Błędna wartość, przekracza 3*3
        "mode": "human"
    })
    
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'maximum number of edges is 9' in data['error']

def test_generate_ef_success(client):
    """Testuje prawidłowe wygenerowanie nowej gry EF."""
    response = client.post('/generate-ef', json={
        "source": "random",
        "n": 3,
        "m": 4,
        "rounds": 5,
        "mode": "ai"
    })
    
    assert response.status_code == 200
    data = response.get_json()
    
    # Weryfikacja struktury odpowiedzi
    assert 'game_id' in data
    assert 'g1' in data
    assert 'g2' in data
    
    # Skoro podaliśmy n=3, g1 powinno mieć 3 wierzchołki. 
    # Cytoscape format dzieli wszystko na 'elements'. Sprawdzamy, czy wygenerowało dane.
    assert len(data['g1']) > 0

def test_move_invalid_game(client):
    """Testuje próbę wykonania ruchu w grze, która nie istnieje."""
    response = client.post('/move', json={
        "game_id": "nieistniejace-id",
        "graph_id": "g1",
        "node_id": "v1"
    })
    
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Game has ended or does not exist'