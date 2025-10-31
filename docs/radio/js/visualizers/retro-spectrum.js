/**
 * RETRO SPECTRUM - Spettro Retrò Tipo Winamp
 */
const RetroSpectrum = (function() {
    'use strict';
    const peakHold = new Array(128).fill(0);
    const peakDecay = new Array(128).fill(0);
    
    function init(canvas) {
        peakHold.fill(0);
        peakDecay.fill(0);
        console.log('📻 Retro-Spectrum initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        // Black background
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        
        const numBars = 64;
        const barWidth = canvas.width / numBars;
        const barSpacing = 2;
        
        // Draw spectrum bars
        for(let i=0; i<numBars; i++) {
            const dataIdx = i * 4;
            const value = dataArray[dataIdx] / 255;
            const barHeight = value * canvas.height * 0.85;
            const x = i * barWidth;
            const y = canvas.height - barHeight;
            
            // Update peak hold
            if(barHeight > peakHold[i]) {
                peakHold[i] = barHeight;
                peakDecay[i] = 0;
            } else {
                peakDecay[i] += 2;
                peakHold[i] = Math.max(0, peakHold[i] - peakDecay[i]);
            }
            
            // Classic gradient (green -> yellow -> red)
            const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
            if(value < 0.5) {
                gradient.addColorStop(0, '#00FF00'); // Green
                gradient.addColorStop(1, '#00FF00');
            } else if(value < 0.75) {
                gradient.addColorStop(0, '#00FF00'); // Green
                gradient.addColorStop(0.5, '#FFFF00'); // Yellow
                gradient.addColorStop(1, '#FFFF00');
            } else {
                gradient.addColorStop(0, '#00FF00'); // Green
                gradient.addColorStop(0.4, '#FFFF00'); // Yellow
                gradient.addColorStop(0.7, '#FF8800'); // Orange
                gradient.addColorStop(1, '#FF0000'); // Red
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - barSpacing, barHeight);
            
            // Peak hold line
            const peakY = canvas.height - peakHold[i];
            ctx.fillStyle = value > 0.75 ? '#FF0000' : '#00FFFF';
            ctx.fillRect(x, peakY, barWidth - barSpacing, 3);
        }
        
        // Oscilloscope waveform at top
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const waveHeight = 60;
        const waveY = waveHeight;
        const step = canvas.width / 256;
        
        for(let i=0; i<256; i++) {
            const x = i * step;
            const y = waveY + (dataArray[i] - 128) * (waveHeight/128) * 0.5;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Grid lines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for(let i=0; i<10; i++) {
            const y = (canvas.height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // VU meter style indicators
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(10, 10, bass * 200, 10);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.fillRect(10, 25, mid * 200, 10);
        
        // Beat flash
        if(bass > 0.8) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(bass-0.8)*1.5})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    return { init, draw, name: 'Retro-Spectrum' };
})();
