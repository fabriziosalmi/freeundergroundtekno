/**
 * PSYCH-SPIRAL - Spirale Psichedelica Potenziata
 * Cerchi concentrici rotanti + raggiere + particelle esplosive
 */

const PsychSpiral = (function() {
    'use strict';

    const acidColors = ['#00FF00', '#FF00FF', '#00FFFF', '#FFFF00'];
    let currentColorIndex = 0;

    function init(canvas) {
        currentColorIndex = Math.floor(Math.random() * acidColors.length);
        console.log('🌀 Psych-Spiral initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const bufferLength = analyser.frequencyBinCount;

        // Estrae bassi, medi, alti
        const bassRange = Math.floor(bufferLength * 0.2);
        const trebleStart = Math.floor(bufferLength * 0.8);
        const midStart = Math.floor(bufferLength * 0.4);
        const midEnd = Math.floor(bufferLength * 0.6);
        
        let bassSum = 0, trebleSum = 0, midSum = 0;
        
        for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
        for (let i = trebleStart; i < bufferLength; i++) trebleSum += dataArray[i];
        for (let i = midStart; i < midEnd; i++) midSum += dataArray[i];
        
        const bassIntensity = (bassSum / bassRange) / 255;
        const trebleIntensity = (trebleSum / (bufferLength - trebleStart)) / 255;
        const midIntensity = (midSum / (midEnd - midStart)) / 255;

        // Rotazione basata sul tempo e sui medi
        const rotation = (Date.now() * 0.0005) + (midIntensity * Math.PI);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);

        // Cerchi concentrici
        const numCircles = 25;
        const baseRadius = 20;
        const radiusIncrement = 20;
        
        for (let i = 0; i < numCircles; i++) {
            const radius = baseRadius + (i * radiusIncrement);
            const pulseRadius = radius + (bassIntensity * 80);
            
            let color;
            if (bassIntensity > 0.7) {
                color = acidColors[currentColorIndex];
            } else if (i % 3 === 0) {
                color = acidColors[(currentColorIndex + 1) % acidColors.length];
            } else if (i % 2 === 0) {
                color = '#FFFFFF';
            } else {
                color = acidColors[currentColorIndex] + '40';
            }
            
            const lineWidth = 1 + (trebleIntensity * 8) + (midIntensity * 4);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            
            // Linee interrotte
            if (Math.random() > 0.6) {
                ctx.beginPath();
                const startAngle = Math.random() * Math.PI * 2;
                const endAngle = startAngle + (Math.random() * Math.PI / 3);
                ctx.arc(centerX, centerY, pulseRadius, startAngle, endAngle);
                ctx.strokeStyle = acidColors[(currentColorIndex + 2) % acidColors.length];
                ctx.lineWidth = lineWidth * 2;
                ctx.stroke();
            }
            
            // Raggiere sui bassi forti
            if (bassIntensity > 0.8 && i % 4 === 0) {
                const numRays = 8;
                for (let r = 0; r < numRays; r++) {
                    const angle = (Math.PI * 2 / numRays) * r;
                    const rayLength = bassIntensity * 100;
                    
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + Math.cos(angle) * pulseRadius,
                        centerY + Math.sin(angle) * pulseRadius
                    );
                    ctx.lineTo(
                        centerX + Math.cos(angle) * (pulseRadius + rayLength),
                        centerY + Math.sin(angle) * (pulseRadius + rayLength)
                    );
                    ctx.strokeStyle = acidColors[currentColorIndex];
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
        }

        ctx.restore();

        // Nucleo centrale pulsante
        const coreSize = 8 + (bassIntensity * 30) + (midIntensity * 20);
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize * 2);
        gradient.addColorStop(0, acidColors[currentColorIndex]);
        gradient.addColorStop(0.5, acidColors[currentColorIndex] + '80');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // Particelle esplose sui picchi
        if (bassIntensity > 0.85) {
            const numParticles = 20;
            for (let p = 0; p < numParticles; p++) {
                const angle = (Math.PI * 2 / numParticles) * p;
                const distance = 200 + (Math.random() * 100);
                const px = centerX + Math.cos(angle) * distance;
                const py = centerY + Math.sin(angle) * distance;
                const size = 5 + Math.random() * 10;
                
                ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : acidColors[currentColorIndex];
                ctx.fillRect(px - size/2, py - size/2, size, size);
            }
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Psych-Spiral'
    };

})();
