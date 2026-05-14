function buildUndirectedMatrix(directedMatrix) {
  const size = directedMatrix.length;
  const undirectedMatrix = directedMatrix.map((row) => [...row]);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (directedMatrix[i][j] === 1 || directedMatrix[j][i] === 1) {
        undirectedMatrix[i][j] = 1;
        undirectedMatrix[j][i] = 1;
      }
    }
  }

  return undirectedMatrix;
}

export default buildUndirectedMatrix;
