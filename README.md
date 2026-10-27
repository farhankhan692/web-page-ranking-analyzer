# Web Page Ranking and Convergence Analyzer

> **Mini Project – Linear Algebra & Vector Calculus (Topic 53 &bull; Modules 1, 2, 3)**  
> An interactive mathematical simulation and analytical verification software for Google's PageRank algorithm, Markov chains, power iteration, and steady-state eigenvectors.

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Project Overview

This project implements a software solution for **Topic 53: Web Page Ranking and Convergence Analyzer**, following the prescribed sequential computational process:

```
Web links (Arrow Notation Input)
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

1. **Option 1: Arrow Notation Link Input**:
   - Easily enter or paste hyperlinks using natural syntax:
     ```text
     Page 1 -> Page 2, Page 3
     Page 2 -> Page 3
     Page 3 -> Page 1
     Page 4 -> Page 1, Page 3
     ```
   - Supports any custom node names (e.g. `Google -> YouTube, Gmail`), numbers (`1 -> 2, 3`), letters (`A -> B`), bidirectional connections (`A <-> B`), and dangling dead-end nodes.
   - Quick 1-click sample presets: *Stanford 4-Page*, *Star Hub*, *Linear Chain*, *Cyclic Ring*, *Spider Trap*, *Dangling Dead End*.

2. **Full Mathematical Pipeline**:
   - **Stage 2**: Adjacency Link Matrix $A$ ($A_{ij} = 1$ if $j \to i$).
   - **Stage 3**: Column-stochastic transition matrix $M$ with dangling node handling, and Google Matrix $G = d M + \frac{1-d}{n} \mathbf{E}$.
   - **Stage 4**: Initial probability vector $v^{(0)}$ (Uniform $1/n$ or custom manual values).
   - **Stage 5**: Power iteration step-by-step history table and animated playback.
   - **Stage 6**: Real-time convergence curves (Euclidean and Manhattan norms on log-scale) and individual page probability trajectories.
   - **Stage 7**: Final ranking leaderboard with percentage distribution.
   - **Stage 8**: Analytical eigenvector verification solving $(G - I)v = 0$ with $\sum v_i = 1$ via Gaussian Elimination with partial pivoting.

3. **Academic Presentation Ready**:
   - Pure client-side web application (works completely offline or deployed on GitHub Pages).
   - Export to CSV, JSON, and printable lab report.
   - Accompanied by a standalone Python 3 CLI engine (`python/pagerank_analyzer.py`) and verification suite (`python/demo_example.py`).

---

## 🌐 Deploy to GitHub Pages in 3 Simple Steps

You can host and deploy this interactive web application completely free on **GitHub Pages** with zero server setup!

### Step 1: Create a New GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository: `web-page-ranking-analyzer`.
3. Set the repository visibility to **Public**.
4. Leave other options unchecked and click **Create repository**.

### Step 2: Push This Code to GitHub
Open your terminal and run:

```bash
cd /Users/farhanullakhan/.gemini/antigravity/scratch/web-page-ranking-analyzer

# Link your remote repository (replace with your GitHub username)
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/web-page-ranking-analyzer.git

# Push the main branch
git branch -M main
git push -u origin main
```

*(Alternatively, you can drag and drop all files directly onto the GitHub repository web page via the **"uploading an existing file"** link!)*

### Step 3: Enable GitHub Pages
1. In your GitHub repository, click on **Settings** (tab at the top).
2. On the left sidebar, click on **Pages**.
3. Under **Build and deployment**:
   - **Source**: Select **Deploy from a branch**.
   - **Branch**: Select `main` and `/ (root)`.
   - Click **Save**.
4. In about 1 minute, your project will be live at:
   ```
   https://<YOUR-GITHUB-USERNAME>.github.io/web-page-ranking-analyzer/
   ```

---

## 🐍 Running the Python CLI Version

```bash
# Run default Stanford 4-node demonstration
python3 python/pagerank_analyzer.py

# Run with custom arrow notation links directly
python3 python/pagerank_analyzer.py --links "Google -> YouTube, Gmail\nYouTube -> Google\nGmail -> Google"

# Run automated mathematical verification test suite
python3 python/demo_example.py
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
