function createRandomMatrix(size, seed) {
  const seedFactory = Math.seedrandom;
  const rng = seedFactory(seed.toString());

  const matrix = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      const value = rng() * 2.0;
      row.push(value);
    }
    matrix.push(row);
  }
  return matrix;
}

export default createRandomMatrix;