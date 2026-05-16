import createRandomMatrix from "./matrix.js";
import buildAdjacencyMatrix from "./dirMatrix.js";

try {
  const n1 = 5;
  const n2 = 5;
  const n3 = 1;
  const n4 = 6;

  const variant = n1 * 1000 + n2 * 100 + n3 * 10 + n4;
  const vertexCount = 10 + n3;
  const k = 1.0 - n3 * 0.01 - n4 * 0.005 - 0.15;

  const layout = {
    centerX: 450,
    centerY: 300,
    radius: 230,
  };

  const baseMatrix = createRandomMatrix(vertexCount, variant);
  const adjacencyMatrix = buildAdjacencyMatrix(baseMatrix, k);
  const positions = buildCircleWithCenter(
    vertexCount,
    layout.centerX,
    layout.centerY,
    layout.radius,
  );

  const state = {
    mode: null,
    stepper: null,
    bfsResult: { order: [], tree: [] },
    dfsResult: { order: [], tree: [] },
  };

  renderMatrixTable(adjacencyMatrix, "adjMatrix", true);
  updateRunLabel("Готово до запуску");
  updateResults(state);
  renderProtocol([], null);
  drawGraph(adjacencyMatrix, positions, layout, state);

  const startBfsButton = document.getElementById("startBfs");
  const startDfsButton = document.getElementById("startDfs");
  const nextStepButton = document.getElementById("nextStep");
  const resetButton = document.getElementById("resetRun");

  startBfsButton.addEventListener("click", () => startTraversal("bfs"));
  startDfsButton.addEventListener("click", () => startTraversal("dfs"));
  nextStepButton.addEventListener("click", () => advanceStep());
  resetButton.addEventListener("click", () => resetAll());

  function startTraversal(mode) {
    state.mode = mode;
    state.stepper = createStepper(mode, adjacencyMatrix);
    renderProtocol([], mode);
    updateRunLabel(mode === "bfs" ? "BFS: старт" : "DFS: старт");
    if (mode === "bfs") {
      state.bfsResult = { order: [], tree: [] };
    } else {
      state.dfsResult = { order: [], tree: [] };
    }
    updateResults(state);
    drawGraph(adjacencyMatrix, positions, layout, state);
  }

  function advanceStep() {
    if (!state.stepper) {
      alert("Спочатку натисніть Почати BFS або Почати DFS.");
      return;
    }

    const info = state.stepper.step();
    if (!info.done) {
      renderProtocol(state.stepper.protocol, state.mode);
    }

    if (state.stepper.done) {
      updateRunLabel(
        state.mode === "bfs" ? "BFS завершено" : "DFS завершено",
      );
    } else {
      updateRunLabel(
        state.mode === "bfs"
          ? `BFS: крок ${state.stepper.stepCount}`
          : `DFS: крок ${state.stepper.stepCount}`,
      );
    }

    updateResultsFromStepper(state);
    drawGraph(adjacencyMatrix, positions, layout, state);
  }

  function resetAll() {
    state.mode = null;
    state.stepper = null;
    state.bfsResult = { order: [], tree: [] };
    state.dfsResult = { order: [], tree: [] };
    updateResults(state);
    renderProtocol([], null);
    updateRunLabel("Готово до запуску");
    drawGraph(adjacencyMatrix, positions, layout, state);
  }
} catch (error) {
  console.error("Помилка при завантаженні:", error);
  alert("Помилка: " + error.message + "\n");
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
      const isLoop = highlightLoops && i === j && matrix[i][j] === 1;
      const cssClass = isLoop ? "highlight" : "";
      html += `<td class="${cssClass}">${matrix[i][j]}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";

  element.innerHTML = html;
}

function updateRunLabel(text) {
  const label = document.getElementById("runLabel");
  if (label) {
    label.textContent = text;
  }
}

function updateResults(state) {
  setText("bfsOrder", formatList(state.bfsResult.order));
  setText("bfsTree", formatEdgeList(state.bfsResult.tree));
  setText("dfsOrder", formatList(state.dfsResult.order));
  setText("dfsTree", formatEdgeList(state.dfsResult.tree));
}

function updateResultsFromStepper(state) {
  if (!state.stepper) {
    return;
  }

  const order = [...state.stepper.order];
  const tree = [...state.stepper.treeEdges];
  if (state.mode === "bfs") {
    state.bfsResult = { order, tree };
  } else {
    state.dfsResult = { order, tree };
  }
  updateResults(state);
}

function renderProtocol(protocol, mode) {
  const element = document.getElementById("protocol");
  if (!element) {
    return;
  }

  if (!protocol.length || !mode) {
    element.innerHTML = "<p>немає</p>";
    return;
  }

  const structureLabel = mode === "bfs" ? "Черга" : "Стек";
  let html = '<table class="protocol-table">';
  html +=
    `<tr><th>Крок</th><th>Поточна</th><th>Додано</th><th>${structureLabel}</th><th>Порядок</th></tr>`;

  protocol.forEach((entry) => {
    html += `
      <tr>
        <td>${entry.step}</td>
        <td>${formatVertex(entry.current)}</td>
        <td>${formatList(entry.added)}</td>
        <td>${formatList(entry.structure)}</td>
        <td>${formatList(entry.order)}</td>
      </tr>
    `;
  });

  html += "</table>";
  element.innerHTML = html;
}

function createStepper(mode, matrix) {
  return {
    mode,
    matrix,
    size: matrix.length,
    visited: new Array(matrix.length).fill(false),
    queued: new Array(matrix.length).fill(false),
    processed: new Array(matrix.length).fill(false),
    current: null,
    queue: [],
    stack: [],
    order: [],
    treeEdges: [],
    protocol: [],
    stepCount: 0,
    done: false,
    step() {
      if (this.done) {
        return { done: true };
      }
      this.current = null;
      if (this.mode === "bfs") {
        return stepBfs(this);
      }
      return stepDfs(this);
    },
  };
}

function stepBfs(state) {
  let addedStart = null;

  if (state.queue.length === 0) {
    const nextStart = findNextStart(state);
    if (nextStart === -1) {
      state.done = true;
      return { done: true };
    }
    enqueue(state, nextStart);
    addedStart = nextStart;
  }

  const current = state.queue.shift();
  state.current = current;
  state.queued[current] = false;

  const added = [];
  if (addedStart !== null) {
    added.push(addedStart);
  }

  for (let j = 0; j < state.size; j++) {
    if (state.matrix[current][j] === 1 && !state.visited[j]) {
      enqueue(state, j);
      added.push(j);
      state.treeEdges.push([current, j]);
    }
  }

  state.processed[current] = true;
  state.order.push(current);
  state.stepCount += 1;

  if (state.queue.length === 0 && findNextStart(state) === -1) {
    state.done = true;
  }

  const info = buildStepInfo(state, current, added, [...state.queue]);
  state.protocol.push(info);
  return info;
}

function stepDfs(state) {
  let addedStart = null;

  if (state.stack.length === 0) {
    const nextStart = findNextStart(state);
    if (nextStart === -1) {
      state.done = true;
      return { done: true };
    }
    pushStack(state, nextStart);
    addedStart = nextStart;
  }

  const current = state.stack.pop();
  state.current = current;
  state.queued[current] = false;

  const added = [];
  if (addedStart !== null) {
    added.push(addedStart);
  }

  const neighbors = [];
  for (let j = 0; j < state.size; j++) {
    if (state.matrix[current][j] === 1 && !state.visited[j]) {
      neighbors.push(j);
    }
  }

  for (let i = neighbors.length - 1; i >= 0; i--) {
    const vertex = neighbors[i];
    pushStack(state, vertex);
    state.treeEdges.push([current, vertex]);
  }

  neighbors.forEach((vertex) => added.push(vertex));

  state.processed[current] = true;
  state.order.push(current);
  state.stepCount += 1;

  if (state.stack.length === 0 && findNextStart(state) === -1) {
    state.done = true;
  }

  const info = buildStepInfo(state, current, added, [...state.stack]);
  state.protocol.push(info);
  return info;
}

function enqueue(state, vertex) {
  state.queue.push(vertex);
  state.visited[vertex] = true;
  state.queued[vertex] = true;
}

function pushStack(state, vertex) {
  state.stack.push(vertex);
  state.visited[vertex] = true;
  state.queued[vertex] = true;
}

function findNextStart(state) {
  for (let i = 0; i < state.size; i++) {
    if (!state.visited[i] && hasOutgoing(state.matrix, i)) {
      return i;
    }
  }
  return -1;
}

function hasOutgoing(matrix, index) {
  for (let j = 0; j < matrix.length; j++) {
    if (matrix[index][j] === 1) {
      return true;
    }
  }
  return false;
}

function buildStepInfo(state, current, added, structure) {
  return {
    done: false,
    step: state.stepCount,
    current,
    added,
    structure,
    order: [...state.order],
  };
}

function formatList(list) {
  if (!list.length) {
    return "немає";
  }
  return list.map((value) => value + 1).join(", ");
}

function formatEdgeList(edges) {
  if (!edges.length) {
    return "немає";
  }
  return edges
    .map((edge) => `${edge[0] + 1}->${edge[1] + 1}`)
    .join(", ");
}

function formatVertex(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  return value + 1;
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
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

function drawGraph(matrix, positions, layout, state) {
  const canvas = document.getElementById("graph");
  const ctx = canvas.getContext("2d");
  const nodeRadius = 20;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const treeSet = buildTreeEdgeSet(state);
  const hasEdge = (i, j) => Number(matrix[i][j]) === 1;

  for (let i = 0; i < positions.length; i++) {
    if (hasEdge(i, i)) {
      drawLoop(ctx, positions[i], layout, nodeRadius, "black");
    }
  }

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const ij = hasEdge(i, j);
      const ji = hasEdge(j, i);

      if (ij && ji) {
        drawArrow(
          ctx,
          positions[i],
          positions[j],
          nodeRadius,
          1,
          treeSet.has(`${i}-${j}`) ? "#e67e22" : "black",
        );
        drawArrow(
          ctx,
          positions[j],
          positions[i],
          nodeRadius,
          -1,
          treeSet.has(`${j}-${i}`) ? "#e67e22" : "black",
        );
      } else if (ij) {
        drawArrow(
          ctx,
          positions[i],
          positions[j],
          nodeRadius,
          0,
          treeSet.has(`${i}-${j}`) ? "#e67e22" : "black",
        );
      } else if (ji) {
        drawArrow(
          ctx,
          positions[j],
          positions[i],
          nodeRadius,
          0,
          treeSet.has(`${j}-${i}`) ? "#e67e22" : "black",
        );
      }
    }
  }

  for (let i = 0; i < positions.length; i++) {
    const color = resolveNodeColor(state, i);
    drawNode(ctx, positions[i], nodeRadius, i + 1, color);
  }
}

function buildTreeEdgeSet(state) {
  if (!state || !state.stepper) {
    return new Set();
  }
  const edges = state.stepper.treeEdges || [];
  return new Set(edges.map((edge) => `${edge[0]}-${edge[1]}`));
}

function resolveNodeColor(state, index) {
  if (!state || !state.stepper) {
    return "#ffffff";
  }
  if (state.stepper.current === index) {
    return "#4a90e2";
  }
  if (state.stepper.processed[index]) {
    return "#7ed321";
  }
  if (state.stepper.queued[index]) {
    return "#f5d547";
  }
  return "#ffffff";
}

function drawArrow(ctx, from, to, nodeRadius, curveDirection, color) {
  const headLength = 12;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  const startX = from.x + nodeRadius * Math.cos(angle);
  const startY = from.y + nodeRadius * Math.sin(angle);
  const endX = to.x - nodeRadius * Math.cos(angle);
  const endY = to.y - nodeRadius * Math.sin(angle);

  ctx.strokeStyle = color;
  ctx.lineWidth = color === "#e67e22" ? 3 : 2;
  ctx.beginPath();

  let arrowAngle = angle;

  if (curveDirection !== 0) {
    const curveOffset = 35 * curveDirection;
    const controlX = (from.x + to.x) / 2 - curveOffset * Math.sin(angle);
    const controlY = (from.y + to.y) / 2 + curveOffset * Math.cos(angle);

    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();

    arrowAngle = Math.atan2(endY - controlY, endX - controlX);
  } else {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(arrowAngle - Math.PI / 6),
    endY - headLength * Math.sin(arrowAngle - Math.PI / 6),
  );
  ctx.lineTo(
    endX - headLength * Math.cos(arrowAngle + Math.PI / 6),
    endY - headLength * Math.sin(arrowAngle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
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

  const arrowAngle = angle + Math.PI / 3;
  const arrowX = loopCenterX + loopRadius * Math.cos(arrowAngle);
  const arrowY = loopCenterY + loopRadius * Math.sin(arrowAngle);

  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - 8 * Math.cos(arrowAngle - Math.PI / 6),
    arrowY - 8 * Math.sin(arrowAngle - Math.PI / 6),
  );
  ctx.lineTo(
    arrowX - 8 * Math.cos(arrowAngle + Math.PI / 6),
    arrowY - 8 * Math.sin(arrowAngle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawNode(ctx, position, nodeRadius, label, fillColor) {
  ctx.beginPath();
  ctx.arc(position.x, position.y, nodeRadius, 0, 2 * Math.PI);
  ctx.fillStyle = fillColor;
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