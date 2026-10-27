/**
 * Main Application Controller for Web Page Ranking & Convergence Analyzer
 * Orchestrates arrow-notation parsing, linear algebra computations,
 * graph visualization, charts, step-by-step sequential process, and verification.
 */

// Preset Networks in Option 1 Arrow Notation format
const PRESETS = {
  classic4: {
    name: "Stanford 4-Page Web",
    text: `P1 -> P2, P3\nP2 -> P3\nP3 -> P1\nP4 -> P1, P3`,
    description: "Standard 4-page Stanford reference network."
  },
  star: {
    name: "Star Hub Network",
    text: `Hub -> P1, P2, P3, P4\nP1 -> Hub\nP2 -> Hub\nP3 -> Hub\nP4 -> Hub`,
    description: "Central authority hub connected bidirectionally to satellite pages."
  },
  linear: {
    name: "Linear Chain",
    text: `P1 -> P2\nP2 -> P3\nP3 -> P4`,
    description: "Sequential cascade showing rank accumulation downstream."
  },
  cycle: {
    name: "Cyclic Ring",
    text: `P1 -> P2\nP2 -> P3\nP3 -> P4\nP4 -> P1`,
    description: "Closed symmetric loop yielding uniform stationary distribution."
  },
  spiderTrap: {
    name: "Spider Trap (Absorbing Node)",
    text: `P1 -> P2\nP2 -> P3\nP3 -> P3`,
    description: "Node P3 loops onto itself, trapping surfers when damping d = 1.0."
  },
  dangling: {
    name: "Dangling Dead-End Node",
    text: `P1 -> P2\nP2 -> P3\nP3\nP4 -> P1, P2`,
    description: "Page P3 has no outgoing links (dead end); tests uniform teleportation."
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
    if (presetSelect) {
      Object.entries(PRESETS).forEach(([key, preset]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = preset.name;
        presetSelect.appendChild(opt);
      });
    }

    // Bind event listeners
    this.bindEvents();

    // Load default classic4 preset into textarea & execute
    this.loadPreset('classic4');
  }

  bindEvents() {
    // Main run button for text input
    const btnRun = document.getElementById('btnRunFromText');
    if (btnRun) {
      btnRun.addEventListener('click', () => {
        this.parseAndRunFromText();
      });
    }

    // Sample preset chips
    const sampleChips = document.querySelectorAll('.sample-chip');
    sampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        sampleChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.dataset.preset;
        if (key === 'clear') {
          document.getElementById('linksTextInput').value = '';
          this.showStatus('Input cleared. Enter your links using arrow notation (e.g. Page 1 -> Page 2, Page 3)', 'success');
        } else if (PRESETS[key]) {
          this.loadPreset(key);
        }
      });
    });

    // Preset dropdown (if changed)
    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.loadPreset(e.target.value);
      });
    }

    // Damping factor slider & input
    const dampingSlider = document.getElementById('dampingSlider');
    const dampingInput = document.getElementById('dampingInput');
    if (dampingSlider && dampingInput) {
      dampingSlider.addEventListener('input', (e) => {
        dampingInput.value = e.target.value;
        this.damping = parseFloat(e.target.value) || 0.85;
        this.runAnalysis();
      });
      dampingInput.addEventListener('input', (e) => {
        dampingSlider.value = e.target.value;
        this.damping = parseFloat(e.target.value) || 0.85;
        this.runAnalysis();
      });
    }

    // Tolerance input
    const toleranceSelect = document.getElementById('toleranceSelect');
    if (toleranceSelect) {
      toleranceSelect.addEventListener('change', (e) => {
        this.tolerance = parseFloat(e.target.value) || 1e-7;
        this.runAnalysis();
      });
    }

    // Max Iterations input
    const maxIterInput = document.getElementById('maxIterInput');
    if (maxIterInput) {
      maxIterInput.addEventListener('input', (e) => {
        this.maxIter = parseInt(e.target.value) || 100;
        this.runAnalysis();
      });
    }

    // Initial vector type change
    const initVectorSelect = document.getElementById('initVectorSelect');
    const customVectorWrapper = document.getElementById('customVectorWrapper');
    if (initVectorSelect) {
      initVectorSelect.addEventListener('change', (e) => {
        this.initVectorType = e.target.value;
        if (customVectorWrapper) {
          customVectorWrapper.style.display = this.initVectorType === 'custom' ? 'block' : 'none';
        }
        this.runAnalysis();
      });
    }

    const customVectorInput = document.getElementById('customVectorInput');
    if (customVectorInput) {
      customVectorInput.addEventListener('input', () => {
        this.runAnalysis();
      });
    }

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
    const btnArrange = document.getElementById('btnArrangeCircle');
    if (btnArrange) {
      btnArrange.addEventListener('click', () => {
        this.graph.arrangeCircle();
      });
    }

    // Stepper controls
    const btnStep = document.getElementById('btnStepNext');
    if (btnStep) btnStep.addEventListener('click', () => this.stepNext());

    const btnPlay = document.getElementById('btnPlayAnimation');
    if (btnPlay) btnPlay.addEventListener('click', () => this.toggleAnimation());

    const btnReset = document.getElementById('btnResetIteration');
    if (btnReset) btnReset.addEventListener('click', () => this.resetIteration());

    // Navigation tab switching
    const tabBtns = document.querySelectorAll('.nav-tab');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.classList.add('active');
      });
    });

    // Export buttons
    const btnCsv = document.getElementById('btnExportCsv');
    if (btnCsv) btnCsv.addEventListener('click', () => this.exportCsv());

    const btnJson = document.getElementById('btnExportJson');
    if (btnJson) btnJson.addEventListener('click', () => this.exportJson());

    const btnPrint = document.getElementById('btnPrintReport');
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());
  }

  loadPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    const textarea = document.getElementById('linksTextInput');
    if (textarea) {
      textarea.value = preset.text;
    }

    const desc = document.getElementById('presetDescription');
    if (desc) desc.textContent = preset.description;

    const select = document.getElementById('presetSelect');
    if (select) select.value = key;

    this.parseAndRunFromText();
  }

  /**
   * Option 1 Arrow-Notation Parser:
   * Parses text lines like:
   * Page 1 -> Page 2, Page 3
   * A -> B, C
   * Hub <-> Satellite
   * StandaloneNode (dangling node)
   */
  parseArrowNotation(text) {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

    if (lines.length === 0) {
      return { error: "Please enter at least one page link (e.g. Page 1 -> Page 2)" };
    }

    const nodeMap = new Map(); // label -> integer index
    const nodes = [];
    const rawEdges = [];

    const getOrCreateNode = (label) => {
      const clean = label.trim();
      if (!clean) return null;
      if (!nodeMap.has(clean)) {
        const idx = nodes.length;
        nodeMap.set(clean, idx);
        nodes.push({ id: idx, label: clean });
      }
      return nodeMap.get(clean);
    };

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      // 1. Bidirectional arrow <-> or <=>
      if (line.includes('<->') || line.includes('<=>')) {
        const parts = line.split(/<=>|<->/);
        if (parts.length >= 2) {
          const left = parts[0].trim();
          const rightTargets = parts.slice(1).join(',').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
          const leftIdx = getOrCreateNode(left);
          for (const r of rightTargets) {
            const rIdx = getOrCreateNode(r);
            if (leftIdx !== null && rIdx !== null) {
              rawEdges.push([leftIdx, rIdx]);
              rawEdges.push([rIdx, leftIdx]);
            }
          }
          continue;
        }
      }

      // 2. Standard directed arrow -> or => or --> or →
      if (line.includes('->') || line.includes('=>') || line.includes('-->') || line.includes('→')) {
        const parts = line.split(/-->|->|=>|→/);
        const source = parts[0].trim();
        const sIdx = getOrCreateNode(source);

        if (parts.length > 1) {
          const targetString = parts.slice(1).join(',').trim();
          if (targetString.length > 0) {
            const targets = targetString.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
            for (const target of targets) {
              const tIdx = getOrCreateNode(target);
              if (sIdx !== null && tIdx !== null) {
                rawEdges.push([sIdx, tIdx]);
              }
            }
          }
        }
      } else {
        // 3. Standalone page (useful for dead-end / dangling nodes with 0 outgoing links)
        getOrCreateNode(line);
      }
    }

    if (nodes.length === 0) {
      return { error: "Could not find any valid page names. Use: Page 1 -> Page 2" };
    }

    // Deduplicate edges
    const edgeSet = new Set();
    const edges = [];
    for (const [u, v] of rawEdges) {
      const key = `${u}->${v}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([u, v]);
      }
    }

    return { nodes, edges };
  }

  parseAndRunFromText() {
    const textarea = document.getElementById('linksTextInput');
    if (!textarea) return;

    const parsed = this.parseArrowNotation(textarea.value);
    if (parsed.error) {
      this.showStatus(`Error: ${parsed.error}`, 'error');
      return;
    }

    // Load parsed nodes and edges into Canvas graph
    this.graph.loadGraph(parsed.nodes, parsed.edges);
    this.graph.arrangeCircle();

    // Show success banner
    const pageLabels = parsed.nodes.map(n => n.label).join(', ');
    this.showStatus(`✓ Successfully parsed ${parsed.nodes.length} pages (${pageLabels}) and ${parsed.edges.length} directed links.`, 'success');

    // Run sequential analysis
    this.runAnalysis();
  }

  showStatus(msg, type = 'success') {
    const banner = document.getElementById('inputStatusBanner');
    if (!banner) return;
    banner.textContent = msg;
    banner.className = `status-banner ${type}`;
    banner.style.display = 'flex';
  }

  getInitialVector(n) {
    if (this.initVectorType === 'custom') {
      const inp = document.getElementById('customVectorInput');
      if (inp && inp.value.trim().length > 0) {
        const parts = inp.value.split(/[,;\s]+/).map(x => parseFloat(x)).filter(x => !isNaN(x));
        if (parts.length === n) {
          return LinAlg.vecNormalizeSum(parts);
        }
      }
    }
    // Default uniform 1/n
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
      nodes: this.graph.nodes.map(n => n.label),
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
    const elPages = document.getElementById('statTotalPages');
    if (elPages) elPages.textContent = d.numNodes;

    const elLinks = document.getElementById('statTotalLinks');
    if (elLinks) elLinks.textContent = this.graph.edges.length;

    const elDangling = document.getElementById('statDanglingNodes');
    if (elDangling) {
      elDangling.textContent = d.danglingNodes.length > 0 
        ? d.danglingNodes.map(i => d.nodes[i]).join(', ') 
        : 'None';
    }

    const elIters = document.getElementById('statIterationsToConverge');
    if (elIters) elIters.textContent = d.powerResults.iterations;

    const elGap = document.getElementById('statSpectralGap');
    if (elGap) elGap.textContent = (1 - d.lambda2).toFixed(4);

    const elL2 = document.getElementById('statLambda2');
    if (elL2) elL2.textContent = d.lambda2.toFixed(4);
  }

  renderStageMatrices() {
    const d = this.analysisData;

    // Render Link/Adjacency Matrix A
    const aContainer = document.getElementById('matrixAdjacency');
    if (aContainer) aContainer.innerHTML = this.generateMatrixHTML(d.A, 'A', 'integer');

    // Render Transition Matrix M
    const mContainer = document.getElementById('matrixTransition');
    if (mContainer) mContainer.innerHTML = this.generateMatrixHTML(d.M, 'M', 'probability');

    // Render Google Matrix G
    const gContainer = document.getElementById('matrixGoogle');
    if (gContainer) gContainer.innerHTML = this.generateMatrixHTML(d.G, 'G', 'probability');

    // Display summary pill tags
    const outPill = document.getElementById('outDegreesPill');
    if (outPill) {
      outPill.textContent = d.outDegrees.map((deg, i) => `${d.nodes[i]}: ${deg}`).join(' | ');
    }
  }

  generateMatrixHTML(matrix, name, format = 'float') {
    const n = matrix.length;
    const labels = this.analysisData.nodes;

    let html = `<div class="matrix-table-wrapper"><table class="matrix-table"><thead><tr><th>${name}</th>`;
    for (let j = 0; j < n; j++) {
      html += `<th>${labels[j]}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let i = 0; i < n; i++) {
      html += `<tr><th>${labels[i]}</th>`;
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
    if (!v0Container) return;

    let html = `<div class="vector-display-row">`;
    d.v0.forEach((val, i) => {
      html += `
        <div class="vector-chip">
          <span class="chip-label">${d.nodes[i]}</span>
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
    if (!tbody) return;
    tbody.innerHTML = '';

    const history = d.powerResults.history;
    const shouldTruncate = history.length > 25;
    const stepsToShow = shouldTruncate
      ? [...history.slice(0, 15), null, ...history.slice(-5)]
      : history;

    stepsToShow.forEach((step) => {
      if (step === null) {
        const tr = document.createElement('tr');
        tr.className = 'ellipsis-row';
        tr.innerHTML = `<td colspan="${d.numNodes + 4}" style="text-align: center; color: #64748b; font-style: italic;">... (${history.length - 20} intermediate iterations omitted for display) ...</td>`;
        tbody.appendChild(tr);
        return;
      }

      const tr = document.createElement('tr');
      if (step.converged) tr.className = 'converged-row';

      let cells = `<td><strong>k = ${step.iteration}</strong></td>`;
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

    const theadRow = document.getElementById('iterationTableHeadRow');
    if (theadRow) {
      let headHtml = `<th>Iteration (k)</th>`;
      for (let i = 0; i < d.numNodes; i++) {
        headHtml += `<th>${d.nodes[i]}</th>`;
      }
      headHtml += `<th>||v^(k) - v^(k-1)||_2</th><th>L1 Norm Diff</th><th>Status</th>`;
      theadRow.innerHTML = headHtml;
    }
  }

  renderConvergenceChart() {
    const history = this.analysisData.powerResults.history;
    const labels = history.slice(1).map(h => `k=${h.iteration}`);
    const l2Errors = history.slice(1).map(h => h.deltaL2);
    const l1Errors = history.slice(1).map(h => h.deltaL1);

    const canvas = document.getElementById('convergenceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

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
    const nodeLabels = this.analysisData.nodes;

    const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

    const datasets = [];
    for (let i = 0; i < n; i++) {
      const pageTrajectory = history.map(h => h.vector[i]);
      datasets.push({
        label: nodeLabels[i],
        data: pageTrajectory,
        borderColor: colors[i % colors.length],
        borderWidth: 2,
        tension: 0.2,
        fill: false
      });
    }

    const canvas = document.getElementById('rankTrajectoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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

    const ranked = finalV.map((score, idx) => ({
      index: idx,
      label: d.nodes[idx],
      score,
      inDeg: d.inDegrees[idx],
      outDeg: d.outDegrees[idx]
    })).sort((a, b) => b.score - a.score);

    const container = document.getElementById('finalRankingTableBody');
    if (!container) return;
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

    const l2Diff = LinAlg.vecDiffNorm2(powerV, eigenV);
    const residual = d.eigenResults.residual;

    const elRes = document.getElementById('eigenResidualVal');
    if (elRes) elRes.textContent = residual.toExponential(4);

    const elDiff = document.getElementById('eigenPowerDiffVal');
    if (elDiff) elDiff.textContent = l2Diff.toExponential(4);

    const statusBadge = document.getElementById('eigenStatusBadge');
    if (statusBadge) {
      if (l2Diff < 1e-4) {
        statusBadge.textContent = 'VERIFIED PERFECT MATCH (Error < 10^-4)';
        statusBadge.className = 'status-badge badge-success';
      } else {
        statusBadge.textContent = 'APPROXIMATE CONVERGENCE';
        statusBadge.className = 'status-badge badge-warning';
      }
    }

    const tbody = document.getElementById('eigenComparisonTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < d.numNodes; i++) {
      const tr = document.createElement('tr');
      const pVal = powerV[i];
      const eVal = eigenV[i];
      const diff = Math.abs(pVal - eVal);
      tr.innerHTML = `
        <td><strong>${d.nodes[i]}</strong></td>
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
    if (!btn) return;
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
      const btn = document.getElementById('btnPlayAnimation');
      if (btn) btn.textContent = 'Play Animation';
    }
    this.currentStepIndex = 0;
    this.highlightStep(0);
  }

  highlightStep(stepIdx) {
    const history = this.analysisData.powerResults.history;
    const step = history[stepIdx];
    this.graph.updateRanks(step.vector);
    const disp = document.getElementById('currentStepDisplay');
    if (disp) {
      disp.textContent = `Iteration k = ${step.iteration} / ${history.length - 1}`;
    }
  }

  exportCsv() {
    if (!this.analysisData) return;
    const history = this.analysisData.powerResults.history;
    const labels = this.analysisData.nodes;

    let csv = 'Iteration,' + labels.join(',') + ',Norm2_Diff,Norm1_Diff,Converged\n';
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
