/**
 * QUANTUM MORPHING - Visualizer Astratto Innovativo
 * Forme geometriche che morfano tra loro seguendo la musica
 * + Particelle quantistiche + Field distortion + Color shifting
 */

const QuantumMorphing = (function() {
    'use strict';

    // State
    let morphShapes = [];
    let quantumParticles = [];
    let morphProgress = 0;
    let currentShape = 0;
    const shapeTypes = ['triangle', 'square', 'hexagon', 'star', 'circle'];
    
    // Colors
    const colors = ['#00FF00', '#FF00FF', '#00FFFF', '#FFFF00', '#FF0000'];
    let colorShift = 0;

    /**
     * Inizializza le forme
     */
    function init(canvas) {
        morphShapes = [];
        
        // Crea 5 forme morfanti concentriche
        for (let i = 0; i < 5; i++) {
            morphShapes.push({
                radius: 80 + (i * 60),
                vertices: getShapeVertices(shapeTypes[i % shapeTypes.length], 80 + (i * 60)),
                targetVertices: null,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: 0.005 + (Math.random() * 0.01),
                colorIndex: i
            });
        }
        
        // Crea particelle quantistiche
        for (let i = 0; i < 100; i++) {
            quantumParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Disegna il visualizer
     */
    function draw(canvas, ctx, dataArray, analyser) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const bufferLength = analyser.frequencyBinCount;
        
        // Calcola intensità per bande
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        // Color shift continuo
        colorShift += 0.01;
        
        // === FIELD DISTORTION (sfondo ondulato) ===
        drawFieldDistortion(ctx, canvas, bassIntensity, midIntensity);
        
        // === PARTICELLE QUANTISTICHE ===
        updateAndDrawParticles(ctx, canvas, trebleIntensity);
        
        // === FORME MORFANTI ===
        morphShapes.forEach((shape, idx) => {
            // Morfa tra forme in base ai medi
            if (midIntensity > 0.7 && !shape.targetVertices) {
                const nextShapeType = shapeTypes[(idx + Math.floor(Math.random() * 3) + 1) % shapeTypes.length];
                shape.targetVertices = getShapeVertices(nextShapeType, shape.radius);
                morphProgress = 0;
            }
            
            // Progresso del morphing
            if (shape.targetVertices) {
                morphProgress += 0.02 + (midIntensity * 0.05);
                if (morphProgress >= 1) {
                    shape.vertices = shape.targetVertices;
                    shape.targetVertices = null;
                    morphProgress = 0;
                }
            }
            
            // Rotazione influenzata dai bassi
            shape.rotation += shape.rotationSpeed + (bassIntensity * 0.05);
            
            // Pulsa con i bassi
            const pulse = 1 + (bassIntensity * 0.3);
            
            // Disegna la forma
            drawMorphingShape(ctx, centerX, centerY, shape, pulse, morphProgress);
            
            // Alone energetico sui picchi
            if (bassIntensity > 0.8) {
                drawEnergyHalo(ctx, centerX, centerY, shape.radius * pulse, colors[shape.colorIndex]);
            }
        });
        
        // === CONNESSIONI TRA VERTICI ===
        if (trebleIntensity > 0.5) {
            drawVertexConnections(ctx, centerX, centerY, trebleIntensity);
        }
        
        // === VORTICE CENTRALE ===
        drawCenterVortex(ctx, centerX, centerY, bassIntensity, midIntensity);
    }

    /**
     * Field distortion - ondulazioni nello spazio
     */
    function drawFieldDistortion(ctx, canvas, bassIntensity, midIntensity) {
        const gridSize = 40;
        const time = Date.now() * 0.001;
        
        ctx.strokeStyle = '#00FF00' + '20';
        ctx.lineWidth = 1;
        
        // Linee orizzontali ondulate
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += 5) {
                const wave1 = Math.sin(x * 0.01 + time + y * 0.02) * 20 * bassIntensity;
                const wave2 = Math.cos(x * 0.02 - time + y * 0.01) * 15 * midIntensity;
                const finalY = y + wave1 + wave2;
                
                if (x === 0) ctx.moveTo(x, finalY);
                else ctx.lineTo(x, finalY);
            }
            ctx.stroke();
        }
    }

    /**
     * Particelle quantistiche che reagiscono alla musica
     */
    function updateAndDrawParticles(ctx, canvas, trebleIntensity) {
        quantumParticles.forEach(p => {
            // Movimento base
            p.x += p.vx * (1 + trebleIntensity * 2);
            p.y += p.vy * (1 + trebleIntensity * 2);
            
            // Movimento quantistico (teletrasporto)
            p.phase += 0.05;
            p.x += Math.sin(p.phase) * 2;
            p.y += Math.cos(p.phase) * 2;
            
            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            // Disegna particella
            const alpha = (0.5 + trebleIntensity * 0.5).toFixed(2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            
            // Scia quantistica
            if (trebleIntensity > 0.7) {
                ctx.fillStyle = `rgba(0, 255, 255, 0.3)`;
                ctx.fillRect(p.x - p.vx * 3, p.y - p.vy * 3, p.size, p.size);
            }
        });
    }

    /**
     * Disegna forma morfante
     */
    function drawMorphingShape(ctx, centerX, centerY, shape, pulse, morphProgress) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(shape.rotation);
        
        const currentVertices = shape.vertices;
        const targetVertices = shape.targetVertices;
        
        // Interpola tra forma corrente e target
        let drawVertices = currentVertices;
        if (targetVertices && morphProgress < 1) {
            drawVertices = currentVertices.map((v, i) => ({
                x: v.x + (targetVertices[i].x - v.x) * morphProgress,
                y: v.y + (targetVertices[i].y - v.y) * morphProgress
            }));
        }
        
        // Disegna forma
        ctx.beginPath();
        drawVertices.forEach((v, i) => {
            const x = v.x * pulse;
            const y = v.y * pulse;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        
        // Gradient fill
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shape.radius * pulse);
        const color = colors[shape.colorIndex];
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(0.7, color + '80');
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Bordo luminoso
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Alone energetico
     */
    function drawEnergyHalo(ctx, centerX, centerY, radius, color) {
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + (i * 20), 0, Math.PI * 2);
            ctx.strokeStyle = color + (80 - i * 20).toString(16);
            ctx.lineWidth = 3 - i;
            ctx.stroke();
        }
    }

    /**
     * Connessioni tra vertici
     */
    function drawVertexConnections(ctx, centerX, centerY, intensity) {
        const allVertices = [];
        
        morphShapes.forEach(shape => {
            shape.vertices.forEach(v => {
                const x = centerX + v.x * Math.cos(shape.rotation) - v.y * Math.sin(shape.rotation);
                const y = centerY + v.x * Math.sin(shape.rotation) + v.y * Math.cos(shape.rotation);
                allVertices.push({ x, y });
            });
        });
        
        // Connetti vertici vicini
        for (let i = 0; i < allVertices.length; i++) {
            for (let j = i + 1; j < allVertices.length; j++) {
                const dx = allVertices[i].x - allVertices[j].x;
                const dy = allVertices[i].y - allVertices[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150) {
                    const alpha = Math.floor((1 - dist / 150) * intensity * 100);
                    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha / 255})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(allVertices[i].x, allVertices[i].y);
                    ctx.lineTo(allVertices[j].x, allVertices[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Vortice centrale
     */
    function drawCenterVortex(ctx, centerX, centerY, bassIntensity, midIntensity) {
        const time = Date.now() * 0.001;
        const numSpirals = 8;
        
        for (let s = 0; s < numSpirals; s++) {
            ctx.beginPath();
            const angleOffset = (Math.PI * 2 / numSpirals) * s;
            
            for (let i = 0; i < 100; i++) {
                const progress = i / 100;
                const angle = angleOffset + (progress * Math.PI * 4) + time;
                const radius = progress * 50 * (1 + bassIntensity);
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            const color = colors[s % colors.length];
            ctx.strokeStyle = color + Math.floor(midIntensity * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * Genera vertici per una forma
     */
    function getShapeVertices(shapeType, radius) {
        const vertices = [];
        
        switch(shapeType) {
            case 'triangle':
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
                    vertices.push({
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    });
                }
                break;
            
            case 'square':
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 / 4) * i + Math.PI / 4;
                    vertices.push({
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    });
                }
                break;
            
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    vertices.push({
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    });
                }
                break;
            
            case 'star':
                for (let i = 0; i < 10; i++) {
                    const angle = (Math.PI * 2 / 10) * i;
                    const r = i % 2 === 0 ? radius : radius * 0.5;
                    vertices.push({
                        x: Math.cos(angle) * r,
                        y: Math.sin(angle) * r
                    });
                }
                break;
            
            case 'circle':
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 / 30) * i;
                    vertices.push({
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    });
                }
                break;
        }
        
        return vertices;
    }

    return {
        init: init,
        draw: draw,
        name: 'Quantum-Morphing'
    };

})();
