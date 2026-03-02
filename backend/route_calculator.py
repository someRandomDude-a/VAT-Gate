import heapq
from functools import lru_cache
from db import NodeLink
from decimal import Decimal

GRAPH_CACHE = {}

def update_graph():
    # Invalidate the graph cache since the underlying data has changed
    global GRAPH_CACHE
    GRAPH_CACHE.clear()
    # Wipe lru_cache of dijkstra since the graph has changed
    route_calc.cache_clear()


def get_graph(weight_field):
    """
    Lazy loads the graph from the DB only if it's not already in memory.
    weight_field: 'time' or 'cost'
    """
    global GRAPH_CACHE

    if weight_field in GRAPH_CACHE:
        return GRAPH_CACHE[weight_field]

    print(f"Building {weight_field} graph from database...") # Debugging log
    links = NodeLink.query.all()
    
    new_graph = {}
    for link in links:
        # We build the adjacency list: Node -> [(Neighbor, Weight)]
        new_graph.setdefault(link.from_node_id, []).append(
            (link.to_node_id, getattr(link, weight_field))
        )
    
    GRAPH_CACHE[weight_field] = new_graph
    
    return new_graph

@lru_cache(maxsize=512)  # Cache results of route calculations for faster repeat queries
def route_calc(start_id, end_id, weight_field):
    """
    weight_field: "time" or "cost"
    """
    graph = {}

    links = NodeLink.query.all()
    for link in links:
        graph.setdefault(link.from_node_id, []).append(
            (link.to_node_id, getattr(link, weight_field))
        )

    queue = [(Decimal(0), start_id, [])]
    visited = set()

    while queue:
        total, current, path = heapq.heappop(queue)

        if current in visited:
            continue
        visited.add(current)

        path = path + [current]

        if current == end_id:
            return {
                "path": path,
                "total": float(total)
            }

        for neighbor, weight in graph.get(current, []):
            if neighbor not in visited:
                heapq.heappush(
                    queue,
                    (total + Decimal(weight), neighbor, path)
                )

    return None