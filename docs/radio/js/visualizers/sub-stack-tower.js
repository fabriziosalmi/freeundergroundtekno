/**
 * SUB STACK TOWER - Torre di Subwoofer Impilati
 */
const SubStackTower = (function() {
    'use strict';
    let kickPulse = 0;
    
    function init(canvas) {
        kickPulse = 0;
        console.log('🔊 Sub-Stack-Tower initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,5,0.15)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        kickPulse = kickPulse*0.8 + bass*0.2;
        
        const numStacks = 3; // Left, Center, Right
        
        for(let stack=0; stack<numStacks; stack++) {
            const centerX = (stack+1)*canvas.width/(numStacks+1);
            const numSubs = 12;
            const subHeight = 50;
            const subWidth = 120 + kickPulse*40;
            
            for(let i=0; i<numSubs; i++) {
                const y = canvas.height - (i+1)*subHeight - kickPulse*20;
                const x = centerX - subWidth/2;
                
                // Sub box
                const gradient = ctx.createLinearGradient(x, y, x+subWidth, y+subHeight);
                const hue = 200 + stack*40 + i*10;
                gradient.addColorStop(0, `hsl(${hue}, 60%, ${15 + kickPulse*30}%)`);
                gradient.addColorStop(1, `hsl(${hue}, 60%, 10%)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, subWidth, subHeight);
                
                // Speaker cone
                const coneSize = 30 + dataArray[i*20]*0.15 + kickPulse*20;
                ctx.fillStyle = `rgba(30, 30, 30, 0.8)`;
                ctx.beginPath();
                ctx.arc(centerX, y + subHeight/2, coneSize, 0, Math.PI*2);
                ctx.fill();
                
                // Speaker membrane (inner circle)
                ctx.fillStyle = `rgba(50, 50, 60, 0.9)`;
                ctx.beginPath();
                ctx.arc(centerX, y + subHeight/2, coneSize*0.7, 0, Math.PI*2);
                ctx.fill();
                
                // Glow effect
                ctx.strokeStyle = `rgba(0, 255, 255, ${bass*0.8})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(centerX, y + subHeight/2, coneSize + 5, 0, Math.PI*2);
                ctx.stroke();
                
                // LED bar
                for(let led=0; led<5; led++) {
                    const ledX = x + 10 + led*20;
                    const ledY = y + 10;
                    const ledActive = dataArray[i*20] > (255 - led*50);
                    ctx.fillStyle = ledActive ? '#0F0' : '#030';
                    ctx.fillRect(ledX, ledY, 15, 5);
                }
            }
            
            // Bass wave from bottom
            if(bass > 0.6) {
                const waveY = canvas.height - kickPulse*100;
                ctx.strokeStyle = `rgba(0, 255, 255, ${bass})`;
                ctx.lineWidth = 5;
                ctx.beginPath();
                for(let x=0; x<canvas.width; x+=5) {
                    const offset = Math.sin(x*0.05 + Date.now()*0.01)*20*bass;
                    ctx.lineTo(x, waveY + offset);
                }
                ctx.stroke();
            }
        }
        
        // Strobo flash
        if(bass > 0.85) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(bass-0.85)*3})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    }
    
    return { init, draw, name: 'Sub-Stack-Tower' };
})();
