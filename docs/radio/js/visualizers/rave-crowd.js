/**
 * RAVE CROWD - Folla che Salta al Rave
 */
const RaveCrowd = (function() {
    'use strict';
    const crowd = [];
    const numPeople = 60;
    
    function init(canvas) {
        crowd.length = 0;
        for(let i=0; i<numPeople; i++) {
            crowd.push({
                x: Math.random()*canvas.width,
                baseY: canvas.height*0.7 + Math.random()*canvas.height*0.3,
                y: 0,
                phase: Math.random()*Math.PI*2,
                speed: 0.1 + Math.random()*0.1,
                armPhase: Math.random()*Math.PI*2,
                color: `hsl(${Math.random()*360}, 80%, 50%)`
            });
        }
        console.log('🕺 Rave-Crowd initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        
        // Stage lights
        for(let i=0; i<5; i++) {
            const x = (canvas.width/5)*i + canvas.width/10;
            const gradient = ctx.createRadialGradient(x, 0, 0, x, canvas.height*0.5, canvas.height*0.5);
            gradient.addColorStop(0, `hsla(${i*72 + bass*180}, 100%, 60%, ${bass*0.3})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
        
        // Draw crowd
        crowd.sort((a,b) => a.baseY - b.baseY); // Depth sort
        
        crowd.forEach(person => {
            person.phase += person.speed;
            person.armPhase += 0.15;
            
            const jump = Math.sin(person.phase)*bass*80;
            person.y = person.baseY - jump;
            
            const size = (person.baseY - canvas.height*0.7) / (canvas.height*0.3) * 0.5 + 0.5; // Perspective
            const headRadius = 10*size;
            const bodyHeight = 25*size;
            const armLength = 15*size;
            
            // Body
            ctx.strokeStyle = person.color;
            ctx.lineWidth = 3*size;
            ctx.beginPath();
            ctx.moveTo(person.x, person.y);
            ctx.lineTo(person.x, person.y + bodyHeight);
            ctx.stroke();
            
            // Head
            ctx.fillStyle = person.color;
            ctx.beginPath();
            ctx.arc(person.x, person.y - headRadius, headRadius, 0, Math.PI*2);
            ctx.fill();
            
            // Arms raised
            const armY = person.y + bodyHeight*0.3;
            const leftArmX = person.x - Math.sin(person.armPhase)*armLength;
            const leftArmY = armY - Math.cos(person.armPhase)*armLength - mid*30;
            const rightArmX = person.x + Math.sin(person.armPhase + Math.PI)*armLength;
            const rightArmY = armY - Math.cos(person.armPhase + Math.PI)*armLength - mid*30;
            
            ctx.beginPath();
            ctx.moveTo(person.x, armY);
            ctx.lineTo(leftArmX, leftArmY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(person.x, armY);
            ctx.lineTo(rightArmX, rightArmY);
            ctx.stroke();
        });
        
        // Bass kick flash
        if(bass > 0.8) {
            ctx.fillStyle = `rgba(255,255,255,${(bass-0.8)*2})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    }
    
    return { init, draw, name: 'Rave-Crowd' };
})();
