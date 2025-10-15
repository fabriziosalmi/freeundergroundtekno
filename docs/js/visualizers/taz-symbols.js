/**
 * TAZ SYMBOLS - Simboli Temporary Autonomous Zone
 */
const TazSymbols = (function() {
    'use strict';
    let rotation = 0;
    const symbols = [];
    
    function init(canvas) {
        rotation = 0;
        symbols.length = 0;
        
        // Create floating symbols
        for(let i=0; i<15; i++) {
            symbols.push({
                x: Math.random()*canvas.width,
                y: Math.random()*canvas.height,
                type: Math.floor(Math.random()*4), // 0=anarchy A, 1=circle-A, 2=DIY, 3=spiral
                size: 40 + Math.random()*60,
                rotation: Math.random()*Math.PI*2,
                rotSpeed: (Math.random()-0.5)*0.05,
                vx: (Math.random()-0.5)*2,
                vy: (Math.random()-0.5)*2
            });
        }
        
        console.log('⚡ TAZ-Symbols initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        rotation += 0.02;
        
        // Draw and update symbols
        symbols.forEach((sym, idx) => {
            sym.x += sym.vx + Math.sin(rotation + idx)*bass*3;
            sym.y += sym.vy + Math.cos(rotation + idx)*bass*3;
            sym.rotation += sym.rotSpeed + bass*0.1;
            
            // Wrap around
            if(sym.x < -100) sym.x = canvas.width + 100;
            if(sym.x > canvas.width + 100) sym.x = -100;
            if(sym.y < -100) sym.y = canvas.height + 100;
            if(sym.y > canvas.height + 100) sym.y = -100;
            
            ctx.save();
            ctx.translate(sym.x, sym.y);
            ctx.rotate(sym.rotation);
            
            const pulseSize = sym.size * (1 + bass*0.3);
            const hue = (idx*25 + mid*180) % 360;
            
            ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.3)`;
            ctx.lineWidth = 3 + bass*5;
            
            switch(sym.type) {
                case 0: // Anarchy A
                    ctx.font = `bold ${pulseSize}px Arial`;
                    ctx.strokeText('A', -pulseSize*0.3, pulseSize*0.3);
                    ctx.fillText('A', -pulseSize*0.3, pulseSize*0.3);
                    break;
                    
                case 1: // Circle-A
                    ctx.beginPath();
                    ctx.arc(0, 0, pulseSize*0.5, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.font = `bold ${pulseSize*0.8}px Arial`;
                    ctx.strokeText('A', -pulseSize*0.25, pulseSize*0.25);
                    ctx.fillText('A', -pulseSize*0.25, pulseSize*0.25);
                    break;
                    
                case 2: // DIY Text
                    ctx.font = `bold ${pulseSize*0.6}px monospace`;
                    ctx.strokeText('DIY', -pulseSize*0.4, 0);
                    ctx.fillText('DIY', -pulseSize*0.4, 0);
                    break;
                    
                case 3: // Spiral
                    ctx.beginPath();
                    for(let a=0; a<Math.PI*4; a+=0.1) {
                        const r = a*pulseSize*0.1;
                        const x = Math.cos(a)*r;
                        const y = Math.sin(a)*r;
                        ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        });
        
        // Central TAZ text
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(Math.sin(rotation)*bass*0.5);
        
        const fontSize = 80 + bass*40;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + bass*0.5})`;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + mid*0.4})`;
        ctx.lineWidth = 3;
        ctx.strokeText('TAZ', -fontSize*0.8, fontSize*0.3);
        ctx.fillText('TAZ', -fontSize*0.8, fontSize*0.3);
        
        ctx.restore();
        
        // Bass kick flash
        if(bass > 0.8) {
            ctx.fillStyle = `rgba(255, 0, 255, ${(bass-0.8)*1.5})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    }
    
    return { init, draw, name: 'TAZ-Symbols' };
})();
