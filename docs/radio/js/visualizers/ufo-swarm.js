/**
 * UFO-SWARM - Sciame di UFO Alieni
 * Bassi = UFO grandi, Medi = UFO medi, Alti = UFO piccoli veloci
 */

const UFOSwarm = (function() {
    'use strict';

    const acidColors = ['#00FF00', '#FF00FF', '#00FFFF', '#FFFF00'];
    let ufos = { bass: [], mid: [], treble: [] };

    function init(canvas) {
        ufos = { bass: [], mid: [], treble: [] };
        
        // BASSI: 8 UFO grandi
        for (let i = 0; i < 8; i++) {
            ufos.bass.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                angle: Math.random() * Math.PI * 2
            });
        }
        
        // MEDI: 15 UFO medi
        for (let i = 0; i < 15; i++) {
            ufos.mid.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                angle: Math.random() * Math.PI * 2
            });
        }
        
        // ALTI: 25 UFO piccoli
        for (let i = 0; i < 25; i++) {
            ufos.treble.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                angle: Math.random() * Math.PI * 2
            });
        }
        
        console.log('🛸 UFO-Swarm initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        
        const bassRange = Math.floor(bufferLength * 0.25);
        const midStart = bassRange;
        const midEnd = Math.floor(bufferLength * 0.65);
        const trebleStart = midEnd;
        
        let bassSum = 0, midSum = 0, trebleSum = 0;
        
        for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
        for (let i = midStart; i < midEnd; i++) midSum += dataArray[i];
        for (let i = trebleStart; i < bufferLength; i++) trebleSum += dataArray[i];
        
        const bassIntensity = (bassSum / bassRange) / 255;
        const midIntensity = (midSum / (midEnd - midStart)) / 255;
        const trebleIntensity = (trebleSum / (bufferLength - trebleStart)) / 255;
        
        // UFO BASSI
        ufos.bass.forEach((ufo, i) => {
            ufo.x += ufo.vx * (1 + bassIntensity * 2);
            ufo.y += ufo.vy * (1 + bassIntensity * 2);
            ufo.angle += 0.02 + (bassIntensity * 0.1);
            ufo.x += Math.sin(Date.now() * 0.001 + i) * 3;
            ufo.y += Math.cos(Date.now() * 0.001 + i) * 3;
            
            if (ufo.x < -50) ufo.x = canvas.width + 50;
            if (ufo.x > canvas.width + 50) ufo.x = -50;
            if (ufo.y < -50) ufo.y = canvas.height + 50;
            if (ufo.y > canvas.height + 50) ufo.y = -50;
            
            const size = 30 + (bassIntensity * 40);
            drawUFO(ctx, ufo.x, ufo.y, size, ufo.angle, '#FF0000', '#00FF00', bassIntensity);
            
            if (bassIntensity > 0.6) {
                ctx.strokeStyle = '#00FF00' + '40';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(ufo.x, ufo.y, size + 20, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // UFO MEDI
        ufos.mid.forEach((ufo, i) => {
            ufo.x += ufo.vx * (1 + midIntensity);
            ufo.y += ufo.vy * (1 + midIntensity);
            ufo.angle += 0.05 + (midIntensity * 0.15);
            ufo.x += Math.sin(Date.now() * 0.002 + i) * 5;
            ufo.y += Math.cos(Date.now() * 0.0015 + i) * 5;
            
            if (ufo.x < -30) ufo.x = canvas.width + 30;
            if (ufo.x > canvas.width + 30) ufo.x = -30;
            if (ufo.y < -30) ufo.y = canvas.height + 30;
            if (ufo.y > canvas.height + 30) ufo.y = -30;
            
            const size = 20 + (midIntensity * 25);
            drawUFO(ctx, ufo.x, ufo.y, size, ufo.angle, '#FF00FF', '#00FFFF', midIntensity);
        });
        
        // UFO ALTI
        ufos.treble.forEach((ufo, i) => {
            ufo.x += ufo.vx * (1 + trebleIntensity * 3);
            ufo.y += ufo.vy * (1 + trebleIntensity * 3);
            ufo.angle += 0.1 + (trebleIntensity * 0.2);
            ufo.x += Math.sin(Date.now() * 0.005 + i) * 8;
            ufo.y += Math.cos(Date.now() * 0.004 + i) * 8;
            
            if (ufo.x < -20) ufo.x = canvas.width + 20;
            if (ufo.x > canvas.width + 20) ufo.x = -20;
            if (ufo.y < -20) ufo.y = canvas.height + 20;
            if (ufo.y > canvas.height + 20) ufo.y = -20;
            
            const size = 10 + (trebleIntensity * 15);
            drawUFO(ctx, ufo.x, ufo.y, size, ufo.angle, '#FFFF00', '#FFFFFF', trebleIntensity);
            
            if (trebleIntensity > 0.7) {
                ctx.fillStyle = '#FFFFFF' + '80';
                ctx.fillRect(ufo.x - 2, ufo.y - 2, 4, 4);
            }
        });
        
        // Connessioni
        if (bassIntensity > 0.5 || midIntensity > 0.5) {
            connectUFOs(ctx, ufos.bass, 150, '#00FF00', bassIntensity);
            connectUFOs(ctx, ufos.mid, 100, '#FF00FF', midIntensity);
        }
    }

    function drawUFO(ctx, x, y, size, angle, color1, color2, intensity) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, color2);
        gradient.addColorStop(0.7, color1);
        gradient.addColorStop(1, color1 + '00');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = intensity > 0.6 ? '#FFFFFF' : color2;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(0, -size * 0.2, size * 0.4, size * 0.3, 0, Math.PI, 0, true);
        ctx.fillStyle = color2 + 'AA';
        ctx.fill();
        
        if (Math.random() > 0.7) {
            for (let i = 0; i < 5; i++) {
                const lx = Math.cos((Math.PI * 2 / 5) * i) * size * 0.7;
                const ly = Math.sin((Math.PI * 2 / 5) * i) * size * 0.25;
                ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : color1;
                ctx.beginPath();
                ctx.arc(lx, ly, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    function connectUFOs(ctx, ufoArray, maxDistance, color, intensity) {
        for (let i = 0; i < ufoArray.length; i++) {
            for (let j = i + 1; j < ufoArray.length; j++) {
                const dx = ufoArray[i].x - ufoArray[j].x;
                const dy = ufoArray[i].y - ufoArray[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const alpha = Math.floor((1 - distance / maxDistance) * intensity * 255).toString(16).padStart(2, '0');
                    ctx.strokeStyle = color + alpha;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(ufoArray[i].x, ufoArray[i].y);
                    ctx.lineTo(ufoArray[j].x, ufoArray[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'UFO-Swarm'
    };

})();
