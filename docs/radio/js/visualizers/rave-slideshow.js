/**
 * RAVE SLIDESHOW - Visualizer con Immagini Sound System Reali
 * Carica 18 immagini WebP di sound system e le anima con effetti audio-reattivi
 * Glitch, distortion, color shift, kaleidoscope, pulse, rotation
 */

const RaveSlideshow = (function() {
    'use strict';

    const images = [];
    const numImages = 18;
    let imagesLoaded = 0;
    let currentImageIndex = 0;
    let nextImageIndex = 1;
    let transition = 0;
    let effectMode = 0;
    let glitchTime = 0;
    let kaleidoscopeAngle = 0;
    let lastSwitchTime = 0;
    const switchInterval = 8000; // 8 secondi per immagine

    function init(canvas) {
        images.length = 0;
        imagesLoaded = 0;
        currentImageIndex = 0;
        nextImageIndex = 1;
        transition = 0;
        effectMode = 0;
        glitchTime = 0;
        lastSwitchTime = Date.now();
        
        // Carica tutte le 18 immagini
        for (let i = 1; i <= numImages; i++) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                imagesLoaded++;
                console.log(`📷 Loaded image ${i}/${numImages}`);
            };
            img.onerror = function() {
                console.warn(`⚠️ Failed to load image ${i}`);
                imagesLoaded++; // Conta comunque per non bloccare
            };
            img.src = `images/${i}.webp`;
            images.push(img);
        }
        
        console.log('🎬 Rave-Slideshow initialized, loading 18 images...');
    }

    function draw(canvas, ctx, dataArray, analyser) {
        // Aspetta che almeno qualche immagine sia caricata
        if (imagesLoaded < 3) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00FF00';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`LOADING SOUND SYSTEM IMAGES... ${imagesLoaded}/${numImages}`, canvas.width/2, canvas.height/2);
            return;
        }
        
        // Calcola intensità
        const bassSum = dataArray.slice(0, 50).reduce((a, b) => a + b, 0);
        const midSum = dataArray.slice(50, 150).reduce((a, b) => a + b, 0);
        const trebleSum = dataArray.slice(150, 250).reduce((a, b) => a + b, 0);
        
        const bassIntensity = (bassSum / 50) / 255;
        const midIntensity = (midSum / 100) / 255;
        const trebleIntensity = (trebleSum / 100) / 255;
        
        const now = Date.now();
        
        // Switch automatico + su bass kick forte
        if ((now - lastSwitchTime > switchInterval) || (bassIntensity > 0.85 && now - lastSwitchTime > 2000)) {
            nextImageIndex = Math.floor(Math.random() * images.length);
            transition = 0;
            effectMode = Math.floor(Math.random() * 5); // Random effect mode
            lastSwitchTime = now;
        }
        
        // Transizione
        if (transition < 1) {
            transition += 0.02 + bassIntensity * 0.03;
            if (transition >= 1) {
                currentImageIndex = nextImageIndex;
                transition = 1;
            }
        }
        
        glitchTime += 0.1;
        kaleidoscopeAngle += 0.01 + midIntensity * 0.02;
        
        // Disegna immagine con effetti
        drawImageWithEffects(ctx, canvas, currentImageIndex, bassIntensity, midIntensity, trebleIntensity, 1 - transition);
        
        if (transition < 1) {
            drawImageWithEffects(ctx, canvas, nextImageIndex, bassIntensity, midIntensity, trebleIntensity, transition);
        }
        
        // Overlay effetti
        applyOverlayEffects(ctx, canvas, bassIntensity, midIntensity, trebleIntensity);
    }

    /**
     * Disegna immagine con effetti audio-reattivi
     */
    function drawImageWithEffects(ctx, canvas, imageIndex, bass, mid, treble, alpha) {
        if (imageIndex >= images.length || !images[imageIndex].complete) return;
        
        const img = images[imageIndex];
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Centro canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Scala basata su bass
        const scale = 1 + bass * 0.3;
        ctx.scale(scale, scale);
        
        // Rotazione basata su mids
        const rotation = Math.sin(glitchTime) * mid * 0.1;
        ctx.rotate(rotation);
        
        // Calcola dimensioni per fit
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight;
        
        if (imgRatio > canvasRatio) {
            drawHeight = canvas.height;
            drawWidth = drawHeight * imgRatio;
        } else {
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgRatio;
        }
        
        // Applica effect mode
        switch(effectMode) {
            case 0: // Normal con color shift
                applyColorShift(ctx, canvas, img, drawWidth, drawHeight, bass, mid, treble);
                break;
            case 1: // Kaleidoscope
                applyKaleidoscope(ctx, canvas, img, drawWidth, drawHeight, bass);
                break;
            case 2: // Mirror/Symmetry
                applyMirrorEffect(ctx, canvas, img, drawWidth, drawHeight, bass);
                break;
            case 3: // Pixelate
                applyPixelate(ctx, canvas, img, drawWidth, drawHeight, bass);
                break;
            case 4: // RGB Split
                applyRGBSplit(ctx, canvas, img, drawWidth, drawHeight, bass);
                break;
        }
        
        ctx.restore();
        
        // Glitch su bass forte
        if (bass > 0.7) {
            applyGlitchEffect(ctx, canvas, bass);
        }
    }

    /**
     * Color shift effect
     */
    function applyColorShift(ctx, canvas, img, w, h, bass, mid, treble) {
        ctx.drawImage(img, -w/2, -h/2, w, h);
        
        // Color overlay
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${Math.floor(bass * 255)}, ${Math.floor(mid * 255)}, ${Math.floor(treble * 255)}, 0.3)`;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Kaleidoscope effect
     */
    function applyKaleidoscope(ctx, canvas, img, w, h, bass) {
        const segments = 8;
        const segmentAngle = (Math.PI * 2) / segments;
        
        for (let i = 0; i < segments; i++) {
            ctx.save();
            ctx.rotate(segmentAngle * i + kaleidoscopeAngle);
            
            // Clip triangolo
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(0) * w, Math.sin(0) * w);
            ctx.lineTo(Math.cos(segmentAngle) * w, Math.sin(segmentAngle) * w);
            ctx.closePath();
            ctx.clip();
            
            // Mirror alternato
            if (i % 2 === 0) {
                ctx.scale(-1, 1);
            }
            
            ctx.drawImage(img, -w/2, -h/2, w, h);
            ctx.restore();
        }
    }

    /**
     * Mirror effect
     */
    function applyMirrorEffect(ctx, canvas, img, w, h, bass) {
        // Top half
        ctx.drawImage(img, -w/2, -h/2, w, h/2);
        
        // Bottom half mirrored
        ctx.save();
        ctx.scale(1, -1);
        ctx.drawImage(img, -w/2, -h/2, w, h/2, -w/2, -h/2, w, h/2);
        ctx.restore();
    }

    /**
     * Pixelate effect
     */
    function applyPixelate(ctx, canvas, img, w, h, bass) {
        const pixelSize = Math.max(4, Math.floor(20 - bass * 18));
        
        // Disegna piccolo
        const smallW = w / pixelSize;
        const smallH = h / pixelSize;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -w/2, -h/2, smallW, smallH);
        
        // Scale up
        ctx.drawImage(canvas, 
            canvas.width/2 - w/2, canvas.height/2 - h/2, smallW, smallH,
            -w/2, -h/2, w, h
        );
        ctx.imageSmoothingEnabled = true;
    }

    /**
     * RGB Split effect
     */
    function applyRGBSplit(ctx, canvas, img, w, h, bass) {
        const offset = bass * 20;
        
        // Red channel
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(-offset, 0);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(img, -w/2, -h/2, w, h);
        
        // Green channel
        ctx.translate(offset, offset);
        ctx.drawImage(img, -w/2, -h/2, w, h);
        
        // Blue channel
        ctx.translate(offset, -offset);
        ctx.drawImage(img, -w/2, -h/2, w, h);
        ctx.restore();
    }

    /**
     * Glitch scanlines
     */
    function applyGlitchEffect(ctx, canvas, bass) {
        // Simplified glitch without getImageData (CORS issues)
        const numGlitches = Math.floor(bass * 15);
        
        ctx.strokeStyle = `rgba(255, 0, 255, ${bass * 0.6})`;
        ctx.lineWidth = 2 + bass * 4;
        
        for (let i = 0; i < numGlitches; i++) {
            const y = Math.random() * canvas.height;
            const width = 50 + Math.random() * 200;
            const x = Math.random() * (canvas.width - width);
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
            
            // Offset line
            ctx.strokeStyle = `rgba(0, 255, 255, ${bass * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(x + bass * 10, y + 2);
            ctx.lineTo(x + width + bass * 10, y + 2);
            ctx.stroke();
        }
    }

    /**
     * Overlay effects
     */
    function applyOverlayEffects(ctx, canvas, bass, mid, treble) {
        // Vignette
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, canvas.width * 0.3,
            canvas.width/2, canvas.height/2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scanlines
        ctx.globalAlpha = 0.1;
        for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, y, canvas.width, 2);
        }
        ctx.globalAlpha = 1;
        
        // Bass kick flash
        if (bass > 0.8) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(bass - 0.8) * 0.5})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Treble sparks
        if (treble > 0.7) {
            const numSparks = Math.floor(treble * 30);
            for (let i = 0; i < numSparks; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = 2 + Math.random() * 4;
                
                ctx.fillStyle = `rgba(0, 255, 255, ${treble})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Text overlay - info mode attivo
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMAGE: ${currentImageIndex + 1}/${numImages}`, 20, 30);
        ctx.fillText(`EFFECT: ${getEffectName(effectMode)}`, 20, 50);
        ctx.fillText(`BASS: ${'█'.repeat(Math.floor(bass * 20))}`, 20, 70);
    }

    /**
     * Nome effect mode
     */
    function getEffectName(mode) {
        const names = ['COLOR-SHIFT', 'KALEIDOSCOPE', 'MIRROR', 'PIXELATE', 'RGB-SPLIT'];
        return names[mode] || 'NORMAL';
    }

    return {
        init: init,
        draw: draw,
        name: 'Rave-Slideshow'
    };

})();
