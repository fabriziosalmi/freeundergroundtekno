/**
 * MATRIX RAIN - Visualizer Cascata Matrix
 * Caratteri che cadono stile Matrix con reattività audio
 * Simboli tekno + velocità variabile + esplosioni bass
 */

const MatrixRain = (function() {
    'use strict';

    const chars = 'ȺΒƆĐƎƑ₲ĦƗɈꝀ⅃ⱮИØþǪЯ§ŦɄVⱲӾɎƵ0123456789※◉◎●◐◑◒◓◔◕☢☣⚠⚡★☆♪♫▲▼◀▶'.split('');
    let drops = [];
    let fontSize = 16;
    let columns = 0;

    function init(canvas) {
        fontSize = 16;
        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        
        // Inizializza gocce a posizioni random
        for (let i = 0; i < columns; i++) {
            drops[i] = {
                y: Math.random() * canvas.height / fontSize * -1,
                speed: 0.3 + Math.random() * 0.7,
                chars: []
            };
        }
        
        console.log('🟢 Matrix-Rain initialized with', columns, 'columns');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Motion blur invece di clear totale
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            
            // Scegli carattere random
            const char = chars[Math.floor(Math.random() * chars.length)];
            
            // Colore basato su frequenza
            let color = getDropColor(i, trebleIntensity, midIntensity);
            
            // Testa della goccia (bianca brillante)
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillText(char, i * fontSize, drop.y * fontSize);
            
            // Coda della goccia (sfumata verde)
            for (let j = 1; j < 10; j++) {
                const trailY = (drop.y - j) * fontSize;
                if (trailY > 0) {
                    const alpha = (10 - j) / 10;
                    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
                    const trailChar = drop.chars[j] || chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(trailChar, i * fontSize, trailY);
                }
            }
            
            // Memorizza caratteri per continuità
            drop.chars.unshift(char);
            if (drop.chars.length > 10) drop.chars.pop();
            
            // Muovi goccia
            const speedMultiplier = 1 + (bassIntensity * 2) + (midIntensity * 1.5);
            drop.y += drop.speed * speedMultiplier;
            
            // Reset quando esce dallo schermo
            if (drop.y * fontSize > canvas.height && Math.random() > 0.975) {
                drop.y = 0;
                drop.speed = 0.3 + Math.random() * 0.7;
                drop.chars = [];
            }
        }
        
        // Esplosioni su bassi forti
        if (bassIntensity > 0.7) {
            drawBassExplosion(ctx, canvas, bassIntensity);
        }
        
        // Glitch orizzontali sui treble
        if (trebleIntensity > 0.8) {
            drawGlitchLines(ctx, canvas, trebleIntensity);
        }
    }

    /**
     * Colore goccia basato su posizione e frequenza
     */
    function getDropColor(columnIndex, trebleIntensity, midIntensity) {
        const hueShift = (columnIndex / columns) * 120; // Da verde a cyan
        const intensity = 200 + trebleIntensity * 55;
        
        // Mix verde-cyan con shift magenta su mids alti
        if (midIntensity > 0.7) {
            return [
                Math.floor(255 * midIntensity),
                Math.floor(intensity),
                Math.floor(255 * midIntensity)
            ];
        }
        
        return [
            0,
            Math.floor(intensity),
            Math.floor(intensity * (hueShift / 120))
        ];
    }

    /**
     * Esplosione radiale su bass kick
     */
    function drawBassExplosion(ctx, canvas, intensity) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const numRays = 30;
        
        for (let i = 0; i < numRays; i++) {
            const angle = (Math.PI * 2 / numRays) * i;
            const length = intensity * 300;
            
            ctx.strokeStyle = `rgba(0, 255, 0, ${intensity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            ctx.stroke();
            
            // Punto finale
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.beginPath();
            ctx.arc(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    /**
     * Linee glitch orizzontali
     */
    function drawGlitchLines(ctx, canvas, intensity) {
        const numGlitches = Math.floor(5 + intensity * 10);
        
        for (let i = 0; i < numGlitches; i++) {
            const y = Math.random() * canvas.height;
            const width = 50 + Math.random() * 200;
            const x = Math.random() * (canvas.width - width);
            
            // Copia una porzione e spostala
            const shift = (Math.random() - 0.5) * 20;
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
            
            // Linea magenta sfalsata
            ctx.strokeStyle = `rgba(255, 0, 255, ${intensity * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(x + shift, y + 2);
            ctx.lineTo(x + width + shift, y + 2);
            ctx.stroke();
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Matrix-Rain'
    };

})();
