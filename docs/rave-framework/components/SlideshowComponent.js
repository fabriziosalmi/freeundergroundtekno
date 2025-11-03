/**
 * RAVE FRAMEWORK - Slideshow Component
 * Background image slideshow with audio-reactive effects
 */

class SlideshowComponent extends BaseComponent {
    constructor(id, config = {}) {
        super(id, config);
        
        this.images = config.images || [];
        this.currentIndex = 0;
        this.transitionDuration = config.transitionDuration || 5; // seconds
        this.transitionTimer = 0;
        this.loop = config.loop !== undefined ? config.loop : true;
        this.effectType = config.effectType || 'fade'; // fade, slide, zoom, glitch
        
        this.imageElements = [];
        this.containerElement = null;
    }
    
    createElement() {
        // Container
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = 'slideshow-component';
        this.element.style.position = 'fixed';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.zIndex = '0';
        this.element.style.overflow = 'hidden';
        this.element.style.opacity = '0.6'; // Leggermente trasparente per vedere gli effetti sopra
        
        // Preload all images
        this.images.forEach((src, index) => {
            const img = document.createElement('div');
            img.className = 'slideshow-image';
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.backgroundImage = `url('${src}')`;
            img.style.backgroundSize = 'cover';
            img.style.backgroundPosition = 'center';
            img.style.opacity = index === 0 ? '1' : '0';
            img.style.transition = 'opacity 1s ease-in-out, transform 1s ease-in-out';
            img.style.transform = 'scale(1)';
            
            this.element.appendChild(img);
            this.imageElements.push(img);
        });
        
        this.applyBaseStyles();
    }
    
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        
        if (!this.enabled || this.images.length === 0) return;
        
        // Update transition timer
        this.transitionTimer += deltaTime;
        
        // Check if it's time to transition
        if (this.transitionTimer >= this.transitionDuration) {
            this.nextImage();
            this.transitionTimer = 0;
        }
        
        // Audio-reactive effects on current image
        if (audioData) {
            const currentImg = this.imageElements[this.currentIndex];
            if (!currentImg) return;
            
            const bass = audioData.bands.bass?.value || 0;
            const energy = audioData.metrics.energy || 0;
            const beat = audioData.beat.detected;
            
            // Subtle zoom on bass
            const scale = 1 + (bass * 0.05);
            
            // Brightness on energy
            const brightness = 0.7 + (energy * 0.5);
            
            // Glitch effect on beat
            let filter = `brightness(${brightness}) contrast(1.2) saturate(1.3)`;
            
            if (beat && Math.random() > 0.7) {
                const hue = Math.random() * 360;
                filter += ` hue-rotate(${hue}deg)`;
            }
            
            currentImg.style.transform = `scale(${scale})`;
            currentImg.style.filter = filter;
        }
    }
    
    nextImage() {
        if (this.images.length === 0) return;
        
        const prevIndex = this.currentIndex;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        
        // Fade out previous
        if (this.imageElements[prevIndex]) {
            this.imageElements[prevIndex].style.opacity = '0';
            this.imageElements[prevIndex].style.transform = 'scale(1.1)';
        }
        
        // Fade in current
        if (this.imageElements[this.currentIndex]) {
            this.imageElements[this.currentIndex].style.opacity = '1';
            this.imageElements[this.currentIndex].style.transform = 'scale(1)';
        }
        
        console.log(`📸 Slideshow: ${this.currentIndex + 1}/${this.images.length}`);
    }
    
    previousImage() {
        if (this.images.length === 0) return;
        
        const prevIndex = this.currentIndex;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        
        // Fade out previous
        if (this.imageElements[prevIndex]) {
            this.imageElements[prevIndex].style.opacity = '0';
        }
        
        // Fade in current
        if (this.imageElements[this.currentIndex]) {
            this.imageElements[this.currentIndex].style.opacity = '1';
        }
    }
    
    setImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        // Hide all
        this.imageElements.forEach(img => {
            img.style.opacity = '0';
        });
        
        // Show selected
        this.currentIndex = index;
        if (this.imageElements[this.currentIndex]) {
            this.imageElements[this.currentIndex].style.opacity = '1';
        }
        
        this.transitionTimer = 0;
    }
    
    render(audioData) {
        if (!this.element || !this.visible) {
            if (this.element) {
                this.element.style.display = 'none';
            }
            return;
        }
        
        this.element.style.display = 'block';
    }
    
    exportConfig() {
        return {
            ...super.exportConfig(),
            images: [...this.images],
            transitionDuration: this.transitionDuration,
            loop: this.loop,
            effectType: this.effectType
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlideshowComponent;
}
