/**
 * VECTOR FIELD - Campo Vettoriale Fluido
 */
const VectorField = (function() {
    'use strict';
    const gridSize = 20;
    let time = 0;
    const particles = [];
    const maxParticles = 500;
    
    function init(canvas) {
        time = 0;
        particles.length = 0;
        
        for(let i=0; i<maxParticles; i++) {
            particles.push({
                x: Math.random()*canvas.width,
                y: Math.random()*canvas.height,
                history: []
            });
        }
        
        console.log('🌀 Vector-Field initialized');
    }
    
    function getVectorAt(x, y, bass, mid, time) {
        // Complex vector field equation
        const scale = 0.01;
        const fx = Math.sin(x*scale + time) * Math.cos(y*scale*0.5 + bass*10);
        const fy = Math.cos(x*scale*0.7 + mid*5) * Math.sin(y*scale + time*0.8);
        return {x: fx*5, y: fy*5};
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        time += 0.05 + bass*0.1;
        
        // Draw vector field arrows
        const cols = Math.floor(canvas.width / gridSize);
        const rows = Math.floor(canvas.height / gridSize);
        
        for(let i=0; i<cols; i++) {
            for(let j=0; j<rows; j++) {
                const x = i*gridSize + gridSize/2;
                const y = j*gridSize + gridSize/2;
                
                const vec = getVectorAt(x, y, bass, mid, time);
                const mag = Math.sqrt(vec.x*vec.x + vec.y*vec.y);
                
                if(mag < 0.1) continue;
                
                const angle = Math.atan2(vec.y, vec.x);
                const arrowLen = mag*(2 + treble*5);
                
                // Color based on direction and magnitude
                const hue = (angle/(Math.PI*2))*360 + mid*120;
                ctx.strokeStyle = `hsla(${hue}, 80%, 50%, ${0.3 + mag*0.1})`;
                ctx.lineWidth = 1 + mag*0.5;
                
                // Arrow line
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle)*arrowLen, y + Math.sin(angle)*arrowLen);
                ctx.stroke();
                
                // Arrow head
                const headSize = 5;
                const endX = x + Math.cos(angle)*arrowLen;
                const endY = y + Math.sin(angle)*arrowLen;
                
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - Math.cos(angle - Math.PI/6)*headSize,
                    endY - Math.sin(angle - Math.PI/6)*headSize
                );
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - Math.cos(angle + Math.PI/6)*headSize,
                    endY - Math.sin(angle + Math.PI/6)*headSize
                );
                ctx.stroke();
            }
        }
        
        // Flow particles
        particles.forEach(p => {
            const vec = getVectorAt(p.x, p.y, bass, mid, time);
            p.x += vec.x*(1 + bass*2);
            p.y += vec.y*(1 + bass*2);
            
            // Wrap around
            if(p.x < 0) p.x = canvas.width;
            if(p.x > canvas.width) p.x = 0;
            if(p.y < 0) p.y = canvas.height;
            if(p.y > canvas.height) p.y = 0;
            
            // History trail
            p.history.push({x: p.x, y: p.y});
            if(p.history.length > 20) p.history.shift();
            
            // Draw trail
            if(p.history.length > 1) {
                ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.history[0].x, p.history[0].y);
                for(let i=1; i<p.history.length; i++) {
                    ctx.lineTo(p.history[i].x, p.history[i].y);
                }
                ctx.stroke();
            }
            
            // Draw particle
            ctx.fillStyle = `rgba(0, 255, 255, 0.8)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
            ctx.fill();
        });
    }
    
    return { init, draw, name: 'Vector-Field' };
})();
