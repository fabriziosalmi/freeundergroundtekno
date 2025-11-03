/**
 * RAVE FRAMEWORK - Base Component
 * Abstract base class for all visual components
 */

class BaseComponent {
    constructor(id, config = {}) {
        this.id = id;
        this.type = this.constructor.name;
        this.enabled = config.enabled !== undefined ? config.enabled : true;
        this.visible = config.visible !== undefined ? config.visible : true;
        
        // Position and transform
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.z = config.z || 0;
        this.scale = config.scale || 1;
        this.rotation = config.rotation || 0;
        this.opacity = config.opacity !== undefined ? config.opacity : 1;
        
        // Audio reactivity mapping
        this.audioMapping = {
            enabled: config.audioReactive !== undefined ? config.audioReactive : true,
            band: config.band || 'bass', // subBass, bass, lowMid, mid, highMid, treble
            metric: config.metric || 'value', // value, peak, average
            property: config.property || 'scale', // scale, rotation, opacity, x, y
            min: config.min || 0,
            max: config.max || 1,
            multiplier: config.multiplier || 1,
            offset: config.offset || 0,
            smoothing: config.smoothing || 0.1
        };
        
        // Smooth values for interpolation
        this.smoothValues = {
            scale: this.scale,
            rotation: this.rotation,
            opacity: this.opacity,
            x: this.x,
            y: this.y
        };
        
        // DOM element reference
        this.element = null;
        this.container = null;
        
        // Color
        this.color = config.color || '#00ffff';
        this.glowColor = config.glowColor || this.color;
        this.glowIntensity = config.glowIntensity || 20;
        
        // Animation state
        this.time = 0;
        
        // Custom properties (override in subclasses)
        this.customConfig = config.custom || {};
    }
    
    /**
     * Initialize component (override in subclasses)
     */
    init(container) {
        this.container = container;
        this.createElement();
        if (this.element) {
            this.container.appendChild(this.element);
        }
    }
    
    /**
     * Create DOM element (override in subclasses)
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `component ${this.type.toLowerCase()}`;
        this.applyBaseStyles();
    }
    
    /**
     * Apply base CSS styles
     */
    applyBaseStyles() {
        if (!this.element) return;
        
        this.element.style.position = 'absolute';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.transform = `
            translate(-50%, -50%) 
            scale(${this.scale}) 
            rotate(${this.rotation}deg)
        `;
        this.element.style.opacity = this.opacity;
        this.element.style.transition = 'none';
        this.element.style.pointerEvents = 'none';
    }
    
    /**
     * Update component (override in subclasses for custom behavior)
     */
    update(audioData, deltaTime) {
        this.time += deltaTime;
        
        if (this.audioMapping.enabled && audioData) {
            this.updateAudioReactivity(audioData);
        }
    }
    
    /**
     * Handle audio reactivity
     */
    updateAudioReactivity(audioData) {
        const { band, metric, property, min, max, multiplier, offset, smoothing } = this.audioMapping;
        
        // Get audio value
        let audioValue = 0;
        if (audioData.bands && audioData.bands[band]) {
            audioValue = audioData.bands[band][metric] || 0;
        }
        
        // Map to range
        const mappedValue = this.mapRange(audioValue, 0, 1, min, max) * multiplier + offset;
        
        // Smooth interpolation
        const targetProperty = property;
        if (this.smoothValues[targetProperty] !== undefined) {
            this.smoothValues[targetProperty] = 
                this.lerp(this.smoothValues[targetProperty], mappedValue, smoothing);
            this[targetProperty] = this.smoothValues[targetProperty];
        }
    }
    
    /**
     * Render component (override in subclasses)
     */
    render(audioData) {
        if (!this.element || !this.visible) return;
        
        // Update transform
        this.element.style.transform = `
            translate(-50%, -50%) 
            scale(${this.smoothValues.scale}) 
            rotate(${this.smoothValues.rotation}deg)
        `;
        
        // Update opacity
        this.element.style.opacity = this.smoothValues.opacity;
        
        // Update position
        this.element.style.left = `${this.smoothValues.x}px`;
        this.element.style.top = `${this.smoothValues.y}px`;
    }
    
    /**
     * Destroy component (override for custom cleanup)
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.container = null;
    }
    
    /**
     * Export configuration
     */
    exportConfig() {
        return {
            enabled: this.enabled,
            visible: this.visible,
            x: this.x,
            y: this.y,
            z: this.z,
            scale: this.scale,
            rotation: this.rotation,
            opacity: this.opacity,
            color: this.color,
            glowColor: this.glowColor,
            glowIntensity: this.glowIntensity,
            audioMapping: { ...this.audioMapping },
            custom: { ...this.customConfig }
        };
    }
    
    /**
     * Set audio mapping
     */
    setAudioMapping(mapping) {
        this.audioMapping = { ...this.audioMapping, ...mapping };
    }
    
    /**
     * Set position
     */
    setPosition(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    /**
     * Set color
     */
    setColor(color) {
        this.color = color;
        if (this.element) {
            this.element.style.color = color;
        }
    }
    
    /**
     * Utility: Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Utility: Map value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    }
    
    /**
     * Utility: Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Utility: Random float between min and max
     */
    random(min, max) {
        return min + Math.random() * (max - min);
    }
    
    /**
     * Utility: Random integer between min and max
     */
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseComponent;
}
