/**
 * NEON TUNNEL - Tunnel al Neon Iperspaziale
 */
const NeonTunnel = (function() {
    'use strict';
    let z = 0;
    const rings = [];
    
    function init(canvas) {
        z = 0;
        rings.length = 0;
        for(let i=0; i<100; i++) rings.push({z: i*50, color: Math.random()*360});
        console.log('🌈 Neon-Tunnel initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        
        z += 10 + bass * 30;
        
        for(let i=rings.length-1; i>=0; i--) {
            const ring = rings[i];
            ring.z -= 10 + bass * 30;
            
            if(ring.z < 1) {
                ring.z = 5000;
                ring.color = Math.random()*360;
            }
            
            const scale = 10000 / ring.z;
            const radius = scale * 200;
            const alpha = Math.min(1, 1 - ring.z/5000);
            
            if(radius > 5 && radius < canvas.width*2) {
                const hue = (ring.color + mid * 180) % 360;
                ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
                ctx.lineWidth = 3 + bass * 10;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI*2);
                ctx.stroke();
                
                // Segments
                const numSegments = 8;
                for(let s=0; s<numSegments; s++) {
                    const angle = (Math.PI*2/numSegments)*s + z*0.001;
                    const x = cx + Math.cos(angle)*radius;
                    const y = cy + Math.sin(angle)*radius;
                    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(x, y, 3+bass*8, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }
    }
    
    return { init, draw, name: 'Neon-Tunnel' };
})();
