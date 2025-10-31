/**
 * RADAR SWEEP - Visualizer Radar Militare
 * Radar rotante con blip audio-reattivi
 * Effetto sonar + griglia + scansione continua
 */

const RadarSweep = (function() {
    'use strict';

    let sweepAngle = 0;
    const blips = [];
    const maxBlips = 50;
    const gridRings = 5;
    const gridLines = 16;

    function init(canvas) {
        sweepAngle = 0;
        blips.length = 0;
        console.log('📡 Radar-Sweep initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Fade background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Disegna griglia radar
        drawRadarGrid(ctx, centerX, centerY, maxRadius, trebleIntensity);
        
        // Genera nuovi blip su bass
        if (bassIntensity > 0.5 && blips.length < maxBlips) {
            const numNewBlips = Math.floor(bassIntensity * 5);
            for (let i = 0; i < numNewBlips; i++) {
                createBlip(maxRadius);
            }
        }
        
        // Aggiorna e disegna blips
        updateBlips(ctx, centerX, centerY, sweepAngle, midIntensity);
        
        // Disegna sweep
        drawSweep(ctx, centerX, centerY, maxRadius, sweepAngle, midIntensity);
        
        // Avanza sweep
        sweepAngle += (0.02 + midIntensity * 0.03) * Math.PI * 2;
        if (sweepAngle > Math.PI * 2) sweepAngle -= Math.PI * 2;
        
        // Indicatori HUD
        drawHUD(ctx, canvas, centerX, centerY, maxRadius, bassIntensity, trebleIntensity);
        
        // Waveform circolare sul bordo
        drawCircularWaveform(ctx, centerX, centerY, maxRadius, dataArray, analyser);
    }

    /**
     * Disegna griglia radar
     */
    function drawRadarGrid(ctx, cx, cy, maxRadius, intensity) {
        const alpha = 0.3 + intensity * 0.2;
        
        // Cerchi concentrici
        for (let i = 1; i <= gridRings; i++) {
            const radius = (maxRadius / gridRings) * i;
            
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.lineWidth = i === gridRings ? 2 : 1;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Label distanza
            if (i < gridRings) {
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.8})`;
                ctx.font = '10px monospace';
                ctx.fillText(`${i}00`, cx + 5, cy - radius + 5);
            }
        }
        
        // Linee radiali
        for (let i = 0; i < gridLines; i++) {
            const angle = (Math.PI * 2 / gridLines) * i;
            const x = cx + Math.cos(angle) * maxRadius;
            const y = cy + Math.sin(angle) * maxRadius;
            
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            // Label angoli cardinali
            if (i % 4 === 0) {
                const labels = ['N', 'E', 'S', 'W'];
                const label = labels[i / 4];
                const labelX = cx + Math.cos(angle) * (maxRadius + 20);
                const labelY = cy + Math.sin(angle) * (maxRadius + 20);
                
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, labelX, labelY);
            }
        }
        
        // Centro
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Crea nuovo blip
     */
    function createBlip(maxRadius) {
        blips.push({
            angle: Math.random() * Math.PI * 2,
            distance: 0.2 + Math.random() * 0.8,
            size: 2 + Math.random() * 4,
            life: 1.0,
            fadeSpeed: 0.01 + Math.random() * 0.02,
            type: Math.random() > 0.7 ? 'hostile' : 'neutral'
        });
    }

    /**
     * Aggiorna blips
     */
    function updateBlips(ctx, cx, cy, sweepAngle, intensity) {
        for (let i = blips.length - 1; i >= 0; i--) {
            const blip = blips[i];
            
            if (blip.life > 0) {
                // Calcola posizione
                const x = cx + Math.cos(blip.angle) * blip.distance * cx * 0.9;
                const y = cy + Math.sin(blip.angle) * blip.distance * cy * 0.9;
                
                // Check se sweep è passato
                const angleDiff = Math.abs(sweepAngle - blip.angle);
                const isFresh = angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3;
                
                // Disegna blip
                const alpha = isFresh ? blip.life : blip.life * 0.3;
                const color = blip.type === 'hostile' ? [255, 0, 0] : [0, 255, 0];
                
                // Glow
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, blip.size * 3);
                gradient.addColorStop(0, `rgba(${color.join(',')}, ${alpha})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, blip.size * 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Core
                ctx.fillStyle = `rgba(${color.join(',')}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, blip.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Pulse ring se fresh
                if (isFresh && intensity > 0.5) {
                    ctx.strokeStyle = `rgba(${color.join(',')}, ${alpha * 0.6})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(x, y, blip.size * 5 * (1 - blip.life), 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Decay
                blip.life -= blip.fadeSpeed;
            } else {
                blips.splice(i, 1);
            }
        }
    }

    /**
     * Disegna sweep beam
     */
    function drawSweep(ctx, cx, cy, maxRadius, angle, intensity) {
        const sweepLength = 30 + intensity * 20;
        
        // Gradient sweep
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        gradient.addColorStop(0.1, 'rgba(0, 255, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Draw sweep wedge
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxRadius, -Math.PI / sweepLength, Math.PI / sweepLength);
        ctx.closePath();
        ctx.fill();
        
        // Leading edge bright line
        ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(maxRadius, 0);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * HUD indicators
     */
    function drawHUD(ctx, canvas, cx, cy, maxRadius, bassIntensity, trebleIntensity) {
        // Contatori
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        
        ctx.fillText(`TARGETS: ${blips.length}`, 20, 30);
        ctx.fillText(`BASS: ${Math.floor(bassIntensity * 100)}%`, 20, 50);
        ctx.fillText(`TREBLE: ${Math.floor(trebleIntensity * 100)}%`, 20, 70);
        
        // Angolo sweep
        const degrees = Math.floor((sweepAngle / (Math.PI * 2)) * 360);
        ctx.fillText(`HEADING: ${degrees}°`, 20, 90);
        
        // Crosshair angoli
        const crosshairSize = 20;
        const corners = [
            { x: 20, y: 20 },
            { x: canvas.width - 20, y: 20 },
            { x: 20, y: canvas.height - 20 },
            { x: canvas.width - 20, y: canvas.height - 20 }
        ];
        
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        
        for (let corner of corners) {
            const xDir = corner.x < canvas.width / 2 ? 1 : -1;
            const yDir = corner.y < canvas.height / 2 ? 1 : -1;
            
            ctx.beginPath();
            ctx.moveTo(corner.x, corner.y);
            ctx.lineTo(corner.x + crosshairSize * xDir, corner.y);
            ctx.moveTo(corner.x, corner.y);
            ctx.lineTo(corner.x, corner.y + crosshairSize * yDir);
            ctx.stroke();
        }
    }

    /**
     * Waveform circolare sul bordo
     */
    function drawCircularWaveform(ctx, cx, cy, maxRadius, dataArray, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const step = Math.floor(bufferLength / 100);
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 / 100) * i;
            const value = dataArray[i * step] / 255;
            const radius = maxRadius + value * 50;
            
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
    }

    return {
        init: init,
        draw: draw,
        name: 'Radar-Sweep'
    };

})();
