class Graph {
  constructor(directed, weighted) {
    this.directed = directed;
    this.weighted = weighted;
    this.nodes = {};
  }

  addEdge(source, destination, weight = 0) {
    if (!this.nodes[source]) {
      this.nodes[source] = [];
    }
    if (this.weighted) {
      this.nodes[source].push({ node: destination, weight });
    } else {
      this.nodes[source].push(destination);
    }
    if (!this.directed && source !== destination) {
      if (!this.nodes[destination]) {
        this.nodes[destination] = [];
      }
      if (this.weighted) {
        this.nodes[destination].push({ node: source, weight });
      } else {
        this.nodes[destination].push(source);
      }
    }
  }

  printGraph() {
    let output = '';
    for (const [node, edges] of Object.entries(this.nodes)) {
      if (this.weighted) {
        output += `${node} (${edges
          .map((edge) => `${edge.node}: ${edge.weight}`)
          .join(', ')})<br>`;
      } else {
        output += `${node} (${edges.join(' -> ')})<br>`;
      }
    }
    return output;
  }

  getNodes() {
    return Object.keys(this.nodes);
  }

  getAdjacencyList() {
    return this.nodes;
  }

  transpose() {
    const transposed = new Graph(this.directed, this.weighted);
    for (const [source, destinations] of Object.entries(this.nodes)) {
      for (const dest of destinations) {
        transposed.addEdge(
          dest.node || dest,
          source,
          this.weighted ? dest.weight : 0,
        );
      }
    }
    return transposed;
  }
}

let graph;

function startAddingEdges() {
  const graphType = document.getElementById('graphType').value;
  const directed = graphType === 'directedUnweighted';
  const weighted = graphType === 'undirectedWeighted';
  graph = new Graph(directed, weighted);

  const graphContainer = document.getElementById('graphContainer');
  graphContainer.innerHTML = '';

  function addEdge() {
    const source = prompt('Digite o nó de origem (ou 0 para parar):');
    if (source === '0') {
      graphContainer.innerHTML = 'Grafo resultante:<br>' + graph.printGraph();
      document.getElementById('algorithmsContainer').style.display = 'block';
      return;
    }

    const destination = prompt('Digite o nó de destino:');
    let weight = 0;
    if (weighted) {
      weight = parseInt(prompt('Digite o peso da aresta:'), 10);
    }
    graph.addEdge(source, destination, weight);

    addEdge();
  }

  addEdge();
}

function performTopologicalSort() {
  if (!graph || !graph.directed) {
    alert(
      'O grafo deve ser direcional não ponderado para realizar a ordenação topológica.',
    );
    return;
  }

  const nodes = graph.getNodes();
  const stack = [];
  const visited = new Set();
  const order = [];
  const discovery = {};
  const finish = {};

  let time = 0;

  function dfs(node) {
    visited.add(node);
    discovery[node] = ++time;
    const edges = graph.getAdjacencyList()[node];
    if (edges) {
      for (const edge of edges) {
        const nextNode = edge.node || edge;
        if (!visited.has(nextNode)) {
          dfs(nextNode);
        }
      }
    }
    finish[node] = ++time;
    stack.push(node);
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  const topologicalOrder = stack.reverse().join(' -> ');
  const discoveryFinishOrder = Object.entries(discovery)
    .map(([node]) => `${node} (${discovery[node]}/${finish[node]})`)
    .join(', ');

  alert(
    `Ordenação Topológica:\n${topologicalOrder}\n\nOrdem de Descoberta e Finalização:\n${discoveryFinishOrder}`,
  );
}

function findStronglyConnectedComponents() {
  if (!graph || !graph.directed) {
    alert(
      'O grafo deve ser direcional não ponderado para encontrar componentes fortemente conectados.',
    );
    return;
  }

  const transposeGraph = graph.transpose();
  const visited = new Set();
  const stack = [];
  const components = [];
  const discovery = {};
  const finish = {};

  let time = 0;

  // Primeira DFS no grafo original para preencher a pilha de finalização
  function dfs(graph, node, addToStack = false) {
    visited.add(node);
    discovery[node] = ++time;
    const edges = graph.getAdjacencyList()[node];
    if (edges) {
      for (const edge of edges) {
        const nextNode = edge.node || edge;
        if (!visited.has(nextNode)) {
          dfs(graph, nextNode, addToStack);
        }
      }
    }
    finish[node] = ++time;
    if (addToStack) {
      stack.push(node);
    }
  }

  // Executa a DFS no grafo original
  for (const node of graph.getNodes()) {
    if (!visited.has(node)) {
      dfs(graph, node, true);
    }
  }

  // Limpa o conjunto de visitados para reutilizar
  visited.clear();
  const stronglyConnectedComponents = [];

  // Coletar componente no grafo transposto
  function collectComponent(graph, node) {
    const component = [];
    function dfsCollect(graph, node) {
      visited.add(node);
      component.push(node);
      const edges = graph.getAdjacencyList()[node];
      if (edges) {
        for (const edge of edges) {
          const nextNode = edge.node || edge;
          if (!visited.has(nextNode)) {
            dfsCollect(graph, nextNode);
          }
        }
      }
    }
    dfsCollect(graph, node);
    return component;
  }

  // Segunda DFS no grafo transposto para encontrar SCCs
  while (stack.length) {
    const node = stack.pop();
    if (!visited.has(node)) {
      const component = collectComponent(transposeGraph, node);
      stronglyConnectedComponents.push(component);
    }
  }

  const componentsOutput = stronglyConnectedComponents
    .map((component) => `{${component.join(', ')}}`)
    .join(', ');
  const discoveryFinishOrder = Object.entries(discovery)
    .map(([node]) => `${node} (${discovery[node]}/${finish[node]})`)
    .join(', ');

  alert(
    `Componentes Fortemente Conectados:\n${componentsOutput}\n\nOrdem de Descoberta e Finalização:\n${discoveryFinishOrder}`,
  );
}

function performDijkstra() {
  if (!graph || !graph.weighted) {
    alert(
      'O grafo deve ser não direcional ponderado para realizar o algoritmo de Dijkstra.',
    );
    return;
  }

  const startNode = prompt('Digite o nó de início:');
  const endNode = prompt('Digite o nó de fim:');
  const distances = {};
  const prevNodes = {};
  const unvisitedNodes = new Set(graph.getNodes());

  for (const node of graph.getNodes()) {
    distances[node] = Infinity;
    prevNodes[node] = null;
  }
  distances[startNode] = 0;

  while (unvisitedNodes.size) {
    const currentNode = [...unvisitedNodes].reduce((closest, node) =>
      distances[node] < distances[closest] ? node : closest,
    );

    if (distances[currentNode] === Infinity) break;

    unvisitedNodes.delete(currentNode);

    const neighbors = graph.getAdjacencyList()[currentNode];
    if (neighbors) {
      for (const { node: neighbor, weight } of neighbors) {
        const tentativeDistance = distances[currentNode] + weight;
        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance;
          prevNodes[neighbor] = currentNode;
        }
      }
    }
  }

  const path = [];
  let node = endNode;
  while (node) {
    path.unshift(node);
    node = prevNodes[node];
  }

  const pathOutput = path.join(' -> ');
  const distanceOutput = distances[endNode];
  alert(
    `Caminho mais curto de ${startNode} a ${endNode}:\n${pathOutput}\n\nDistância: ${distanceOutput}`,
  );
}

function performAStar() {
  if (!graph || !graph.weighted) {
    alert(
      'O grafo deve ser não direcional ponderado para realizar o algoritmo A*.',
    );
    return;
  }

  const heuristic = (node1, node2) => {
    const [x1, y1] = node1.split(',').map(Number);
    const [x2, y2] = node2.split(',').map(Number);
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const startNode = prompt('Digite o nó de início:');
  const endNode = prompt('Digite o nó de fim:');
  const openList = new Set([startNode]);
  const closedList = new Set();
  const gScores = {};
  const fScores = {};
  const cameFrom = {};

  for (const node of graph.getNodes()) {
    gScores[node] = Infinity;
    fScores[node] = Infinity;
    cameFrom[node] = null;
  }
  gScores[startNode] = 0;
  fScores[startNode] = heuristic(startNode, endNode);

  while (openList.size) {
    const currentNode = [...openList].reduce((lowest, node) =>
      fScores[node] < fScores[lowest] ? node : lowest,
    );

    if (currentNode === endNode) {
      const path = [];
      let node = currentNode;
      while (node) {
        path.unshift(node);
        node = cameFrom[node];
      }
      alert(
        `Caminho mais curto de ${startNode} a ${endNode}:\n${path.join(
          ' -> ',
        )}`,
      );
      return;
    }

    openList.delete(currentNode);
    closedList.add(currentNode);

    const neighbors = graph.getAdjacencyList()[currentNode];
    if (neighbors) {
      for (const { node: neighbor, weight } of neighbors) {
        if (closedList.has(neighbor)) continue;

        const tentativeGScore = gScores[currentNode] + weight;
        if (!openList.has(neighbor)) {
          openList.add(neighbor);
        } else if (tentativeGScore >= gScores[neighbor]) {
          continue;
        }

        cameFrom[neighbor] = currentNode;
        gScores[neighbor] = tentativeGScore;
        fScores[neighbor] = gScores[neighbor] + heuristic(neighbor, endNode);
      }
    }
  }

  alert('Não foi possível encontrar um caminho.');
}
