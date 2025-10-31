/**
 * HOLOGRAM CUBE - Cubo Olografico Rotante
 */
const HologramCube = (function() {
    'use strict';
    let rotX = 0, rotY = 0, rotZ = 0;
    
    function init(canvas) {
        rotX = rotY = rotZ = 0;
        console.log('🔷 Hologram-Cube initialized');
    }
    
    // 3D point rotation
    function rotateX(p, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {x: p.x, y: p.y*cos - p.z*sin, z: p.y*sin + p.z*cos};
    }
    
    function rotateY(p, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {x: p.x*cos + p.z*sin, y: p.y, z: -p.x*sin + p.z*cos};
    }
    
    function rotateZ(p, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {x: p.x*cos - p.y*sin, y: p.x*sin + p.y*cos, z: p.z};
    }
    
    function project(p, canvas, scale) {
        const perspective = 800 / (800 + p.z);
        return {
            x: canvas.width/2 + p.x*perspective*scale,
            y: canvas.height/2 + p.y*perspective*scale,
            scale: perspective
        };
    }
    
    function draw(canvas, ctx, dataArray, analyser) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        const bass = dataArray.slice(0,50).reduce((a,b)=>a+b,0)/50/255;
        const mid = dataArray.slice(50,150).reduce((a,b)=>a+b,0)/100/255;
        const treble = dataArray.slice(150,250).reduce((a,b)=>a+b,0)/100/255;
        
        rotX += 0.01 + mid*0.05;
        rotY += 0.015 + bass*0.05;
        rotZ += 0.008 + treble*0.03;
        
        const size = 150 + bass*80;
        
        // Cube vertices
        const vertices = [
            {x: -1, y: -1, z: -1}, {x: 1, y: -1, z: -1},
            {x: 1, y: 1, z: -1}, {x: -1, y: 1, z: -1},
            {x: -1, y: -1, z: 1}, {x: 1, y: -1, z: 1},
            {x: 1, y: 1, z: 1}, {x: -1, y: 1, z: 1}
        ].map(v => {
            let p = {x: v.x*size, y: v.y*size, z: v.z*size};
            p = rotateX(p, rotX);
            p = rotateY(p, rotY);
            p = rotateZ(p, rotZ);
            return project(p, canvas, 1);
        });
        
        // Cube edges
        const edges = [
            [0,1],[1,2],[2,3],[3,0], // Back face
            [4,5],[5,6],[6,7],[7,4], // Front face
            [0,4],[1,5],[2,6],[3,7]  // Connecting edges
        ];
        
        // Draw edges with frequency data
        edges.forEach((edge, idx) => {
            const v1 = vertices[edge[0]];
            const v2 = vertices[edge[1]];
            const freq = dataArray[idx*20]/255;
            
            const hue = (idx*30 + mid*180) % 360;
            ctx.strokeStyle = `hsl(${hue}, 90%, ${40 + freq*50}%)`;
            ctx.lineWidth = 2 + freq*6;
            ctx.shadowBlur = 20*freq;
            ctx.shadowColor = `hsl(${hue}, 90%, 60%)`;
            
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        
        // Draw vertices
        vertices.forEach((v, idx) => {
            const freq = dataArray[idx*30]/255;
            const dotSize = 5 + freq*15;
            
            const gradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, dotSize);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${0.8 + freq*0.2})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(v.x, v.y, dotSize, 0, Math.PI*2);
            ctx.fill();
        });
        
        // Scan lines effect
        for(let y=0; y<canvas.height; y+=3) {
            ctx.fillStyle = `rgba(0, 255, 255, ${treble*0.1})`;
            ctx.fillRect(0, y, canvas.width, 1);
        }
        
        // Bass kick flash
        if(bass > 0.8) {
            ctx.fillStyle = `rgba(0, 255, 255, ${(bass-0.8)*2})`;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    }
    
    return { init, draw, name: 'Hologram-Cube' };
})();
