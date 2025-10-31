/**
 * KALEIDOSCOPE - Caleidoscopio Audio-Reattivo
 */
const Kaleidoscope = (function() {
    'use strict';
    let rotation = 0;
    const segments = 12;
    
    function init(canvas) {
        rotation = 0;
        console.log('🔮 Kaleidoscope initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        rotation += 0.01 + bass*0.05;
        
        const centerX = canvas.width/2;
        const centerY = canvas.height/2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Draw each segment
        for(let seg=0; seg<segments; seg++) {
            ctx.save();
            ctx.rotate((seg/segments)*Math.PI*2 + rotation);
            
            // Mirror effect
            if(seg % 2 === 0) {
                ctx.scale(1, -1);
            }
            
            // Draw frequency bars in this segment
            const barsPerSegment = 20;
            for(let i=0; i<barsPerSegment; i++) {
                const dataIdx = Math.floor((i/barsPerSegment)*256);
                const freq = dataArray[dataIdx]/255;
                
                const startRadius = 50 + i*10;
                const length = freq*150*(1 + bass*0.5);
                const angle = (i/barsPerSegment)*Math.PI/(segments/2);
                
                const x1 = Math.cos(angle)*startRadius;
                const y1 = Math.sin(angle)*startRadius;
                const x2 = Math.cos(angle)*(startRadius + length);
                const y2 = Math.sin(angle)*(startRadius + length);
                
                // Color
                const hue = (i*10 + seg*30 + mid*180) % 360;
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, `hsla(${hue}, 90%, 40%, 0.8)`);
                gradient.addColorStop(1, `hsla(${hue}, 90%, 60%, 0.9)`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3 + freq*5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Dots at end
                if(freq > 0.5) {
                    const dotGradient = ctx.createRadialGradient(x2, y2, 0, x2, y2, 10);
                    dotGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 1)`);
                    dotGradient.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = dotGradient;
                    ctx.beginPath();
                    ctx.arc(x2, y2, 8*freq, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
        }
        
        // Central mandala
        for(let ring=0; ring<5; ring++) {
            const radius = 20 + ring*15 + bass*30;
            const hue = (ring*72 + mid*180) % 360;
            
            ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI*2);
            ctx.stroke();
            
            // Dots on ring
            const numDots = 8 + ring*4;
            for(let d=0; d<numDots; d++) {
                const angle = (d/numDots)*Math.PI*2 + rotation*2;
                const x = Math.cos(angle)*radius;
                const y = Math.sin(angle)*radius;
                
                ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.beginPath();
                ctx.arc(x, y, 3 + treble*4, 0, Math.PI*2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        // Bass flash
        if(bass > 0.8) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(bass-0.8)*2})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    }
    
    return { init, draw, name: 'Kaleidoscope' };
})();
