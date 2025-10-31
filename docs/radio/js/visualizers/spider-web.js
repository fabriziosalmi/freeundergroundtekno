/**
 * SPIDER WEB - Visualizer Ragnatela Elettrica
 * Rete di nodi interconnessi che pulsano con la musica
 * Effetto neural network + onde propaganti + scariche elettriche
 */

const SpiderWeb = (function() {
    'use strict';

    const nodes = [];
    const numNodes = 60;
    const connections = [];
    const maxDistance = 150;
    let pulseTime = 0;

    function init(canvas) {
        nodes.length = 0;
        connections.length = 0;
        pulseTime = 0;
        
        // Crea nodi
        for (let i = 0; i < numNodes; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 3 + Math.random() * 5,
                pulse: Math.random() * Math.PI * 2,
                energy: 0
            });
        }
        
        console.log('🕸️ Spider-Web initialized with', numNodes, 'nodes');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Motion blur leggero
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        pulseTime += 0.05 + midIntensity * 0.1;
        
        // Aggiorna nodi
        updateNodes(canvas, bassIntensity, midIntensity);
        
        // Trova connessioni
        connections.length = 0;
        findConnections(bassIntensity);
        
        // Disegna connessioni
        drawConnections(ctx, midIntensity, trebleIntensity);
        
        // Disegna nodi
        drawNodes(ctx, bassIntensity, trebleIntensity);
        
        // Scariche elettriche su bass forti
        if (bassIntensity > 0.7) {
            drawLightning(ctx, canvas, bassIntensity);
        }
        
        // Onde di propagazione su treble
        if (trebleIntensity > 0.6) {
            drawPropagationWaves(ctx, trebleIntensity);
        }
    }

    /**
     * Aggiorna posizione nodi
     */
    function updateNodes(canvas, bassIntensity, midIntensity) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            // Movimento
            node.x += node.vx * (1 + bassIntensity * 2);
            node.y += node.vy * (1 + bassIntensity * 2);
            
            // Rimbalzo sui bordi
            if (node.x < 0 || node.x > canvas.width) {
                node.vx *= -1;
                node.x = Math.max(0, Math.min(canvas.width, node.x));
            }
            if (node.y < 0 || node.y > canvas.height) {
                node.vy *= -1;
                node.y = Math.max(0, Math.min(canvas.height, node.y));
            }
            
            // Pulse
            node.pulse += 0.1 + midIntensity * 0.2;
            
            // Decay energia
            node.energy *= 0.95;
        }
    }

    /**
     * Trova connessioni tra nodi vicini
     */
    function findConnections(bassIntensity) {
        const connectionDistance = maxDistance * (1 + bassIntensity * 0.5);
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < connectionDistance) {
                    connections.push({
                        from: nodes[i],
                        to: nodes[j],
                        distance: dist,
                        strength: 1 - (dist / connectionDistance)
                    });
                }
            }
        }
    }

    /**
     * Disegna connessioni
     */
    function drawConnections(ctx, midIntensity, trebleIntensity) {
        for (let i = 0; i < connections.length; i++) {
            const conn = connections[i];
            const alpha = conn.strength * 0.5;
            
            // Colore basato su energia dei nodi
            const energy = (conn.from.energy + conn.to.energy) / 2;
            let color;
            
            if (energy > 0.5) {
                // Elettrico bianco-cyan
                color = `rgba(0, 255, 255, ${alpha * (1 + energy)})`;
            } else if (midIntensity > 0.6) {
                // Verde-magenta
                const mix = Math.sin(pulseTime + i * 0.1);
                const r = mix > 0 ? 255 * mix : 0;
                const g = mix < 0 ? 255 * -mix : 255;
                const b = 255 * midIntensity;
                color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else {
                // Default verde
                color = `rgba(0, 255, 0, ${alpha})`;
            }
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1 + conn.strength * 2 + trebleIntensity * 2;
            
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.lineTo(conn.to.x, conn.to.y);
            ctx.stroke();
            
            // Punto medio brillante su connessioni forti
            if (conn.strength > 0.8 && trebleIntensity > 0.5) {
                const midX = (conn.from.x + conn.to.x) / 2;
                const midY = (conn.from.y + conn.to.y) / 2;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(midX, midY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Disegna nodi
     */
    function drawNodes(ctx, bassIntensity, trebleIntensity) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const pulseFactor = Math.sin(node.pulse) * 0.5 + 0.5;
            const size = node.radius * (1 + pulseFactor * bassIntensity);
            
            // Glow esterno
            const gradient = ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, size * 2
            );
            
            if (node.energy > 0.5) {
                // Nodo carico
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            } else {
                // Nodo normale
                const hue = (i / nodes.length) * 120; // Verde a cyan
                gradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 + pulseFactor * 0.5})`);
                gradient.addColorStop(0.5, `rgba(0, 255, ${Math.floor(128 + hue)}, 0.6)`);
                gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Core del nodo
            ctx.fillStyle = node.energy > 0.5 ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 255, 0, 1)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Scariche elettriche tra nodi random
     */
    function drawLightning(ctx, canvas, intensity) {
        const numBolts = Math.floor(intensity * 5);
        
        for (let i = 0; i < numBolts; i++) {
            const node1 = nodes[Math.floor(Math.random() * nodes.length)];
            const node2 = nodes[Math.floor(Math.random() * nodes.length)];
            
            if (node1 === node2) continue;
            
            // Carica energia ai nodi
            node1.energy = 1;
            node2.energy = 1;
            
            // Disegna fulmine spezzato
            drawBolt(ctx, node1.x, node1.y, node2.x, node2.y, intensity);
        }
    }

    /**
     * Disegna un fulmine spezzato
     */
    function drawBolt(ctx, x1, y1, x2, y2, intensity) {
        const segments = 8;
        const points = [{ x: x1, y: y1 }];
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
            points.push({ x, y });
        }
        points.push({ x: x2, y: y2 });
        
        // Disegna fulmine
        ctx.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // Glow cyan
        ctx.strokeStyle = `rgba(0, 255, 255, ${intensity * 0.6})`;
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    /**
     * Onde di propagazione dai nodi carichi
     */
    function drawPropagationWaves(ctx, intensity) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            if (node.energy > 0.7) {
                const radius = (pulseTime * 50) % 100;
                const alpha = 1 - (radius / 100);
                
                ctx.strokeStyle = `rgba(255, 0, 255, ${alpha * intensity})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Spider-Web'
    };

})();
