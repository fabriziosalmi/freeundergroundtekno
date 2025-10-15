/**
 * FIREWORKS - Visualizer Fuochi d'Artificio
 * Esplosioni di particelle colorate sincronizzate con i bassi
 * Razzi che salgono + esplosioni + caduta particelle
 */

const Fireworks = (function() {
    'use strict';

    const rockets = [];
    const explosions = [];
    const maxRockets = 5;
    let lastRocketTime = 0;

    function init(canvas) {
        rockets.length = 0;
        explosions.length = 0;
        lastRocketTime = 0;
        console.log('🎆 Fireworks initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Background nero chiaro per vedere i fuochi
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        const now = Date.now();
        
        // Crea nuovi razzi su bass kick
        if (bassIntensity > 0.6 && rockets.length < maxRockets && now - lastRocketTime > 300) {
            createRocket(canvas);
            lastRocketTime = now;
        }
        
        // Aggiorna e disegna razzi
        updateRockets(ctx, canvas, bassIntensity);
        
        // Aggiorna e disegna esplosioni
        updateExplosions(ctx, canvas, midIntensity, trebleIntensity);
        
        // Stelle di sfondo
        if (trebleIntensity > 0.5) {
            drawBackgroundStars(ctx, canvas, trebleIntensity);
        }
    }

    /**
     * Crea un nuovo razzo
     */
    function createRocket(canvas) {
        const rocket = {
            x: Math.random() * canvas.width,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: -10 - Math.random() * 5,
            targetY: canvas.height * (0.2 + Math.random() * 0.3),
            color: getRandomColor(),
            trail: []
        };
        rockets.push(rocket);
    }

    /**
     * Aggiorna razzi
     */
    function updateRockets(ctx, canvas, bassIntensity) {
        for (let i = rockets.length - 1; i >= 0; i--) {
            const rocket = rockets[i];
            
            // Salva posizione per trail
            rocket.trail.push({ x: rocket.x, y: rocket.y });
            if (rocket.trail.length > 10) rocket.trail.shift();
            
            // Disegna scia
            for (let j = 0; j < rocket.trail.length; j++) {
                const pos = rocket.trail[j];
                const alpha = j / rocket.trail.length;
                const size = 2 + alpha * 3;
                
                ctx.fillStyle = `rgba(${rocket.color.join(',')}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Disegna razzo
            ctx.fillStyle = `rgb(${rocket.color.join(',')})`;
            ctx.beginPath();
            ctx.arc(rocket.x, rocket.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Particelle sparkle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Aggiorna posizione
            rocket.x += rocket.vx;
            rocket.y += rocket.vy;
            rocket.vy += 0.1; // Gravità leggera
            
            // Esplodi quando raggiunge target o inizia a scendere
            if (rocket.y <= rocket.targetY || rocket.vy > 0) {
                createExplosion(rocket.x, rocket.y, rocket.color, bassIntensity);
                rockets.splice(i, 1);
            }
        }
    }

    /**
     * Crea esplosione
     */
    function createExplosion(x, y, color, intensity) {
        const numParticles = Math.floor(50 + intensity * 100);
        const explosion = {
            particles: []
        };
        
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            
            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: Math.random() > 0.3 ? color : [255, 255, 255],
                size: 2 + Math.random() * 3
            });
        }
        
        explosions.push(explosion);
    }

    /**
     * Aggiorna esplosioni
     */
    function updateExplosions(ctx, canvas, midIntensity, trebleIntensity) {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i];
            let allDead = true;
            
            for (let j = explosion.particles.length - 1; j >= 0; j--) {
                const p = explosion.particles[j];
                
                if (p.life > 0) {
                    allDead = false;
                    
                    // Disegna particella
                    const alpha = p.life;
                    ctx.fillStyle = `rgba(${p.color.join(',')}, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Glow per particelle bianche
                    if (p.color[0] === 255 && p.color[1] === 255 && p.color[2] === 255) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // Aggiorna posizione
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.15; // Gravità
                    p.vx *= 0.98; // Attrito
                    
                    // Twinkle effect sui treble
                    if (trebleIntensity > 0.6) {
                        p.vx += (Math.random() - 0.5) * 0.5;
                        p.vy += (Math.random() - 0.5) * 0.5;
                    }
                    
                    // Decay vita
                    p.life -= 0.01 + midIntensity * 0.01;
                } else {
                    explosion.particles.splice(j, 1);
                }
            }
            
            if (allDead || explosion.particles.length === 0) {
                explosions.splice(i, 1);
            }
        }
    }

    /**
     * Stelle di sfondo brillanti
     */
    function drawBackgroundStars(ctx, canvas, intensity) {
        const numStars = Math.floor(intensity * 20);
        
        for (let i = 0; i < numStars; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 1 + Math.random() * 2;
            const alpha = 0.3 + Math.random() * 0.7;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * intensity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Genera colore random per fuochi
     */
    function getRandomColor() {
        const colors = [
            [255, 0, 0],     // Rosso
            [0, 255, 0],     // Verde
            [0, 0, 255],     // Blu
            [255, 255, 0],   // Giallo
            [255, 0, 255],   // Magenta
            [0, 255, 255],   // Cyan
            [255, 128, 0],   // Arancione
            [255, 0, 128]    // Rosa
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    return {
        init: init,
        draw: draw,
        name: 'Fireworks'
    };

})();
