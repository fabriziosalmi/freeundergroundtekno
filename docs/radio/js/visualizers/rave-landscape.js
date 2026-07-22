/**
 * RAVE LANDSCAPE - Paesaggio Sound System Stile Line Art
 */
const RaveLandscape = (function() {
    'use strict';
    let time = 0;
    let structures = [];
    
    function init(canvas) {
        time = 0;
        structures = [];
        
        // Create landscape structures (speakers, towers, trusses)
        const numStructures = 15;
        for (let i = 0; i < numStructures; i++) {
            structures.push({
                x: (i / numStructures) * canvas.width,
                type: Math.floor(Math.random() * 4), // 0=speaker, 1=tower, 2=truss, 3=stack
                height: 0.4 + Math.random() * 0.5,
                width: 0.05 + Math.random() * 0.08,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        console.log('🎪 Rave-Landscape initialized');
    }
    
    function drawSpeaker(ctx, x, y, width, height, hue, intensity) {
        // Speaker box outline
        ctx.strokeStyle = `hsl(${hue}, 80%, ${40 + intensity * 40}%)`;
        ctx.lineWidth = 2 + intensity * 3;
        ctx.strokeRect(x - width/2, y - height, width, height);
        
        // Speaker cone circles
        const numCones = 3;
        for (let i = 0; i < numCones; i++) {
            const coneY = y - height * (0.2 + i * 0.3);
            const coneSize = width * (0.3 - i * 0.05) * (1 + intensity * 0.3);
            
            ctx.beginPath();
            ctx.arc(x, coneY, coneSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner circle
            ctx.beginPath();
            ctx.arc(x, coneY, coneSize * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Glow
        if (intensity > 0.5) {
            ctx.shadowBlur = 15 + intensity * 20;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.strokeRect(x - width/2, y - height, width, height);
            ctx.shadowBlur = 0;
        }
    }
    
    function drawTower(ctx, x, y, width, height, hue, intensity) {
        // Tower structure (truss style)
        ctx.strokeStyle = `hsl(${hue}, 70%, ${35 + intensity * 45}%)`;
        ctx.lineWidth = 2 + intensity * 2;
        
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x - width/2, y);
        ctx.lineTo(x - width/2, y - height);
        ctx.moveTo(x + width/2, y);
        ctx.lineTo(x + width/2, y - height);
        ctx.stroke();
        
        // Cross beams
        const numBeams = 8;
        for (let i = 0; i < numBeams; i++) {
            const beamY = y - (i / numBeams) * height;
            ctx.beginPath();
            ctx.moveTo(x - width/2, beamY);
            ctx.lineTo(x + width/2, beamY);
            ctx.stroke();
            
            // X pattern
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(x - width/2, beamY);
                ctx.lineTo(x + width/2, beamY - height / numBeams);
                ctx.moveTo(x + width/2, beamY);
                ctx.lineTo(x - width/2, beamY - height / numBeams);
                ctx.stroke();
            }
        }
        
        // Top lights
        for (let i = 0; i < 3; i++) {
            const lightX = x - width/2 + (i / 2) * width;
            ctx.fillStyle = `hsl(${(hue + i * 40) % 360}, 100%, ${intensity * 80}%)`;
            ctx.beginPath();
            ctx.arc(lightX, y - height - 10, 3 + intensity * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawTruss(ctx, x, y, width, height, hue, intensity) {
        // Horizontal truss
        ctx.strokeStyle = `hsl(${hue}, 75%, ${38 + intensity * 42}%)`;
        ctx.lineWidth = 2 + intensity * 2;
        
        // Top and bottom bars
        ctx.beginPath();
        ctx.moveTo(x - width/2, y - height);
        ctx.lineTo(x + width/2, y - height);
        ctx.moveTo(x - width/2, y - height * 0.7);
        ctx.lineTo(x + width/2, y - height * 0.7);
        ctx.stroke();
        
        // Cross pattern
        const numSections = 6;
        for (let i = 0; i < numSections; i++) {
            const sectionX = x - width/2 + (i / numSections) * width;
            ctx.beginPath();
            ctx.moveTo(sectionX, y - height);
            ctx.lineTo(sectionX + width/numSections, y - height * 0.7);
            ctx.moveTo(sectionX + width/numSections, y - height);
            ctx.lineTo(sectionX, y - height * 0.7);
            ctx.stroke();
        }
        
        // Hanging speakers
        for (let i = 0; i < 4; i++) {
            const speakerX = x - width/2 + (i / 3) * width;
            ctx.beginPath();
            ctx.moveTo(speakerX, y - height);
            ctx.lineTo(speakerX, y - height * 0.5);
            ctx.stroke();
            
            const speakerSize = 8 + intensity * 8;
            ctx.strokeRect(speakerX - speakerSize/2, y - height * 0.5, speakerSize, speakerSize);
        }
    }
    
    function drawStack(ctx, x, y, width, height, hue, intensity) {
        // Stack of sub boxes
        const numBoxes = 6;
        const boxHeight = height / numBoxes;
        
        for (let i = 0; i < numBoxes; i++) {
            const boxY = y - (i + 1) * boxHeight;
            const boxHue = (hue + i * 15) % 360;
            
            ctx.strokeStyle = `hsl(${boxHue}, 80%, ${40 + intensity * 40}%)`;
            ctx.lineWidth = 2 + intensity * 2;
            ctx.strokeRect(x - width/2, boxY, width, boxHeight);
            
            // Speaker cone
            const coneSize = width * 0.35 * (1 + intensity * 0.4);
            ctx.beginPath();
            ctx.arc(x, boxY + boxHeight/2, coneSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner cone
            ctx.beginPath();
            ctx.arc(x, boxY + boxHeight/2, coneSize * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const bass = dataArray.slice(0, 50).reduce((a,b) => a+b, 0) / 50 / 255;
        const mid = dataArray.slice(50, 150).reduce((a,b) => a+b, 0) / 100 / 255;
        const treble = dataArray.slice(150, 250).reduce((a,b) => a+b, 0) / 100 / 255;
        
        time += 0.03 + bass * 0.05;
        
        const groundY = canvas.height * 0.85;
        
        // Draw ground with sound waves
        ctx.strokeStyle = `hsl(${time * 30 % 360}, 60%, 30%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
            const waveOffset = Math.sin(x * 0.02 + time) * bass * 20;
            const y = groundY + waveOffset;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw all structures
        structures.forEach((struct, idx) => {
            const dataIdx = Math.floor((idx / structures.length) * 256);
            const intensity = dataArray[dataIdx] / 255;
            
            // Position with perspective
            const x = struct.x + Math.sin(time + struct.phase) * bass * 20;
            const y = groundY;
            const height = canvas.height * struct.height * (1 + intensity * 0.4 + bass * 0.2);
            const width = canvas.width * struct.width * (1 + intensity * 0.2);
            
            // Color based on frequency band and time
            const hue = (idx * 25 + time * 40 + intensity * 120) % 360;
            
            // Distortion effect
            ctx.save();
            ctx.translate(x, y);
            
            // Warp on bass
            if (bass > 0.7) {
                const skew = Math.sin(time + idx) * bass * 0.1;
                ctx.transform(1, skew, 0, 1, 0, 0);
            }
            
            // Draw structure type
            switch(struct.type) {
                case 0:
                    drawSpeaker(ctx, 0, 0, width, height, hue, intensity);
                    break;
                case 1:
                    drawTower(ctx, 0, 0, width, height, hue, intensity);
                    break;
                case 2:
                    drawTruss(ctx, 0, 0, width, height, hue, intensity);
                    break;
                case 3:
                    drawStack(ctx, 0, 0, width, height, hue, intensity);
                    break;
            }
            
            ctx.restore();
            
            // Sound pressure waves
            if (intensity > 0.7) {
                const waveRadius = 30 + intensity * 50;
                ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${intensity * 0.5})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y - height/2, waveRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // Crowd silhouettes at bottom
        const numPeople = 40;
        for (let i = 0; i < numPeople; i++) {
            const personX = (i / numPeople) * canvas.width;
            const dataIdx = i * 6;
            const jump = dataArray[dataIdx] / 255 * bass * 30;
            
            const hue = (i * 10 + time * 20) % 360;
            ctx.fillStyle = `hsla(${hue}, 70%, 40%, 0.6)`;
            
            // Simple person shape
            ctx.fillRect(personX, groundY - 30 - jump, 8, 30);
            ctx.beginPath();
            ctx.arc(personX + 4, groundY - 35 - jump, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Laser beams
        if (treble > 0.6) {
            const numLasers = 8;
            for (let i = 0; i < numLasers; i++) {
                const laserX = (i / numLasers) * canvas.width;
                const angle = Math.sin(time + i) * treble;
                
                ctx.strokeStyle = `hsla(${(i * 45 + time * 50) % 360}, 100%, 60%, ${treble * 0.6})`;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${(i * 45 + time * 50) % 360}, 100%, 60%)`;
                
                ctx.beginPath();
                ctx.moveTo(laserX, 0);
                ctx.lineTo(laserX + angle * 200, canvas.height);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }
        
        // Bass kick flash
        if (bass > 0.85) {
            const flashHue = (time * 100) % 360;
            ctx.fillStyle = `hsla(${flashHue}, 100%, 60%, ${(bass - 0.85) * 2})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Smoke/fog effect at bottom
        ctx.fillStyle = `hsla(${time * 20 % 360}, 30%, 30%, ${0.1 + mid * 0.2})`;
        const fogGradient = ctx.createLinearGradient(0, groundY - 100, 0, groundY + 50);
        fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fogGradient.addColorStop(1, `hsla(${time * 20 % 360}, 40%, 20%, 0.6)`);
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, groundY - 100, canvas.width, 150);
    }
    
    return { init, draw, name: 'Rave-Landscape' };
})();
