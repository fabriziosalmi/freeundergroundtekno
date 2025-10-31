/**
 * ACID SPIRAL LSD - Spirale Psichedelica Estrema
 * Spirale trippy che si torce e cambia colore
 * Stile LSD underground freetekno
 */

const AcidSpiralLSD = (function() {
    'use strict';

    let rotation = 0;
    let colorShift = 0;
    let warpFactor = 0;

    function init(canvas) {
        rotation = 0;
        colorShift = 0;
        warpFactor = 0;
        console.log('🌀 Acid-Spiral-LSD initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Motion blur
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        rotation += 0.02 + midIntensity * 0.05;
        colorShift += 0.01;
        warpFactor = bassIntensity * 100;
        
        // Multiple spirals
        for (let spiral = 0; spiral < 3; spiral++) {
            drawSpiral(ctx, centerX, centerY, rotation + spiral * Math.PI * 0.66, colorShift + spiral * 120, warpFactor, trebleIntensity);
        }
    }

    function drawSpiral(ctx, cx, cy, rot, colorOffset, warp, treble) {
        const numPoints = 500;
        const maxRadius = Math.max(canvas.width, canvas.height) * 0.7;
        
        ctx.beginPath();
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / numPoints;
            const angle = rot + t * Math.PI * 8 + Math.sin(t * 10) * warp * 0.01;
            const radius = t * maxRadius + Math.sin(t * 20) * warp;
            
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            const hue = (colorOffset + t * 360) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, ${50 + treble * 30}%)`;
            ctx.lineWidth = 3 + treble * 5;
            
            if (i > 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.moveTo(x, y);
            }
            
            if (i % 10 === 0) {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        }
        ctx.stroke();
    }

    return {
        init: init,
        draw: draw,
        name: 'Acid-Spiral-LSD'
    };
})();
