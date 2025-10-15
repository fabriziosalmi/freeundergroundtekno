/**
 * ANALOG SYNTH - Sintetizzatore Analogico Vintage
 */
const AnalogSynth = (function() {
    'use strict';
    const oscillators = [];
    const numOscillators = 8;
    let time = 0;
    
    function init(canvas) {
        oscillators.length = 0;
        for(let i=0; i<numOscillators; i++) {
            oscillators.push({
                phase: Math.random() * Math.PI * 2,
                freq: 0.5 + i*0.3,
                amp: 0.5 + Math.random()*0.5,
                color: `hsl(${i*45}, 80%, 60%)`
            });
        }
        time = 0;
        console.log('🎹 Analog-Synth initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        // Slow fade (analog tape delay effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        time += 0.05;
        
        const centerY = canvas.height/2;
        const waveWidth = canvas.width;
        
        // Draw each oscillator
        oscillators.forEach((osc, idx) => {
            osc.phase += osc.freq * (0.01 + bass*0.05);
            const modulation = mid * 100;
            
            ctx.strokeStyle = osc.color;
            ctx.lineWidth = 2 + bass*4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = osc.color;
            ctx.beginPath();
            
            for(let x=0; x<waveWidth; x+=3) {
                const t = x / waveWidth;
                const dataIdx = Math.floor(t * 256);
                const audioMod = (dataArray[dataIdx]/255 - 0.5) * modulation;
                
                // Complex waveform (sawtooth + sine)
                const saw = ((osc.phase + t*Math.PI*4) % (Math.PI*2)) / (Math.PI*2) - 0.5;
                const sine = Math.sin(osc.phase + t*Math.PI*2*osc.freq);
                const wave = (saw*0.3 + sine*0.7) * osc.amp;
                
                const y = centerY + (wave * 150 + audioMod) + Math.sin(t*Math.PI*2 + time)*30*treble;
                
                if(x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        
        // VU Meter style bars
        const numBars = 32;
        const barWidth = canvas.width / numBars;
        for(let i=0; i<numBars; i++) {
            const level = dataArray[i*8]/255;
            const barHeight = level * canvas.height * 0.3;
            const x = i * barWidth;
            const y = canvas.height - barHeight;
            
            // Gradient from green to red (like VU meter)
            const hue = 120 - level*120; // 120=green, 0=red
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.6)`;
            ctx.fillRect(x, y, barWidth-3, barHeight);
            
            // Peak indicator
            if(level > 0.8) {
                ctx.fillStyle = '#F00';
                ctx.fillRect(x, y-5, barWidth-3, 3);
            }
        }
        
        // Filter sweep visualization (circular)
        const sweepRadius = 80 + mid*120;
        const sweepThickness = 20 + bass*30;
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, sweepRadius - sweepThickness,
            canvas.width/2, canvas.height/2, sweepRadius
        );
        gradient.addColorStop(0, `hsla(${mid*180}, 80%, 50%, 0)`);
        gradient.addColorStop(0.5, `hsla(${mid*180}, 80%, 50%, ${mid*0.6})`);
        gradient.addColorStop(1, `hsla(${mid*180}, 80%, 50%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, sweepRadius, 0, Math.PI*2);
        ctx.fill();
        
        // Envelope indicator (ADSR-style)
        if(bass > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 0, ${bass-0.7})`;
            ctx.fillRect(20, 20, 60, 10);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = '10px monospace';
            ctx.fillText('ATTACK', 25, 28);
        }
    }
    
    return { init, draw, name: 'Analog-Synth' };
})();
