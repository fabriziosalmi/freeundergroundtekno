/**
 * RAVE FRAMEWORK - Laser Component
 * Sweeping laser beam effect
 */

class LaserComponent extends BaseComponent {
    constructor(id, config = {}) {
        super(id, config);
        
        this.direction = config.direction || 'horizontal'; // horizontal, vertical, diagonal
        this.position = config.position || 'left'; // left, right, center, top, bottom
        this.width = config.width || 800;
        this.height = config.height || 4;
        this.sweepSpeed = config.sweepSpeed || 2;
        this.color = config.color || '#ff00ff';
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `laser laser-${this.position}`;
        this.applyStyles();
    }
    
    applyStyles() {
        this.applyBaseStyles();
        
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.background = `
            linear-gradient(90deg, 
                transparent, 
                ${this.color}, 
                transparent
            )
        `;
        this.element.style.boxShadow = `
            0 0 10px ${this.color},
            0 0 20px ${this.color}
        `;
        this.element.style.opacity = 0;
        this.element.style.transformOrigin = 'left center';
        
        // Position based on config
        if (this.position === 'left') {
            this.element.style.left = '0';
            this.element.style.top = '40%';
            this.element.style.transformOrigin = 'left center';
        } else if (this.position === 'right') {
            this.element.style.right = '0';
            this.element.style.top = '60%';
            this.element.style.transformOrigin = 'right center';
        } else if (this.position === 'center') {
            this.element.style.left = '50%';
            this.element.style.top = '50%';
            this.element.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        
        if (!audioData || !this.enabled) return;
        
        // Get audio value for this laser
        let audioValue = 0;
        if (this.position === 'left' && audioData.bands.bass) {
            audioValue = audioData.bands.bass.value;
        } else if (this.position === 'right' && audioData.bands.mid) {
            audioValue = audioData.bands.mid.value;
        } else if (this.position === 'center' && audioData.bands.treble) {
            audioValue = audioData.bands.treble.value;
        }
        
        // Smooth values
        this.smoothValues.audioIntensity = this.lerp(
            this.smoothValues.audioIntensity || 0, 
            audioValue, 
            0.2
        );
    }
    
    render(audioData) {
        if (!this.element || !this.visible) return;
        
        const intensity = this.smoothValues.audioIntensity || 0;
        
        // Opacity based on audio
        this.element.style.opacity = intensity;
        
        // Rotation sweep
        const sweepAngle = Math.sin(this.time * this.sweepSpeed) * 30;
        
        if (this.position === 'left') {
            this.element.style.transform = `rotate(${sweepAngle}deg)`;
        } else if (this.position === 'right') {
            this.element.style.transform = `rotate(${-sweepAngle}deg)`;
        } else if (this.position === 'center') {
            this.element.style.transform = `
                translate(-50%, -50%) 
                rotate(${sweepAngle * 2}deg)
            `;
        }
        
        // Glow intensity
        this.element.style.boxShadow = `
            0 0 ${10 + intensity * 30}px ${this.color},
            0 0 ${20 + intensity * 50}px ${this.color}
        `;
    }
    
    exportConfig() {
        return {
            ...super.exportConfig(),
            direction: this.direction,
            position: this.position,
            width: this.width,
            height: this.height,
            sweepSpeed: this.sweepSpeed
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaserComponent;
}
