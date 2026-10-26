/**
 * Main Application Controller for Web Page Ranking & Convergence Analyzer
 * Orchestrates linear algebra computations, graph visualization, charts,
 * step-by-step sequential process, and verification.
 */

// Preset Networks
const PRESETS = {
  classic4: {
    name: "Classic 4-Page Web",
    description: "Standard 4-page Stanford example with balanced link interplay.",
    nodes: [{ label: "P1" }, { label: "P2" }, { label: "P3" }, { label: "P4" }],
    edges: [[0, 1], [0, 2], [1, 2], [2, 0], [3, 0], [3, 2]]
  },
  star: {
    name: "Star Hub Network",
    description: "Central authority node P1 connected bidirectionally to satellite nodes.",
    nodes: [{ label: "P1 (Hub)" }, { label: "P2" }, { label: "P3" }, { label: "P4" }, { label: "P5" }],
    edges: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 0], [2, 0], [3, 0], [4, 0]]
  },
  linear: {
    name: "Linear Chain",
    description: "Sequential cascade P1 -> P2 -> P3 -> P4 demonstrating rank accumulation.",
    nodes: [{ label: "P1" }, { label: "P2" }, { label: "P3" }, { label: "P4" }],
    edges: [[0, 1], [1, 2], [2, 3]]
  },
  cycle: {
    name: "Cyclic Ring",
    description: "Closed symmetric loop P1 -> P2 -> P3 -> P4 -> P1 yielding uniform distribution.",
    nodes: [{ label: "P1" }, { label: "P2" }, { label: "P3" }, { label: "P4" }],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0]]
  },
  spiderTrap: {
    name: "Spider Trap (Absorbing Node)",
    description: "Node P3 loops onto itself, trapping random surfers when damping d = 1.0.",
    nodes: [{ label: "P1" }, { label: "P2" }, { label: "P3 (Trap)" }],
    edges: [[0, 1], [1, 2], [2, 2]]
  },
  dangling: {
    name: "Dangling Dead-End Node",
    description: "Page P3 has no outgoing links; requires uniform teleportation normalization.",
    nodes: [{ label: "P1" }, { label: "P2" }, { label: "P3 (Dead End)" }, { label: "P4" }],
    edges: [[0, 1], [1, 2], [3, 0], [3, 1]]
  }
};

class AppController {
  constructor() {
    this.graph = null;
    this.chart = null;
    this.rankTrajectoryChart = null;
    this.animationTimer = null;
    this.currentStepIndex = 0;
    this.analysisData = null;

    // Simulation params
    this.damping = 0.85;
    this.tolerance = 1e-7;
    this.maxIter = 100;
    this.initVectorType = 'uniform';

    this.init();
  }

  init() {
    // Initialize graph canvas
    this.graph = new InteractiveGraph('networkCanvas', {
      onChange: () => this.runAnalysis()
    });

    // Populate preset dropdown
    const presetSelect = document.getElementById('presetSelect');
    Object.entries(PRESETS).forEach(([key, preset]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = preset.name;
      presetSelect.appendChild(opt);
    });

    // Bind event listeners
    this.bindEvents();

    // Load initial preset
    this.loadPreset('classic4');
  }

  bindEvents() {
    // Preset change
    document.getElementById('presetSelect').addEventListener('change', (e) => {
      this.loadPreset(e.target.value);
    });

    // Damping factor slider and number input synchronization
    const dampingSlider = document.getElementById('dampingSlider');
    const dampingInput = document.getElementById('dampingInput');
    dampingSlider.addEventListener('input', (e) => {
      dampingInput.value = e.target.value;
      this.damping = parseFloat(e.target.value);
      this.runAnalysis();
    });
    dampingInput.addEventListener('input', (e) => {
      dampingSlider.value = e.target.value;
      this.damping = parseFloat(e.target.value);
      this.runAnalysis();
    });

    // Tolerance input
    document.getElementById('toleranceSelect').addEventListener('change', (e) => {
      this.tolerance = parseFloat(e.target.value);
      this.runAnalysis();
    });

    // Max Iterations input
    document.getElementById('maxIterInput').addEventListener('input', (e) => {
      this.maxIter = parseInt(e.target.value) || 100;
      this.runAnalysis();
    });

    // Initial vector type change
    document.getElementById('initVectorSelect').addEventListener('change', (e) => {
      this.initVectorType = e.target.value;
      const customContainer = document.getElementById('customVectorContainer');
      customContainer.style.display = this.initVectorType === 'custom' ? 'block' : 'none';
      if (this.initVectorType === 'custom') {
        this.renderCustomVectorInputs();
      }
      this.runAnalysis();
    });

    // Graph tool mode buttons
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.graph.setMode(btn.dataset.mode);
      });
    });

    // Arrange circle button
    document.getElementById('btnArrangeCircle').addEventListener('click', () => {
      this.graph.arrangeCircle();
    });

    // Stepper controls
    document.getElementById('btnStepNext').addEventListener('click', () => {
      this.stepNext();
    });

    document.getElementById('btnPlayAnimation').addEventListener('click', () => {
      this.toggleAnimation();
    });

    document.getElementById('btnResetIteration').addEventListener('click', () => {
      this.resetIteration();
    });

    // Navigation tab switching
    const tabBtns = document.querySelectorAll('.nav-tab');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
      });
    });

    // Export buttons
    document.getElementById('btnExportCsv').addEventListener('click', () => this.exportCsv());
    document.getElementById('btnExportJson').addEventListener('click', () => this.exportJson());
    document.getElementById('btnPrintReport').addEventListener('click', () => window.print());
  }

  loadPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    document.getElementById('presetDescription').textContent = preset.description;
    this.graph.loadGraph(preset.nodes, preset.edges);
    this.graph.arrangeCircle();
    this.runAnalysis();
  }

  renderCustomVectorInputs() {
    const n = this.graph.nodes.length;
    const container = document.getElementById('customVectorInputs');
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'vector-input-cell';
      wrapper.innerHTML = `
        <label>P${i + 1}:</label>
        <input type="number" step="0.05" min="0" max="1" value="${(1 / n).toFixed(4)}" data-idx="${i}" class="custom-v-val">
      `;
      container.appendChild(wrapper);
    }
    container.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => this.runAnalysis());
    });
  }

  getInitialVector(n) {
    if (this.initVectorType === 'biased') {
      const v = new Array(n).fill(0.1 / (n - 1 || 1));
      v[0] = 0.9;
      return LinAlg.vecNormalizeSum(v);
    } else if (this.initVectorType === 'custom') {
      const inputs = document.querySelectorAll('.custom-v-val');
      const v = [];
      inputs.forEach(inp => v.push(parseFloat(inp.value) || 0));
      if (v.length === n) {
        return LinAlg.vecNormalizeSum(v);
      }
    }
    return LinAlg.vecUniform(n);
  }

  runAnalysis() {
    const numNodes = this.graph.nodes.length;
    if (numNodes === 0) return;

    // Stage 1: Build Adjacency Matrix
    const { A, outDegrees, inDegrees } = LinAlg.buildAdjacencyMatrix(numNodes, this.graph.edges);

    // Stage 2: Column Normalization (Transition Matrix M)
    const { M, danglingNodes } = LinAlg.normalizeTransitionMatrix(A, outDegrees);

    // Stage 3: Google Matrix G
    const G = LinAlg.buildGoogleMatrix(M, this.damping);

    // Stage 4: Initial Vector v0
    const v0 = this.getInitialVector(numNodes);

    // Stage 5: Power Iteration
    const powerResults = LinAlg.runPowerIteration(G, v0, this.tolerance, this.maxIter);

    // Stage 7: Exact Eigenvector Solution (lambda = 1)
    const eigenResults = LinAlg.solveStationaryEigenvector(G);

    // Second Eigenvalue estimation
    const lambda2 = LinAlg.estimateSecondEigenvalue(G, eigenResults.eigenvector);

    // Save state
    this.analysisData = {
      numNodes,
      A,
      M,
      G,
      v0,
      outDegrees,
      inDegrees,
      danglingNodes,
      powerResults,
      eigenResults,
      lambda2
    };

    // Update graph node ranks with final ranking vector
    this.graph.updateRanks(powerResults.finalVector);

    // Render all mathematical stages
    this.renderStageMatrices();
    this.renderInitialVector();
    this.renderIterationTable();
    this.renderConvergenceChart();
    this.renderRankTrajectoryChart();
    this.renderFinalRanking();
    this.renderEigenvectorVerification();
    this.renderProcessOverview();
  }

  renderProcessOverview() {
    const d = this.analysisData;
    document.getElementById('statTotalPages').textContent = d.numNodes;
    document.getElementById('statTotalLinks').textContent = this.graph.edges.length;
    document.getElementById('statDanglingNodes').textContent = d.danglingNodes.length > 0 ? d.danglingNodes.map(i => `P${i + 1}`).join(', ') : 'None';
    document.getElementById('statIterationsToConverge').textContent = d.powerResults.iterations;
    document.getElementById('statSpectralGap').textContent = (1 - d.lambda2).toFixed(4);
    document.getElementById('statLambda2').textContent = d.lambda2.toFixed(4);
  }

  renderStageMatrices() {
    const d = this.analysisData;
    const n = d.numNodes;

    // Render Link/Adjacency Matrix A
    const aContainer = document.getElementById('matrixAdjacency');
    aContainer.innerHTML = this.generateMatrixHTML(d.A, 'A', 'integer');

    // Render Transition Matrix M
    const mContainer = document.getElementById('matrixTransition');
    mContainer.innerHTML = this.generateMatrixHTML(d.M, 'M', 'probability');

    // Render Google Matrix G
    const gContainer = document.getElementById('matrixGoogle');
    gContainer.innerHTML = this.generateMatrixHTML(d.G, 'G', 'probability');

    // Display summary pill tags
    document.getElementById('outDegreesPill').textContent = d.outDegrees.map((deg, i) => `P${i + 1}: ${deg}`).join(' | ');
  }

  generateMatrixHTML(matrix, name, format = 'float') {
    const n = matrix.length;
    let html = `<div class="matrix-table-wrapper"><table class="matrix-table"><thead><tr><th>${name}</th>`;
    for (let j = 0; j < n; j++) {
      html += `<th>P${j + 1}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let i = 0; i < n; i++) {
      html += `<tr><th>P${i + 1}</th>`;
      for (let j = 0; j < n; j++) {
        const val = matrix[i][j];
        let displayVal = format === 'integer' ? val : val.toFixed(4);
        let bgStyle = '';
        if (format === 'probability' && val > 0) {
          const alpha = Math.min(0.7, val * 0.8 + 0.1);
          bgStyle = `style="background-color: rgba(59, 130, 246, ${alpha}); color: ${val > 0.4 ? '#fff' : '#0f172a'};"`;
        } else if (format === 'integer' && val === 1) {
          bgStyle = `style="background-color: rgba(34, 197, 94, 0.25); font-weight: bold;"`;
        }
        html += `<td ${bgStyle}>${displayVal}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    return html;
  }

  renderInitialVector() {
    const d = this.analysisData;
    const v0Container = document.getElementById('initialVectorDisplay');
    let html = `<div class="vector-display-row">`;
    d.v0.forEach((val, i) => {
      html += `
        <div class="vector-chip">
          <span class="chip-label">P${i + 1}</span>
          <span class="chip-val">${val.toFixed(4)}</span>
        </div>
      `;
    });
    html += `</div>`;
    v0Container.innerHTML = html;
  }

  renderIterationTable() {
    const d = this.analysisData;
    const tbody = document.getElementById('iterationTableBody');
    tbody.innerHTML = '';

    const history = d.powerResults.history;
    // Show first 15 and last 5 if history is long
    const shouldTruncate = history.length > 25;
    const stepsToShow = shouldTruncate
      ? [...history.slice(0, 15), null, ...history.slice(-5)]
      : history;

    stepsToShow.forEach((step, idx) => {
      if (step === null) {
        const tr = document.createElement('tr');
        tr.className = 'ellipsis-row';
        tr.innerHTML = `<td colspan="${d.numNodes + 4}">... (${history.length - 20} intermediate iterations omitted for display) ...</td>`;
        tbody.appendChild(tr);
        return;
      }

      const tr = document.createElement('tr');
      if (step.converged) tr.className = 'converged-row';

      let cells = `
        <td><strong>k = ${step.iteration}</strong></td>
      `;
      step.vector.forEach(v => {
        cells += `<td>${v.toFixed(5)}</td>`;
      });
      cells += `
        <td><span class="delta-badge">${step.iteration === 0 ? '-' : step.deltaL2.toExponential(3)}</span></td>
        <td>${step.iteration === 0 ? '-' : step.deltaL1.toExponential(3)}</td>
        <td>${step.converged ? '<span class="status-converged">Converged</span>' : '<span class="status-iterating">Iterating</span>'}</td>
      `;
      tr.innerHTML = cells;
      tbody.appendChild(tr);
    });

    // Update iteration table headers
    const theadRow = document.getElementById('iterationTableHeadRow');
    theadRow.innerHTML = `<th>Iteration (k)</th>`;
    for (let i = 0; i < d.numNodes; i++) {
      theadRow.innerHTML += `<th>v_${i + 1}</th>`;
    }
    theadRow.innerHTML += `<th>||v^(k) - v^(k-1)||_2</th><th>L1 Norm Diff</th><th>Status</th>`;
  }

  renderConvergenceChart() {
    const history = this.analysisData.powerResults.history;
    const labels = history.slice(1).map(h => `k=${h.iteration}`);
    const l2Errors = history.slice(1).map(h => h.deltaL2);
    const l1Errors = history.slice(1).map(h => h.deltaL1);

    const ctx = document.getElementById('convergenceChart').getContext('2d');

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Euclidean Norm ||v^(k) - v^(k-1)||_2',
            data: l2Errors,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          },
          {
            label: 'Manhattan Norm L1',
            data: l1Errors,
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Norm Difference (Log Scale)' }
          },
          x: {
            title: { display: true, text: 'Iteration (k)' }
          }
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw.toExponential(4)}`
            }
          }
        }
      }
    });
  }

  renderRankTrajectoryChart() {
    const history = this.analysisData.powerResults.history;
    const n = this.analysisData.numNodes;
    const labels = history.map(h => `k=${h.iteration}`);

    // Palette of distinguishable colors
    const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

    const datasets = [];
    for (let i = 0; i < n; i++) {
      const pageTrajectory = history.map(h => h.vector[i]);
      datasets.push({
        label: `Page P${i + 1}`,
        data: pageTrajectory,
        borderColor: colors[i % colors.length],
        borderWidth: 2,
        tension: 0.2,
        fill: false
      });
    }

    const ctx = document.getElementById('rankTrajectoryChart').getContext('2d');
    if (this.rankTrajectoryChart) {
      this.rankTrajectoryChart.destroy();
    }

    this.rankTrajectoryChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: { display: true, text: 'PageRank Probability v_i' },
            min: 0,
            max: Math.min(1.0, Math.max(...this.analysisData.powerResults.finalVector) * 1.3)
          },
          x: {
            title: { display: true, text: 'Iteration (k)' }
          }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }

  renderFinalRanking() {
    const d = this.analysisData;
    const finalV = d.powerResults.finalVector;

    // Create ranked list
    const ranked = finalV.map((score, idx) => ({
      index: idx,
      label: `Page P${idx + 1}`,
      score,
      inDeg: d.inDegrees[idx],
      outDeg: d.outDegrees[idx]
    })).sort((a, b) => b.score - a.score);

    const container = document.getElementById('finalRankingTableBody');
    container.innerHTML = '';

    ranked.forEach((item, rank) => {
      const percentage = (item.score * 100).toFixed(2);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="rank-badge rank-${rank + 1}">#${rank + 1}</span></td>
        <td><strong>${item.label}</strong></td>
        <td><span class="score-pill">${item.score.toFixed(6)}</span></td>
        <td>
          <div class="percentage-bar-wrapper">
            <div class="percentage-bar" style="width: ${percentage}%;"></div>
            <span class="percentage-label">${percentage}%</span>
          </div>
        </td>
        <td>${item.inDeg}</td>
        <td>${item.outDeg}</td>
      `;
      container.appendChild(tr);
    });
  }

  renderEigenvectorVerification() {
    const d = this.analysisData;
    const eigenV = d.eigenResults.eigenvector;
    const powerV = d.powerResults.finalVector;

    // Norm difference between Power Iteration and Analytical Eigenvector
    const l2Diff = LinAlg.vecDiffNorm2(powerV, eigenV);
    const l1Diff = LinAlg.vecDiffNorm1(powerV, eigenV);
    const residual = d.eigenResults.residual;

    document.getElementById('eigenResidualVal').textContent = residual.toExponential(4);
    document.getElementById('eigenPowerDiffVal').textContent = l2Diff.toExponential(4);

    const statusBadge = document.getElementById('eigenStatusBadge');
    if (l2Diff < 1e-4) {
      statusBadge.textContent = 'VERIFIED PERFECT MATCH (Error < 10^-4)';
      statusBadge.className = 'status-badge badge-success';
    } else {
      statusBadge.textContent = 'APPROXIMATE CONVERGENCE';
      statusBadge.className = 'status-badge badge-warning';
    }

    // Comparison table
    const tbody = document.getElementById('eigenComparisonTableBody');
    tbody.innerHTML = '';
    for (let i = 0; i < d.numNodes; i++) {
      const tr = document.createElement('tr');
      const pVal = powerV[i];
      const eVal = eigenV[i];
      const diff = Math.abs(pVal - eVal);
      tr.innerHTML = `
        <td><strong>Page P${i + 1}</strong></td>
        <td>${pVal.toFixed(6)}</td>
        <td>${eVal.toFixed(6)}</td>
        <td><span class="code-val">${diff.toExponential(3)}</span></td>
      `;
      tbody.appendChild(tr);
    }
  }

  // Stepper controls
  stepNext() {
    if (!this.analysisData) return;
    const history = this.analysisData.powerResults.history;
    if (this.currentStepIndex < history.length - 1) {
      this.currentStepIndex++;
      this.highlightStep(this.currentStepIndex);
    }
  }

  toggleAnimation() {
    const btn = document.getElementById('btnPlayAnimation');
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
      btn.textContent = 'Play Animation';
    } else {
      btn.textContent = 'Pause Animation';
      const history = this.analysisData.powerResults.history;
      this.animationTimer = setInterval(() => {
        if (this.currentStepIndex >= history.length - 1) {
          clearInterval(this.animationTimer);
          this.animationTimer = null;
          btn.textContent = 'Play Animation';
          return;
        }
        this.currentStepIndex++;
        this.highlightStep(this.currentStepIndex);
      }, 500);
    }
  }

  resetIteration() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
      document.getElementById('btnPlayAnimation').textContent = 'Play Animation';
    }
    this.currentStepIndex = 0;
    this.highlightStep(0);
  }

  highlightStep(stepIdx) {
    const history = this.analysisData.powerResults.history;
    const step = history[stepIdx];
    this.graph.updateRanks(step.vector);
    document.getElementById('currentStepDisplay').textContent = `Iteration k = ${step.iteration} / ${history.length - 1}`;
  }

  exportCsv() {
    if (!this.analysisData) return;
    const history = this.analysisData.powerResults.history;
    const n = this.analysisData.numNodes;

    let csv = 'Iteration,' + Array.from({ length: n }, (_, i) => `P${i + 1}`).join(',') + ',Norm2_Diff,Norm1_Diff,Converged\n';
    history.forEach(h => {
      csv += `${h.iteration},${h.vector.map(v => v.toFixed(6)).join(',')},${h.deltaL2.toExponential(4)},${h.deltaL1.toExponential(4)},${h.converged}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'pagerank_convergence_history.csv');
    link.click();
  }

  exportJson() {
    if (!this.analysisData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.analysisData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'pagerank_analysis.json');
    dlAnchor.click();
  }
}

// Instantiate once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
