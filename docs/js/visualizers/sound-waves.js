/**
 * SOUND WAVES - Visualizer Onde Sonore
 * Multiple onde concentriche che si propagano
 * Effetto doppler + interferenza + risonanza
 */

const SoundWaves = (function() {
    'use strict';

    const waves = [];
    const maxWaves = 20;
    let time = 0;
    const emitters = [];
    const numEmitters = 5;

    function init(canvas) {
        waves.length = 0;
        emitters.length = 0;
        time = 0;
        
        // Crea emettitori di onde
        for (let i = 0; i < numEmitters; i++) {
            emitters.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                phase: Math.random() * Math.PI * 2,
                color: getRandomColor()
            });
        }
        
        console.log('🌊 Sound-Waves initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Motion blur
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        time += 0.02;
        
        // Aggiorna emettitori
        updateEmitters(canvas, midIntensity);
        
        // Genera nuove onde su bass
        if (bassIntensity > 0.5) {
            const numNewWaves = Math.floor(bassIntensity * 3);
            for (let i = 0; i < numNewWaves && waves.length < maxWaves; i++) {
                const emitter = emitters[Math.floor(Math.random() * emitters.length)];
                createWave(emitter, bassIntensity);
            }
        }
        
        // Aggiorna e disegna onde
        updateWaves(ctx, canvas, trebleIntensity);
        
        // Disegna emettitori
        drawEmitters(ctx, bassIntensity, trebleIntensity);
        
        // Particelle di interferenza
        if (waves.length > 3) {
            drawInterference(ctx, canvas, midIntensity);
        }
        
        // Waveform oscillante
        drawOscillatingWaveform(ctx, canvas, dataArray, analyser);
    }

    /**
     * Aggiorna posizione emettitori
     */
    function updateEmitters(canvas, intensity) {
        for (let i = 0; i < emitters.length; i++) {
            const em = emitters[i];
            
            // Movimento
            em.x += em.vx * (1 + intensity);
            em.y += em.vy * (1 + intensity);
            
            // Rimbalzo
            if (em.x < 0 || em.x > canvas.width) {
                em.vx *= -1;
                em.x = Math.max(0, Math.min(canvas.width, em.x));
            }
            if (em.y < 0 || em.y > canvas.height) {
                em.vy *= -1;
                em.y = Math.max(0, Math.min(canvas.height, em.y));
            }
            
            em.phase += 0.05;
        }
    }

    /**
     * Crea nuova onda
     */
    function createWave(emitter, intensity) {
        waves.push({
            x: emitter.x,
            y: emitter.y,
            radius: 0,
            maxRadius: 200 + intensity * 300,
            speed: 3 + intensity * 5,
            thickness: 2 + intensity * 4,
            alpha: 1.0,
            color: emitter.color,
            frequency: 2 + Math.floor(intensity * 5)
        });
    }

    /**
     * Aggiorna onde
     */
    function updateWaves(ctx, canvas, intensity) {
        for (let i = waves.length - 1; i >= 0; i--) {
            const wave = waves[i];
            
            if (wave.radius < wave.maxRadius && wave.alpha > 0) {
                // Disegna onda con oscillazioni
                drawWave(ctx, wave, intensity);
                
                // Aggiorna
                wave.radius += wave.speed;
                wave.alpha = 1 - (wave.radius / wave.maxRadius);
            } else {
                waves.splice(i, 1);
            }
        }
    }

    /**
     * Disegna singola onda
     */
    function drawWave(ctx, wave, intensity) {
        const segments = 60;
        const amplitude = 10 + intensity * 20;
        
        ctx.strokeStyle = `rgba(${wave.color.join(',')}, ${wave.alpha * 0.8})`;
        ctx.lineWidth = wave.thickness * wave.alpha;
        ctx.beginPath();
        
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            
            // Oscillazione sinusoidale
            const oscillation = Math.sin(angle * wave.frequency + time * 5) * amplitude * wave.alpha;
            const radius = wave.radius + oscillation;
            
            const x = wave.x + Math.cos(angle) * radius;
            const y = wave.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
        
        // Glow interno
        if (wave.alpha > 0.5) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${wave.alpha * 0.4})`;
            ctx.lineWidth = wave.thickness * 0.5;
            ctx.stroke();
        }
    }

    /**
     * Disegna emettitori
     */
    function drawEmitters(ctx, bassIntensity, trebleIntensity) {
        for (let i = 0; i < emitters.length; i++) {
            const em = emitters[i];
            const size = 8 + Math.sin(em.phase) * 4 + bassIntensity * 10;
            
            // Glow pulsante
            const gradient = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, size * 3);
            gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
            gradient.addColorStop(0.3, `rgba(${em.color.join(',')}, 0.8)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(em.x, em.y, size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.fillStyle = `rgb(${em.color.join(',')})`;
            ctx.beginPath();
            ctx.arc(em.x, em.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Anello
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(em.x, em.y, size * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Raggi su treble alti
            if (trebleIntensity > 0.7) {
                drawEmitterRays(ctx, em, size, trebleIntensity);
            }
        }
    }

    /**
     * Raggi dall'emettitore
     */
    function drawEmitterRays(ctx, emitter, size, intensity) {
        const numRays = 8;
        const rayLength = 30 + intensity * 40;
        
        for (let i = 0; i < numRays; i++) {
            const angle = (Math.PI * 2 / numRays) * i + emitter.phase;
            const x = emitter.x + Math.cos(angle) * rayLength;
            const y = emitter.y + Math.sin(angle) * rayLength;
            
            ctx.strokeStyle = `rgba(${emitter.color.join(',')}, ${intensity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(emitter.x, emitter.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    /**
     * Pattern di interferenza tra onde
     */
    function drawInterference(ctx, canvas, intensity) {
        // Campiona punti casuali e calcola interferenza
        const numPoints = Math.floor(intensity * 50);
        
        for (let i = 0; i < numPoints; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            
            // Calcola interferenza totale nel punto
            let totalInterference = 0;
            
            for (let j = 0; j < waves.length; j++) {
                const wave = waves[j];
                const dx = x - wave.x;
                const dy = y - wave.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Check se punto è vicino a un'onda
                const waveDiff = Math.abs(dist - wave.radius);
                if (waveDiff < 20) {
                    totalInterference += (1 - waveDiff / 20) * wave.alpha;
                }
            }
            
            // Disegna particella se interferenza alta
            if (totalInterference > 1.5) {
                const size = 2 + totalInterference;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(totalInterference * 0.5, 1)})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Sparkle
                ctx.strokeStyle = `rgba(0, 255, 255, ${totalInterference * 0.3})`;
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
     * Waveform oscillante in basso
     */
    function drawOscillatingWaveform(ctx, canvas, dataArray, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const step = Math.floor(bufferLength / 200);
        const baseY = canvas.height - 50;
        const amplitude = 40;
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < 200; i++) {
            const x = (canvas.width / 200) * i;
            const value = (dataArray[i * step] / 255) - 0.5;
            const y = baseY + value * amplitude;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Reflection
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < 200; i++) {
            const x = (canvas.width / 200) * i;
            const value = (dataArray[i * step] / 255) - 0.5;
            const y = baseY - value * amplitude;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }

    /**
     * Colore random
     */
    function getRandomColor() {
        const colors = [
            [255, 0, 0],
            [0, 255, 0],
            [0, 0, 255],
            [255, 255, 0],
            [255, 0, 255],
            [0, 255, 255]
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    return {
        init: init,
        draw: draw,
        name: 'Sound-Waves'
    };

})();
