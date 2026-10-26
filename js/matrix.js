/**
 * Matrix and Linear Algebra Engine for Web Page Ranking & Convergence Analyzer
 * Implements fundamental linear algebra operations, Markov chains, power iteration,
 * and exact eigenvector nullspace solver via Gaussian elimination.
 */

const LinAlg = {
  // Vector operations
  vecZeros(n) {
    return new Array(n).fill(0);
  },

  vecUniform(n) {
    return new Array(n).fill(1 / n);
  },

  vecNorm2(v) {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
  },

  vecNorm1(v) {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += Math.abs(v[i]);
    }
    return sum;
  },

  vecNormInf(v) {
    let max = 0;
    for (let i = 0; i < v.length; i++) {
      const abs = Math.abs(v[i]);
      if (abs > max) max = abs;
    }
    return max;
  },

  vecDiffNorm2(u, v) {
    let sum = 0;
    for (let i = 0; i < u.length; i++) {
      const diff = u[i] - v[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  },

  vecDiffNorm1(u, v) {
    let sum = 0;
    for (let i = 0; i < u.length; i++) {
      sum += Math.abs(u[i] - v[i]);
    }
    return sum;
  },

  vecNormalizeSum(v) {
    const sum = v.reduce((a, b) => a + b, 0);
    if (Math.abs(sum) < 1e-12) {
      return this.vecUniform(v.length);
    }
    return v.map(x => x / sum);
  },

  // Matrix operations
  matZeros(rows, cols) {
    const M = [];
    for (let i = 0; i < rows; i++) {
      M.push(new Array(cols).fill(0));
    }
    return M;
  },

  matIdentity(n) {
    const I = this.matZeros(n, n);
    for (let i = 0; i < n; i++) {
      I[i][i] = 1;
    }
    return I;
  },

  matClone(A) {
    return A.map(row => [...row]);
  },

  matVecMult(A, x) {
    const rows = A.length;
    const cols = x.length;
    const y = new Array(rows).fill(0);
    for (let i = 0; i < rows; i++) {
      let sum = 0;
      const row = A[i];
      for (let j = 0; j < cols; j++) {
        sum += row[j] * x[j];
      }
      y[i] = sum;
    }
    return y;
  },

  matMatMult(A, B) {
    const rA = A.length;
    const cA = A[0].length;
    const cB = B[0].length;
    const C = this.matZeros(rA, cB);
    for (let i = 0; i < rA; i++) {
      for (let k = 0; k < cA; k++) {
        const aik = A[i][k];
        for (let j = 0; j < cB; j++) {
          C[i][j] += aik * B[k][j];
        }
      }
    }
    return C;
  },

  /**
   * Constructs the Link / Adjacency Matrix A.
   * Convention in Markov PageRank: A[i][j] = 1 if page j points to page i.
   * Node j has outgoing links to all i where A[i][j] = 1.
   * Out-degree of page j is column sum: d_j = sum_{i} A[i][j].
   */
  buildAdjacencyMatrix(numNodes, edges) {
    const A = this.matZeros(numNodes, numNodes);
    const outDegrees = new Array(numNodes).fill(0);
    const inDegrees = new Array(numNodes).fill(0);

    for (const [from, to] of edges) {
      if (from >= 0 && from < numNodes && to >= 0 && to < numNodes) {
        if (A[to][from] === 0) {
          A[to][from] = 1;
          outDegrees[from]++;
          inDegrees[to]++;
        }
      }
    }
    return { A, outDegrees, inDegrees };
  },

  /**
   * Constructs Column-Stochastic Transition Matrix M.
   * M[i][j] = A[i][j] / outDegrees[j] if outDegrees[j] > 0
   * If dangling node (outDegrees[j] === 0), surfer jumps uniformly to all nodes: M[i][j] = 1 / numNodes.
   */
  normalizeTransitionMatrix(A, outDegrees) {
    const n = A.length;
    const M = this.matZeros(n, n);
    const danglingNodes = [];

    for (let j = 0; j < n; j++) {
      const d_j = outDegrees[j];
      if (d_j > 0) {
        for (let i = 0; i < n; i++) {
          M[i][j] = A[i][j] / d_j;
        }
      } else {
        danglingNodes.push(j);
        for (let i = 0; i < n; i++) {
          M[i][j] = 1 / n;
        }
      }
    }
    return { M, danglingNodes };
  },

  /**
   * Constructs the Google Matrix G:
   * G = d * M + (1 - d) / n * E
   * where E is an n x n matrix of ones.
   */
  buildGoogleMatrix(M, damping = 0.85) {
    const n = M.length;
    const G = this.matZeros(n, n);
    const teleportProb = (1 - damping) / n;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        G[i][j] = damping * M[i][j] + teleportProb;
      }
    }
    return G;
  },

  /**
   * Solves a system of linear equations B * x = b using
   * Gaussian elimination with partial pivoting.
   */
  solveLinearSystem(B, b) {
    const n = B.length;
    // Augmented matrix
    const aug = [];
    for (let i = 0; i < n; i++) {
      aug.push([...B[i], b[i]]);
    }

    // Forward elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot row
      let maxRow = i;
      let maxVal = Math.abs(aug[i][i]);
      for (let k = i + 1; k < n; k++) {
        const val = Math.abs(aug[k][i]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = k;
        }
      }

      if (maxRow !== i) {
        const tmp = aug[i];
        aug[i] = aug[maxRow];
        aug[maxRow] = tmp;
      }

      const pivot = aug[i][i];
      if (Math.abs(pivot) < 1e-14) {
        continue;
      }

      for (let k = i + 1; k < n; k++) {
        const factor = aug[k][i] / pivot;
        aug[k][i] = 0;
        for (let j = i + 1; j <= n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = aug[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= aug[i][j] * x[j];
      }
      if (Math.abs(aug[i][i]) > 1e-14) {
        x[i] = sum / aug[i][i];
      } else {
        x[i] = 0;
      }
    }

    return x;
  },

  /**
   * Solves for the stationary eigenvector of G corresponding to lambda = 1:
   * (G - I) * v = 0 with constraint sum(v_i) = 1.
   * Replaces the last row of (G - I) with [1, 1, ..., 1] and solves B * v = [0, ..., 0, 1]^T.
   */
  solveStationaryEigenvector(G) {
    const n = G.length;
    const B = this.matZeros(n, n);
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n; j++) {
        B[i][j] = G[i][j] - (i === j ? 1 : 0);
      }
    }
    // Last row enforces probability constraint: sum(v_i) = 1
    for (let j = 0; j < n; j++) {
      B[n - 1][j] = 1.0;
    }

    const b = new Array(n).fill(0);
    b[n - 1] = 1.0;

    let v = this.solveLinearSystem(B, b);
    v = this.vecNormalizeSum(v);

    // Compute residual norm ||G*v - v||_2
    const Gv = this.matVecMult(G, v);
    const residual = this.vecDiffNorm2(Gv, v);

    return { eigenvector: v, residual };
  },

  /**
   * Estimates the second dominant eigenvalue magnitude |lambda_2|
   * using Hotelling's deflation on G: G_deflated = G - lambda_1 * (v * 1^T)
   * Since lambda_1 = 1, G_deflated = G - v * 1^T.
   * Then runs power iteration on G_deflated.
   */
  estimateSecondEigenvalue(G, stationaryVector, maxIter = 50) {
    const n = G.length;
    const G_deflated = this.matZeros(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        G_deflated[i][j] = G[i][j] - stationaryVector[i];
      }
    }

    let u = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      u[i] = Math.sin(i + 1); // Non-uniform seed
    }
    let norm = this.vecNorm2(u);
    u = u.map(x => x / norm);

    let lambda2 = 0;
    for (let it = 0; it < maxIter; it++) {
      const uNext = this.matVecMult(G_deflated, u);
      const nextNorm = this.vecNorm2(uNext);
      if (nextNorm < 1e-12) {
        lambda2 = 0;
        break;
      }
      // Rayleigh quotient
      let dot = 0;
      for (let i = 0; i < n; i++) {
        dot += u[i] * uNext[i];
      }
      lambda2 = dot;
      u = uNext.map(x => x / nextNorm);
    }
    return Math.abs(lambda2);
  },

  /**
   * Performs Power Iteration:
   * v^{(k+1)} = G * v^{(k)}
   * Records every iteration for convergence analysis.
   */
  runPowerIteration(G, v0, tolerance = 1e-7, maxIter = 100) {
    let currentV = [...v0];
    const history = [];

    // Initial state (iteration 0)
    history.push({
      iteration: 0,
      vector: [...currentV],
      deltaL2: 0,
      deltaL1: 0,
      deltaLInf: 0,
      converged: false
    });

    let converged = false;
    let finalIter = 0;

    for (let k = 1; k <= maxIter; k++) {
      const nextV = this.matVecMult(G, currentV);
      // Ensure sum is 1.0 against floating point drift
      const normalizedNextV = this.vecNormalizeSum(nextV);

      const deltaL2 = this.vecDiffNorm2(normalizedNextV, currentV);
      const deltaL1 = this.vecDiffNorm1(normalizedNextV, currentV);
      const deltaLInf = this.vecNormInf(normalizedNextV.map((val, idx) => val - currentV[idx]));

      converged = deltaL2 < tolerance;
      currentV = normalizedNextV;

      history.push({
        iteration: k,
        vector: [...currentV],
        deltaL2,
        deltaL1,
        deltaLInf,
        converged
      });

      finalIter = k;
      if (converged) break;
    }

    return {
      history,
      converged,
      iterations: finalIter,
      finalVector: currentV
    };
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinAlg;
} else if (typeof window !== 'undefined') {
  window.LinAlg = LinAlg;
}
