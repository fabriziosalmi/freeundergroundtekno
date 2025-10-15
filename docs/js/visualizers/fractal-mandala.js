/**
 * FRACTAL MANDALA - Visualizer Mandala Frattale
 * Mandala geometrico che si evolve con pattern frattali
 * Simmetria radiale + rotazione + espansione audio-reattiva
 */

const FractalMandala = (function() {
    'use strict';

    let rotation = 0;
    let scale = 1;
    const symmetry = 12; // Simmetria a 12 raggi

    function init(canvas) {
        rotation = 0;
        scale = 1;
        console.log('🔯 Fractal-Mandala initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Aggiorna parametri
        rotation += 0.01 + midIntensity * 0.03;
        scale = 1 + bassIntensity * 0.3;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Disegna layer multipli con rotazioni diverse
        const numLayers = 5;
        for (let layer = 0; layer < numLayers; layer++) {
            const layerRotation = rotation * (layer % 2 === 0 ? 1 : -1) * (1 + layer * 0.2);
            const layerScale = scale * (1 - layer * 0.15);
            const layerAlpha = 1 - layer * 0.15;
            
            ctx.save();
            ctx.rotate(layerRotation);
            ctx.scale(layerScale, layerScale);
            
            // Disegna mandala per questo layer
            drawMandalaLayer(ctx, canvas, layer, bassIntensity, midIntensity, trebleIntensity, layerAlpha);
            
            ctx.restore();
        }
        
        // Particelle fluttuanti sui treble
        if (trebleIntensity > 0.6) {
            drawSacredParticles(ctx, canvas, trebleIntensity);
        }
        
        ctx.restore();
        
        // Pulse ring su bass forti
        if (bassIntensity > 0.7) {
            drawPulseRings(ctx, centerX, centerY, canvas, bassIntensity);
        }
    }

    /**
     * Disegna un layer del mandala
     */
    function drawMandalaLayer(ctx, canvas, layer, bassIntensity, midIntensity, trebleIntensity, alpha) {
        const baseRadius = Math.min(canvas.width, canvas.height) * 0.3;
        const radius = baseRadius * (1 + layer * 0.1);
        
        // Colore per layer
        const hue = (layer / 5) * 360;
        const color = hslToRgb(hue / 360, 1, 0.5);
        
        // Disegna con simmetria radiale
        for (let i = 0; i < symmetry; i++) {
            const angle = (Math.PI * 2 / symmetry) * i;
            
            ctx.save();
            ctx.rotate(angle);
            
            // Disegna petalo/raggio
            drawPetal(ctx, radius, color, layer, bassIntensity, midIntensity, trebleIntensity, alpha);
            
            // Disegna nodi sui vertici
            drawNode(ctx, radius, color, bassIntensity, alpha);
            
            ctx.restore();
        }
        
        // Cerchio centrale
        drawCenterCircle(ctx, radius * 0.2, layer, bassIntensity, alpha);
    }

    /**
     * Disegna un petalo del mandala
     */
    function drawPetal(ctx, radius, color, layer, bassIntensity, midIntensity, trebleIntensity, alpha) {
        const petalLength = radius * (0.8 + bassIntensity * 0.4);
        const petalWidth = 20 + midIntensity * 30;
        
        // Curva del petalo
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // Bezier curve per forma organica
        ctx.bezierCurveTo(
            petalWidth / 2, petalLength * 0.3,
            petalWidth / 2, petalLength * 0.7,
            0, petalLength
        );
        ctx.bezierCurveTo(
            -petalWidth / 2, petalLength * 0.7,
            -petalWidth / 2, petalLength * 0.3,
            0, 0
        );
        
        // Riempi con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, petalLength);
        gradient.addColorStop(0, `rgba(${color.join(',')}, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(${color.join(',')}, ${alpha * 0.4})`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Contorno
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 1 + trebleIntensity * 2;
        ctx.stroke();
        
        // Decorazioni interne
        drawPetalDecorations(ctx, petalLength, petalWidth, color, trebleIntensity, alpha);
    }

    /**
     * Decorazioni interne del petalo
     */
    function drawPetalDecorations(ctx, length, width, color, intensity, alpha) {
        const numLines = 3;
        
        for (let i = 1; i <= numLines; i++) {
            const y = (length / (numLines + 1)) * i;
            const w = width * (1 - i / (numLines + 2));
            
            ctx.strokeStyle = `rgba(${color.join(',')}, ${alpha * 0.6})`;
            ctx.lineWidth = 0.5 + intensity;
            ctx.beginPath();
            ctx.moveTo(-w / 2, y);
            ctx.lineTo(w / 2, y);
            ctx.stroke();
        }
    }

    /**
     * Disegna nodo sui vertici
     */
    function drawNode(ctx, radius, color, intensity, alpha) {
        const nodeSize = 5 + intensity * 8;
        
        // Glow
        const gradient = ctx.createRadialGradient(0, radius, 0, 0, radius, nodeSize * 2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${color.join(',')}, ${alpha * 0.8})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, radius, nodeSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, radius, nodeSize, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Cerchio centrale
     */
    function drawCenterCircle(ctx, radius, layer, intensity, alpha) {
        // Glow pulsante
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.8})`);
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * (1 + intensity * 0.5), 0, Math.PI * 2);
        ctx.fill();
        
        // Anello esterno
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 2 + intensity * 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Particelle sacre fluttuanti
     */
    function drawSacredParticles(ctx, canvas, intensity) {
        const numParticles = Math.floor(intensity * 40);
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.5;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * maxRadius;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = 1 + Math.random() * 3;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Croce luminosa
            if (Math.random() > 0.7) {
                ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.6})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - size * 2, y);
                ctx.lineTo(x + size * 2, y);
                ctx.moveTo(x, y - size * 2);
                ctx.lineTo(x, y + size * 2);
                ctx.stroke();
            }
        }
    }

    /**
     * Anelli pulsanti sui bass
     */
    function drawPulseRings(ctx, centerX, centerY, canvas, intensity) {
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.5;
        const numRings = 5;
        
        for (let i = 0; i < numRings; i++) {
            const radius = maxRadius * (i / numRings) * intensity;
            const alpha = (1 - i / numRings) * intensity;
            
            ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.lineWidth = 2 + intensity * 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Converti HSL a RGB
     */
    function hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    return {
        init: init,
        draw: draw,
        name: 'Fractal-Mandala'
    };

})();
