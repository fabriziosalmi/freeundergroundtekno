/**
 * Free Underground Tekno - Visualizer Manager (Modular Version)
 * Carica e gestisce visualizer esterni modulari
 */

const Visualizer = (function() {
    'use strict';

    // === VARIABILI DI STATO ===
    let canvas = null;
    let ctx = null;
    let currentStyleIndex = 0;
    
    // Registro visualizers esterni (caricati dinamicamente)
    let visualizers = [];
    let externalVisualizersLoaded = false;

    /**
     * Inizializza il visualizer manager
     */
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        
        // Imposta le dimensioni del canvas
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // AUTO-DETECT e carica tutti i visualizer disponibili
        const availableVisualizers = [
            typeof PsychSpiral !== 'undefined' ? PsychSpiral : null,
            typeof UFOSwarm !== 'undefined' ? UFOSwarm : null,
            typeof RTypeTekno !== 'undefined' ? RTypeTekno : null,
            typeof QuantumMorphing !== 'undefined' ? QuantumMorphing : null,
            typeof LiquidPlasma !== 'undefined' ? LiquidPlasma : null,
            typeof MatrixRain !== 'undefined' ? MatrixRain : null,
            typeof WarpTunnel !== 'undefined' ? WarpTunnel : null,
            typeof Fireworks !== 'undefined' ? Fireworks : null,
            typeof SpiderWeb !== 'undefined' ? SpiderWeb : null,
            typeof DNAHelix !== 'undefined' ? DNAHelix : null,
            typeof FractalMandala !== 'undefined' ? FractalMandala : null,
            typeof LightningStorm !== 'undefined' ? LightningStorm : null,
            typeof RadarSweep !== 'undefined' ? RadarSweep : null,
            typeof SoundWaves !== 'undefined' ? SoundWaves : null,
            typeof SoundSystemWall !== 'undefined' ? SoundSystemWall : null,
            typeof RaveSlideshow !== 'undefined' ? RaveSlideshow : null,
            typeof Strobo !== 'undefined' ? Strobo : null,
            typeof LaserGrid !== 'undefined' ? LaserGrid : null,
            typeof RadioLogoPulse !== 'undefined' ? RadioLogoPulse : null,
            typeof AcidSpiralLSD !== 'undefined' ? AcidSpiralLSD : null,
            typeof VinylTurntables !== 'undefined' ? VinylTurntables : null,
            typeof ParticleStorm !== 'undefined' ? ParticleStorm : null,
            typeof NeonTunnel !== 'undefined' ? NeonTunnel : null,
            typeof GlitchCity !== 'undefined' ? GlitchCity : null,
            typeof RaveCrowd !== 'undefined' ? RaveCrowd : null,
            typeof SubStackTower !== 'undefined' ? SubStackTower : null,
            typeof TazSymbols !== 'undefined' ? TazSymbols : null,
            typeof FrequencyBars3D !== 'undefined' ? FrequencyBars3D : null,
            typeof HologramCube !== 'undefined' ? HologramCube : null,
            typeof EnergyField !== 'undefined' ? EnergyField : null,
            typeof CosmicDust !== 'undefined' ? CosmicDust : null,
            typeof VectorField !== 'undefined' ? VectorField : null,
            typeof AudioTerrain !== 'undefined' ? AudioTerrain : null,
            typeof Kaleidoscope !== 'undefined' ? Kaleidoscope : null,
        ].filter(v => v !== null);
        
        // Registra tutti i visualizer trovati
        availableVisualizers.forEach(viz => {
            visualizers.push(viz);
            if (viz.init) {
                viz.init(canvas);
            }
            console.log(`✅ Loaded: ${viz.name}`);
        });
        
        if (visualizers.length === 0) {
            console.warn('⚠️ No visualizers loaded! Using fallback.');
        } else {
            console.log(`🎨 Visualizer Manager initialized with ${visualizers.length} visualizer(s)`);
        }
    }
    
    /**
     * Registra un visualizer
     */
    function registerVisualizer(viz) {
        if (typeof viz !== 'undefined' && viz.draw && viz.name) {
            visualizers.push(viz);
            if (viz.init) viz.init(canvas);
            console.log(`✅ Loaded: ${viz.name}`);
        }
    }

    /**
     * Ridimensiona il canvas
     */
    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(`📐 Canvas resized: ${canvas.width}x${canvas.height}`);
    }

    /**
     * Funzione principale di disegno
     */
    function draw(analyser, dataArray) {
        if (!ctx) {
            console.error('❌ Canvas context not initialized');
            return;
        }
        if (!analyser || !dataArray) {
            console.warn('⚠️ Missing analyser or dataArray in draw()');
            return;
        }

        // Motion blur
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ottiene i dati
        analyser.getByteFrequencyData(dataArray);

        // Disegna il visualizer corrente
        if (visualizers.length > 0 && currentStyleIndex < visualizers.length) {
            visualizers[currentStyleIndex].draw(canvas, ctx, dataArray, analyser);
        } else {
            // Fallback: disegna qualcosa di base
            drawFallback(dataArray);
        }
    }

    /**
     * Fallback visualizer se nessun modulo caricato
     */
    function drawFallback(dataArray) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No visualizers loaded', centerX, centerY);
    }

    /**
     * Passa allo stile successivo
     */
    function nextStyle() {
        if (visualizers.length === 0) {
            console.warn('⚠️ No visualizers available');
            return 'No visualizers';
        }
        
        currentStyleIndex = (currentStyleIndex + 1) % visualizers.length;
        const currentViz = visualizers[currentStyleIndex];
        
        // Re-init se ha un metodo init
        if (currentViz.init) {
            currentViz.init(canvas);
        }
        
        console.log(`🎨 Style switched to: ${currentViz.name}`);
        return currentViz.name;
    }

    /**
     * Ottiene il nome dello stile corrente
     */
    function getCurrentStyleName() {
        if (visualizers.length === 0) return 'None';
        return visualizers[currentStyleIndex].name || 'Unknown';
    }

    // === ESPORTA L'OGGETTO PUBBLICO ===
    return {
        init: init,
        draw: draw,
        nextStyle: nextStyle,
        getCurrentStyleName: getCurrentStyleName
    };

})();

// Esporta per uso come modulo (se supportato)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visualizer;
}
