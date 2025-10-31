/**
 * COLOR BURST - Esplosione di Colori Sincronizzata
 */
const ColorBurst = (function() {
    'use strict';
    const bursts = [];
    let lastBeat = 0;
    
    function init(canvas) {
        bursts.length = 0;
        lastBeat = 0;
        console.log('💥 Color-Burst initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        // Create burst on bass kick
        if(bass > 0.75 && Date.now() - lastBeat > 150) {
            lastBeat = Date.now();
            bursts.push({
                x: canvas.width/2,
                y: canvas.height/2,
                radius: 0,
                maxRadius: 200 + bass*300,
                speed: 5 + bass*10,
                hue: Math.random()*360,
                alpha: 1,
                particles: []
            });
            
            // Add particles to burst
            const numParticles = Math.floor(50 + bass*100);
            for(let i=0; i<numParticles; i++) {
                const angle = (i/numParticles) * Math.PI * 2;
                bursts[bursts.length-1].particles.push({
                    angle: angle,
                    speed: 3 + Math.random()*5 + bass*5,
                    size: 2 + Math.random()*4,
                    hue: (bursts[bursts.length-1].hue + Math.random()*60 - 30) % 360
                });
            }
        }
        
        // Update and draw bursts
        for(let i=bursts.length-1; i>=0; i--) {
            const burst = bursts[i];
            burst.radius += burst.speed;
            burst.alpha -= 0.015;
            
            if(burst.alpha <= 0) {
                bursts.splice(i, 1);
                continue;
            }
            
            // Draw expanding ring
            ctx.strokeStyle = `hsla(${burst.hue}, 100%, 60%, ${burst.alpha})`;
            ctx.lineWidth = 5 + mid*10;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsl(${burst.hue}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI*2);
            ctx.stroke();
            
            // Draw particles
            burst.particles.forEach(p => {
                const dist = burst.radius + p.speed*10;
                const x = burst.x + Math.cos(p.angle) * dist;
                const y = burst.y + Math.sin(p.angle) * dist;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size*3);
                gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${burst.alpha})`);
                gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI*2);
                ctx.fill();
            });
        }
        
        ctx.shadowBlur = 0;
        
        // Frequency spectrum as colored waves from center
        const numWaves = 8;
        for(let w=0; w<numWaves; w++) {
            const angle = (w/numWaves) * Math.PI * 2;
            ctx.strokeStyle = `hsla(${w*45 + mid*180}, 90%, 60%, 0.6)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for(let i=0; i<32; i++) {
                const dataIdx = w*32 + i;
                const level = dataArray[dataIdx]/255;
                const dist = 100 + i*8 + level*100;
                const waveAngle = angle + Math.sin(i*0.3 + Date.now()*0.003)*0.2;
                const x = canvas.width/2 + Math.cos(waveAngle) * dist;
                const y = canvas.height/2 + Math.sin(waveAngle) * dist;
                
                if(i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Central core pulse
        const coreSize = 30 + bass*80;
        const coreGradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, coreSize
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${bass})`);
        coreGradient.addColorStop(0.5, `rgba(255, 100, 200, ${mid*0.8})`);
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, coreSize, 0, Math.PI*2);
        ctx.fill();
        
        // Screen flash on big bass
        if(bass > 0.85) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(bass-0.85)*2})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    return { init, draw, name: 'Color-Burst' };
})();
