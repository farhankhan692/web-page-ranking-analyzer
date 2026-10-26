/**
 * Interactive Graph Visualizer for Web Page Ranking & Convergence Analyzer
 * HTML5 Canvas directed graph with draggable nodes, edge arrows, and real-time rank scaling.
 */

class InteractiveGraph {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = []; // { id, label, x, y, radius, rank }
    this.edges = []; // [ [fromId, toId], ... ]
    this.selectedNode = null;
    this.draggedNode = null;
    this.connectingNode = null;
    this.hoveredNode = null;
    this.mode = 'drag'; // 'drag', 'addNode', 'addLink', 'delete'
    this.onChange = options.onChange || (() => {});
    this.isSimulating = false;

    this.initCanvas();
    this.attachEvents();
  }

  initCanvas() {
    // Handle Retina / HiDPI screens
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 600;
    this.height = 420;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  resize() {
    this.initCanvas();
  }

  setMode(mode) {
    this.mode = mode;
    this.connectingNode = null;
    this.render();
  }

  loadGraph(nodesData, edgesData) {
    this.nodes = nodesData.map((n, i) => ({
      id: i,
      label: n.label || `P${i + 1}`,
      x: n.x || (this.width / 2 + Math.cos(2 * Math.PI * i / nodesData.length) * 140),
      y: n.y || (this.height / 2 + Math.sin(2 * Math.PI * i / nodesData.length) * 140),
      radius: 24,
      rank: 1 / nodesData.length,
      vx: 0,
      vy: 0
    }));

    this.edges = edgesData.map(([from, to]) => [from, to]);
    this.render();
    this.onChange();
  }

  updateRanks(ranks) {
    if (!ranks || ranks.length !== this.nodes.length) return;
    const maxRank = Math.max(...ranks, 0.001);
    this.nodes.forEach((node, i) => {
      node.rank = ranks[i];
      // Dynamic radius scaling between 20px and 38px
      node.radius = 20 + (ranks[i] / maxRank) * 18;
    });
    this.render();
  }

  getNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= node.radius + 4) {
        return node;
      }
    }
    return null;
  }

  attachEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const { x, y } = getPos(e);
      const clicked = this.getNodeAt(x, y);

      if (this.mode === 'drag') {
        if (clicked) {
          this.draggedNode = clicked;
          this.selectedNode = clicked;
        } else {
          this.selectedNode = null;
        }
      } else if (this.mode === 'addNode') {
        if (!clicked) {
          const newId = this.nodes.length;
          this.nodes.push({
            id: newId,
            label: `P${newId + 1}`,
            x,
            y,
            radius: 24,
            rank: 1 / (this.nodes.length + 1),
            vx: 0,
            vy: 0
          });
          this.onChange();
        }
      } else if (this.mode === 'addLink') {
        if (clicked) {
          if (this.connectingNode === null) {
            this.connectingNode = clicked;
          } else {
            const from = this.connectingNode.id;
            const to = clicked.id;
            // Check if link already exists
            const exists = this.edges.some(([f, t]) => f === from && t === to);
            if (!exists) {
              this.edges.push([from, to]);
              this.onChange();
            }
            this.connectingNode = null;
          }
        } else {
          this.connectingNode = null;
        }
      } else if (this.mode === 'delete') {
        if (clicked) {
          const idToRemove = clicked.id;
          this.nodes = this.nodes.filter(n => n.id !== idToRemove);
          // Re-index remaining nodes
          const idMap = {};
          this.nodes.forEach((n, idx) => {
            idMap[n.id] = idx;
            n.id = idx;
            n.label = `P${idx + 1}`;
          });
          this.edges = this.edges
            .filter(([f, t]) => f !== idToRemove && t !== idToRemove)
            .map(([f, t]) => [idMap[f], idMap[t]]);
          this.onChange();
        }
      }
      this.render();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const { x, y } = getPos(e);
      this.mousePos = { x, y };

      if (this.draggedNode) {
        this.draggedNode.x = Math.max(30, Math.min(this.width - 30, x));
        this.draggedNode.y = Math.max(30, Math.min(this.height - 30, y));
        this.render();
        return;
      }

      const prevHover = this.hoveredNode;
      this.hoveredNode = this.getNodeAt(x, y);
      if (prevHover !== this.hoveredNode || this.connectingNode) {
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedNode = null;
    });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  arrangeCircle() {
    const n = this.nodes.length;
    if (n === 0) return;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.min(cx, cy) * 0.65;
    this.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });
    this.render();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw grid background
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Draw active connecting line preview in 'addLink' mode
    if (this.mode === 'addLink' && this.connectingNode && this.mousePos) {
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.moveTo(this.connectingNode.x, this.connectingNode.y);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw edges
    this.edges.forEach(([fromId, toId]) => {
      const fromNode = this.nodes.find(n => n.id === fromId);
      const toNode = this.nodes.find(n => n.id === toId);
      if (!fromNode || !toNode) return;

      this.drawArrow(fromNode, toNode);
    });

    // Draw nodes
    this.nodes.forEach(node => {
      const isSelected = this.selectedNode === node;
      const isHovered = this.hoveredNode === node;
      const isConnecting = this.connectingNode === node;

      // Outer glow for rank importance or selection
      if (isSelected || isConnecting) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = isConnecting ? 'rgba(14, 165, 233, 0.3)' : 'rgba(99, 102, 241, 0.3)';
        ctx.fill();
      }

      // Main node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

      // Color based on rank
      const hue = 220; // Slate blue base
      const lightness = Math.max(35, 65 - (node.rank || 0.1) * 70);
      ctx.fillStyle = `hsl(${hue}, 85%, ${lightness}%)`;
      ctx.fill();

      ctx.strokeStyle = isSelected || isConnecting ? '#3b82f6' : '#1e293b';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y - 2);

      // Rank score badge below node
      if (node.rank !== undefined) {
        const pct = (node.rank * 100).toFixed(1) + '%';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(pct, node.x, node.y + node.radius + 12);
      }
    });

    // Tooltip on hover
    if (this.hoveredNode) {
      const n = this.hoveredNode;
      const inDeg = this.edges.filter(([f, t]) => t === n.id).length;
      const outDeg = this.edges.filter(([f, t]) => f === n.id).length;
      const tipText = `${n.label}: In=${inDeg}, Out=${outDeg}, Score=${(n.rank * 100).toFixed(2)}%`;

      ctx.font = '11px Inter, sans-serif';
      const textWidth = ctx.measureText(tipText).width;
      const tipX = Math.min(this.width - textWidth - 20, Math.max(10, n.x - textWidth / 2));
      const tipY = Math.max(25, n.y - n.radius - 12);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(tipX - 6, tipY - 14, textWidth + 12, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tipText, tipX, tipY - 4);
    }
  }

  drawArrow(fromNode, toNode) {
    const ctx = this.ctx;
    const isSelfLoop = fromNode.id === toNode.id;

    if (isSelfLoop) {
      // Draw self-loop curve
      const loopRadius = 18;
      const loopX = fromNode.x;
      const loopY = fromNode.y - fromNode.radius - loopRadius;

      ctx.beginPath();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.arc(loopX, loopY, loopRadius, 0.4 * Math.PI, 2.6 * Math.PI);
      ctx.stroke();

      // Arrow head for self loop
      this.drawArrowHead(loopX + 10, fromNode.y - fromNode.radius, Math.PI / 3);
      return;
    }

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-4) return;

    // Check if reverse edge exists for curvature
    const hasReverse = this.edges.some(([f, t]) => f === toNode.id && t === fromNode.id);
    const curvature = hasReverse ? 26 : 0;

    const angle = Math.atan2(dy, dx);
    const startX = fromNode.x + Math.cos(angle) * fromNode.radius;
    const startY = fromNode.y + Math.sin(angle) * fromNode.radius;
    const endX = toNode.x - Math.cos(angle) * toNode.radius;
    const endY = toNode.y - Math.sin(angle) * toNode.radius;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;

    if (curvature === 0) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      this.drawArrowHead(endX, endY, angle);
    } else {
      // Curved edge using quadratic bezier
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      // Perpendicular offset
      const perpX = -Math.sin(angle) * curvature;
      const perpY = Math.cos(angle) * curvature;
      const ctrlX = midX + perpX;
      const ctrlY = midY + perpY;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      ctx.stroke();

      // Tangent angle at end of bezier curve
      const tangentAngle = Math.atan2(endY - ctrlY, endX - ctrlX);
      this.drawArrowHead(endX, endY, tangentAngle);
    }
  }

  drawArrowHead(x, y, angle) {
    const ctx = this.ctx;
    const headLength = 11;
    const arrowAngle = Math.PI / 7;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle - arrowAngle),
      y - headLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x - headLength * Math.cos(angle + arrowAngle),
      y - headLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  }
}

if (typeof window !== 'undefined') {
  window.InteractiveGraph = InteractiveGraph;
}
