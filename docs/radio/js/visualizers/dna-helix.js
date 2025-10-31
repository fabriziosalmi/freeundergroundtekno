/**
 * DNA HELIX - Visualizer Doppia Elica DNA
 * Doppia elica rotante con connessioni tra basi azotate
 * Effetto genetico/biologico + mutazioni audio-reattive
 */

const DNAHelix = (function() {
    'use strict';

    let rotation = 0;
    let helixHeight = 0;
    const numPairs = 40;
    const helixRadius = 120;
    const pairSpacing = 15;
    
    // Colori basi azotate (Adenina, Timina, Citosina, Guanina)
    const baseColors = {
        A: [255, 0, 0],     // Rosso
        T: [0, 255, 0],     // Verde
        C: [0, 0, 255],     // Blu
        G: [255, 255, 0]    // Giallo
    };

    function init(canvas) {
        rotation = 0;
        helixHeight = canvas.height * 0.8;
        console.log('🧬 DNA-Helix initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const centerX = canvas.width / 2;
        const startY = (canvas.height - helixHeight) / 2;
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Velocità rotazione basata su mids
        rotation += 0.02 + midIntensity * 0.05;
        
        // Disegna tutte le coppie
        const pairs = [];
        for (let i = 0; i < numPairs; i++) {
            const t = i / numPairs;
            const y = startY + t * helixHeight;
            const angle = rotation + t * Math.PI * 4; // 4 giri completi
            
            // Calcola posizioni dei due filamenti
            const strand1 = {
                x: centerX + Math.cos(angle) * helixRadius * (1 + bassIntensity * 0.3),
                y: y,
                z: Math.sin(angle)
            };
            
            const strand2 = {
                x: centerX + Math.cos(angle + Math.PI) * helixRadius * (1 + bassIntensity * 0.3),
                y: y,
                z: Math.sin(angle + Math.PI)
            };
            
            // Ordina per profondità (z)
            pairs.push({
                strand1: strand1,
                strand2: strand2,
                base1: getBase(i, dataArray),
                base2: getComplementaryBase(getBase(i, dataArray)),
                index: i,
                bassIntensity: bassIntensity,
                trebleIntensity: trebleIntensity
            });
        }
        
        // Ordina per Z (disegna prima i lontani)
        pairs.sort((a, b) => (a.strand1.z + a.strand2.z) - (b.strand1.z + b.strand2.z));
        
        // Disegna connessioni tra coppie
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            drawPair(ctx, pair);
        }
        
        // Disegna filamenti spine
        drawBackbones(ctx, centerX, startY, bassIntensity, midIntensity);
        
        // Particelle fluttuanti su treble
        if (trebleIntensity > 0.6) {
            drawFloatingParticles(ctx, canvas, trebleIntensity);
        }
        
        // Pulse aura su bass forti
        if (bassIntensity > 0.7) {
            drawAura(ctx, centerX, canvas.height / 2, bassIntensity);
        }
    }

    /**
     * Determina base azotata per una coppia
     */
    function getBase(index, dataArray) {
        const freq = dataArray[index % dataArray.length];
        if (freq < 64) return 'A';
        if (freq < 128) return 'T';
        if (freq < 192) return 'C';
        return 'G';
    }

    /**
     * Base complementare (A-T, C-G)
     */
    function getComplementaryBase(base) {
        if (base === 'A') return 'T';
        if (base === 'T') return 'A';
        if (base === 'C') return 'G';
        return 'C';
    }

    /**
     * Disegna una coppia di basi
     */
    function drawPair(ctx, pair) {
        const s1 = pair.strand1;
        const s2 = pair.strand2;
        
        // Calcola alpha basato su profondità
        const depth = (s1.z + s2.z) / 2;
        const alpha = 0.3 + (depth + 1) * 0.35;
        
        // Connessione tra basi
        const gradient = ctx.createLinearGradient(s1.x, s1.y, s2.x, s2.y);
        const color1 = baseColors[pair.base1];
        const color2 = baseColors[pair.base2];
        
        gradient.addColorStop(0, `rgba(${color1.join(',')}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${color2.join(',')}, ${alpha})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + pair.bassIntensity * 3;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
        
        // Basi (cerchi colorati)
        drawBase(ctx, s1.x, s1.y, pair.base1, alpha, pair.trebleIntensity);
        drawBase(ctx, s2.x, s2.y, pair.base2, alpha, pair.trebleIntensity);
    }

    /**
     * Disegna una singola base
     */
    function drawBase(ctx, x, y, base, alpha, intensity) {
        const color = baseColors[base];
        const size = 5 + intensity * 5;
        
        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, `rgba(${color.join(',')}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${color.join(',')}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = `rgba(${color.join(',')}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Disegna i filamenti backbone
     */
    function drawBackbones(ctx, centerX, startY, bassIntensity, midIntensity) {
        const points1 = [];
        const points2 = [];
        
        for (let i = 0; i < numPairs; i++) {
            const t = i / numPairs;
            const y = startY + t * helixHeight;
            const angle = rotation + t * Math.PI * 4;
            
            const x1 = centerX + Math.cos(angle) * helixRadius * (1 + bassIntensity * 0.3);
            const x2 = centerX + Math.cos(angle + Math.PI) * helixRadius * (1 + bassIntensity * 0.3);
            
            points1.push({ x: x1, y: y, z: Math.sin(angle) });
            points2.push({ x: x2, y: y, z: Math.sin(angle + Math.PI) });
        }
        
        // Disegna curve
        drawBackboneCurve(ctx, points1, [0, 255, 255], midIntensity);
        drawBackboneCurve(ctx, points2, [255, 0, 255], midIntensity);
    }

    /**
     * Disegna una curva backbone
     */
    function drawBackboneCurve(ctx, points, color, intensity) {
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const depth = (p1.z + p2.z) / 2;
            const alpha = 0.3 + (depth + 1) * 0.35;
            
            ctx.strokeStyle = `rgba(${color.join(',')}, ${alpha})`;
            ctx.lineWidth = 3 + intensity * 4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    /**
     * Particelle fluttuanti
     */
    function drawFloatingParticles(ctx, canvas, intensity) {
        const numParticles = Math.floor(intensity * 30);
        
        for (let i = 0; i < numParticles; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 1 + Math.random() * 3;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Aura pulsante
     */
    function drawAura(ctx, centerX, centerY, intensity) {
        const numRings = 3;
        
        for (let i = 0; i < numRings; i++) {
            const radius = helixRadius * (1.5 + i * 0.5) * intensity;
            const alpha = (1 - i / numRings) * intensity * 0.3;
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'DNA-Helix'
    };

})();
