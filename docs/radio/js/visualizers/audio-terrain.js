/**
 * AUDIO TERRAIN - Terreno 3D Generato dall'Audio
 */
const AudioTerrain = (function() {
    'use strict';
    let offsetZ = 0;
    
    function init(canvas) {
        offsetZ = 0;
        console.log('🏔️ Audio-Terrain initialized');
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        
        offsetZ += 2 + bass*10;
        
        const rows = 30;
        const cols = 40;
        const spacing = 20;
        const startX = canvas.width/2 - (cols*spacing)/2;
        const startY = canvas.height*0.8;
        
        // Draw terrain grid from back to front
        for(let z=rows; z>=0; z--) {
            const rowZ = z*spacing + offsetZ;
            const prevRowZ = (z+1)*spacing + offsetZ;
            
            // Perspective scale
            const scale = 800 / (800 + rowZ);
            const prevScale = 800 / (800 + prevRowZ);
            
            for(let x=0; x<cols; x++) {
                const dataIndex = Math.floor((x/cols)*256);
                const height = dataArray[dataIndex]*0.5;
                const nextDataIndex = Math.floor(((x+1)/cols)*256);
                const nextHeight = dataArray[nextDataIndex]*0.5;
                
                // Current point
                const x1 = startX + x*spacing*scale;
                const y1 = startY - height*scale - z*spacing*scale*0.3;
                
                // Next point on same row
                const x2 = startX + (x+1)*spacing*scale;
                const y2 = startY - nextHeight*scale - z*spacing*scale*0.3;
                
                // Point on previous row
                const prevHeight = z < rows ? dataArray[dataIndex]*0.5 : 0;
                const x3 = startX + x*spacing*prevScale;
                const y3 = startY - prevHeight*prevScale - (z+1)*spacing*prevScale*0.3;
                
                // Color based on height and depth
                const depth = (rows - z) / rows;
                const hue = (height/255)*120 + mid*120;
                const brightness = 30 + depth*40 + (height/255)*30;
                
                // Draw horizontal line
                ctx.strokeStyle = `hsl(${hue}, 80%, ${brightness}%)`;
                ctx.lineWidth = 1 + scale*2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Draw vertical line to previous row
                if(z < rows) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x3, y3);
                    ctx.stroke();
                }
                
                // Glow on peaks
                if(height > 200) {
                    const gradient = ctx.createRadialGradient(x1, y1, 0, x1, y1, 20*scale);
                    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(x1-20*scale, y1-20*scale, 40*scale, 40*scale);
                }
            }
        }
        
        // Horizon glow
        const horizonGradient = ctx.createLinearGradient(0, canvas.height*0.5, 0, canvas.height);
        horizonGradient.addColorStop(0, 'rgba(0,0,0,0)');
        horizonGradient.addColorStop(0.5, `rgba(150, 100, 255, ${bass*0.3})`);
        horizonGradient.addColorStop(1, 'rgba(0,0,20,0.5)');
        ctx.fillStyle = horizonGradient;
        ctx.fillRect(0, canvas.height*0.5, canvas.width, canvas.height*0.5);
        
        // Bass kick flash
        if(bass > 0.8) {
            ctx.fillStyle = `rgba(150, 100, 255, ${(bass-0.8)*1.5})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    }
    
    return { init, draw, name: 'Audio-Terrain' };
})();
