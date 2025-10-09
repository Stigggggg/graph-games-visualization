import random

colors = [i for i in range(1,7)]

class Edge:
    def __init__(self, end1, end2, colors):
        self.end1 = end1
        self.end2 = end2
        self.colors = set(colors)


class Vertex:
    def __init__(self, id, colors):
        self.id = id
        self.colors = set(colors)
        self.edges = []
    
    def add_edge(self, edge):
        self.edges.append(edge)
    

class Graph:
    def __init__(self):
        self.V = {}
    
    def add_vertex(self, id, colors):
        if id not in self.V:
            self.V[id] = Vertex(id, colors)
    
    def add_edge(self, v1_id, v2_id, colors):
        v1 = self.V[v1_id]
        v2 = self.V[v2_id]
        edge = Edge(v1_id, v2_id, colors)
        v1.add_edge(edge)
        v2.add_edge(edge)

    def print_adjacency_list(self):
        for v_id, vertex in self.V.items():
            for e in vertex.edges:
                neigh = e.end1 if e.end2 == v_id else e.end2
                print(f"{v_id}: {neigh}, kolory krawędzi: {e.colors}, kolory końców: {self.V[e.end1].colors}, {self.V[e.end2].colors}")


# n - max liczba wierzchołków, m - max liczba krawędzi
def generate_random_graph(n, m):
    # if m >= n:
    #     raise ValueError('')
    g = Graph()
    num_vertices = random.randint(1, n)
    num_edges = random.randint(1, m)
    
    for i in range(num_vertices): 
        v_colors = set()
        num_colors = random.randint(1, 6)
        while len(v_colors) != num_colors:
            v_colors.add(random.choice(colors))
        g.add_vertex(i, v_colors)
    
    for i in range(num_edges):
        e_colors = set()
        num_colors = random.randint(1, 6)
        while len(e_colors) != num_colors:
            e_colors.add(random.choice(colors))
        # todo: krawędzie nie powinny się powtarzać
        end1_id, end2_id = random.randint(0, num_vertices - 1), random.randint(0, num_vertices - 1)
        if end1_id != end2_id:
            g.add_edge(end1_id, end2_id, e_colors)
    
    return g

g = Graph()
g.add_vertex("a", [1, 2, 3])
g.add_vertex("b", [4])
g.add_vertex("c", [5, 6])
g.add_edge("a", "b", [2])
g.add_edge("a", "c", [3, 4])
# g.print_adjacency_list()
test_graph = generate_random_graph(5, 4)
test_graph.print_adjacency_list()

# pytania:
# czym mają być kolory krawędzi i wierzchołków, ile maksymalnie może ich być,
# maksymalna liczba wierzchołków i krawędzi
# czy grafy proste, spójne, co z cyklami
# najpierw human vs human czy ai?
# wizualizacja grafów, jak to robić
    
