function buildDirectedMatrix(baseMatrix, coefficient) {
  return baseMatrix.map((row) =>
    row.map((value) => (value * coefficient >= 1 ? 1 : 0)),
  );
}

export default buildDirectedMatrix;
