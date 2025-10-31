/**
 * FREQUENCY BARS 3D - Barre di Frequenza in 3D
 */
const FrequencyBars3D = (function() {
    'use strict';
    let rotation = 0;
    
    function init(canvas) {
        rotation = 0;
        console.log('📊 Frequency-Bars-3D initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        
        rotation += 0.01 + bass*0.02;
        
        const numBars = 64;
        const centerX = canvas.width/2;
        const centerY = canvas.height/2;
        const radius = 200;
        
        for(let i=0; i<numBars; i++) {
            const angle = (i/numBars)*Math.PI*2 + rotation;
            const freq = dataArray[i*4]/255;
            
            // 3D perspective calculation
            const x3d = Math.cos(angle)*radius;
            const y3d = Math.sin(angle)*radius;
            const z = Math.sin(rotation*2 + i*0.1)*100; // Oscillating Z
            
            // Simple perspective projection
            const scale = 1 + z/500;
            const x = centerX + x3d*scale;
            const y = centerY + y3d*scale;
            
            // Bar height
            const barHeight = freq*200*(1 + bass*0.5);
            
            // Bar direction (toward center)
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const endX = x - dx*barHeight;
            const endY = y - dy*barHeight;
            
            // Color based on frequency + depth
            const hue = (i*5 + mid*180 + z) % 360;
            const brightness = 40 + freq*40 + (z+100)/200*20;
            
            // Draw bar
            const gradient = ctx.createLinearGradient(x, y, endX, endY);
            gradient.addColorStop(0, `hsla(${hue}, 80%, ${brightness}%, 0.9)`);
            gradient.addColorStop(1, `hsla(${hue}, 80%, ${brightness*0.5}%, 0.3)`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4*scale;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Glow tip
            if(freq > 0.5) {
                const glowGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, 20*scale);
                glowGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${freq})`);
                glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glowGradient;
                ctx.fillRect(endX-20*scale, endY-20*scale, 40*scale, 40*scale);
            }
        }
        
        // Central sphere
        const sphereSize = 30 + bass*50;
        const sphereGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sphereSize);
        sphereGradient.addColorStop(0, `rgba(255, 255, 255, ${bass})`);
        sphereGradient.addColorStop(0.5, `rgba(0, 255, 255, ${mid*0.8})`);
        sphereGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sphereGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sphereSize, 0, Math.PI*2);
        ctx.fill();
    }
    
    return { init, draw, name: 'Frequency-Bars-3D' };
})();
