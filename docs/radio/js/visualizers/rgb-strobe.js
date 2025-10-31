/**
 * RGB STROBE - Strobo RGB Hardcore a Tempo
 */
const RGBStrobe = (function() {
    'use strict';
    let beatDetector = { last: 0, threshold: 0.75 };
    let stroboPhase = 0;
    let colorPhase = 0;
    
    function init(canvas) {
        beatDetector = { last: 0, threshold: 0.75 };
        stroboPhase = 0;
        colorPhase = 0;
        console.log('⚡ RGB-Strobe initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        // Beat detection
        const isBeat = bass > beatDetector.threshold && (Date.now() - beatDetector.last) > 100;
        if(isBeat) {
            beatDetector.last = Date.now();
            colorPhase = (colorPhase + 1) % 3;
            stroboPhase = 1;
        }
        
        stroboPhase *= 0.85; // Decay
        
        // Full screen strobe
        if(stroboPhase > 0.1) {
            const colors = [
                [255, 0, 0],   // RED
                [0, 255, 0],   // GREEN
                [0, 0, 255]    // BLUE
            ];
            const [r, g, b] = colors[colorPhase];
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${stroboPhase})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Frequency bars (when not strobing)
        const barWidth = canvas.width / 64;
        for(let i=0; i<64; i++) {
            const barHeight = (dataArray[i*4]/255) * canvas.height * 0.8;
            const x = i * barWidth;
            const y = canvas.height - barHeight;
            
            // Color cycle
            const hue = (i*5 + mid*180) % 360;
            const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.8)`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0.9)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth-2, barHeight);
        }
        
        // Central flash on big bass
        if(bass > 0.85) {
            const flashSize = canvas.width * bass;
            const gradient = ctx.createRadialGradient(
                canvas.width/2, canvas.height/2, 0,
                canvas.width/2, canvas.height/2, flashSize
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${(bass-0.85)*3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Waveform overlay
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + treble*0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const step = canvas.width / 256;
        for(let i=0; i<256; i++) {
            const x = i * step;
            const y = canvas.height/2 + (dataArray[i] - 128) * (treble*2);
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    return { init, draw, name: 'RGB-Strobe' };
})();
