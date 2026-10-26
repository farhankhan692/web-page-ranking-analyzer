# Mini Project Report: Linear Algebra & Vector Calculus

## Project 53: Web Page Ranking and Convergence Analyzer

**Academic Course:** Linear Algebra & Vector Calculus  
**Modules Covered:** Module 1, Module 2, Module 3  
**Implementation Medium:** Interactive Web Application (GitHub Pages) & Standalone Python Engine  

---

## 1. Aim and Objectives

### 1.1 Aim
To develop a mathematical software-based Page-Ranking model based on discrete-time Markov chains and study the convergence characteristics of its ranking vector through repeated linear transformations and analytical eigenvector verification.

### 1.2 Prescribed Sequential Computational Process
The computational pipeline executes eight sequential stages where the output of each stage serves strictly as the input to the subsequent stage:

$$\text{Web Links} \longrightarrow \text{Adjacency Matrix } (A) \longrightarrow \text{Matrix Normalization } (M, G) \longrightarrow \text{Initial Ranking Vector } (v^{(0)}) \longrightarrow \text{Repeated Transformation } (v^{(k+1)} = Gv^{(k)}) \longrightarrow \text{Convergence Analysis } (\delta_k < \epsilon) \longrightarrow \text{Final Ranking} \longrightarrow \text{Eigenvector Verification } ((G - I)v^* = 0)$$

---

## 2. Mathematical Concepts and Formulations

The project integrates **five major concepts** in linear algebra:

### Concept 1: Matrices (Link Adjacency & Transition Matrices)
Consider a collection of $n$ web pages represented by vertices $V = \{P_1, P_2, \dots, P_n\}$ in a directed graph $G = (V, E)$.

1. **Adjacency Matrix $A \in \mathbb{R}^{n \times n}$**:
   Defined such that $A_{ij} = 1$ if page $P_j$ links to page $P_i$, and $0$ otherwise:
   $$A_{ij} = \begin{cases} 1 & \text{if } (P_j \to P_i) \in E \\ 0 & \text{otherwise} \end{cases}$$
   The out-degree of page $P_j$ is given by the column sum:
   $$d_j = \sum_{i=1}^n A_{ij}$$

2. **Column-Stochastic Transition Matrix $M \in \mathbb{R}^{n \times n}$**:
   Each entry $M_{ij}$ represents the conditional probability that a random web surfer on page $P_j$ moves to page $P_i$:
   $$M_{ij} = \begin{cases} \frac{A_{ij}}{d_j} & \text{if } d_j > 0 \\ \frac{1}{n} & \text{if } d_j = 0 \quad (\text{Dangling Node / Dead-End}) \end{cases}$$
   By construction, every column of $M$ sums to $1$:
   $$\sum_{i=1}^n M_{ij} = 1 \quad \forall j \in \{1, \dots, n\}$$

### Concept 2: Markov Chains & Google Matrix Regularization
In an arbitrary directed graph, two structural pathologies violate ergodicity:
1. **Dangling Nodes:** Pages with no outgoing links ($d_j = 0$), causing probability loss.
2. **Spider Traps:** Strongly connected subgraphs with no external outgoing links, trapping random surfers.

To satisfy the **Perron-Frobenius Theorem**, the transition matrix is regularized using a damping factor $d \in (0, 1)$ (typically $d = 0.85$):
$$G = d M + \frac{1 - d}{n} \mathbf{E}$$
where $\mathbf{E} = \mathbf{1}\mathbf{1}^T$ is an $n \times n$ matrix of all ones. Because $G_{ij} > 0$ strictly for all $i, j$, $G$ is a **primitive positive column-stochastic matrix**.

### Concept 3: Vectors & Linear Transformations
The state of the system at time step $k$ is represented by a probability vector $v^{(k)} \in \mathbb{R}^n$ where $v_i^{(k)} \ge 0$ and $\|v^{(k)}\|_1 = \sum_{i=1}^n v_i^{(k)} = 1$.

The transition from state $k$ to state $k+1$ is defined by a **linear transformation** $T: \mathbb{R}^n \to \mathbb{R}^n$:
$$v^{(k+1)} = T(v^{(k)}) = G v^{(k)}$$
Because $G$ is column-stochastic:
$$\|v^{(k+1)}\|_1 = \mathbf{1}^T (G v^{(k)}) = (\mathbf{1}^T G) v^{(k)} = \mathbf{1}^T v^{(k)} = 1$$
Probability mass is strictly conserved under repeated transformations.

### Concept 4: Power Iteration & Convergence Analysis
Starting from an initial vector $v^{(0)}$ (e.g., uniform $v_i^{(0)} = \frac{1}{n}$), repeated linear transformation yields:
$$v^{(k)} = G^k v^{(0)}$$
At each iteration $k$, the Euclidean ($\ell_2$) convergence metric is evaluated:
$$\delta_k = \|v^{(k+1)} - v^{(k)}\|_2 = \sqrt{\sum_{i=1}^n \left(v_i^{(k+1)} - v_i^{(k)}\right)^2}$$
Iteration terminates when $\delta_k < \epsilon$ where $\epsilon$ is a specified tolerance (e.g., $10^{-7}$).

**Asymptotic Rate of Convergence:**  
By spectral decomposition, any vector $v^{(0)}$ can be expressed as a linear combination of the eigenvectors of $G$:
$$v^{(0)} = c_1 v_1 + c_2 v_2 + \dots + c_n v_n$$
Applying $G^k$:
$$v^{(k)} = c_1 \lambda_1^k v_1 + \sum_{i=2}^n c_i \lambda_i^k v_i$$
Since $\lambda_1 = 1$ and $|\lambda_i| \le d < 1$ for all $i \ge 2$:
$$\|v^{(k)} - v^*\| = \mathcal{O}(|\lambda_2|^k) \le \mathcal{O}(d^k)$$
The rate of convergence is governed by the second dominant eigenvalue $\lambda_2$. The quantity $\gamma = 1 - |\lambda_2|$ is the **spectral gap**.

### Concept 5: Eigenvalues & Eigenvectors (Stationary State Verification)
At steady-state equilibrium ($k \to \infty$):
$$v^* = G v^* \iff (G - I) v^* = \mathbf{0}$$
Thus, $v^*$ is the principal eigenvector of $G$ associated with eigenvalue $\lambda = 1$.

To verify the power iteration result analytically without iterative approximations, we solve the homogeneous system:
$$(G - I) v^* = \mathbf{0} \quad \text{subject to} \quad \sum_{i=1}^n v_i^* = 1$$
Because $\mathbf{1}^T (G - I) = \mathbf{0}^T$, the rows of $(G - I)$ are linearly dependent. We replace the last row of $(G - I)$ with $\mathbf{1}^T = [1, 1, \dots, 1]$ and solve the non-singular $n \times n$ system:
$$\begin{bmatrix} (G - I)_{1:n-1, :} \\ 1 \quad 1 \dots 1 \end{bmatrix} v^* = \begin{bmatrix} 0 \\ \vdots \\ 0 \\ 1 \end{bmatrix}$$
using Gaussian Elimination with partial pivoting.

---

## 3. Program Implementation Details

The project is implemented in two complementary forms:
1. **Interactive Client-Side Web Application:**
   - HTML5 / CSS3 / Vanilla JavaScript (zero external backend, works completely offline or on GitHub Pages).
   - Draggable directed graph visualizer using HTML5 Canvas.
   - Real-time Chart.js convergence plots (logarithmic scale) and page rank trajectories.
   - KaTeX rendering for mathematical equations.
   - Export to CSV, JSON, and printable lab report.
2. **Standalone Python Analyzer (`python/pagerank_analyzer.py`):**
   - Pure Python 3 standard library implementation.
   - Comprehensive test suite (`python/demo_example.py`).

---

## 4. Test Results & Numerical Verification

### Test Case: Stanford 4-Node Web Example
- **Nodes:** $P_1, P_2, P_3, P_4$
- **Hyperlinks:** $P_1 \to P_2, P_3$; $P_2 \to P_3$; $P_3 \to P_1$; $P_4 \to P_1, P_3$.
- **Damping factor:** $d = 0.85$, $\epsilon = 10^{-7}$.

#### Adjacency Matrix ($A$):
$$A = \begin{bmatrix} 0 & 0 & 1 & 1 \\ 1 & 0 & 0 & 0 \\ 1 & 1 & 0 & 1 \\ 0 & 0 & 0 & 0 \end{bmatrix}$$

#### Out-Degree Vector:
$$d = [2, 1, 1, 2]^T$$

#### Normalized Transition Matrix ($M$):
$$M = \begin{bmatrix} 0 & 0 & 1 & 0.5 \\ 0.5 & 0 & 0 & 0 \\ 0.5 & 1 & 0 & 0.5 \\ 0 & 0 & 0 & 0 \end{bmatrix}$$

#### Google Matrix ($G$ for $d = 0.85$):
$$G = \begin{bmatrix} 0.0375 & 0.0375 & 0.8875 & 0.4625 \\ 0.4625 & 0.0375 & 0.0375 & 0.0375 \\ 0.4625 & 0.8875 & 0.0375 & 0.4625 \\ 0.0375 & 0.0375 & 0.0375 & 0.0375 \end{bmatrix}$$

#### Iteration History & Convergence:
| Iteration ($k$) | $v_1^{(k)}$ | $v_2^{(k)}$ | $v_3^{(k)}$ | $v_4^{(k)}$ | $\|v^{(k)} - v^{(k-1)}\|_2$ |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 0.250000 | 0.250000 | 0.250000 | 0.250000 | --- |
| 1 | 0.356250 | 0.143750 | 0.462500 | 0.037500 | $3.360 \times 10^{-1}$ |
| 5 | 0.382803 | 0.206080 | 0.373617 | 0.037500 | $3.396 \times 10^{-2}$ |
| 10 | 0.380872 | 0.198717 | 0.382911 | 0.037500 | $2.877 \times 10^{-3}$ |
| 20 | 0.379737 | 0.198884 | 0.383879 | 0.037500 | $2.413 \times 10^{-5}$ |
| 31 | 0.379734 | 0.198887 | 0.383879 | 0.037500 | $9.258 \times 10^{-8}$ |

**Status:** Converged in 31 iterations.

#### Final Ranking:
1. **Rank #1:** Page $P_3$ — Score: $0.383879$ ($38.39\%$)
2. **Rank #2:** Page $P_1$ — Score: $0.379734$ ($37.97\%$)
3. **Rank #3:** Page $P_2$ — Score: $0.198887$ ($19.89\%$)
4. **Rank #4:** Page $P_4$ — Score: $0.037500$ ($3.75\%$)

#### Analytical Eigenvector Verification:
- Gaussian Elimination exact stationary vector: $v_{\text{eigen}} = [0.379734, 0.198887, 0.383879, 0.037500]^T$.
- Residual norm: $\|G v_{\text{eigen}} - v_{\text{eigen}}\|_2 = 8.78 \times 10^{-17} \approx 0$.
- Difference between power iteration and exact eigenvector:
  $$\|v_{\text{power}}^* - v_{\text{eigen}}^*\|_2 = 3.83 \times 10^{-8} < 10^{-7}$$
- **Conclusion:** Perfect numerical verification confirmed.

---

## 5. Viva Voce Preparation & Key Questions

1. **Why is PageRank formulated as a Markov chain?**  
   A web surfer randomly clicking hyperlinks transition between discrete states (pages) where the next state depends only on the current page, satisfying the Markov property.

2. **Why must $M$ be column-stochastic?**  
   Each column $j$ is the conditional probability distribution $\Pr(X_{k+1} = i \mid X_k = j)$. The sum of probabilities over all possible destinations must equal 1: $\sum_{i=1}^n M_{ij} = 1$.

3. **What is the significance of the damping factor $d = 0.85$?**  
   It balances following actual link structure ($85\%$ probability) with random teleportation ($15\%$ probability). This makes the transition matrix strictly positive, guaranteeing ergodicity and a unique stationary distribution under the Perron-Frobenius theorem.

4. **What determines the convergence speed of Power Iteration?**  
   The second eigenvalue magnitude $|\lambda_2| \le d$. The spectral gap $(1 - |\lambda_2|)$ determines the exponential decay rate of error.

---

## 6. Conclusion
The project successfully realizes an end-to-end software platform demonstrating the sequential application of matrices, vectors, linear transformations, Markov chains, and eigenvector analysis. Both iterative numerical simulation and analytical linear system solutions converge to the exact same steady-state distribution.
