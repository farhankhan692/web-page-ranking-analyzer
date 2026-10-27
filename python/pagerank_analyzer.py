#!/usr/bin/env python3
"""
Web Page Ranking and Convergence Analyzer
Sequential Linear Algebra Computational Process:
Web links -> Adjacency matrix -> Matrix normalization -> Initial ranking vector
-> Repeated transformation -> Convergence analysis -> Final ranking -> Eigenvector verification

Zero external dependencies required (uses Python standard library).
Supports Option 1 Arrow Notation input:
e.g. "Page 1 -> Page 2, Page 3"
"""

import sys
import math
import json
import csv
import argparse

PRESETS = {
    "classic4": {
        "name": "Stanford 4-Page Web",
        "text": "P1 -> P2, P3\nP2 -> P3\nP3 -> P1\nP4 -> P1, P3"
    },
    "star": {
        "name": "Star Hub Network",
        "text": "Hub -> P1, P2, P3, P4\nP1 -> Hub\nP2 -> Hub\nP3 -> Hub\nP4 -> Hub"
    },
    "linear": {
        "name": "Linear Chain",
        "text": "P1 -> P2\nP2 -> P3\nP3 -> P4"
    },
    "cycle": {
        "name": "Cyclic Ring",
        "text": "P1 -> P2\nP2 -> P3\nP3 -> P4\nP4 -> P1"
    },
    "spiderTrap": {
        "name": "Spider Trap (Absorbing Node)",
        "text": "P1 -> P2\nP2 -> P3\nP3 -> P3"
    },
    "dangling": {
        "name": "Dangling Dead-End Node",
        "text": "P1 -> P2\nP2 -> P3\nP3\nP4 -> P1, P2"
    }
}

def parse_arrow_notation(text):
    """
    Parses links formatted in Option 1 Arrow Notation:
    Page 1 -> Page 2, Page 3
    A <-> B (bidirectional)
    DanglingPage (standalone)
    """
    lines = [l.strip() for l in text.strip().splitlines() if l.strip() and not l.strip().startswith(('#', '//'))]
    node_map = {}
    nodes = []
    raw_edges = []

    def get_or_create(label):
        clean = label.strip()
        if not clean:
            return None
        if clean not in node_map:
            idx = len(nodes)
            node_map[clean] = idx
            nodes.append(clean)
        return node_map[clean]

    for line in lines:
        if "<->" in line or "<=>" in line:
            parts = line.split("<->" if "<->" in line else "<=>")
            if len(parts) >= 2:
                left = parts[0].strip()
                rights = [r.strip() for r in parts[1].replace(';', ',').split(',') if r.strip()]
                l_idx = get_or_create(left)
                for r in rights:
                    r_idx = get_or_create(r)
                    if l_idx is not None and r_idx is not None:
                        raw_edges.append((l_idx, r_idx))
                        raw_edges.append((r_idx, l_idx))
                continue

        if any(arrow in line for arrow in ["->", "=>", "-->", "→"]):
            for arrow in ["-->", "->", "=>", "→"]:
                if arrow in line:
                    parts = line.split(arrow, 1)
                    break
            source = parts[0].strip()
            s_idx = get_or_create(source)
            if len(parts) > 1 and parts[1].strip():
                targets = [t.strip() for t in parts[1].replace(';', ',').split(',') if t.strip()]
                for target in targets:
                    t_idx = get_or_create(target)
                    if s_idx is not None and t_idx is not None:
                        raw_edges.append((s_idx, t_idx))
        else:
            get_or_create(line)

    edges = list(dict.fromkeys(raw_edges))
    return nodes, edges


class PageRankAnalyzer:
    def __init__(self, nodes, edges, damping=0.85, tolerance=1e-7, max_iter=100):
        self.nodes = nodes
        self.edges = edges
        self.n = len(nodes)
        self.damping = damping
        self.tolerance = tolerance
        self.max_iter = max_iter

        # Computed structures
        self.A = None
        self.out_degrees = None
        self.in_degrees = None
        self.M = None
        self.dangling_nodes = []
        self.G = None
        self.v0 = None
        self.history = []
        self.final_vector = None
        self.converged = False
        self.eigen_vector = None
        self.eigen_residual = 0.0

    def step1_build_adjacency_matrix(self):
        """Constructs Adjacency Matrix A where A[i][j] = 1 if j points to i."""
        self.A = [[0] * self.n for _ in range(self.n)]
        self.out_degrees = [0] * self.n
        self.in_degrees = [0] * self.n

        for u, v in self.edges:
            if 0 <= u < self.n and 0 <= v < self.n:
                if self.A[v][u] == 0:
                    self.A[v][u] = 1
                    self.out_degrees[u] += 1
                    self.in_degrees[v] += 1
        return self.A

    def step2_normalize_transition_matrix(self):
        """Constructs column-stochastic matrix M, handling dangling nodes."""
        self.M = [[0.0] * self.n for _ in range(self.n)]
        self.dangling_nodes = []

        for j in range(self.n):
            d_j = self.out_degrees[j]
            if d_j > 0:
                for i in range(self.n):
                    self.M[i][j] = self.A[i][j] / d_j
            else:
                self.dangling_nodes.append(j)
                for i in range(self.n):
                    self.M[i][j] = 1.0 / self.n
        return self.M

    def step3_build_google_matrix(self):
        """Constructs Google Matrix G = d*M + (1-d)/n * E."""
        self.G = [[0.0] * self.n for _ in range(self.n)]
        teleport = (1.0 - self.damping) / self.n
        for i in range(self.n):
            for j in range(self.n):
                self.G[i][j] = self.damping * self.M[i][j] + teleport
        return self.G

    def step4_set_initial_vector(self, custom_v0=None):
        """Sets initial ranking vector v0 (default uniform 1/n)."""
        if custom_v0 is not None:
            s = sum(custom_v0)
            self.v0 = [x / s for x in custom_v0]
        else:
            self.v0 = [1.0 / self.n] * self.n
        return self.v0

    def step5_repeated_transformation_power_iteration(self):
        """Executes v^(k+1) = G * v^(k) until ||v^(k+1) - v^(k)|| < tolerance."""
        curr = list(self.v0)
        self.history = [{
            "k": 0,
            "v": list(curr),
            "delta_l2": 0.0,
            "delta_l1": 0.0,
            "converged": False
        }]

        for k in range(1, self.max_iter + 1):
            next_v = [0.0] * self.n
            for i in range(self.n):
                next_v[i] = sum(self.G[i][j] * curr[j] for j in range(self.n))

            # Normalize against numerical drift
            s = sum(next_v)
            next_v = [x / s for x in next_v]

            delta_l2 = math.sqrt(sum((next_v[i] - curr[i]) ** 2 for i in range(self.n)))
            delta_l1 = sum(abs(next_v[i] - curr[i]) for i in range(self.n))
            converged = delta_l2 < self.tolerance

            self.history.append({
                "k": k,
                "v": list(next_v),
                "delta_l2": delta_l2,
                "delta_l1": delta_l1,
                "converged": converged
            })

            curr = next_v
            if converged:
                self.converged = True
                break

        self.final_vector = curr
        return self.history

    def step7_verify_eigenvector(self):
        """
        Solves (G - I)v = 0 with constraint sum(v_i) = 1
        via Gaussian Elimination with partial pivoting.
        """
        n = self.n
        B = [[self.G[i][j] - (1.0 if i == j else 0.0) for j in range(n)] for i in range(n)]
        B[n - 1] = [1.0] * n
        b = [0.0] * (n - 1) + [1.0]

        aug = [B[i][:] + [b[i]] for i in range(n)]

        for i in range(n):
            max_row = i
            max_val = abs(aug[i][i])
            for k in range(i + 1, n):
                if abs(aug[k][i]) > max_val:
                    max_val = abs(aug[k][i])
                    max_row = k

            if max_row != i:
                aug[i], aug[max_row] = aug[max_row], aug[i]

            pivot = aug[i][i]
            if abs(pivot) < 1e-12:
                continue

            for k in range(i + 1, n):
                factor = aug[k][i] / pivot
                aug[k][i] = 0.0
                for j in range(i + 1, n + 1):
                    aug[k][j] -= factor * aug[i][j]

        x = [0.0] * n
        for i in range(n - 1, -1, -1):
            s = aug[i][n]
            for j in range(i + 1, n):
                s -= aug[i][j] * x[j]
            x[i] = s / aug[i][i] if abs(aug[i][i]) > 1e-12 else 0.0

        s = sum(x)
        self.eigen_vector = [val / s for val in x]

        Gv = [sum(self.G[i][j] * self.eigen_vector[j] for j in range(n)) for i in range(n)]
        self.eigen_residual = math.sqrt(sum((Gv[i] - self.eigen_vector[i]) ** 2 for i in range(n)))
        return self.eigen_vector

    def run_full_pipeline(self):
        self.step1_build_adjacency_matrix()
        self.step2_normalize_transition_matrix()
        self.step3_build_google_matrix()
        self.step4_set_initial_vector()
        self.step5_repeated_transformation_power_iteration()
        self.step7_verify_eigenvector()
        return self

    def print_report(self):
        sep = "=" * 76
        subsep = "-" * 76
        print("\n" + sep)
        print("    WEB PAGE RANKING & CONVERGENCE ANALYZER - COMPUTATION REPORT")
        print(sep)
        print(f"Total Pages: {self.n} | Total Links: {len(self.edges)} | Damping Factor (d): {self.damping}")
        print(f"Convergence Tolerance: {self.tolerance:.1e} | Max Iterations: {self.max_iter}")
        dangling_str = ", ".join(self.nodes[i] for i in self.dangling_nodes) if self.dangling_nodes else "None"
        print(f"Dangling Dead-End Pages: {dangling_str}")

        print("\n[STAGE 2] Adjacency Matrix (A):")
        print("       " + "  ".join(f"{self.nodes[j][:4]:>5}" for j in range(self.n)))
        for i in range(self.n):
            row_str = "  ".join(f"{self.A[i][j]:>5}" for j in range(self.n))
            print(f"{self.nodes[i][:4]:>5} [ {row_str} ]")

        print("\n[STAGE 3] Normalized Google Matrix (G = d*M + (1-d)/n * E):")
        print("       " + "  ".join(f"{self.nodes[j][:4]:>7}" for j in range(self.n)))
        for i in range(self.n):
            row_str = "  ".join(f"{self.G[i][j]:>7.4f}" for j in range(self.n))
            print(f"{self.nodes[i][:4]:>5} [ {row_str} ]")

        print("\n[STAGE 4] Initial Probability Vector v^(0):")
        print("  " + ", ".join(f"{self.nodes[i]}: {self.v0[i]:.4f}" for i in range(self.n)))

        print("\n[STAGE 5] Repeated Transformation / Power Iteration History:")
        print(subsep)
        header = f"  {'k':>3} | " + " | ".join(f"{self.nodes[i][:6]:>7}" for i in range(self.n)) + f" | {'||v_k - v_(k-1)||_2':>18}"
        print(header)
        print(subsep)
        for step in self.history:
            v_str = " | ".join(f"{val:>7.5f}" for val in step["v"])
            diff_str = f"{step['delta_l2']:>18.3e}" if step["k"] > 0 else f"{'---':>18}"
            print(f"  {step['k']:>3} | {v_str} | {diff_str}")
        print(subsep)
        print(f"Convergence Status: {'CONVERGED in ' + str(len(self.history)-1) + ' steps' if self.converged else 'MAX ITERATIONS REACHED'}")

        print("\n[STAGE 7] Final Page Importance Ranking:")
        ranked = sorted(
            [{"page": self.nodes[i], "score": self.final_vector[i], "in": self.in_degrees[i], "out": self.out_degrees[i]} for i in range(self.n)],
            key=lambda x: x["score"],
            reverse=True
        )
        for rank, item in enumerate(ranked, 1):
            pct = item["score"] * 100.0
            print(f"  Rank #{rank}: {item['page']:<16} | Score = {item['score']:.6f} ({pct:>5.2f}%) | In-links: {item['in']} | Out-links: {item['out']}")

        print("\n[STAGE 8] Analytical Eigenvector Verification (Perron-Frobenius):")
        eigen_diff = math.sqrt(sum((self.final_vector[i] - self.eigen_vector[i]) ** 2 for i in range(self.n)))
        print(f"  System: (G - I)v = 0 with sum(v_i) = 1")
        print(f"  Residual Norm ||G * v_eigen - v_eigen||_2 : {self.eigen_residual:.3e}")
        print(f"  Norm Difference ||v_power - v_eigen||_2    : {eigen_diff:.3e}")
        if eigen_diff < 1e-4:
            print("  ==> VERIFICATION PASSED: Power iteration matches stationary eigenvector exactly!")
        else:
            print("  ==> VERIFICATION APPROXIMATE: Increase iterations or tighten tolerance.")
        print(sep + "\n")


def main():
    parser = argparse.ArgumentParser(description="Web Page Ranking and Convergence Analyzer CLI")
    parser.add_argument("--links", type=str, default=None, help="Input page links in Option 1 Arrow Notation (e.g. 'P1 -> P2, P3\\nP2 -> P3')")
    parser.add_argument("--preset", choices=list(PRESETS.keys()), default="classic4", help="Choose a network topology preset")
    parser.add_argument("--damping", type=float, default=0.85, help="Google damping factor d (0.0 to 1.0)")
    parser.add_argument("--tolerance", type=float, default=1e-7, help="Convergence tolerance epsilon")
    parser.add_argument("--max_iter", type=int, default=100, help="Maximum iteration cutoff")
    args = parser.parse_args()

    if args.links:
        print("\nParsing custom arrow notation links...")
        nodes, edges = parse_arrow_notation(args.links)
    else:
        preset_data = PRESETS[args.preset]
        print(f"\nLoading preset: {preset_data['name']}...")
        nodes, edges = parse_arrow_notation(preset_data["text"])

    analyzer = PageRankAnalyzer(
        nodes=nodes,
        edges=edges,
        damping=args.damping,
        tolerance=args.tolerance,
        max_iter=args.max_iter
    )
    analyzer.run_full_pipeline()
    analyzer.print_report()

if __name__ == "__main__":
    main()
