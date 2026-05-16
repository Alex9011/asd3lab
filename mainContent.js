import createRandomMatrix from "./matrix.js";
import buildAdjacencyMatrix from "./dirMatrix.js";
import buildSymmetricMatrix from "./unDirMatrix.js";

try {
  const n1 = 5;
  const n2 = 5;
  const n3 = 1;
  const n4 = 6;

  const variant = n1 * 1000 + n2 * 100 + n3 * 10 + n4;
  const vertexCount = 10 + n3;

  const k1 = 1.0 - n3 * 0.01 - n4 * 0.01 - 0.3;
  const k2 = 1.0 - n3 * 0.005 - n4 * 0.005 - 0.27;

  const layout = {
    centerX: 450,
    centerY: 300,
    radius: 230,
    condRadius: 180,
  };

  const baseMatrix = createRandomMatrix(vertexCount, variant);
  const dirK1 = buildAdjacencyMatrix(baseMatrix, k1);
  const undirK1 = buildSymmetricMatrix(dirK1);
  const dirK2 = buildAdjacencyMatrix(baseMatrix, k2);

  const mainPositions = buildCircleWithCenter(
    vertexCount,
    layout.centerX,
    layout.centerY,
    layout.radius,
  );

  const k1DirectedStats = getDirectedStats(dirK1);
  const k1UndirectedStats = getUndirectedStats(undirK1);
  const k2DirectedStats = getDirectedStats(dirK2);

  const matrixA2 = multiplyMatrices(dirK2, dirK2);
  const matrixA3 = multiplyMatrices(matrixA2, dirK2);
  const pathsLen2 = collectPathsLen2(dirK2, matrixA2);
  const pathsLen3 = collectPathsLen3(dirK2, matrixA3);

  const reachMatrix = buildReachability(dirK2);
  const strongMatrix = buildStrongMatrix(reachMatrix);
  const components = extractStrongComponents(strongMatrix);
  const condensationMatrix = buildCondensationMatrix(dirK2, components);
  const condPositions = buildCirclePositions(
    components.length,
    layout.centerX,
    layout.centerY,
    layout.condRadius,
  );

  renderMatrixTable(baseMatrix, "baseMatrix", false);
  renderMatrixTable(dirK1, "dirMatrixK1", true);
  renderMatrixTable(undirK1, "undirMatrixK1", true);
  renderMatrixTable(dirK2, "dirMatrixK2", true);
  renderMatrixTable(reachMatrix, "reachMatrix", true);
  renderMatrixTable(strongMatrix, "strongMatrix", true);
  renderMatrixTable(condensationMatrix, "condMatrix", true);

  renderK1Stats(k1DirectedStats, k1UndirectedStats);
  renderK2Stats(k2DirectedStats);
  renderPaths(pathsLen2, "pathsLen2");
  renderPaths(pathsLen3, "pathsLen3");
  renderComponents(components);

  const views = {
    k1Dir: {
      title: `Орієнтований граф k1 (k1 = ${k1.toFixed(2)})`,
      matrix: dirK1,
      positions: mainPositions,
      directed: true,
      labels: buildLabels(vertexCount),
    },
    k1Undir: {
      title: `Неорієнтований граф k1 (k1 = ${k1.toFixed(2)})`,
      matrix: undirK1,
      positions: mainPositions,
      directed: false,
      labels: buildLabels(vertexCount),
    },
    k2Dir: {
      title: `Новий орграф k2 (k2 = ${k2.toFixed(3)})`,
      matrix: dirK2,
      positions: mainPositions,
      directed: true,
      labels: buildLabels(vertexCount),
    },
    condensation: {
      title: "Граф конденсації",
      matrix: condensationMatrix,
      positions: condPositions,
      directed: true,
      labels: buildLabels(components.length),
    },
  };

  const showDirK1Button = document.getElementById("showDirK1");
  const showUndirK1Button = document.getElementById("showUndirK1");
  const showDirK2Button = document.getElementById("showDirK2");
  const showCondButton = document.getElementById("showCond");

  showDirK1Button.addEventListener("click", () => setGraphView("k1Dir"));
  showUndirK1Button.addEventListener("click", () => setGraphView("k1Undir"));
  showDirK2Button.addEventListener("click", () => setGraphView("k2Dir"));
  showCondButton.addEventListener("click", () => {
    setGraphView("condensation");
  });

  setGraphView("k1Dir");

  function setGraphView(key) {
    const view = views[key];
    if (!view) {
      return;
    }
    drawGraph(view.matrix, view.positions, view.directed, layout, view.labels);
    updateGraphLabel(view.title);
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

      const value = matrix[i][j];
      const displayValue = Number.isInteger(value) ? value : value.toFixed(2);

      html += `<td class="${cssClass}">${displayValue}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";

  element.innerHTML = html;
}

function renderK1Stats(directedStats, undirectedStats) {
  const element = document.getElementById("k1Stats");
  if (!element) {
    return;
  }

  const directedTable = buildDirectedStatsTable(directedStats);
  const undirectedTable = buildUndirectedStatsTable(undirectedStats);
  const pendant = formatVertexList(undirectedStats.pendant);
  const isolated = formatVertexList(undirectedStats.isolated);

  element.innerHTML = `
    <div class="stats-group">
      <h4>Орієнтований граф k1: півстепені та степені</h4>
      ${directedTable}
      <p>${formatRegularity(directedStats.regular)}</p>
    </div>
    <div class="stats-group">
      <h4>Неорієнтований граф k1: степені</h4>
      ${undirectedTable}
      <p>${formatRegularity(undirectedStats.regular)}</p>
      <p>Висячі вершини: ${pendant}</p>
      <p>Ізольовані вершини: ${isolated}</p>
    </div>
  `;
}

function renderK2Stats(directedStats) {
  const element = document.getElementById("k2Stats");
  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="stats-group">
      <h4>Новий орграф k2: півстепені та степені</h4>
      ${buildDirectedStatsTable(directedStats)}
      <p>${formatRegularity(directedStats.regular)}</p>
    </div>
  `;
}

function renderPaths(paths, elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }
  element.textContent = paths.length > 0 ? paths.join("\n") : "немає";
}

function renderComponents(components) {
  const element = document.getElementById("sccList");
  if (!element) {
    return;
  }

  const items = components
    .map(
      (component, index) =>
        `<li>К${index + 1}: ${component.map((v) => v + 1).join(", ")}</li>`,
    )
    .join("");

  element.innerHTML = `
    <div class="stats-group">
      <h4>Компоненти сильної зв'язності</h4>
      <ol class="components-list">${items}</ol>
    </div>
  `;
}

function buildDirectedStatsTable(stats) {
  let html = '<table class="stats-table">';
  html += "<tr><th>Вершина</th><th>Вихід</th><th>Заход</th><th>Ступінь</th></tr>";

  for (let i = 0; i < stats.out.length; i++) {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${stats.out[i]}</td>
        <td>${stats.incoming[i]}</td>
        <td>${stats.total[i]}</td>
      </tr>
    `;
  }

  html += "</table>";
  return html;
}

function buildUndirectedStatsTable(stats) {
  let html = '<table class="stats-table">';
  html += "<tr><th>Вершина</th><th>Ступінь</th></tr>";

  for (let i = 0; i < stats.degree.length; i++) {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${stats.degree[i]}</td>
      </tr>
    `;
  }

  html += "</table>";
  return html;
}

function formatRegularity(regularInfo) {
  if (regularInfo.isRegular) {
    return `Регулярний граф: так (ступінь ${regularInfo.degree})`;
  }
  return "Регулярний граф: ні";
}

function formatVertexList(list) {
  if (!list.length) {
    return "немає";
  }
  return list.map((value) => value + 1).join(", ");
}

function getDirectedStats(matrix) {
  const size = matrix.length;
  const outgoing = new Array(size).fill(0);
  const incoming = new Array(size).fill(0);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === 1) {
        outgoing[i] += 1;
        incoming[j] += 1;
      }
    }
  }

  const total = outgoing.map((value, index) => value + incoming[index]);
  return {
    out: outgoing,
    incoming,
    total,
    regular: buildRegularInfo(total),
  };
}

function getUndirectedStats(matrix) {
  const size = matrix.length;
  const degree = new Array(size).fill(0);

  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let j = 0; j < size; j++) {
      sum += matrix[i][j];
    }
    if (matrix[i][i] === 1) {
      sum += 1;
    }
    degree[i] = sum;
  }

  const pendant = [];
  const isolated = [];

  degree.forEach((value, index) => {
    if (value === 1) {
      pendant.push(index);
    } else if (value === 0) {
      isolated.push(index);
    }
  });

  return {
    degree,
    pendant,
    isolated,
    regular: buildRegularInfo(degree),
  };
}

function buildRegularInfo(degreeList) {
  if (!degreeList.length) {
    return { isRegular: false, degree: 0 };
  }
  const base = degreeList[0];
  const isRegular = degreeList.every((value) => value === base);
  return { isRegular, degree: base };
}

function multiplyMatrices(a, b) {
  const size = a.length;
  const result = Array.from({ length: size }, () =>
    new Array(size).fill(0),
  );

  for (let i = 0; i < size; i++) {
    for (let k = 0; k < size; k++) {
      if (a[i][k] === 0) {
        continue;
      }
      for (let j = 0; j < size; j++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

function collectPathsLen2(matrix, a2) {
  const size = matrix.length;
  const paths = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (a2[i][j] === 0) {
        continue;
      }
      for (let k = 0; k < size; k++) {
        if (matrix[i][k] === 1 && matrix[k][j] === 1) {
          paths.push(`${i + 1} - ${k + 1} - ${j + 1}`);
        }
      }
    }
  }

  return paths;
}

function collectPathsLen3(matrix, a3) {
  const size = matrix.length;
  const paths = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (a3[i][j] === 0) {
        continue;
      }
      for (let k = 0; k < size; k++) {
        if (matrix[i][k] !== 1) {
          continue;
        }
        for (let l = 0; l < size; l++) {
          if (matrix[k][l] === 1 && matrix[l][j] === 1) {
            paths.push(`${i + 1} - ${k + 1} - ${l + 1} - ${j + 1}`);
          }
        }
      }
    }
  }

  return paths;
}

function buildReachability(matrix) {
  const size = matrix.length;
  const reach = matrix.map((row, i) =>
    row.map((value, j) => (i === j || value === 1 ? 1 : 0)),
  );

  for (let k = 0; k < size; k++) {
    for (let i = 0; i < size; i++) {
      if (reach[i][k] === 0) {
        continue;
      }
      for (let j = 0; j < size; j++) {
        if (reach[k][j] === 1) {
          reach[i][j] = 1;
        }
      }
    }
  }

  return reach;
}

function buildStrongMatrix(reach) {
  const size = reach.length;
  const strong = Array.from({ length: size }, () =>
    new Array(size).fill(0),
  );

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      strong[i][j] = reach[i][j] === 1 && reach[j][i] === 1 ? 1 : 0;
    }
  }

  return strong;
}

function extractStrongComponents(strongMatrix) {
  const size = strongMatrix.length;
  const visited = new Array(size).fill(false);
  const components = [];

  for (let i = 0; i < size; i++) {
    if (visited[i]) {
      continue;
    }
    const component = [];
    for (let j = 0; j < size; j++) {
      if (strongMatrix[i][j] === 1) {
        visited[j] = true;
        component.push(j);
      }
    }
    components.push(component);
  }

  return components;
}

function buildCondensationMatrix(matrix, components) {
  const size = matrix.length;
  const compIndex = new Array(size).fill(-1);
  components.forEach((component, index) => {
    component.forEach((vertex) => {
      compIndex[vertex] = index;
    });
  });

  const condSize = components.length;
  const condensation = Array.from({ length: condSize }, () =>
    new Array(condSize).fill(0),
  );

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === 1) {
        const from = compIndex[i];
        const to = compIndex[j];
        if (from !== to) {
          condensation[from][to] = 1;
        }
      }
    }
  }

  return condensation;
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

function buildCirclePositions(count, centerX, centerY, radius) {
  if (count <= 1) {
    return [{ x: centerX, y: centerY }];
  }

  const positions = [];
  const step = (Math.PI * 2) / count;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < count; i++) {
    const angle = startAngle + step * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions.push({ x: Math.round(x), y: Math.round(y) });
  }

  return positions;
}

function buildLabels(count) {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function updateGraphLabel(text) {
  const label = document.getElementById("graphLabel");
  if (label) {
    label.textContent = text;
  }
}

function drawGraph(matrix, positions, directed, layout, labels) {
  const canvas = document.getElementById("graph");
  const ctx = canvas.getContext("2d");
  const nodeRadius = 20;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const hasEdge = (i, j) => Number(matrix[i][j]) === 1;

  for (let i = 0; i < positions.length; i++) {
    if (hasEdge(i, i)) {
      drawLoop(ctx, positions[i], directed, layout, nodeRadius);
    }
  }

  if (directed) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const ij = hasEdge(i, j);
        const ji = hasEdge(j, i);

        if (ij && ji) {
          drawArrow(ctx, positions[i], positions[j], nodeRadius, 1);
          drawArrow(ctx, positions[j], positions[i], nodeRadius, -1);
        } else if (ij) {
          drawArrow(ctx, positions[i], positions[j], nodeRadius, 0);
        } else if (ji) {
          drawArrow(ctx, positions[j], positions[i], nodeRadius, 0);
        }
      }
    }
  } else {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (hasEdge(i, j)) {
          drawUndirectedEdge(ctx, positions[i], positions[j], nodeRadius);
        }
      }
    }
  }

  for (let i = 0; i < positions.length; i++) {
    const label = labels && labels[i] ? labels[i] : i + 1;
    drawNode(ctx, positions[i], nodeRadius, label);
  }
}

function drawArrow(ctx, from, to, nodeRadius, curveDirection) {
  const headLength = 12;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  const startX = from.x + nodeRadius * Math.cos(angle);
  const startY = from.y + nodeRadius * Math.sin(angle);
  const endX = to.x - nodeRadius * Math.cos(angle);
  const endY = to.y - nodeRadius * Math.sin(angle);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
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
  ctx.fillStyle = "black";
  ctx.fill();
}

function drawUndirectedEdge(ctx, from, to, nodeRadius) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  const startX = from.x + nodeRadius * Math.cos(angle);
  const startY = from.y + nodeRadius * Math.sin(angle);
  const endX = to.x - nodeRadius * Math.cos(angle);
  const endY = to.y - nodeRadius * Math.sin(angle);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawLoop(ctx, position, directed, layout, nodeRadius) {
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

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(loopCenterX, loopCenterY, loopRadius, 0, 2 * Math.PI);
  ctx.stroke();

  if (directed) {
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
    ctx.fillStyle = "black";
    ctx.fill();
  }
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