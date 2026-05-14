import generateBaseMatrix from "./matrix.js";
import buildDirectedMatrix from "./dirMatrix.js";
import buildUndirectedMatrix from "./unDirMatrix.js";

try {
  const n1 = 5;
  const n2 = 5;
  const n3 = 1;
  const n4 = 6;

  const variant = n1 * 1000 + n2 * 100 + n3 * 10 + n4;
  const nodeCount = 10 + n3;
  const coefficient = 1.0 - n3 * 0.02 - n4 * 0.005 - 0.25;

  const layout = {
    centerX: 450,
    centerY: 300,
    radius: 230,
  };

  const baseMatrix = generateBaseMatrix(nodeCount, variant);
  const directedMatrix = buildDirectedMatrix(baseMatrix, coefficient);
  const undirectedMatrix = buildUndirectedMatrix(directedMatrix);

  renderMatrixTable(baseMatrix, "baseMatrix", false);
  renderMatrixTable(directedMatrix, "dirMatrix", true);
  renderMatrixTable(undirectedMatrix, "undirMatrix", true);

  const positions = getCircleWithCenterPositions(
    nodeCount,
    layout.centerX,
    layout.centerY,
    layout.radius,
  );

  const showDirectedButton = document.getElementById("showDir");
  const showUndirectedButton = document.getElementById("showUndir");

  showDirectedButton.addEventListener("click", () => {
    drawGraph(directedMatrix, positions, true, layout);
  });

  showUndirectedButton.addEventListener("click", () => {
    drawGraph(undirectedMatrix, positions, false, layout);
  });

  drawGraph(directedMatrix, positions, true, layout);
} catch (error) {
  console.error("Помилка при завантаженні:", error);
  alert("Помилка: " + error.message + "\n");
}

function renderMatrixTable(matrix, elementId, showStats) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  let html = '<table class="matrix-table">';

  for (let i = 0; i < matrix.length; i++) {
    html += "<tr>";
    for (let j = 0; j < matrix[i].length; j++) {
      const isLoop = i === j && matrix[i][j] === 1;
      const cssClass = isLoop ? "highlight" : "";

      const displayValue = Number.isInteger(matrix[i][j])
        ? matrix[i][j]
        : matrix[i][j].toFixed(2);

      html += `<td class="${cssClass}">${displayValue}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";

  if (showStats) {
    const edges = matrix.reduce(
      (sum, row, i) =>
        sum +
        row.reduce(
          (rowSum, val, j) => rowSum + (i !== j && val === 1 ? 1 : 0),
          0,
        ),
      0,
    );
    const loops = matrix.reduce(
      (sum, row, i) => sum + (row[i] === 1 ? 1 : 0),
      0,
    );

    html += `<p style="margin-top: 10px; font-size: 12px; color: #666;">
          Ребер: <strong>${edges}</strong> | Петель: <strong>${loops}</strong>
        </p>`;
  }

  element.innerHTML = html;
}

function getCircleWithCenterPositions(count, centerX, centerY, radius) {
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

function drawGraph(matrix, positions, directed, layout) {
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
    drawNode(ctx, positions[i], nodeRadius, i + 1);
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