/**
 * RAVE FRAMEWORK - Strobe Component
 * Corner strobe light effect
 */

class StrobeComponent extends BaseComponent {
    constructor(id, config = {}) {
        super(id, config);
        
        this.corner = config.corner || 'top-left'; // top-left, top-right, bottom-left, bottom-right
        this.size = config.size || 200;
        this.color = config.color || '#ff0000';
        this.threshold = config.threshold || 0.7;
        this.metric = config.metric || 'punch'; // punch, peak, kick
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `strobe strobe-${this.corner}`;
        this.applyStyles();
    }
    
    applyStyles() {
        this.applyBaseStyles();
        
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.background = `
            radial-gradient(circle, 
                ${this.color}, 
                transparent
            )
        `;
        this.element.style.opacity = 0;
        this.element.style.pointerEvents = 'none';
        this.element.style.boxShadow = `0 0 50px ${this.color}`;
        
        // Position in corner
        const positions = {
            'top-left': { top: 0, left: 0 },
            'top-right': { top: 0, right: 0 },
            'bottom-left': { bottom: 0, left: 0 },
            'bottom-right': { bottom: 0, right: 0 }
        };
        
        const pos = positions[this.corner];
        Object.assign(this.element.style, pos);
    }
    
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        
        if (!audioData || !this.enabled) return;
        
        // Get metric value
        let value = 0;
        if (this.metric === 'punch') {
            value = audioData.metrics.punch || 0;
        } else if (this.metric === 'peak') {
            value = audioData.metrics.peak || 0;
        } else if (this.metric === 'kick' && audioData.beat) {
            value = audioData.beat.kick ? 1 : 0;
        }
        
        // Trigger strobe if above threshold
        this.smoothValues.triggered = value > this.threshold;
        this.smoothValues.intensity = this.lerp(
            this.smoothValues.intensity || 0,
            this.smoothValues.triggered ? 1 : 0,
            0.3
        );
    }
    
    render(audioData) {
        if (!this.element || !this.visible) return;
        
        const intensity = this.smoothValues.intensity || 0;
        
        // Flash effect
        this.element.style.opacity = intensity;
        this.element.style.boxShadow = `
            0 0 ${50 + intensity * 100}px ${this.color}
        `;
        
        // Scale pulse
        const scale = 1 + (intensity * 0.3);
        this.element.style.transform = `scale(${scale})`;
    }
    
    exportConfig() {
        return {
            ...super.exportConfig(),
            corner: this.corner,
            size: this.size,
            threshold: this.threshold,
            metric: this.metric
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StrobeComponent;
}
