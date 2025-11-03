/**
 * RAVE FRAMEWORK - Grid System
 * Snap-to-grid positioning and alignment
 */

class GridSystem {
    constructor(config = {}) {
        this.enabled = config.enabled !== undefined ? config.enabled : false;
        this.gridSize = config.gridSize || 50; // pixels
        this.showGrid = config.showGrid !== undefined ? config.showGrid : false;
        this.gridColor = config.gridColor || '#00ff00';
        this.gridOpacity = config.gridOpacity || 0.2;
        
        this.gridOverlay = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * Initialize grid overlay
     */
    init(container) {
        if (this.canvas) return;
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'grid-overlay';
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '99999';
        this.canvas.style.opacity = this.gridOpacity;
        this.canvas.style.display = this.showGrid ? 'block' : 'none';
        
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);
        
        this.drawGrid();
    }
    
    /**
     * Draw grid lines
     */
    drawGrid() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Center crosshair
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 20, cy);
        this.ctx.lineTo(cx + 20, cy);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - 20);
        this.ctx.lineTo(cx, cy + 20);
        this.ctx.stroke();
    }
    
    /**
     * Snap coordinates to grid
     */
    snap(x, y) {
        if (!this.enabled) return { x, y };
        
        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }
    
    /**
     * Snap single value
     */
    snapValue(value) {
        if (!this.enabled) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }
    
    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        if (this.canvas) {
            this.canvas.style.display = this.showGrid ? 'block' : 'none';
        }
    }
    
    /**
     * Enable/disable snap
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`🔲 Grid snap: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Set grid size
     */
    setGridSize(size) {
        this.gridSize = size;
        this.drawGrid();
        console.log(`📏 Grid size: ${size}px`);
    }
    
    /**
     * Get preset positions
     */
    getPresetPositions() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        return {
            center: this.snap(w / 2, h / 2),
            topLeft: this.snap(w * 0.1, h * 0.1),
            topRight: this.snap(w * 0.9, h * 0.1),
            bottomLeft: this.snap(w * 0.1, h * 0.9),
            bottomRight: this.snap(w * 0.9, h * 0.9),
            topCenter: this.snap(w / 2, h * 0.1),
            bottomCenter: this.snap(w / 2, h * 0.9),
            leftCenter: this.snap(w * 0.1, h / 2),
            rightCenter: this.snap(w * 0.9, h / 2)
        };
    }
    
    /**
     * Export configuration
     */
    exportConfig() {
        return {
            enabled: this.enabled,
            gridSize: this.gridSize,
            showGrid: this.showGrid,
            gridColor: this.gridColor,
            gridOpacity: this.gridOpacity
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridSystem;
}
