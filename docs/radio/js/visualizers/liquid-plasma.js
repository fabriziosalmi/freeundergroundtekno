/**
 * LIQUID PLASMA - Visualizer Plasma Liquido
 * Plasma fluido che ondeggia come acqua psichedelica
 * Effetto metaball + color shifting + wave distortion
 */

const LiquidPlasma = (function() {
    'use strict';

    let time = 0;
    const colors = [
        [0, 255, 0],    // Verde
        [255, 0, 255],  // Magenta
        [0, 255, 255],  // Cyan
        [255, 255, 0],  // Giallo
        [255, 0, 0]     // Rosso
    ];

    function init(canvas) {
        time = 0;
        console.log('🌊 Liquid-Plasma initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        time += 0.02 + (midIntensity * 0.05);
        
        // Disegna plasma pixel per pixel (ottimizzato con step)
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const step = 3; // Riduci per più dettaglio (ma più lento)
        
        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                // Calcola valore plasma multi-onda
                const value = calculatePlasma(x, y, time, canvas, bassIntensity, trebleIntensity);
                
                // Mappa a colore
                const color = getPlasmaColor(value, midIntensity);
                
                // Disegna pixel (con step per performance)
                for (let dy = 0; dy < step; dy++) {
                    for (let dx = 0; dx < step; dx++) {
                        const px = x + dx;
                        const py = y + dy;
                        if (px < canvas.width && py < canvas.height) {
                            const index = (py * canvas.width + px) * 4;
                            imageData.data[index] = color[0];
                            imageData.data[index + 1] = color[1];
                            imageData.data[index + 2] = color[2];
                            imageData.data[index + 3] = 255;
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Aggiungi metaball luminose sui bassi forti
        if (bassIntensity > 0.6) {
            drawMetaballs(ctx, canvas, bassIntensity, time);
        }
        
        // Onde di energia sui treble
        if (trebleIntensity > 0.7) {
            drawEnergyWaves(ctx, canvas, trebleIntensity, time);
        }
    }

    /**
     * Calcola valore plasma per un punto
     */
    function calculatePlasma(x, y, t, canvas, bassIntensity, trebleIntensity) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        // Normalizza coordinate
        const nx = x / canvas.width;
        const ny = y / canvas.height;
        
        // Multiple onde sinusoidali
        const wave1 = Math.sin((nx * 10 + t) * (1 + bassIntensity));
        const wave2 = Math.sin((ny * 10 - t * 0.7) * (1 + bassIntensity));
        const wave3 = Math.sin((nx * 8 + ny * 8 + t * 0.5) * (1 + trebleIntensity));
        
        // Onde circolari dal centro
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wave4 = Math.sin((dist * 0.05 - t * 2) * (1 + bassIntensity));
        
        // Turbulenza
        const turbulence = Math.sin(nx * 20 + t) * Math.cos(ny * 20 - t) * trebleIntensity;
        
        // Combina tutte le onde
        const plasma = (wave1 + wave2 + wave3 + wave4 + turbulence) / 5;
        
        return (plasma + 1) / 2; // Normalizza 0-1
    }

    /**
     * Mappa valore plasma a colore
     */
    function getPlasmaColor(value, midIntensity) {
        // Shift colore basato su intensità
        const colorShift = midIntensity * (colors.length - 1);
        const colorIndex = Math.floor(colorShift);
        const colorMix = colorShift - colorIndex;
        
        const color1 = colors[colorIndex % colors.length];
        const color2 = colors[(colorIndex + 1) % colors.length];
        
        // Interpola tra due colori
        const r = Math.floor(color1[0] + (color2[0] - color1[0]) * colorMix);
        const g = Math.floor(color1[1] + (color2[1] - color1[1]) * colorMix);
        const b = Math.floor(color1[2] + (color2[2] - color1[2]) * colorMix);
        
        // Modula con valore plasma
        const intensity = value * 0.8 + 0.2;
        
        return [
            Math.floor(r * intensity),
            Math.floor(g * intensity),
            Math.floor(b * intensity)
        ];
    }

    /**
     * Metaball luminose
     */
    function drawMetaballs(ctx, canvas, intensity, t) {
        const numBalls = 5;
        
        for (let i = 0; i < numBalls; i++) {
            const angle = (Math.PI * 2 / numBalls) * i + t;
            const radius = 150 + Math.sin(t * 0.5 + i) * 100;
            
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius;
            const size = 50 + intensity * 80;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, `rgba(${colors[i % colors.length].join(',')}, 0.5)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Onde di energia
     */
    function drawEnergyWaves(ctx, canvas, intensity, t) {
        const numWaves = 8;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < numWaves; i++) {
            const radius = (t * 100 + i * 50) % (canvas.width * 0.7);
            const alpha = 1 - (radius / (canvas.width * 0.7));
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * intensity})`;
            ctx.lineWidth = 2 + intensity * 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Liquid-Plasma'
    };

})();
