function matrixDir(matrix, k) {
  return matrix.map((row) => row.map((value) => (value * k >= 1 ? 1 : 0)));
}

export default matrixDir;
