function createMatrixUnDir(matrixDir) {
  const size = matrixDir.length;

  const matrixUndir = matrixDir.map((row) => [...row]);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrixDir[i][j] === 1 || matrixDir[j][i] === 1) {
        matrixUndir[i][j] = 1;
        matrixUndir[j][i] = 1;
      }
    }
  }

  return matrixUndir;
}

export default createMatrixUnDir;
