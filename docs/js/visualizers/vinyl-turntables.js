/**
 * VINYL TURNTABLES - Piatti DJ che grattano
 */
const VinylTurntables = (function() {
    'use strict';
    let rotation1 = 0, rotation2 = 0;
    function init(canvas) { rotation1 = 0; rotation2 = 0; console.log('🎧 Vinyl-Turntables initialized'); }
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const bass = dataArray.slice(0, 50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50, 150).reduce((a,b)=>a+b,0)/100/255;
        rotation1 += (0.1 + bass * 0.3) * (mid > 0.5 ? -1 : 1);
        rotation2 += (0.1 + bass * 0.3) * (mid > 0.5 ? 1 : -1);
        drawTurntable(ctx, canvas.width * 0.3, canvas.height / 2, rotation1, bass, mid);
        drawTurntable(ctx, canvas.width * 0.7, canvas.height / 2, rotation2, bass, mid);
    }
    function drawTurntable(ctx, x, y, rot, bass, mid) {
        const size = 120 + bass * 40;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        const grad = ctx.createRadialGradient(0,0,0,0,0,size);
        grad.addColorStop(0, '#000'); grad.addColorStop(0.5, '#111'); grad.addColorStop(1, '#333');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#F00'; ctx.lineWidth = 3; ctx.stroke();
        for(let i=0; i<3; i++) { ctx.strokeStyle = '#444'; ctx.beginPath(); ctx.arc(0,0,size*(0.3+i*0.2),0,Math.PI*2); ctx.stroke(); }
        ctx.fillStyle = `rgba(255,0,0,${mid})`; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(size-10,0); ctx.stroke();
        ctx.restore();
    }
    return { init, draw, name: 'Vinyl-Turntables' };
})();
