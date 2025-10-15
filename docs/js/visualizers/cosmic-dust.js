/**
 * COSMIC DUST - Polvere Cosmica con Nebulae
 */
const CosmicDust = (function() {
    'use strict';
    const stars = [];
    const numStars = 800;
    let nebulaTime = 0;
    
    function init(canvas) {
        stars.length = 0;
        nebulaTime = 0;
        
        for(let i=0; i<numStars; i++) {
            stars.push({
                x: Math.random()*canvas.width,
                y: Math.random()*canvas.height,
                z: Math.random()*1000,
                size: Math.random()*2,
                speed: 0.5 + Math.random()*1.5
            });
        }
        
        console.log('🌌 Cosmic-Dust initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,5,0.2)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        nebulaTime += 0.01;
        
        const centerX = canvas.width/2;
        const centerY = canvas.height/2;
        
        // Draw nebula clouds
        const numClouds = 5;
        for(let i=0; i<numClouds; i++) {
            const angle = (i/numClouds)*Math.PI*2 + nebulaTime*0.5;
            const dist = 150 + Math.sin(nebulaTime + i)*50;
            const x = centerX + Math.cos(angle)*dist;
            const y = centerY + Math.sin(angle)*dist;
            const size = 100 + bass*150;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            const hue = (i*72 + mid*180) % 360;
            gradient.addColorStop(0, `hsla(${hue}, 80%, 50%, ${0.3 + bass*0.3})`);
            gradient.addColorStop(0.5, `hsla(${hue}, 60%, 40%, ${0.15 + mid*0.2})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x-size, y-size, size*2, size*2);
        }
        
        // Update and draw stars
        stars.forEach(star => {
            star.z -= star.speed*(1 + bass*10);
            
            if(star.z <= 0) {
                star.z = 1000;
                star.x = Math.random()*canvas.width;
                star.y = Math.random()*canvas.height;
            }
            
            // Perspective projection
            const scale = 1000 / star.z;
            const x = centerX + (star.x - centerX)*scale;
            const y = centerY + (star.y - centerY)*scale;
            const size = star.size*scale*(1 + treble*0.5);
            
            // Color based on depth
            const depth = (1000 - star.z) / 1000;
            const hue = 200 + depth*160 + mid*60;
            const brightness = 40 + depth*60;
            
            ctx.fillStyle = `hsl(${hue}, 80%, ${brightness}%)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fill();
            
            // Star trail
            if(bass > 0.5) {
                ctx.strokeStyle = `hsla(${hue}, 80%, ${brightness}%, ${bass*0.5})`;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(x, y);
                const prevScale = 1000 / (star.z + star.speed*5);
                const prevX = centerX + (star.x - centerX)*prevScale;
                const prevY = centerY + (star.y - centerY)*prevScale;
                ctx.lineTo(prevX, prevY);
                ctx.stroke();
            }
        });
        
        // Central galaxy core
        const coreSize = 60 + bass*100;
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${bass*0.6})`);
        coreGradient.addColorStop(0.2, `rgba(100, 200, 255, ${mid*0.5})`);
        coreGradient.addColorStop(0.6, `rgba(150, 100, 255, ${treble*0.3})`);
        coreGradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI*2);
        ctx.fill();
        
        // Spiral arms
        for(let arm=0; arm<3; arm++) {
            ctx.strokeStyle = `rgba(150, 100, 255, ${0.2 + mid*0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            for(let a=0; a<Math.PI*4; a+=0.1) {
                const r = a*30 + bass*50;
                const angle = a + nebulaTime + arm*Math.PI*2/3;
                const x = centerX + Math.cos(angle)*r;
                const y = centerY + Math.sin(angle)*r;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    
    return { init, draw, name: 'Cosmic-Dust' };
})();
