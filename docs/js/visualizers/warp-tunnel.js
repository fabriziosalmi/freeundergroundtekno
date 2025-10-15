/**
 * WARP TUNNEL - Visualizer Tunnel Iperspaziale
 * Tunnel 3D che viaggia nello spazio con warp speed
 * Anelli concentrici + stelle + effetto velocità luce
 */

const WarpTunnel = (function() {
    'use strict';

    let time = 0;
    const stars = [];
    const numStars = 200;
    const rings = [];
    const numRings = 50;

    function init(canvas) {
        time = 0;
        stars.length = 0;
        rings.length = 0;
        
        // Inizializza stelle
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
                z: Math.random(),
                pz: Math.random()
            });
        }
        
        // Inizializza anelli tunnel
        for (let i = 0; i < numRings; i++) {
            rings.push({
                z: i / numRings,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        console.log('🌀 Warp-Tunnel initialized');
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
        
        // Velocità warp basata su bass
        const warpSpeed = 0.02 + bassIntensity * 0.08;
        time += warpSpeed;
        
        // Background nero con motion blur
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Disegna anelli tunnel
        drawTunnelRings(ctx, centerX, centerY, canvas, bassIntensity, midIntensity, warpSpeed);
        
        // Disegna stelle in movimento
        drawWarpStars(ctx, centerX, centerY, canvas, trebleIntensity, warpSpeed);
        
        // Effetto warp speed su bassi forti
        if (bassIntensity > 0.6) {
            drawWarpLines(ctx, centerX, centerY, canvas, bassIntensity);
        }
        
        // Vignette effect
        drawVignette(ctx, canvas);
    }

    /**
     * Disegna anelli concentrici del tunnel
     */
    function drawTunnelRings(ctx, centerX, centerY, canvas, bassIntensity, midIntensity, speed) {
        for (let i = 0; i < rings.length; i++) {
            const ring = rings[i];
            
            // Muovi anello verso la camera
            ring.z -= speed;
            if (ring.z < 0) {
                ring.z = 1;
                ring.rotation = Math.random() * Math.PI * 2;
            }
            
            // Proiezione 3D -> 2D
            const scale = (1 - ring.z) * 1000;
            if (scale < 10) continue; // Non disegnare se troppo lontano
            
            const radius = scale;
            const alpha = 1 - ring.z;
            
            // Colore che shifta con le frequenze
            const hue = (ring.z * 360 + time * 50 + midIntensity * 120) % 360;
            const color = hslToRgb(hue / 360, 1, 0.5);
            
            // Anello esterno
            ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha * 0.8})`;
            ctx.lineWidth = 2 + bassIntensity * 5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Aggiungi segmenti all'anello per effetto techno
            const segments = 8;
            for (let j = 0; j < segments; j++) {
                const angle = (Math.PI * 2 / segments) * j + ring.rotation;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, 3 + bassIntensity * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Disegna stelle che volano verso la camera
     */
    function drawWarpStars(ctx, centerX, centerY, canvas, intensity, speed) {
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            
            // Salva posizione precedente
            star.pz = star.z;
            
            // Muovi stella verso la camera
            star.z -= speed * (0.5 + intensity);
            if (star.z < 0) {
                star.z = 1;
                star.pz = 1;
                star.x = (Math.random() - 0.5) * 2;
                star.y = (Math.random() - 0.5) * 2;
            }
            
            // Proiezione 3D
            const sx = (star.x / star.z) * (canvas.width * 0.5) + centerX;
            const sy = (star.y / star.z) * (canvas.height * 0.5) + centerY;
            const px = (star.x / star.pz) * (canvas.width * 0.5) + centerX;
            const py = (star.y / star.pz) * (canvas.height * 0.5) + centerY;
            
            // Dimensione stella basata su distanza
            const size = (1 - star.z) * 3;
            
            // Disegna scia
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - star.z) * 0.8})`;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            ctx.stroke();
            
            // Punto stella
            ctx.fillStyle = `rgba(0, 255, 255, ${1 - star.z})`;
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Linee warp speed su bass kick
     */
    function drawWarpLines(ctx, centerX, centerY, canvas, intensity) {
        const numLines = Math.floor(intensity * 50);
        
        for (let i = 0; i < numLines; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 100 + Math.random() * (canvas.width * 0.4);
            const distance = Math.random() * (canvas.width * 0.3);
            
            const x1 = centerX + Math.cos(angle) * distance;
            const y1 = centerY + Math.sin(angle) * distance;
            const x2 = centerX + Math.cos(angle) * (distance + length);
            const y2 = centerY + Math.sin(angle) * (distance + length);
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + intensity * 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    /**
     * Effetto vignette scuro ai bordi
     */
    function drawVignette(ctx, canvas) {
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        name: 'Warp-Tunnel'
    };

})();
