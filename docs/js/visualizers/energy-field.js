/**
 * ENERGY FIELD - Campo di Energia con Particelle
 */
const EnergyField = (function() {
    'use strict';
    const particles = [];
    const maxParticles = 300;
    let fieldTime = 0;
    
    function init(canvas) {
        particles.length = 0;
        fieldTime = 0;
        
        for(let i=0; i<maxParticles; i++) {
            particles.push({
                x: Math.random()*canvas.width,
                y: Math.random()*canvas.height,
                vx: 0,
                vy: 0,
                angle: Math.random()*Math.PI*2,
                speed: 0.5 + Math.random()*1.5,
                size: 2 + Math.random()*3,
                hue: Math.random()*360
            });
        }
        
        console.log('⚡ Energy-Field initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,10,0.15)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        fieldTime += 0.05;
        
        const centerX = canvas.width/2;
        const centerY = canvas.height/2;
        const fieldStrength = bass*100;
        
        // Update and draw particles
        particles.forEach((p, idx) => {
            // Force field calculation (radial from center)
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Circular motion around center
            const fieldAngle = Math.atan2(dy, dx) + Math.PI/2;
            const fieldForce = (1 / (dist+1)) * fieldStrength;
            
            p.vx += Math.cos(fieldAngle)*fieldForce*0.1;
            p.vy += Math.sin(fieldAngle)*fieldForce*0.1;
            
            // Add noise
            p.vx += (Math.random()-0.5)*mid*2;
            p.vy += (Math.random()-0.5)*mid*2;
            
            // Friction
            p.vx *= 0.95;
            p.vy *= 0.95;
            
            // Move
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around
            if(p.x < 0) p.x = canvas.width;
            if(p.x > canvas.width) p.x = 0;
            if(p.y < 0) p.y = canvas.height;
            if(p.y > canvas.height) p.y = 0;
            
            // Draw particle
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size*3);
            gradient.addColorStop(0, `hsla(${p.hue + mid*120}, 100%, 60%, 0.9)`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        
        // Draw field lines
        if(treble > 0.5) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${treble*0.3})`;
            ctx.lineWidth = 1;
            
            for(let i=0; i<particles.length; i++) {
                const p1 = particles[i];
                
                for(let j=i+1; j<particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if(dist < 80) {
                        ctx.globalAlpha = (1 - dist/80)*treble*0.5;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        }
        
        // Central energy core
        const coreSize = 40 + bass*60;
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${bass*0.8})`);
        coreGradient.addColorStop(0.3, `rgba(0, 255, 255, ${mid*0.6})`);
        coreGradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI*2);
        ctx.fill();
        
        // Energy rings
        for(let i=0; i<3; i++) {
            const ringRadius = coreSize + i*30 + Math.sin(fieldTime + i)*20*bass;
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - i*0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI*2);
            ctx.stroke();
        }
    }
    
    return { init, draw, name: 'Energy-Field' };
})();
