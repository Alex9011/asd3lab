import createRandomMatrix from "./matrix.js";
import buildAdjacencyMatrix from "./dirMatrix.js";

try {
  const n1 = 5;
  const n2 = 5;
  const n3 = 1;
  const n4 = 6;

  const variant = n1 * 1000 + n2 * 100 + n3 * 10 + n4;
  const vertexCount = 10 + n3;
  const k = 1.0 - n3 * 0.01 - n4 * 0.005 - 0.05;

  const layout = {
    centerX: 450,
    centerY: 300,
    radius: 230,
  };

  const baseMatrix = createRandomMatrix(vertexCount, variant);
  const directedAdj = buildAdjacencyMatrix(baseMatrix, k);
  const undirectedAdj = buildUndirectedAdjacency(directedAdj);
  const randomWeights = createRandomMatrix(vertexCount, variant);
  const weightMatrix = buildWeightMatrix(randomWeights, undirectedAdj);
  const positions = buildCircleWithCenter(
    vertexCount,
    layout.centerX,
    layout.centerY,
    layout.radius,
  );

  const edges = collectEdges(weightMatrix, undirectedAdj);
  const sortedEdges = [...edges].sort(sortEdges);

  const state = {
    stepper: null,
    edges: sortedEdges,
  };

  renderMatrixTable(undirectedAdj, "adjMatrix", true);
  renderMatrixTable(weightMatrix, "weightMatrix", false);
  renderSortedEdges(sortedEdges);
  renderProtocol([]);
  updateRunLabel("Готово до запуску");
  updateCurrentEdge(null, null);
  updateMstResults([], 0);
  drawGraph(undirectedAdj, weightMatrix, positions, layout, state);

  const startButton = document.getElementById("startKruskal");
  const nextStepButton = document.getElementById("nextStep");
  const resetButton = document.getElementById("resetRun");

  startButton.addEventListener("click", () => startAlgorithm());
  nextStepButton.addEventListener("click", () => advanceStep());
  resetButton.addEventListener("click", () => resetAll());

  function startAlgorithm() {
    state.stepper = createKruskalStepper(sortedEdges, vertexCount);
    renderProtocol([]);
    updateCurrentEdge(null, null);
    updateMstResults([], 0);
    updateRunLabel("Краскал: старт");
    drawGraph(undirectedAdj, weightMatrix, positions, layout, state);
  }

  function advanceStep() {
    if (!state.stepper) {
      alert("Спочатку натисніть Почати алгоритм Краскала.");
      return;
    }

    const info = state.stepper.step();
    if (!info.done) {
      renderProtocol(state.stepper.protocol);
    }

    if (state.stepper.done) {
      updateRunLabel("Краскал завершено");
    } else {
      updateRunLabel(`Крок ${state.stepper.stepCount}`);
    }

    updateCurrentEdge(state.stepper.currentEdge, state.stepper.lastDecision);
    updateMstResults(state.stepper.mstEdges, state.stepper.totalWeight);
    drawGraph(undirectedAdj, weightMatrix, positions, layout, state);
  }

  function resetAll() {
    state.stepper = null;
    renderProtocol([]);
    updateRunLabel("Готово до запуску");
    updateCurrentEdge(null, null);
    updateMstResults([], 0);
    drawGraph(undirectedAdj, weightMatrix, positions, layout, state);
  }
} catch (error) {
  console.error("Помилка при завантаженні:", error);
  alert("Помилка: " + error.message + "\n");
}

function buildUndirectedAdjacency(directed) {
  const size = directed.length;
  const result = directed.map((row) => [...row]);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (directed[i][j] === 1 || directed[j][i] === 1) {
        result[i][j] = 1;
        result[j][i] = 1;
      }
    }
  }

  return result;
}

function buildWeightMatrix(randomMatrix, adj) {
  const size = randomMatrix.length;
  const c = Array.from({ length: size }, () => new Array(size).fill(0));
  const d = Array.from({ length: size }, () => new Array(size).fill(0));
  const h = Array.from({ length: size }, () => new Array(size).fill(0));
  const w = Array.from({ length: size }, () => new Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const value = Math.ceil(randomMatrix[i][j] * 100 * adj[i][j]);
      c[i][j] = value;
      d[i][j] = value === 0 ? 0 : 1;
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      h[i][j] = d[i][j] !== d[j][i] ? 1 : 0;
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = i; j < size; j++) {
      if (i === j) {
        w[i][j] = d[i][j] * c[i][j];
      } else {
        const value = (d[i][j] + h[i][j]) * c[i][j];
        w[i][j] = value;
        w[j][i] = value;
      }
    }
  }

  return w;
}

function collectEdges(weights, adj) {
  const edges = [];
  for (let i = 0; i < weights.length; i++) {
    for (let j = i + 1; j < weights.length; j++) {
      if (adj[i][j] === 1 && weights[i][j] > 0) {
        edges.push({ u: i, v: j, weight: weights[i][j] });
      }
    }
  }
  return edges;
}

function sortEdges(a, b) {
  if (a.weight !== b.weight) {
    return a.weight - b.weight;
  }
  if (a.u !== b.u) {
    return a.u - b.u;
  }
  return a.v - b.v;
}

function renderMatrixTable(matrix, elementId, highlightLoops) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  let html = '<table class="matrix-table">';

  for (let i = 0; i < matrix.length; i++) {
    html += "<tr>";
    for (let j = 0; j < matrix[i].length; j++) {
      const isLoop = highlightLoops && i === j && matrix[i][j] > 0;
      const cssClass = isLoop ? "highlight" : "";
      html += `<td class="${cssClass}">${matrix[i][j]}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";

  element.innerHTML = html;
}

function renderSortedEdges(edges) {
  const element = document.getElementById("sortedEdges");
  if (!element) {
    return;
  }
  if (!edges.length) {
    element.textContent = "немає";
    return;
  }
  element.textContent = edges
    .map((edge) => `${edge.u + 1}-${edge.v + 1} (w=${edge.weight})`)
    .join("\n");
}

function renderProtocol(protocol) {
  const element = document.getElementById("kruskalProtocol");
  if (!element) {
    return;
  }

  if (!protocol.length) {
    element.innerHTML = "<p>немає</p>";
    return;
  }

  let html = '<table class="protocol-table">';
  html +=
    "<tr><th>Крок</th><th>Ребро</th><th>Вага</th><th>Дія</th><th>Кістяк</th><th>Сума</th></tr>";

  protocol.forEach((entry) => {
    html += `
      <tr>
        <td>${entry.step}</td>
        <td>${formatEdge(entry.edge)}</td>
        <td>${entry.edge.weight}</td>
        <td>${entry.action}</td>
        <td>${formatEdgeList(entry.mst)}</td>
        <td>${entry.total}</td>
      </tr>
    `;
  });

  html += "</table>";
  element.innerHTML = html;
}

function updateRunLabel(text) {
  const label = document.getElementById("runLabel");
  if (label) {
    label.textContent = text;
  }
}

function updateCurrentEdge(edge, decision) {
  const element = document.getElementById("currentEdge");
  if (!element) {
    return;
  }

  if (!edge) {
    element.textContent = "Поточне ребро: -";
    return;
  }

  const status = decision === "accepted"
    ? "додано"
    : decision === "rejected"
      ? "відхилено"
      : "";
  const statusText = status ? `, статус: ${status}` : "";
  element.textContent = `Поточне ребро: ${formatEdge(edge)} (w=${edge.weight})${statusText}`;
}

function updateMstResults(edges, total) {
  setText("mstEdges", formatEdgeList(edges));
  setText("mstWeight", total.toString());
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function formatEdge(edge) {
  return `${edge.u + 1}-${edge.v + 1}`;
}

function formatEdgeList(edges) {
  if (!edges.length) {
    return "немає";
  }
  return edges
    .map((edge) => `${edge.u + 1}-${edge.v + 1}(${edge.weight})`)
    .join(", ");
}

function createKruskalStepper(edges, size) {
  return {
    edges,
    size,
    index: 0,
    stepCount: 0,
    mstEdges: [],
    totalWeight: 0,
    protocol: [],
    currentEdge: null,
    lastDecision: null,
    dsu: new DisjointSet(size),
    done: false,
    step() {
      if (this.done) {
        return { done: true };
      }

      if (this.mstEdges.length === this.size - 1 || this.index >= this.edges.length) {
        this.done = true;
        return { done: true };
      }

      const edge = this.edges[this.index];
      this.index += 1;
      this.currentEdge = edge;

      const added = this.dsu.union(edge.u, edge.v);
      this.lastDecision = added ? "accepted" : "rejected";

      if (added) {
        this.mstEdges.push(edge);
        this.totalWeight += edge.weight;
      }

      this.stepCount += 1;
      const info = {
        done: false,
        step: this.stepCount,
        edge,
        action: added ? "додано" : "відхилено (цикл)",
        mst: [...this.mstEdges],
        total: this.totalWeight,
      };

      this.protocol.push(info);

      if (this.mstEdges.length === this.size - 1 || this.index >= this.edges.length) {
        this.done = true;
      }

      return info;
    },
  };
}

class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(value) {
    if (this.parent[value] !== value) {
      this.parent[value] = this.find(this.parent[value]);
    }
    return this.parent[value];
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) {
      return false;
    }

    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA] += 1;
    }

    return true;
  }
}

function buildCircleWithCenter(count, centerX, centerY, radius) {
  const positions = [];
  const circleNodes = count - 1;
  const step = (Math.PI * 2) / circleNodes;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < circleNodes; i++) {
    const angle = startAngle + step * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions.push({ x: Math.round(x), y: Math.round(y) });
  }

  positions.push({ x: centerX, y: centerY });
  return positions;
}

function drawGraph(adj, weights, positions, layout, state) {
  const canvas = document.getElementById("graph");
  const ctx = canvas.getContext("2d");
  const nodeRadius = 20;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const mstSet = buildMstEdgeSet(state);
  const currentKey = state.stepper?.currentEdge
    ? buildEdgeKey(state.stepper.currentEdge.u, state.stepper.currentEdge.v)
    : null;

  for (let i = 0; i < positions.length; i++) {
    if (adj[i][i] === 1 && weights[i][i] > 0) {
      drawLoop(ctx, positions[i], layout, nodeRadius, "black");
      drawLoopLabel(ctx, positions[i], layout, nodeRadius, weights[i][i]);
    }
  }

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (adj[i][j] !== 1 || weights[i][j] === 0) {
        continue;
      }

      const key = buildEdgeKey(i, j);
      let color = "black";
      let width = 2;

      if (currentKey === key && state.stepper) {
        if (state.stepper.lastDecision === "rejected") {
          color = "#d0021b";
        } else {
          color = "#4a90e2";
        }
        width = 3;
      } else if (mstSet.has(key)) {
        color = "#e67e22";
        width = 3;
      }

      drawUndirectedEdge(ctx, positions[i], positions[j], nodeRadius, color, width);
      drawEdgeLabel(ctx, positions[i], positions[j], weights[i][j]);
    }
  }

  for (let i = 0; i < positions.length; i++) {
    drawNode(ctx, positions[i], nodeRadius, i + 1);
  }
}

function buildMstEdgeSet(state) {
  if (!state.stepper) {
    return new Set();
  }
  return new Set(
    state.stepper.mstEdges.map((edge) => buildEdgeKey(edge.u, edge.v)),
  );
}

function buildEdgeKey(u, v) {
  return u < v ? `${u}-${v}` : `${v}-${u}`;
}

function drawUndirectedEdge(ctx, from, to, nodeRadius, color, width) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  const startX = from.x + nodeRadius * Math.cos(angle);
  const startY = from.y + nodeRadius * Math.sin(angle);
  const endX = to.x - nodeRadius * Math.cos(angle);
  const endY = to.y - nodeRadius * Math.sin(angle);

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawEdgeLabel(ctx, from, to, weight) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const offsetX = (-dy / length) * 10;
  const offsetY = (dx / length) * 10;

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(weight.toString(), midX + offsetX, midY + offsetY);
}

function drawLoop(ctx, position, layout, nodeRadius, color) {
  const loopRadius = 18;
  let angle;

  if (position.x === layout.centerX && position.y === layout.centerY) {
    angle = -Math.PI / 2;
  } else {
    angle = Math.atan2(position.y - layout.centerY, position.x - layout.centerX);
  }

  const loopCenterX =
    position.x + (nodeRadius + loopRadius) * Math.cos(angle);
  const loopCenterY =
    position.y + (nodeRadius + loopRadius) * Math.sin(angle);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(loopCenterX, loopCenterY, loopRadius, 0, 2 * Math.PI);
  ctx.stroke();
}

function drawLoopLabel(ctx, position, layout, nodeRadius, weight) {
  const loopRadius = 18;
  let angle;

  if (position.x === layout.centerX && position.y === layout.centerY) {
    angle = -Math.PI / 2;
  } else {
    angle = Math.atan2(position.y - layout.centerY, position.x - layout.centerX);
  }

  const labelX =
    position.x + (nodeRadius + loopRadius + 14) * Math.cos(angle);
  const labelY =
    position.y + (nodeRadius + loopRadius + 14) * Math.sin(angle);

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(weight.toString(), labelX, labelY);
}

function drawNode(ctx, position, nodeRadius, label) {
  ctx.beginPath();
  ctx.arc(position.x, position.y, nodeRadius, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, position.x, position.y);
}