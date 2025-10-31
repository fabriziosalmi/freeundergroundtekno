/**
 * LASER GRID - Visualizer Laser da Rave
 * Laser che tagliano lo spazio in tutte le direzioni
 * Stile rave techno - laser verdi rossi cyan
 */

const LaserGrid = (function() {
    'use strict';

    const lasers = [];
    const numLasers = 12;
    let time = 0;

    function init(canvas) {
        lasers.length = 0;
        time = 0;
        
        // Crea laser
        for (let i = 0; i < numLasers; i++) {
            lasers.push({
                angle: (Math.PI * 2 / numLasers) * i,
                speed: 0.02 + Math.random() * 0.03,
                length: 0,
                color: getRandomLaserColor(),
                thickness: 1 + Math.random() * 2
            });
        }
        
        console.log('🔴 Laser-Grid initialized');
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
        
        time += 0.01;
        
        // Background nero con motion blur
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Smoke/fog effect
        drawFog(ctx, canvas, midIntensity);
        
        // Disegna ogni laser
        for (let i = 0; i < lasers.length; i++) {
            const laser = lasers[i];
            
            // Rotazione
            laser.angle += laser.speed * (1 + midIntensity);
            
            // Lunghezza basata su intensità
            const maxLength = Math.min(canvas.width, canvas.height) * 0.6;
            laser.length = maxLength * (0.5 + bassIntensity * 0.5);
            
            drawLaser(ctx, centerX, centerY, laser, bassIntensity, trebleIntensity);
        }
        
        // Laser beam cross center
        if (bassIntensity > 0.6) {
            drawCrossBeams(ctx, centerX, centerY, canvas, bassIntensity, time);
        }
        
        // Particles sui laser
        if (trebleIntensity > 0.6) {
            drawLaserParticles(ctx, centerX, centerY, lasers, trebleIntensity);
        }
        
        // Centro brillante
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30 + bassIntensity * 50);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, `rgba(255, 0, 0, ${bassIntensity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30 + bassIntensity * 50, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLaser(ctx, cx, cy, laser, bass, treble) {
        const endX = cx + Math.cos(laser.angle) * laser.length;
        const endY = cy + Math.sin(laser.angle) * laser.length;
        
        // Outer glow
        ctx.strokeStyle = `rgba(${laser.color.join(',')}, ${0.3 + bass * 0.3})`;
        ctx.lineWidth = laser.thickness * 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Middle glow
        ctx.strokeStyle = `rgba(${laser.color.join(',')}, ${0.6 + bass * 0.4})`;
        ctx.lineWidth = laser.thickness * 4;
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + treble * 0.2})`;
        ctx.lineWidth = laser.thickness;
        ctx.stroke();
        
        // End point
        ctx.fillStyle = `rgba(${laser.color.join(',')}, 1)`;
        ctx.beginPath();
        ctx.arc(endX, endY, 3 + bass * 5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawCrossBeams(ctx, cx, cy, canvas, intensity, t) {
        const numBeams = 4;
        
        for (let i = 0; i < numBeams; i++) {
            const angle = (Math.PI / 2) * i + t;
            const length = Math.max(canvas.width, canvas.height);
            
            const gradient = ctx.createLinearGradient(
                cx, cy,
                cx + Math.cos(angle) * length,
                cy + Math.sin(angle) * length
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3 + intensity * 5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
            ctx.stroke();
        }
    }

    function drawFog(ctx, canvas, intensity) {
        const numFogSpots = 10;
        
        for (let i = 0; i < numFogSpots; i++) {
            const x = (i / numFogSpots) * canvas.width;
            const y = canvas.height * 0.7 + Math.sin(time + i) * 50;
            const size = 100 + Math.sin(time * 2 + i) * 50;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, `rgba(100, 100, 100, ${intensity * 0.1})`);
            gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawLaserParticles(ctx, cx, cy, lasers, intensity) {
        for (let i = 0; i < lasers.length; i++) {
            const laser = lasers[i];
            const numParticles = 5;
            
            for (let j = 0; j < numParticles; j++) {
                const t = j / numParticles;
                const x = cx + Math.cos(laser.angle) * laser.length * t;
                const y = cy + Math.sin(laser.angle) * laser.length * t;
                const size = 2 + intensity * 3;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function getRandomLaserColor() {
        const colors = [
            [255, 0, 0],    // Rosso
            [0, 255, 0],    // Verde
            [0, 255, 255],  // Cyan
            [255, 0, 255],  // Magenta
            [255, 255, 0]   // Giallo
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    return {
        init: init,
        draw: draw,
        name: 'Laser-Grid'
    };

})();
