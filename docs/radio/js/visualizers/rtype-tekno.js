/**
 * R-TYPE-TEKNO - Mini-gioco Retro Shooter
 * Navicella + nemici + oscilloscopio background
 */

const RTypeTekno = (function() {
    'use strict';

    let rtype = {
        ship: { x: 100, y: 0, vy: 0 },
        bullets: [],
        enemies: [],
        particles: [],
        score: 0,
        lastShot: 0,
        lastEnemy: 0
    };

    function init(canvas) {
        rtype.ship.y = canvas.height / 2;
        rtype.bullets = [];
        rtype.enemies = [];
        rtype.particles = [];
        rtype.score = 0;
        console.log('🚀 R-Type-Tekno initialized');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        const bufferLength = analyser.fftSize;
        const waveData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(waveData);
        
        analyser.getByteFrequencyData(dataArray);
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const bassIntensity = (bassSum / 50) / 255;
        
        // Oscilloscopio background
        ctx.strokeStyle = '#00FF00' + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = waveData[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#00FFFF' + '30';
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = waveData[i] / 128.0;
            const y = canvas.height - ((v * canvas.height) / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        
        // Griglia
        ctx.strokeStyle = '#00FF00' + '10';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        
        // Movimento navicella
        const autoMove = Math.sin(Date.now() * 0.001) * 2;
        const audioMove = (bassIntensity - 0.5) * 5;
        rtype.ship.vy = autoMove + audioMove;
        rtype.ship.y += rtype.ship.vy;
        if (rtype.ship.y < 20) rtype.ship.y = 20;
        if (rtype.ship.y > canvas.height - 20) rtype.ship.y = canvas.height - 20;
        
        // Sparo automatico
        const now = Date.now();
        if (now - rtype.lastShot > 200) {
            rtype.bullets.push({ x: rtype.ship.x + 25, y: rtype.ship.y, vx: 12 });
            rtype.lastShot = now;
        }
        
        // Genera nemici
        if (now - rtype.lastEnemy > 1500) {
            rtype.enemies.push({
                x: canvas.width + 30,
                y: Math.random() * (canvas.height - 100) + 50,
                vx: -3 - Math.random() * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 15 + Math.random() * 10,
                type: Math.floor(Math.random() * 3),
                hp: 1
            });
            rtype.lastEnemy = now;
        }
        
        // Disegna navicella
        drawShip(ctx, rtype.ship.x, rtype.ship.y, bassIntensity);
        
        // Aggiorna proiettili
        for (let i = rtype.bullets.length - 1; i >= 0; i--) {
            const bullet = rtype.bullets[i];
            bullet.x += bullet.vx;
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(bullet.x - 4, bullet.y - 2, 8, 4);
            if (bullet.x > canvas.width + 10) rtype.bullets.splice(i, 1);
        }
        
        // Aggiorna nemici
        for (let i = rtype.enemies.length - 1; i >= 0; i--) {
            const enemy = rtype.enemies[i];
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            if (enemy.y < 30 || enemy.y > canvas.height - 30) enemy.vy *= -1;
            drawEnemy(ctx, enemy.x, enemy.y, enemy.size, enemy.type);
            if (enemy.x < -50) {
                rtype.enemies.splice(i, 1);
                continue;
            }
            
            // Collisioni
            for (let j = rtype.bullets.length - 1; j >= 0; j--) {
                const bullet = rtype.bullets[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.size + 5) {
                    rtype.bullets.splice(j, 1);
                    rtype.enemies.splice(i, 1);
                    rtype.score++;
                    for (let p = 0; p < 10; p++) {
                        rtype.particles.push({
                            x: enemy.x, y: enemy.y,
                            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                            life: 30,
                            color: ['#FF00FF', '#00FFFF', '#FFFF00'][Math.floor(Math.random() * 3)]
                        });
                    }
                    break;
                }
            }
        }
        
        // Particelle
        for (let i = rtype.particles.length - 1; i >= 0; i--) {
            const p = rtype.particles[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            const alpha = (p.life / 30).toFixed(2);
            ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            if (p.life <= 0) rtype.particles.splice(i, 1);
        }
        
        // Score
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`KILLS: ${rtype.score}`, 20, 30);
    }

    function drawShip(ctx, x, y, intensity) {
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x - 15, y - 5);
        ctx.lineTo(x - 15, y + 5);
        ctx.lineTo(x, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(x + 5, y, 5, 0, Math.PI * 2);
        ctx.fill();
        const thrustLength = 10 + (intensity * 15);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x - 15 - thrustLength, y);
        ctx.stroke();
        if (Math.random() > 0.5) {
            ctx.fillStyle = '#FF00FF';
            ctx.fillRect(x - 20 - Math.random() * 10, y - 2, 3, 4);
        }
    }

    function drawEnemy(ctx, x, y, size, type) {
        switch(type) {
            case 0:
                ctx.fillStyle = '#FF00FF';
                ctx.fillRect(x - size/2, y - size/2, size, size);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - size/2, y - size/2, size, size);
                break;
            case 1:
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size/2, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size/2, y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case 2:
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(x, y, size/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
        }
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x - 3, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    return {
        init: init,
        draw: draw,
        name: 'R-Type-Tekno'
    };

})();
