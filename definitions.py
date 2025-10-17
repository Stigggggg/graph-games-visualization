import random

colors = [i for i in range(1,7)]

class Edge:
    def __init__(self, end1, end2, colors):
        self.end1 = end1 # stąd wychodzi
        self.end2 = end2 # tu wchodzi
        self.colors = set(colors)


class Vertex:
    def __init__(self, id, colors):
        self.id = id
        self.colors = set(colors)
        self.edges_out = [] # wychodzące
        self.edges_in = [] # wchodzące
    
    def add_out_edge(self, edge):
        self.edges_out.append(edge)
    
    def add_in_edge(self, edge):
        self.edges_in.append(edge)
    
class Graph:
    def __init__(self):
        self.V = {}
        self.edges = set() # etykieta: wierzchołek wyjścia, wejścia, kolory
    
    def add_vertex(self, id, colors):
        if id not in self.V:
            self.V[id] = Vertex(id, colors)
    
    def add_edge(self, v1_id, v2_id, colors):
        edge_parameters = (v1_id, v2_id, frozenset(colors))
        if edge_parameters not in self.edges: # cała etykieta nie może się powtórzyć
            self.edges.add(edge_parameters)
            v1 = self.V[v1_id]
            v2 = self.V[v2_id]
            edge = Edge(v1_id, v2_id, colors)
            v1.add_out_edge(edge)
            v2.add_in_edge(edge)

    def print_adjacency_list(self):
        for v_id, vertex in self.V.items():
            print(f"\nWierzchołek {v_id} (kolory: {vertex.colors}):")
            print("Wychodzące: ")
            for e in vertex.edges_out:
                print(f"{e.end2}  (kolory krawędzi: {e.colors}, kolory celu: {self.V[e.end2].colors})")
            print("Wchodzące: ")
            for e in vertex.edges_in:
                print(f"{e.end1}  (kolory krawędzi: {e.colors}, kolory źródła: {self.V[e.end1].colors})")
                
# n - max liczba wierzchołków, m - max liczba krawędzi
def generate_random_graph(n, m):
    g = Graph()
    num_vertices = random.randint(1, n)
    num_edges = random.randint(1, m)
    
    for i in range(num_vertices): 
        v_colors = set(random.sample(colors, random.randint(1, 6)))
        g.add_vertex(i, v_colors)
    
    if num_vertices < 1:
        return g
    
    added = set()
    possible = list(g.V.keys())
    tries = 0
    max_tries = 1000

    while len(added) < num_edges and tries < max_tries:
        tries += 1
        e_colors = set(random.sample(colors, random.randint(1, 6)))
        end1_id, end2_id = random.choice(possible), random.choice(possible)
        edge_signature = (end1_id, end2_id, frozenset(e_colors))
        if edge_signature not in added:
            added.add(edge_signature)
            g.add_edge(end1_id, end2_id, e_colors)

    return g


# g = Graph()
# g.add_vertex("a", [1, 2, 3])
# g.add_vertex("b", [4])
# g.add_vertex("c", [5, 6])
# g.add_edge("a", "b", [2])
# g.add_edge("a", "c", [3, 4])
test_graph = generate_random_graph(5, 4)
test_graph.print_adjacency_list()
    
