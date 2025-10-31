/**
 * RADIO LOGO PULSE - Visualizer con Logo Radio
 * Logo Free Underground Tekno che pulsa e si distorce
 * Carica logo da images/logo.webp (o .png)
 */

const RadioLogoPulse = (function() {
    'use strict';

    let logo = null;
    let logoLoaded = false;
    let pulse = 0;
    let rotation = 0;
    const particles = [];

    function init(canvas) {
        logo = new Image();
        logoLoaded = false;
        pulse = 0;
        rotation = 0;
        particles.length = 0;
        
        // Prova a caricare logo (diversi formati)
        logo.onload = function() {
            logoLoaded = true;
            console.log('📻 Radio logo loaded!');
        };
        logo.onerror = function() {
            console.warn('⚠️ Logo not found, using text fallback');
        };
        
        // Prova prima WebP, poi PNG, poi fallback
        logo.src = 'images/logo.webp';
        setTimeout(() => {
            if (!logoLoaded) {
                logo.src = 'images/logo.png';
            }
        }, 500);
        
        // Crea particelle di sfondo
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 2 + Math.random() * 4
            });
        }
        
        console.log('📻 Radio-Logo-Pulse initialized');
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
        
        // Background gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width);
        gradient.addColorStop(0, `rgba(${Math.floor(bassIntensity * 50)}, ${Math.floor(midIntensity * 50)}, ${Math.floor(trebleIntensity * 50)}, 1)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Aggiorna particelle
        updateParticles(ctx, canvas, particles, trebleIntensity);
        
        // Pulse e rotation
        pulse = 1 + bassIntensity * 0.5;
        rotation += 0.005 + midIntensity * 0.01;
        
        // Disegna logo o fallback
        if (logoLoaded && logo.complete) {
            drawLogo(ctx, centerX, centerY, bassIntensity, midIntensity, trebleIntensity);
        } else {
            drawTextFallback(ctx, centerX, centerY, bassIntensity, midIntensity);
        }
        
        // Rings pulsanti
        drawPulseRings(ctx, centerX, centerY, bassIntensity, canvas);
        
        // Waveform circolare
        drawCircularWaveform(ctx, centerX, centerY, dataArray, analyser, trebleIntensity);
    }

    function drawLogo(ctx, cx, cy, bass, mid, treble) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.scale(pulse, pulse);
        
        const size = 300;
        
        // Glow layers
        for (let i = 3; i > 0; i--) {
            ctx.globalAlpha = (bass * 0.3) / i;
            const glowSize = size * (1 + i * 0.2);
            ctx.drawImage(logo, -glowSize/2, -glowSize/2, glowSize, glowSize);
        }
        
        // Main logo
        ctx.globalAlpha = 1;
        ctx.drawImage(logo, -size/2, -size/2, size, size);
        
        // Color overlay
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${Math.floor(bass * 255)}, ${Math.floor(mid * 255)}, ${Math.floor(treble * 255)}, 0.5)`;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.globalCompositeOperation = 'source-over';
        
        ctx.restore();
    }

    function drawTextFallback(ctx, cx, cy, bass, mid) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.scale(pulse, pulse);
        
        // Glow
        ctx.shadowColor = `rgba(0, 255, 0, ${bass})`;
        ctx.shadowBlur = 20 + bass * 40;
        
        // Text
        ctx.fillStyle = '#0F0';
        ctx.font = 'bold 60px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FREE', 0, -30);
        ctx.fillText('UNDERGROUND', 0, 10);
        ctx.fillText('TEKNO', 0, 50);
        
        ctx.restore();
    }

    function updateParticles(ctx, canvas, particles, intensity) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // Move
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            // Draw
            ctx.fillStyle = `rgba(0, 255, 0, ${0.3 + intensity * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPulseRings(ctx, cx, cy, intensity, canvas) {
        const numRings = 5;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
        
        for (let i = 0; i < numRings; i++) {
            const radius = maxRadius * ((i + pulse) / numRings) % maxRadius;
            const alpha = 1 - (radius / maxRadius);
            
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * intensity})`;
            ctx.lineWidth = 2 + intensity * 4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawCircularWaveform(ctx, cx, cy, dataArray, analyser, intensity) {
        const bufferLength = analyser.frequencyBinCount;
        const radius = 250;
        const segments = 100;
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + intensity * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            const dataIndex = Math.floor((i / segments) * bufferLength);
            const value = dataArray[dataIndex] / 255;
            const r = radius + value * 100;
            
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
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
        name: 'Radio-Logo-Pulse'
    };

})();
