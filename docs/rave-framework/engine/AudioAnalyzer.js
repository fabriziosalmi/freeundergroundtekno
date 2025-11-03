/**
 * RAVE FRAMEWORK - Audio Analyzer
 * Advanced audio analysis engine for VJ visuals
 */

class AudioAnalyzer {
    constructor(config = {}) {
        this.config = {
            fftSize: config.fftSize || 2048,
            smoothing: config.smoothing || 0.8,
            minDecibels: config.minDecibels || -90,
            maxDecibels: config.maxDecibels || -10,
            ...config
        };
        
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.audioSource = null;
        
        // Frequency bands
        this.bands = {
            subBass: { start: 0, end: 10, value: 0, peak: 0, average: 0 },
            bass: { start: 10, end: 40, value: 0, peak: 0, average: 0 },
            lowMid: { start: 40, end: 70, value: 0, peak: 0, average: 0 },
            mid: { start: 70, end: 150, value: 0, peak: 0, average: 0 },
            highMid: { start: 150, end: 250, value: 0, peak: 0, average: 0 },
            treble: { start: 250, end: 512, value: 0, peak: 0, average: 0 }
        };
        
        // Advanced metrics
        this.metrics = {
            peak: 0,
            rms: 0,
            energy: 0,
            spectralCentroid: 0,
            spectralFlatness: 0,
            spectralRolloff: 0,
            zcr: 0, // Zero crossing rate
            punch: 0,
            brightness: 0,
            warmth: 0,
            presence: 0,
            dynamicRange: 0
        };
        
        // Beat detection
        this.beat = {
            detected: false,
            confidence: 0,
            bpm: 0,
            kick: false,
            snare: false,
            hihat: false
        };
        
        // History for temporal analysis
        this.history = {
            maxLength: 100,
            energy: [],
            bass: [],
            spectralCentroid: []
        };
        
        // Onset detection
        this.onset = {
            threshold: 1.5,
            detected: false,
            strength: 0
        };
    }
    
    /**
     * Initialize audio context and analyser
     */
    async init(audioSource) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothing;
            this.analyser.minDecibels = this.config.minDecibels;
            this.analyser.maxDecibels = this.config.maxDecibels;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            // Connect audio source
            if (typeof audioSource === 'string') {
                // URL string
                const audio = new Audio(audioSource);
                audio.crossOrigin = "anonymous";
                this.audioSource = this.audioContext.createMediaElementSource(audio);
                await audio.play();
            } else if (audioSource instanceof HTMLMediaElement) {
                // Audio/Video element
                this.audioSource = this.audioContext.createMediaElementSource(audioSource);
            } else if (audioSource instanceof MediaStream) {
                // Microphone or stream
                this.audioSource = this.audioContext.createMediaStreamSource(audioSource);
            }
            
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            console.log('🎵 Audio Analyzer initialized');
            return true;
        } catch (error) {
            console.error('❌ Audio Analyzer init failed:', error);
            return false;
        }
    }
    
    /**
     * Analyze current audio frame
     */
    analyze() {
        if (!this.analyser || !this.dataArray) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        this._analyzeBands();
        this._analyzeMetrics();
        this._detectBeats();
        this._detectOnsets();
        this._updateHistory();
    }
    
    /**
     * Analyze frequency bands
     */
    _analyzeBands() {
        Object.values(this.bands).forEach(band => {
            let sum = 0;
            let peak = 0;
            const count = band.end - band.start;
            
            for (let i = band.start; i < band.end; i++) {
                const val = this.dataArray[i];
                sum += val;
                if (val > peak) peak = val;
            }
            
            band.value = sum / count / 255;
            band.peak = peak / 255;
            band.average = (band.average * 0.9) + (band.value * 0.1); // Smoothed
        });
    }
    
    /**
     * Calculate advanced metrics
     */
    _analyzeMetrics() {
        let sum = 0;
        let peak = 0;
        let rmsSum = 0;
        let weightedSum = 0;
        let totalSum = 0;
        let geometricMean = 0;
        let rolloffThreshold = 0.85;
        let rolloffBin = 0;
        
        const length = this.dataArray.length;
        
        // Calculate basic metrics
        for (let i = 0; i < length; i++) {
            const val = this.dataArray[i];
            const normalized = val / 255;
            
            sum += normalized;
            if (val > peak) peak = val;
            rmsSum += normalized * normalized;
            
            // Spectral centroid
            weightedSum += i * val;
            totalSum += val;
            
            // Spectral flatness
            geometricMean += Math.log(val + 1);
        }
        
        // Peak
        this.metrics.peak = peak / 255;
        
        // RMS (Root Mean Square) - energy
        this.metrics.rms = Math.sqrt(rmsSum / length);
        this.metrics.energy = this.metrics.rms;
        
        // Spectral centroid (brightness indicator)
        this.metrics.spectralCentroid = totalSum > 0 ? 
            (weightedSum / totalSum / length) : 0;
        
        // Spectral flatness (noise vs tone)
        const arithmeticMean = totalSum / length;
        geometricMean = Math.exp(geometricMean / length);
        this.metrics.spectralFlatness = arithmeticMean > 0 ? 
            geometricMean / arithmeticMean : 0;
        
        // Spectral rolloff
        let cumulativeSum = 0;
        const threshold = totalSum * rolloffThreshold;
        for (let i = 0; i < length; i++) {
            cumulativeSum += this.dataArray[i];
            if (cumulativeSum >= threshold) {
                rolloffBin = i;
                break;
            }
        }
        this.metrics.spectralRolloff = rolloffBin / length;
        
        // Dynamic range
        let minVal = 255;
        for (let i = 0; i < length; i++) {
            if (this.dataArray[i] < minVal) minVal = this.dataArray[i];
        }
        this.metrics.dynamicRange = (peak - minVal) / 255;
        
        // Derived metrics
        this.metrics.punch = Math.max(0, 
            (this.bands.bass.value + this.bands.subBass.value - 0.5) * 2);
        
        this.metrics.brightness = 
            (this.bands.highMid.value + this.bands.treble.value) / 2;
        
        this.metrics.warmth = 
            (this.bands.lowMid.value + this.bands.mid.value) / 2;
        
        this.metrics.presence = this.bands.highMid.value;
    }
    
    /**
     * Simple beat detection
     */
    _detectBeats() {
        const energyThreshold = 1.3;
        const currentEnergy = this.metrics.energy;
        const historyLength = Math.min(this.history.energy.length, 43); // ~1 second at 60fps
        
        if (historyLength > 0) {
            const avgEnergy = this.history.energy
                .slice(-historyLength)
                .reduce((a, b) => a + b, 0) / historyLength;
            
            const variance = this.history.energy
                .slice(-historyLength)
                .reduce((sum, val) => sum + Math.pow(val - avgEnergy, 2), 0) / historyLength;
            
            const threshold = (-0.0025714 * variance) + energyThreshold;
            
            this.beat.detected = currentEnergy > (avgEnergy * threshold);
            this.beat.confidence = this.beat.detected ? 
                Math.min((currentEnergy / (avgEnergy * threshold)), 1) : 0;
        }
        
        // Simple kick/snare/hihat detection based on frequency bands
        this.beat.kick = this.bands.subBass.value > 0.7 || this.bands.bass.value > 0.75;
        this.beat.snare = this.bands.mid.value > 0.7 && this.bands.highMid.value > 0.6;
        this.beat.hihat = this.bands.treble.value > 0.7;
    }
    
    /**
     * Onset detection (sudden changes)
     */
    _detectOnsets() {
        const currentEnergy = this.metrics.energy;
        const historyLength = 3;
        
        if (this.history.energy.length >= historyLength) {
            const recentEnergies = this.history.energy.slice(-historyLength);
            const avgRecent = recentEnergies.reduce((a, b) => a + b, 0) / historyLength;
            
            const ratio = avgRecent > 0 ? currentEnergy / avgRecent : 1;
            
            this.onset.detected = ratio > this.onset.threshold;
            this.onset.strength = Math.max(0, ratio - this.onset.threshold);
        }
    }
    
    /**
     * Update history buffers
     */
    _updateHistory() {
        const { maxLength } = this.history;
        
        // Energy history
        this.history.energy.push(this.metrics.energy);
        if (this.history.energy.length > maxLength) {
            this.history.energy.shift();
        }
        
        // Bass history
        this.history.bass.push(this.bands.bass.value);
        if (this.history.bass.length > maxLength) {
            this.history.bass.shift();
        }
        
        // Spectral centroid history
        this.history.spectralCentroid.push(this.metrics.spectralCentroid);
        if (this.history.spectralCentroid.length > maxLength) {
            this.history.spectralCentroid.shift();
        }
    }
    
    /**
     * Get all analysis data
     */
    getData() {
        return {
            bands: this.bands,
            metrics: this.metrics,
            beat: this.beat,
            onset: this.onset,
            raw: this.dataArray
        };
    }
    
    /**
     * Get specific band value
     */
    getBand(bandName) {
        return this.bands[bandName] || null;
    }
    
    /**
     * Get specific metric
     */
    getMetric(metricName) {
        return this.metrics[metricName] || 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioAnalyzer;
}
