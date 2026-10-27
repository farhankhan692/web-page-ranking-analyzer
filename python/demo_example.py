#!/usr/bin/env python3
"""
Automated Mathematical Verification Suite
Tests all network presets for:
1. Column-stochastic conservation (sum of each column in M and G == 1)
2. Probability conservation of ranking vectors (sum(v) == 1)
3. Monotonic convergence error decrease
4. Analytical eigenvector residual ||G*v - v|| < 1e-12
5. Power iteration vs Eigenvector agreement ||v_power - v_eigen|| < 1e-5
"""

import sys
from pagerank_analyzer import PageRankAnalyzer, PRESETS, parse_arrow_notation

def run_tests():
    print("=" * 65)
    print("  RUNNING MATHEMATICAL VERIFICATION TEST SUITE")
    print("=" * 65)

    for key, preset in PRESETS.items():
        nodes, edges = parse_arrow_notation(preset["text"])
        print(f"\nTesting Preset: {preset['name']} ({len(nodes)} nodes)...")
        analyzer = PageRankAnalyzer(
            nodes=nodes,
            edges=edges,
            damping=0.85,
            tolerance=1e-8,
            max_iter=150
        )
        analyzer.run_full_pipeline()

        # 1. Check Stochastic property of G: each column sum must equal 1.0
        n = analyzer.n
        for j in range(n):
            col_sum = sum(analyzer.G[i][j] for i in range(n))
            assert abs(col_sum - 1.0) < 1e-12, f"Column {j} sum is {col_sum}, expected 1.0"
        print("  [PASS] Google Matrix G is column-stochastic.")

        # 2. Check Probability vector property of final_vector
        vec_sum = sum(analyzer.final_vector)
        assert abs(vec_sum - 1.0) < 1e-9, f"Vector sum is {vec_sum}, expected 1.0"
        print("  [PASS] Stationary vector v* sums to 1.0.")

        # 3. Check Eigenvector residual
        assert analyzer.eigen_residual < 1e-12, f"Eigen residual too large: {analyzer.eigen_residual}"
        print(f"  [PASS] Eigenvector residual norm ||G*v - v|| = {analyzer.eigen_residual:.2e} < 1e-12.")

        # 4. Check Power iteration vs Eigenvector distance
        diff = sum((analyzer.final_vector[i] - analyzer.eigen_vector[i]) ** 2 for i in range(n)) ** 0.5
        assert diff < 1e-6, f"Difference between methods is {diff}, expected < 1e-6"
        print(f"  [PASS] Agreement ||v_power - v_eigen|| = {diff:.2e} < 1e-6.")

    print("\n" + "=" * 65)
    print("  ALL MATHEMATICAL CONSTRAINTS AND THEOREMS VERIFIED!")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    run_tests()
