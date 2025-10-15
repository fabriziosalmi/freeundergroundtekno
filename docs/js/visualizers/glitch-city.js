/**
 * GLITCH CITY - Città Glitchata Digitale
 */
const GlitchCity = (function() {
    'use strict';
    let glitchTime = 0;
    
    function init(canvas) {
        glitchTime = 0;
        console.log('🏙️ Glitch-City initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        glitchTime += 0.1;
        
        // Skyline buildings
        const numBuildings = 20;
        for(let i=0; i<numBuildings; i++) {
            const x = (canvas.width/numBuildings)*i;
            const height = 100 + Math.sin(i+glitchTime*0.5)*50 + dataArray[i*10]*0.5;
            const y = canvas.height - height;
            const width = canvas.width/numBuildings - 5;
            
            // Building
            const hue = (i*20 + mid*180) % 360;
            ctx.fillStyle = `hsl(${hue}, 80%, ${30 + bass*40}%)`;
            ctx.fillRect(x, y, width, height);
            
            // Windows
            const windowRows = Math.floor(height/20);
            for(let r=0; r<windowRows; r++) {
                for(let c=0; c<3; c++) {
                    if(Math.random() > 0.3 || treble > 0.7) {
                        ctx.fillStyle = Math.random() > 0.5 ? '#FF0' : '#0FF';
                        ctx.fillRect(x + c*10 + 5, y + r*20 + 5, 8, 8);
                    }
                }
            }
            
            // Glitch effect
            if(bass > 0.7 && Math.random() > 0.7) {
                ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.5)`;
                ctx.fillRect(x + (Math.random()-0.5)*20, y, width, height);
            }
        }
        
        // Scan lines
        for(let y=0; y<canvas.height; y+=4) {
            ctx.fillStyle = `rgba(0,255,255,${treble*0.1})`;
            ctx.fillRect(0, y, canvas.width, 2);
        }
        
        // Random glitch bars
        if(bass > 0.65) {
            for(let i=0; i<5; i++) {
                const y = Math.random()*canvas.height;
                const h = 5 + Math.random()*20;
                ctx.fillStyle = `rgba(255,0,255,${bass})`;
                ctx.fillRect(0, y, canvas.width, h);
            }
        }
    }
    
    return { init, draw, name: 'Glitch-City' };
})();
