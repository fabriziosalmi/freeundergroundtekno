/**
 * RAVE FRAMEWORK - Particle System Component
 * Optimized particle system for rave visuals
 */

class ParticleComponent extends BaseComponent {
    constructor(id, config = {}) {
        super(id, config);
        
        this.maxParticles = config.maxParticles || 50;
        this.particleSize = config.particleSize || 3;
        this.particleLifetime = config.particleLifetime || 2; // seconds
        this.emissionRate = config.emissionRate || 10; // particles per second
        this.speed = config.speed || 100;
        this.spread = config.spread || 360; // degrees
        this.gravity = config.gravity || 0;
        this.particleColor = config.particleColor || '#00ffff';
        this.emitterType = config.emitterType || 'point'; // point, line, circle
        
        this.particles = [];
        this.emissionTimer = 0;
        this.canvas = null;
        this.ctx = null;
    }
    
    createElement() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = this.id;
        this.canvas.className = 'particle-system';
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.element = this.canvas;
        
        this.ctx = this.canvas.getContext('2d');
        this.applyBaseStyles();
        
        this.canvas.style.pointerEvents = 'none';
    }
    
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        
        if (!this.enabled) return;
        
        // Emit new particles
        this.emissionTimer += deltaTime;
        const emissionInterval = 1 / this.emissionRate;
        
        while (this.emissionTimer >= emissionInterval && this.particles.length < this.maxParticles) {
            this.emitParticle();
            this.emissionTimer -= emissionInterval;
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life += deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += this.gravity * deltaTime;
            
            // Remove dead particles
            if (p.life >= this.particleLifetime) {
                this.particles.splice(i, 1);
            }
        }
        
        // Audio reactivity - increase emission on bass
        if (audioData && audioData.bands.bass) {
            const bassValue = audioData.bands.bass.value;
            if (bassValue > 0.7) {
                for (let i = 0; i < Math.floor(bassValue * 5); i++) {
                    if (this.particles.length < this.maxParticles) {
                        this.emitParticle();
                    }
                }
            }
        }
    }
    
    emitParticle() {
        const angle = (Math.random() * this.spread - this.spread / 2) * Math.PI / 180;
        const speed = this.speed * (0.5 + Math.random() * 0.5);
        
        this.particles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            size: this.particleSize * (0.5 + Math.random() * 0.5)
        });
    }
    
    render(audioData) {
        if (!this.visible || !this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.particles.forEach(p => {
            const alpha = 1 - (p.life / this.particleLifetime);
            this.ctx.fillStyle = this.particleColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    exportConfig() {
        return {
            ...super.exportConfig(),
            maxParticles: this.maxParticles,
            particleSize: this.particleSize,
            particleLifetime: this.particleLifetime,
            emissionRate: this.emissionRate,
            speed: this.speed,
            spread: this.spread,
            gravity: this.gravity,
            particleColor: this.particleColor,
            emitterType: this.emitterType
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleComponent;
}
