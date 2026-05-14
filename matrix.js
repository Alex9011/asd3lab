function createMatrix(n, seed) {
  const seedFactory = Math.seedrandom;

  const rng = seedFactory(seed.toString());

  const A = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const value = rng() * 2.0;
      row.push(value);
    }
    A.push(row);
  }
  return A;
}

export default createMatrix;