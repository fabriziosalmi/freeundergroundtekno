/**
 * RAVE FRAMEWORK - Speaker Component
 * Cyberpunk-style audio-reactive speaker
 */

class SpeakerComponent extends BaseComponent {
    constructor(id, config = {}) {
        super(id, config);
        
        this.speakerType = config.speakerType || 'bass'; // subwoofer, bass, lowmid, mid, highmid, tweeter
        this.size = config.size || 160;
        this.channel = config.channel || 'mono'; // left, right, mono
        
        // Audio mapping override based on speaker type
        this.audioMapping.band = this.getBandForType(this.speakerType);
        
        // Speaker-specific config
        this.coneElement = null;
        this.centerElement = null;
        this.labelElement = null;
        
        // Colors based on type
        this.colors = this.getColorsForType(this.speakerType);
        this.color = this.colors.primary;
        this.glowColor = this.colors.glow;
    }
    
    /**
     * Get frequency band for speaker type
     */
    getBandForType(type) {
        const mapping = {
            'subwoofer': 'subBass',
            'bass': 'bass',
            'lowmid': 'lowMid',
            'mid': 'mid',
            'highmid': 'highMid',
            'tweeter': 'treble'
        };
        return mapping[type] || 'bass';
    }
    
    /**
     * Get colors for speaker type
     */
    getColorsForType(type) {
        const colorMap = {
            'subwoofer': { primary: '#ff0000', glow: '#ff0000', label: 'SUB' },
            'bass': { primary: '#ff6600', glow: '#ff6600', label: 'BASS' },
            'lowmid': { primary: '#ffaa00', glow: '#ffaa00', label: 'LOW' },
            'mid': { primary: '#ffff00', glow: '#ffff00', label: 'MID' },
            'highmid': { primary: '#00ffaa', glow: '#00ffaa', label: 'HI' },
            'tweeter': { primary: '#00ffff', glow: '#00ffff', label: 'TW' }
        };
        return colorMap[type] || colorMap['bass'];
    }
    
    /**
     * Create speaker DOM structure
     */
    createElement() {
        // Main container
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `speaker ${this.speakerType}-speaker channel-${this.channel}`;
        
        // Cone (outer ring)
        this.coneElement = document.createElement('div');
        this.coneElement.className = 'speaker-cone';
        
        // Center (inner circle)
        this.centerElement = document.createElement('div');
        this.centerElement.className = 'speaker-center';
        
        // Label
        this.labelElement = document.createElement('div');
        this.labelElement.className = 'speaker-label';
        this.labelElement.textContent = this.colors.label;
        
        // Assemble
        this.element.appendChild(this.coneElement);
        this.element.appendChild(this.centerElement);
        this.element.appendChild(this.labelElement);
        
        this.applyStyles();
    }
    
    /**
     * Apply component-specific styles
     */
    applyStyles() {
        // Base styles
        this.applyBaseStyles();
        
        // Speaker container
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.position = 'relative';
        this.element.style.margin = '10px';
        this.element.style.borderRadius = '50%';
        this.element.style.border = `3px solid ${this.color}`;
        this.element.style.background = `
            radial-gradient(circle at 30% 30%, 
                rgba(255,255,255,0.1) 0%, 
                rgba(0,0,0,0.8) 50%
            )
        `;
        this.element.style.boxShadow = `
            0 0 ${this.glowIntensity}px ${this.glowColor},
            inset 0 0 ${this.glowIntensity/2}px rgba(0,0,0,0.8)
        `;
        
        // Cone styles
        this.coneElement.style.position = 'absolute';
        this.coneElement.style.inset = '10%';
        this.coneElement.style.borderRadius = '50%';
        this.coneElement.style.border = `2px dashed ${this.color}`;
        this.coneElement.style.background = `
            conic-gradient(
                ${this.color} 0deg,
                transparent 90deg,
                ${this.color} 180deg,
                transparent 270deg
            )
        `;
        this.coneElement.style.animation = 'rotateCone 4s linear infinite';
        
        // Center styles
        this.centerElement.style.position = 'absolute';
        this.centerElement.style.top = '50%';
        this.centerElement.style.left = '50%';
        this.centerElement.style.width = '40%';
        this.centerElement.style.height = '40%';
        this.centerElement.style.transform = 'translate(-50%, -50%)';
        this.centerElement.style.borderRadius = '50%';
        this.centerElement.style.background = `
            radial-gradient(circle, 
                ${this.color} 0%, 
                transparent 70%
            )
        `;
        this.centerElement.style.boxShadow = `0 0 15px ${this.glowColor}`;
        
        // Label styles
        this.labelElement.style.position = 'absolute';
        this.labelElement.style.bottom = '10px';
        this.labelElement.style.left = '50%';
        this.labelElement.style.transform = 'translateX(-50%)';
        this.labelElement.style.color = this.color;
        this.labelElement.style.fontSize = '10px';
        this.labelElement.style.fontWeight = 'bold';
        this.labelElement.style.textShadow = `0 0 5px ${this.glowColor}`;
        this.labelElement.style.fontFamily = 'monospace';
        this.labelElement.style.letterSpacing = '2px';
        
        // Add CSS animations if not already present
        this.addCSSAnimations();
    }
    
    /**
     * Add CSS animations to document
     */
    addCSSAnimations() {
        const styleId = 'speaker-animations';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes rotateCone {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes pulseSpeaker {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Update speaker with audio data
     */
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        
        if (!audioData || !this.enabled) return;
        
        // Get band value for this speaker
        const band = audioData.bands[this.audioMapping.band];
        if (!band) return;
        
        const value = band.value;
        const peak = band.peak;
        
        // Update smooth values for rendering
        const intensity = this.lerp(this.smoothValues.intensity || 0, value, 0.2);
        this.smoothValues.intensity = intensity;
        
        const peakIntensity = this.lerp(this.smoothValues.peakIntensity || 0, peak, 0.3);
        this.smoothValues.peakIntensity = peakIntensity;
        
        // Channel offset for stereo effect
        const channelOffset = this.channel === 'left' ? 0 : 
                            this.channel === 'right' ? 180 : 0;
        this.smoothValues.channelRotation = channelOffset;
    }
    
    /**
     * Render speaker effects
     */
    render(audioData) {
        if (!this.element || !this.visible) return;
        
        const intensity = this.smoothValues.intensity || 0;
        const peakIntensity = this.smoothValues.peakIntensity || 0;
        const channelRotation = this.smoothValues.channelRotation || 0;
        
        // Speaker scale and glow
        const scale = 1 + (intensity * 0.3);
        this.element.style.transform = `scale(${scale})`;
        this.element.style.boxShadow = `
            0 0 ${20 + intensity * 40}px ${this.glowColor},
            inset 0 0 ${10 + intensity * 20}px rgba(0,0,0,0.8)
        `;
        
        // Cone rotation and intensity
        const coneRotation = (this.time * 50) + channelRotation + (intensity * 180);
        this.coneElement.style.transform = `rotate(${coneRotation}deg)`;
        this.coneElement.style.opacity = 0.3 + (intensity * 0.7);
        this.coneElement.style.filter = `brightness(${1 + peakIntensity})`;
        
        // Center pulse
        const centerScale = 1 + (peakIntensity * 0.5);
        this.centerElement.style.transform = `
            translate(-50%, -50%) 
            scale(${centerScale})
        `;
        this.centerElement.style.boxShadow = `
            0 0 ${15 + peakIntensity * 30}px ${this.glowColor}
        `;
        
        // Label glow
        this.labelElement.style.textShadow = `
            0 0 ${5 + intensity * 15}px ${this.glowColor}
        `;
        
        // Color intensity
        const brightness = 1 + (intensity * 0.5);
        this.element.style.filter = `
            brightness(${brightness})
            saturate(${1 + intensity * 0.5})
        `;
    }
    
    /**
     * Export speaker configuration
     */
    exportConfig() {
        return {
            ...super.exportConfig(),
            speakerType: this.speakerType,
            size: this.size,
            channel: this.channel
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeakerComponent;
}
