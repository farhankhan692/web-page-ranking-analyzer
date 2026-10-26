# Web Page Ranking and Convergence Analyzer

> **Mini Project – Linear Algebra & Vector Calculus (Topic 53 &bull; Modules 1, 2, 3)**  
> An interactive mathematical simulation and analytical verification software for Google's PageRank algorithm, Markov chains, power iteration, and steady-state eigenvectors.

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Project Overview

This project implements a software solution for **Topic 53: Web Page Ranking and Convergence Analyzer**, following the prescribed sequential computational process:

```
Web links 
   │
   ▼
Adjacency matrix (A)
   │
   ▼
Matrix normalization (M, G)
   │
   ▼
Initial ranking vector (v⁰)
   │
   ▼
Repeated transformation (Power Iteration: v^(k+1) = G · v^(k))
   │
   ▼
Convergence analysis (||v^(k+1) - v^(k)||₂ < ε)
   │
   ▼
Final ranking
   │
   ▼
Eigenvector verification ((G - I)v* = 0, λ = 1)
```

---

## 🚀 Key Features

1. **Interactive Visual Directed Graph**:
   - Canvas-based drag-and-drop web network editor.
   - Dynamic node scaling proportional to PageRank score.
   - Presets included: *Classic 4-Page Web*, *Star Hub*, *Linear Chain*, *Cyclic Ring*, *Spider Trap*, *Dangling Dead End*.

2. **Full Mathematical Pipeline**:
   - **Stage 2**: Adjacency Link Matrix $A$ ($A_{ij} = 1$ if $j \to i$).
   - **Stage 3**: Column-stochastic transition matrix $M$ with dangling node handling, and Google Matrix $G = d M + \frac{1-d}{n} \mathbf{E}$.
   - **Stage 4**: Initial probability vector $v^{(0)}$ (Uniform, Biased, or Custom manual values).
   - **Stage 5**: Power iteration step-by-step history table and animated playback.
   - **Stage 6**: Real-time convergence curves (Euclidean and Manhattan norms on log-scale) and individual page probability trajectories.
   - **Stage 7**: Final ranking leaderboard with percentage distribution.
   - **Stage 8**: Analytical eigenvector verification solving $(G - I)v = 0$ with $\sum v_i = 1$ via Gaussian Elimination with partial pivoting.

3. **Academic Presentation Ready**:
   - Built-in **Viva Voce & Interview Guide** with model answers for college presentation.
   - One-click **PDF Report Generation** and CSV / JSON data export.
   - Accompanied by a standalone Python 3 CLI engine (`python/pagerank_analyzer.py`) and test suite (`python/demo_example.py`).

---

## 🌐 Deploy to GitHub Pages in 3 Simple Steps

You can host and deploy this interactive web application completely free on **GitHub Pages** with zero server setup!

### Step 1: Create a New GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (for example: `web-page-ranking-analyzer`).
3. Set the repository visibility to **Public**.
4. Leave other options unchecked and click **Create repository**.

### Step 2: Push This Code to GitHub
Open your terminal and run the following commands inside this project directory:

```bash
cd /Users/farhanullakhan/.gemini/antigravity/scratch/web-page-ranking-analyzer

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Complete Web Page Ranking and Convergence Analyzer"

# Set main branch and link your remote GitHub repo
git branch -M main
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/web-page-ranking-analyzer.git

# Push the project to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. In your GitHub repository, click on **Settings** (tab at the top).
2. On the left sidebar, click on **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select **Deploy from a branch**.
   - **Branch**: Select `main` and `/ (root)`.
   - Click **Save**.
4. In about 1–2 minutes, your project will be live at:
   ```
   https://<YOUR-GITHUB-USERNAME>.github.io/web-page-ranking-analyzer/
   ```

*(Alternatively, the included `.github/workflows/deploy.yml` workflow will automatically trigger and deploy via GitHub Actions!)*

---

## 🐍 Running the Python CLI Version

The repository also includes a standalone, pure Python 3 implementation that requires **no external packages**:

```bash
# Run default Stanford 4-node demonstration
python3 python/pagerank_analyzer.py

# Run with custom parameters or presets
python3 python/pagerank_analyzer.py --preset star --damping 0.85 --tolerance 1e-8

# Run automated mathematical verification test suite
python3 python/demo_example.py
```

### Presets Available in Python CLI:
- `classic4`: Stanford 4-page reference web
- `star`: Central hub with satellite authority links
- `linear`: Directed cascade chain
- `cycle`: Symmetric closed loop
- `spiderTrap`: Absorbing self-loop node
- `dangling`: Dead-end node with zero out-degree

---

## 📐 Major Mathematical Concepts Covered

| Concept | Mathematical Application |
|---|---|
| **Matrices** | Link Adjacency Matrix $A$, Column-Stochastic Transition Matrix $M$, Google Matrix $G$. |
| **Vectors** | Initial Probability Vector $v^{(0)}$, Iteration Vectors $v^{(k)}$, Steady-State Ranking $v^*$. |
| **Linear Transformations** | State transition mapping $T(v) = Gv$ preserving unit $\ell_1$-norm ($\|v\|_1 = 1$). |
| **Markov Chains** | Discrete-time finite state ergodic Markov process with teleportation. |
| **Eigenvalues & Eigenvectors** | Dominant eigenvalue $\lambda_1 = 1$; analytical nullspace solution to $(G - I)v = 0$ via Gaussian Elimination. |

---

## 📂 Repository File Structure

```
web-page-ranking-analyzer/
├── index.html                   # Main interactive web application
├── css/
│   └── style.css                # Academic UI styling & print stylesheet
├── js/
│   ├── matrix.js                # Pure linear algebra engine (Gaussian elimination, power iteration)
│   ├── graph.js                 # Interactive HTML5 Canvas directed graph visualizer
│   └── app.js                   # Application controller, Chart.js integrations & presets
├── python/
│   ├── pagerank_analyzer.py     # Standalone Python CLI analyzer
│   └── demo_example.py          # Automated theorem verification test suite
├── .github/
│   └── workflows/
│       └── deploy.yml           # Automated GitHub Pages CI/CD workflow
├── PROJECT_REPORT.md            # Comprehensive academic lab & project report
├── README.md                    # Project documentation and deployment guide
└── LICENSE                      # MIT Open Source License
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
