/**
 * STROBO - Visualizer Flash Strobo Hardcore
 * Flash stroboscopici sincronizzati con i bassi
 * Stile rave hardcore - strobo semplice ma potente
 */

const Strobo = (function() {
    'use strict';

    let flashIntensity = 0;
    let stroboState = false;
    let lastBassKick = 0;
    const bassThreshold = 0.65;

    function init(canvas) {
        flashIntensity = 0;
        stroboState = false;
        lastBassKick = 0;
        console.log('⚡ Strobo initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Trigger strobo su bass kick
        if (bassIntensity > bassThreshold && lastBassKick < bassThreshold) {
            stroboState = !stroboState;
            flashIntensity = 1;
        }
        lastBassKick = bassIntensity;
        
        // Decay flash
        flashIntensity *= 0.85;
        
        // Background base
        if (stroboState) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
        } else {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - flashIntensity * 0.5})`;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Waveform centrale quando acceso
        if (stroboState && flashIntensity > 0.3) {
            drawWaveform(ctx, canvas, dataArray, analyser);
        }
        
        // Griglia quando spento
        if (!stroboState) {
            drawGrid(ctx, canvas, bassIntensity, midIntensity);
        }
        
        // Info text
        ctx.fillStyle = stroboState ? '#000' : '#0F0';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${stroboState ? 'ON' : 'OFF'}`, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px monospace';
        ctx.fillText(`BASS: ${Math.floor(bassIntensity * 100)}%`, canvas.width / 2, canvas.height / 2 + 40);
    }

    function drawWaveform(ctx, canvas, dataArray, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const step = Math.floor(bufferLength / 200);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        
        for (let i = 0; i < 200; i++) {
            const x = (canvas.width / 200) * i;
            const value = dataArray[i * step] / 255;
            const y = canvas.height / 2 + (value - 0.5) * 200;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    function drawGrid(ctx, canvas, bass, mid) {
        const gridSize = 50;
        const alpha = 0.2 + mid * 0.3;
        
        ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Strobo'
    };

})();
