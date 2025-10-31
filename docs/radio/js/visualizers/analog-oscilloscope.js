/**
 * ANALOG OSCILLOSCOPE - Oscilloscopio Analogico Vintage
 */
const AnalogOscilloscope = (function() {
    'use strict';
    let phosphorTrails = [];
    const trailLength = 100;
    
    function init(canvas) {
        phosphorTrails = [];
        console.log('📺 Analog-Oscilloscope initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        // Phosphor decay (green CRT effect)
        ctx.fillStyle = 'rgba(0, 5, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        const centerY = canvas.height/2;
        const amplitude = 200 + bass*150;
        
        // Main waveform (classic oscilloscope)
        ctx.strokeStyle = `rgba(0, 255, 50, ${0.8 + bass*0.2})`;
        ctx.lineWidth = 2 + bass*3;
        ctx.shadowBlur = 15 + bass*20;
        ctx.shadowColor = 'rgba(0, 255, 50, 0.8)';
        ctx.beginPath();
        
        const step = canvas.width / 256;
        for(let i=0; i<256; i++) {
            const x = i * step;
            const y = centerY + (dataArray[i] - 128) * (amplitude/128);
            
            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // X-Y mode (Lissajous figure)
        ctx.strokeStyle = `rgba(50, 255, 255, ${0.5 + mid*0.4})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(50, 255, 255, 0.6)';
        ctx.beginPath();
        
        const centerX = canvas.width/2;
        const radius = 100 + treble*100;
        for(let i=0; i<128; i++) {
            const angle1 = (dataArray[i]/255) * Math.PI * 2;
            const angle2 = (dataArray[i+64]/255) * Math.PI * 2;
            const x = centerX + Math.sin(angle1) * radius;
            const y = centerY + Math.cos(angle2) * radius;
            
            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // Grid lines (oscilloscope grid)
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.2)';
        ctx.lineWidth = 1;
        for(let i=0; i<10; i++) {
            const y = (canvas.height/10)*i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        for(let i=0; i<10; i++) {
            const x = (canvas.width/10)*i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Trigger line
        if(bass > 0.7) {
            ctx.strokeStyle = `rgba(255, 100, 0, ${bass})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(canvas.width, centerY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    return { init, draw, name: 'Analog-Oscilloscope' };
})();
