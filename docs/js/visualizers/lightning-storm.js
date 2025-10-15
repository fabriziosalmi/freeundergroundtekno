/**
 * LIGHTNING STORM - Visualizer Tempesta di Fulmini
 * Fulmini elettrici che scaricano dal cielo
 * Effetto tempesta + lampi + tuoni visuali
 */

const LightningStorm = (function() {
    'use strict';

    const clouds = [];
    const lightnings = [];
    const numClouds = 8;
    let flashTime = 0;
    let lastBoltTime = 0;

    function init(canvas) {
        clouds.length = 0;
        lightnings.length = 0;
        flashTime = 0;
        lastBoltTime = 0;
        
        // Crea nuvole
        for (let i = 0; i < numClouds; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.3,
                width: 100 + Math.random() * 200,
                height: 40 + Math.random() * 60,
                vx: (Math.random() - 0.5) * 2,
                charge: Math.random()
            });
        }
        
        console.log('⚡ Lightning-Storm initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Background gradiente temporalesco
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(10, 10, 30, 0.15)');
        gradient.addColorStop(0.3, 'rgba(20, 20, 40, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        const now = Date.now();
        
        // Flash screen su bass forte
        if (flashTime > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashTime})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashTime -= 0.05;
        }
        
        // Genera fulmine su bass kick
        if (bassIntensity > 0.65 && now - lastBoltTime > 200) {
            const cloud = clouds[Math.floor(Math.random() * clouds.length)];
            createLightning(cloud, canvas, bassIntensity);
            flashTime = bassIntensity * 0.5;
            lastBoltTime = now;
        }
        
        // Aggiorna e disegna nuvole
        updateClouds(ctx, canvas, midIntensity);
        
        // Aggiorna e disegna fulmini
        updateLightnings(ctx, bassIntensity, trebleIntensity);
        
        // Pioggia sui mids alti
        if (midIntensity > 0.5) {
            drawRain(ctx, canvas, midIntensity);
        }
        
        // Ground glow
        drawGroundGlow(ctx, canvas, trebleIntensity);
    }

    /**
     * Aggiorna nuvole
     */
    function updateClouds(ctx, canvas, intensity) {
        for (let i = 0; i < clouds.length; i++) {
            const cloud = clouds[i];
            
            // Movimento
            cloud.x += cloud.vx;
            if (cloud.x < -cloud.width) cloud.x = canvas.width;
            if (cloud.x > canvas.width) cloud.x = -cloud.width;
            
            // Accumula carica
            cloud.charge += 0.01 * intensity;
            if (cloud.charge > 1) cloud.charge = 0;
            
            // Disegna nuvola
            drawCloud(ctx, cloud, intensity);
        }
    }

    /**
     * Disegna una nuvola
     */
    function drawCloud(ctx, cloud, intensity) {
        const numBlobs = 5;
        
        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        
        // Glow carica elettrica
        if (cloud.charge > 0.7) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.width);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${(cloud.charge - 0.7) * 2})`);
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, cloud.width, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Blob nuvola
        for (let i = 0; i < numBlobs; i++) {
            const bx = (i - numBlobs / 2) * (cloud.width / numBlobs) * 0.8;
            const by = Math.sin(i * 0.5) * cloud.height * 0.3;
            const br = cloud.width / numBlobs * (1 + Math.sin(i * 1.2) * 0.3);
            
            const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            gradient.addColorStop(0, `rgba(60, 60, 80, ${0.7 + intensity * 0.3})`);
            gradient.addColorStop(1, `rgba(30, 30, 50, ${0.3 + intensity * 0.2})`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * Crea fulmine
     */
    function createLightning(cloud, canvas, intensity) {
        const startX = cloud.x + (Math.random() - 0.5) * cloud.width * 0.5;
        const startY = cloud.y + cloud.height * 0.5;
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = canvas.height;
        
        const segments = Math.floor(10 + intensity * 20);
        const branches = Math.floor(2 + intensity * 4);
        
        lightnings.push({
            segments: generateLightningSegments(startX, startY, endX, endY, segments),
            branches: generateBranches(startX, startY, endX, endY, segments, branches),
            life: 1.0,
            thickness: 2 + intensity * 4
        });
    }

    /**
     * Genera segmenti fulmine
     */
    function generateLightningSegments(x1, y1, x2, y2, numSegments) {
        const points = [{ x: x1, y: y1 }];
        
        for (let i = 1; i < numSegments; i++) {
            const t = i / numSegments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 60;
            const y = y1 + (y2 - y1) * t;
            points.push({ x, y });
        }
        
        points.push({ x: x2, y: y2 });
        return points;
    }

    /**
     * Genera rami del fulmine
     */
    function generateBranches(x1, y1, x2, y2, numSegments, numBranches) {
        const branches = [];
        
        for (let i = 0; i < numBranches; i++) {
            const startIndex = Math.floor(Math.random() * (numSegments - 2)) + 1;
            const t = startIndex / numSegments;
            const startX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 60;
            const startY = y1 + (y2 - y1) * t;
            
            const branchLength = Math.random() * 200 + 100;
            const angle = (Math.random() - 0.5) * Math.PI * 0.5;
            const endX = startX + Math.sin(angle) * branchLength;
            const endY = startY + Math.cos(angle) * branchLength;
            
            const branchSegments = Math.floor(5 + Math.random() * 10);
            branches.push(generateLightningSegments(startX, startY, endX, endY, branchSegments));
        }
        
        return branches;
    }

    /**
     * Aggiorna fulmini
     */
    function updateLightnings(ctx, bassIntensity, trebleIntensity) {
        for (let i = lightnings.length - 1; i >= 0; i--) {
            const lightning = lightnings[i];
            
            if (lightning.life > 0) {
                // Disegna fulmine principale
                drawLightningBolt(ctx, lightning.segments, lightning.thickness, lightning.life);
                
                // Disegna rami
                for (let j = 0; j < lightning.branches.length; j++) {
                    drawLightningBolt(ctx, lightning.branches[j], lightning.thickness * 0.6, lightning.life * 0.8);
                }
                
                // Decay
                lightning.life -= 0.1 + trebleIntensity * 0.1;
            } else {
                lightnings.splice(i, 1);
            }
        }
    }

    /**
     * Disegna un singolo fulmine
     */
    function drawLightningBolt(ctx, points, thickness, alpha) {
        if (points.length < 2) return;
        
        // Core bianco
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // Glow cyan
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;
        ctx.lineWidth = thickness * 3;
        ctx.stroke();
        
        // Glow esterno blu
        ctx.strokeStyle = `rgba(100, 150, 255, ${alpha * 0.3})`;
        ctx.lineWidth = thickness * 6;
        ctx.stroke();
    }

    /**
     * Pioggia
     */
    function drawRain(ctx, canvas, intensity) {
        const numDrops = Math.floor(intensity * 100);
        
        ctx.strokeStyle = `rgba(150, 150, 200, ${intensity * 0.4})`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < numDrops; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const length = 10 + Math.random() * 20;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + length);
            ctx.stroke();
        }
    }

    /**
     * Ground glow quando fulmine colpisce
     */
    function drawGroundGlow(ctx, canvas, intensity) {
        if (lightnings.length > 0) {
            // Trova punto di impatto più recente
            const recent = lightnings[lightnings.length - 1];
            if (recent.life > 0.5 && recent.segments.length > 0) {
                const impact = recent.segments[recent.segments.length - 1];
                
                const gradient = ctx.createRadialGradient(
                    impact.x, canvas.height, 0,
                    impact.x, canvas.height, 200
                );
                gradient.addColorStop(0, `rgba(0, 255, 255, ${recent.life * 0.8})`);
                gradient.addColorStop(0.5, `rgba(100, 150, 255, ${recent.life * 0.4})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(impact.x, canvas.height, 200, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    return {
        init: init,
        draw: draw,
        name: 'Lightning-Storm'
    };

})();
