/**
 * PARTICLE STORM - Tempesta di Particelle Esplosive
 * Migliaia di particelle che esplodono e si muovono
 */
const ParticleStorm = (function() {
    'use strict';
    const particles = [];
    const maxParticles = 2000;
    
    function init(canvas) {
        particles.length = 0;
        for(let i=0; i<200; i++) createParticle(canvas);
        console.log('💥 Particle-Storm initialized');
    }
    
    function createParticle(canvas) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random()-0.5)*10,
            vy: (Math.random()-0.5)*10,
            life: 1,
            size: 2 + Math.random()*4,
            color: [Math.random()*255, Math.random()*255, Math.random()*255]
        });
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        // Spawna particelle su bass
        if(bass > 0.6 && particles.length < maxParticles) {
            for(let i=0; i<Math.floor(bass*50); i++) createParticle(canvas);
        }
        
        // Aggiorna particelle
        for(let i=particles.length-1; i>=0; i--) {
            const p = particles[i];
            
            // Attrazione gravitazionale verso centro su mids
            if(mid > 0.5) {
                const dx = canvas.width/2 - p.x;
                const dy = canvas.height/2 - p.y;
                p.vx += dx * 0.0001 * mid;
                p.vy += dy * 0.0001 * mid;
            }
            
            p.x += p.vx * (1 + treble);
            p.y += p.vy * (1 + treble);
            p.vx *= 0.99;
            p.vy *= 0.99;
            p.life -= 0.005;
            
            if(p.life > 0 && p.x > 0 && p.x < canvas.width && p.y > 0 && p.y < canvas.height) {
                const glow = p.size * (1 + bass * 3);
                const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,glow);
                grad.addColorStop(0, `rgba(${p.color.join(',')},${p.life})`);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, glow, 0, Math.PI*2);
                ctx.fill();
            } else {
                particles.splice(i, 1);
            }
        }
        
        // Connessioni tra particelle vicine
        if(treble > 0.6) {
            for(let i=0; i<Math.min(particles.length, 100); i++) {
                for(let j=i+1; j<Math.min(particles.length, 100); j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 100) {
                        ctx.strokeStyle = `rgba(255,255,255,${(1-dist/100)*treble*0.5})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        }
    }
    
    return { init, draw, name: 'Particle-Storm' };
})();
