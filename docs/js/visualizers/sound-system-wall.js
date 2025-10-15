/**
 * SOUND SYSTEM WALL - Visualizer Muro di Casse
 * Muro gigante di speaker e subwoofer che pulsano a ritmo
 * Stile rave underground - sound system illegale
 */

const SoundSystemWall = (function() {
    'use strict';

    const speakers = [];
    let bassKick = 0;

    function init(canvas) {
        speakers.length = 0;
        bassKick = 0;
        
        // Crea griglia di speakers
        const cols = 8;
        const rows = 6;
        const spacing = 80;
        const offsetX = (canvas.width - (cols * spacing)) / 2;
        const offsetY = (canvas.height - (rows * spacing)) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isSub = row >= rows - 2; // Ultime 2 righe sono sub
                speakers.push({
                    x: offsetX + col * spacing + spacing / 2,
                    y: offsetY + row * spacing + spacing / 2,
                    size: isSub ? 60 : 40,
                    type: isSub ? 'sub' : (row < 2 ? 'tweeter' : 'mid'),
                    pulse: 0,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        
        console.log('🔊 Sound-System-Wall initialized with', speakers.length, 'speakers');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Background scuro rave
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcola intensità per banda
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Bass kick detection
        if (bassIntensity > 0.7) {
            bassKick = 1;
        } else {
            bassKick *= 0.9;
        }
        
        // Disegna ogni speaker
        for (let i = 0; i < speakers.length; i++) {
            const speaker = speakers[i];
            let intensity;
            
            // Assegna intensità per tipo
            if (speaker.type === 'sub') {
                intensity = bassIntensity;
            } else if (speaker.type === 'tweeter') {
                intensity = trebleIntensity;
            } else {
                intensity = midIntensity;
            }
            
            speaker.pulse = intensity;
            speaker.phase += 0.1;
            
            drawSpeaker(ctx, speaker, intensity, bassKick);
        }
        
        // Onde sonore che escono dal wall
        if (bassIntensity > 0.6) {
            drawSoundBlast(ctx, canvas, bassIntensity);
        }
        
        // Frequency bars laterali
        drawFrequencyBars(ctx, canvas, dataArray, analyser);
        
        // Strobo flash su kick forte
        if (bassKick > 0.8) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(bassKick - 0.8) * 0.3})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * Disegna singolo speaker
     */
    function drawSpeaker(ctx, speaker, intensity, kick) {
        const size = speaker.size * (1 + intensity * 0.5);
        const x = speaker.x;
        const y = speaker.y;
        
        // Cabinet box
        const boxSize = size * 1.2;
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.fillRect(x - boxSize/2, y - boxSize/2, boxSize, boxSize);
        ctx.strokeRect(x - boxSize/2, y - boxSize/2, boxSize, boxSize);
        
        if (speaker.type === 'sub') {
            // SUBWOOFER - cono grande
            drawSubwoofer(ctx, x, y, size, intensity, kick);
        } else if (speaker.type === 'tweeter') {
            // TWEETER - piccolo dome
            drawTweeter(ctx, x, y, size, intensity);
        } else {
            // MID - cono medio
            drawMidDriver(ctx, x, y, size, intensity);
        }
        
        // LED indicator
        const ledColor = intensity > 0.7 ? [255, 0, 0] : intensity > 0.4 ? [255, 255, 0] : [0, 255, 0];
        ctx.fillStyle = `rgb(${ledColor.join(',')})`;
        ctx.beginPath();
        ctx.arc(x - boxSize/2 + 5, y - boxSize/2 + 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Disegna subwoofer
     */
    function drawSubwoofer(ctx, x, y, size, intensity, kick) {
        // Cono che pulsa
        const coneSize = size * (1 + kick * 0.3);
        
        // Outer rim
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, coneSize * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        
        // Cone gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, coneSize);
        gradient.addColorStop(0, '#222');
        gradient.addColorStop(0.4, '#111');
        gradient.addColorStop(0.7, '#000');
        gradient.addColorStop(1, '#444');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, coneSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Dust cap centrale
        ctx.fillStyle = intensity > 0.6 ? '#FF0000' : '#333';
        ctx.beginPath();
        ctx.arc(x, y, coneSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow su bass forte
        if (intensity > 0.7) {
            const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, coneSize * 1.5);
            glowGrad.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.5})`);
            glowGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(x, y, coneSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Onde d'urto
        if (kick > 0.7) {
            for (let i = 0; i < 3; i++) {
                const waveSize = coneSize * (1.2 + i * 0.3) * kick;
                ctx.strokeStyle = `rgba(255, 0, 0, ${(1 - i/3) * kick * 0.5})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, waveSize, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    /**
     * Disegna tweeter
     */
    function drawTweeter(ctx, x, y, size, intensity) {
        // Dome tweeter
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, intensity > 0.6 ? '#00FFFF' : '#666');
        gradient.addColorStop(0.5, '#333');
        gradient.addColorStop(1, '#111');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Ring
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sparkle su treble alti
        if (intensity > 0.7) {
            ctx.fillStyle = `rgba(0, 255, 255, ${intensity})`;
            ctx.beginPath();
            ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Rays
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.6})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * size * 1.5, y + Math.sin(angle) * size * 1.5);
                ctx.stroke();
            }
        }
    }

    /**
     * Disegna mid driver
     */
    function drawMidDriver(ctx, x, y, size, intensity) {
        // Cone
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(0.5, '#222');
        gradient.addColorStop(1, '#555');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * (1 + intensity * 0.2), 0, Math.PI * 2);
        ctx.fill();
        
        // Surround
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center cap
        ctx.fillStyle = intensity > 0.5 ? `rgba(0, 255, 0, ${intensity})` : '#333';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Onde sonore esplosive
     */
    function drawSoundBlast(ctx, canvas, intensity) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const numWaves = 5;
        
        for (let i = 0; i < numWaves; i++) {
            const radius = (canvas.width * 0.3) * (i / numWaves) * intensity;
            const alpha = (1 - i / numWaves) * intensity * 0.3;
            
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Barre frequenza laterali
     */
    function drawFrequencyBars(ctx, canvas, dataArray, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const barCount = 32;
        const barWidth = 5;
        const barSpacing = 2;
        const maxHeight = 100;
        
        // Lato sinistro
        for (let i = 0; i < barCount; i++) {
            const value = dataArray[Math.floor(i * bufferLength / barCount)] / 255;
            const barHeight = value * maxHeight;
            const y = canvas.height - barHeight;
            const x = 10 + i * (barWidth + barSpacing);
            
            const hue = (value * 120);
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        // Lato destro
        for (let i = 0; i < barCount; i++) {
            const value = dataArray[Math.floor(i * bufferLength / barCount)] / 255;
            const barHeight = value * maxHeight;
            const y = canvas.height - barHeight;
            const x = canvas.width - 10 - (barCount - i) * (barWidth + barSpacing);
            
            const hue = (value * 120);
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Sound-System-Wall'
    };

})();
