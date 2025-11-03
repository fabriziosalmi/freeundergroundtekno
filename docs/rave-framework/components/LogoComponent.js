/**
 * RAVE FRAMEWORK - Logo Component
 * Rotating center logo with glitch effect
 */

class LogoComponent extends BaseComponent {
    constructor(id, config = {}) {
        super(id, config);
        
        this.size = config.size || 350;
        this.text = config.text || 'FUT';
        this.color = config.color || '#0f0';
        this.rotationSpeed = config.rotationSpeed || 0.5;
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = 'center-logo';
        
        // Text label
        this.labelElement = document.createElement('div');
        this.labelElement.className = 'logo-text';
        this.labelElement.textContent = this.text;
        
        this.element.appendChild(this.labelElement);
        this.applyStyles();
    }
    
    applyStyles() {
        this.applyBaseStyles();
        
        // Container
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.left = '50%';
        this.element.style.top = '50%';
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.borderRadius = '50%';
        this.element.style.border = `4px solid ${this.color}`;
        this.element.style.background = `
            conic-gradient(
                from 0deg,
                ${this.color} 0deg,
                transparent 90deg,
                ${this.color} 180deg,
                transparent 270deg,
                ${this.color} 360deg
            )
        `;
        this.element.style.boxShadow = `
            0 0 40px ${this.color},
            inset 0 0 60px rgba(0,0,0,0.9)
        `;
        this.element.style.zIndex = '10';
        
        // Text
        this.labelElement.style.position = 'absolute';
        this.labelElement.style.top = '50%';
        this.labelElement.style.left = '50%';
        this.labelElement.style.transform = 'translate(-50%, -50%)';
        this.labelElement.style.fontSize = '80px';
        this.labelElement.style.fontWeight = 'bold';
        this.labelElement.style.fontFamily = 'monospace';
        this.labelElement.style.color = this.color;
        this.labelElement.style.textShadow = `
            0 0 20px ${this.color},
            2px 2px 0 #f00,
            -2px -2px 0 #0ff
        `;
        this.labelElement.style.letterSpacing = '10px';
        this.labelElement.style.animation = 'glitchText 0.3s infinite';
        
        // Add glitch animation
        this.addCSSAnimations();
    }
    
    addCSSAnimations() {
        const styleId = 'logo-animations';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes glitchText {
                0%, 100% {
                    text-shadow: 
                        0 0 20px currentColor,
                        2px 2px 0 #f00,
                        -2px -2px 0 #0ff;
                }
                25% {
                    text-shadow: 
                        0 0 20px currentColor,
                        -2px 2px 0 #f00,
                        2px -2px 0 #0ff;
                }
                50% {
                    text-shadow: 
                        0 0 20px currentColor,
                        2px -2px 0 #f00,
                        -2px 2px 0 #0ff;
                }
                75% {
                    text-shadow: 
                        0 0 20px currentColor,
                        -2px -2px 0 #f00,
                        2px 2px 0 #0ff;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        
        if (!audioData || !this.enabled) return;
        
        // React to overall energy
        const energy = audioData.metrics.energy || 0;
        this.smoothValues.energy = this.lerp(
            this.smoothValues.energy || 0,
            energy,
            0.15
        );
    }
    
    render(audioData) {
        if (!this.element || !this.visible) return;
        
        const energy = this.smoothValues.energy || 0;
        
        // Continuous rotation + audio pulse
        const rotation = this.time * this.rotationSpeed * 50;
        const scale = 1 + (energy * 0.2);
        
        this.element.style.transform = `
            translate(-50%, -50%) 
            rotate(${rotation}deg) 
            scale(${scale})
        `;
        
        // Glow intensity
        this.element.style.boxShadow = `
            0 0 ${40 + energy * 60}px ${this.color},
            inset 0 0 60px rgba(0,0,0,0.9)
        `;
        
        // Text intensity
        this.labelElement.style.textShadow = `
            0 0 ${20 + energy * 40}px ${this.color},
            ${2 + energy * 2}px ${2 + energy * 2}px 0 #f00,
            ${-2 - energy * 2}px ${-2 - energy * 2}px 0 #0ff
        `;
    }
    
    exportConfig() {
        return {
            ...super.exportConfig(),
            size: this.size,
            text: this.text,
            rotationSpeed: this.rotationSpeed
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogoComponent;
}
