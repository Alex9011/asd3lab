import createMatrix from "./matrix.js";
import matrixDir from "./dirMatrix.js";
import createMatrixUnDir from "./unDirMatrix.js";

try {
  const n1 = 5;
  const n2 = 5;
  const n3 = 0;
  const n4 = 4;

  const variant = n1 * 1000 + n2 * 100 + n3 * 10 + n4;
  const n = 10 + n3;
  const k = 1.0 - n3 * 0.02 - n4 * 0.005 - 0.25;

  let baseMatrix = createMatrix(n, variant);
  let Adir = matrixDir(baseMatrix, k);
  let Aundir = createMatrixUnDir(Adir);

  const layout = {
    centerX: 450,
    centerY: 300,
    width: 700,
    height: 450,
  };

  function displayMatrix(matrix, elementId, showStats = true) {
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

        const displayVal = Number.isInteger(matrix[i][j])
          ? matrix[i][j]
          : matrix[i][j].toFixed(2);

        html += `<td class="${cssClass}">${displayVal}</td>`;
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

  displayMatrix(baseMatrix, "baseMatrix", false);
  displayMatrix(Adir, "dirMatrix", true);
  displayMatrix(Aundir, "undirMatrix", true);

  function createPositions() {
    let pos = [];
    let centerX = layout.centerX;
    let centerY = layout.centerY;
    let width = layout.width;
    let height = layout.height;

    let xMin = centerX - width / 2;
    let xMax = centerX + width / 2;
    let yMin = centerY - height / 2;
    let yMax = centerY + height / 2;

    let perimeter = 2 * width + 2 * height;
    let numPerimeterNodes = n - 1;

    for (let i = 0; i < numPerimeterNodes; i++) {
      let d = (i / numPerimeterNodes) * perimeter;
      let x, y;

      if (d < width) {
        x = xMin + d;
        y = yMin;
      } else if (d < width + height) {

        x = xMax;
        y = yMin + (d - width);
      } else if (d < 2 * width + height) {

        x = xMax - (d - (width + height));
        y = yMax;
      } else {

        x = xMin;
        y = yMax - (d - (2 * width + height));
      }
      pos.push({ x: Math.round(x), y: Math.round(y) });
    }

    pos.push({ x: centerX, y: centerY });
    return pos;
  }

  function createTrianglePositions() {
    let pos = [];
    let centerX = layout.centerX;
    let centerY = layout.centerY;
    let size = 280;

    // Три вершини трикутника
    const topX = centerX;
    const topY = centerY - size;
    const bottomLeftX = centerX - size;
    const bottomLeftY = centerY + size / 2;
    const bottomRightX = centerX + size;
    const bottomRightY = centerY + size / 2;

    // Периметр трикутника
    const sideLength = 2 * Math.sqrt(size * size + (size / 2) * (size / 2));
    const perimeter = 3 * sideLength / 2;
    let numPerimeterNodes = n - 1;

    for (let i = 0; i < numPerimeterNodes; i++) {
      let d = (i / numPerimeterNodes) * perimeter;
      let x, y;

      // Сторона 1: верх-ліво
      if (d < sideLength / 2) {
        let t = d / (sideLength / 2);
        x = topX + (bottomLeftX - topX) * t;
        y = topY + (bottomLeftY - topY) * t;
      }
      // Сторона 2: ліво-право
      else if (d < sideLength) {
        let t = (d - sideLength / 2) / (sideLength / 2);
        x = bottomLeftX + (bottomRightX - bottomLeftX) * t;
        y = bottomLeftY + (bottomRightY - bottomLeftY) * t;
      }
      // Сторона 3: право-верх
      else {
        let t = (d - sideLength) / (sideLength / 2);
        x = bottomRightX + (topX - bottomRightX) * t;
        y = bottomRightY + (topY - bottomRightY) * t;
      }

      pos.push({ x: Math.round(x), y: Math.round(y) });
    }

    pos.push({ x: centerX, y: centerY });
    return pos;
  }

  function animatePositions(fromPos, toPos, duration = 1500) {
    const canvas = document.getElementById("graph");
    const startTime = Date.now();
    let currentMatrix = Adir; // Використовуємо поточну матрицю

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const animPos = fromPos.map((from, i) => ({
        x: from.x + (toPos[i].x - from.x) * progress,
        y: from.y + (toPos[i].y - from.y) * progress,
      }));

      drawGraph(currentMatrix, animPos, true);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  function drawArrow(ctx, x1, y1, x2, y2, curveDirection = 0) {
    const nodeRadius = 20;
    const headlen = 12;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    const startX = x1 + nodeRadius * Math.cos(angle);
    const startY = y1 + nodeRadius * Math.sin(angle);
    const endX = x2 - nodeRadius * Math.cos(angle);
    const endY = y2 - nodeRadius * Math.sin(angle);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let arrowAngle;

    if (curveDirection !== 0) {
      const curveOffset = 35 * curveDirection;
      const controlX = (x1 + x2) / 2 - curveOffset * Math.sin(angle);
      const controlY = (y1 + y2) / 2 + curveOffset * Math.cos(angle);

      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();

      arrowAngle = Math.atan2(endY - controlY, endX - controlX);
    } else {

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      arrowAngle = angle;
    }

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headlen * Math.cos(arrowAngle - Math.PI / 6),
      endY - headlen * Math.sin(arrowAngle - Math.PI / 6),
    );
    ctx.lineTo(
      endX - headlen * Math.cos(arrowAngle + Math.PI / 6),
      endY - headlen * Math.sin(arrowAngle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
  }

  function drawUndirectedEdge(ctx, x1, y1, x2, y2) {
    const nodeRadius = 20;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    const startX = x1 + nodeRadius * Math.cos(angle);
    const startY = y1 + nodeRadius * Math.sin(angle);
    const endX = x2 - nodeRadius * Math.cos(angle);
    const endY = y2 - nodeRadius * Math.sin(angle);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  function drawLoop(ctx, x, y, index) {
    const loopRadius = 18;
    const nodeRadius = 20;

    let angle;
    if (index === n - 1) {
      angle = -Math.PI / 2;
    } else {
      const graphCenterX = layout.centerX;
      const graphCenterY = layout.centerY;
      angle = Math.atan2(y - graphCenterY, x - graphCenterX);
    }

    const loopCenterX = x + (nodeRadius + loopRadius) * Math.cos(angle);
    const loopCenterY = y + (nodeRadius + loopRadius) * Math.sin(angle);

    ctx.strokeStyle = "black";
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
    ctx.fillStyle = "black";
    ctx.fill();
  }

  function drawGraph(matrix, pos, directed = true) {
    const canvas = document.getElementById("graph");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hasEdge = (i, j) => Number(matrix[i][j]) === 1;

    for (let i = 0; i < n; i++) {
      if (hasEdge(i, i)) {
        drawLoop(ctx, pos[i].x, pos[i].y, i);
      }
    }

    if (directed) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const ij = hasEdge(i, j);
          const ji = hasEdge(j, i);

          if (ij && ji) {
            drawArrow(ctx, pos[i].x, pos[i].y, pos[j].x, pos[j].y, 1);
            drawArrow(ctx, pos[j].x, pos[j].y, pos[i].x, pos[i].y, 1);
          } else if (ij) {
            drawArrow(ctx, pos[i].x, pos[i].y, pos[j].x, pos[j].y, 0);
          } else if (ji) {
            drawArrow(ctx, pos[j].x, pos[j].y, pos[i].x, pos[i].y, 0);
          }
        }
      }
    } else {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (hasEdge(i, j) || hasEdge(j, i)) {
            drawUndirectedEdge(ctx, pos[i].x, pos[i].y, pos[j].x, pos[j].y);
          }
        }
      }
    }

    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "black";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i + 1, pos[i].x, pos[i].y);
    }
  }

  const trianglePositions = createTrianglePositions();

  document.getElementById("showDir").onclick = () => {
    drawGraph(Adir, trianglePositions, true);
  };

  document.getElementById("showUndir").onclick = () => {
    drawGraph(Aundir, trianglePositions, false);
  };

  drawGraph(Adir, trianglePositions, true);
} catch (error) {
  console.error("Помилка при завантаженні:", error);
  alert("Помилка: " + error.message + "\n");
}