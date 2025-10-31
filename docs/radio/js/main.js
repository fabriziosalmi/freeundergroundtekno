/**
 * Free Underground Tekno - Main Player Logic
 * Gestisce Web Audio API, interazioni UI e loop di animazione
 */

(function() {
    'use strict';

    // === RIFERIMENTI ELEMENTI DOM ===
    let canvas;
    let audioElement;
    let playPauseBtn;
    let playIcon;
    let pauseIcon;
    let infoOverlay;
    let styleIndicator;
    let volumeIndicator;
    let instructions;
    let loadingSpinner;

    // === STATO DELL'APPLICAZIONE ===
    let isPlaying = false;
    let isInitialized = false;
    let animationId = null;

    // === WEB AUDIO API ===
    let audioContext = null;
    let analyser = null;
    let source = null;
    let dataArray = null;

    // === INTERAZIONI ===
    let dragStartX = 0;
    let isDragging = false;
    let instructionsTimeout = null;

    /**
     * Inizializzazione al caricamento della pagina
     */
    function init() {
        console.log('🎵 Free Underground Tekno - Digital Wall Player');
        
        // Ottieni riferimenti agli elementi DOM
        canvas = document.getElementById('audio-visualizer');
        audioElement = document.getElementById('audio-player');
        playPauseBtn = document.getElementById('play-pause-btn');
        playIcon = document.getElementById('play-icon');
        pauseIcon = document.getElementById('pause-icon');
        infoOverlay = document.getElementById('info-overlay');
        styleIndicator = document.getElementById('style-indicator');
        volumeIndicator = document.getElementById('volume-indicator');
        instructions = document.getElementById('instructions');
        loadingSpinner = document.getElementById('loading-spinner');

        // Verifica che tutti gli elementi esistano
        if (!canvas || !audioElement || !playPauseBtn) {
            console.error('❌ Errore: elementi DOM mancanti');
            return;
        }

        // Inizializza il visualizer
        Visualizer.init(canvas);
        
        // TEST: Disegna qualcosa sul canvas per verificare che funzioni
        testCanvasVisibility();

        // Aggiungi event listeners
        playPauseBtn.addEventListener('click', togglePlayPause);
        
        // Controllo volume con movimento verticale del mouse
        document.addEventListener('mousemove', handleVolumeControl);
        document.addEventListener('touchmove', handleVolumeControlTouch, { passive: false });

        // CAMBIO STILE VISUALIZER - Metodi multipli per facilità:
        // 1. Doppio click ovunque (più semplice)
        document.addEventListener('dblclick', changeVisualizerStyle);
        
        // 2. Drag orizzontale (alternativo)
        document.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        
        // 3. Tasti freccia per cambio stile (desktop)
        document.addEventListener('keydown', function(e) {
            // Freccia sinistra o destra = cambio stile
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                changeVisualizerStyle();
                e.preventDefault();
            }
            // Spazio = play/pause
            if (e.key === ' ' || e.key === 'Spacebar') {
                togglePlayPause();
                e.preventDefault();
            }
        });

        // Nascondi le istruzioni dopo 5 secondi
        instructionsTimeout = setTimeout(() => {
            if (instructions) {
                instructions.classList.add('hidden');
            }
        }, 5000);

        console.log('✅ Player initialized - Click to start');
    }
    
    /**
     * Test iniziale per verificare che il canvas sia visibile
     */
    function testCanvasVisibility() {
        const testCtx = canvas.getContext('2d');
        
        console.log('🧪 Testing canvas visibility...');
        console.log(`   Canvas dimensions: ${canvas.width}x${canvas.height}`);
        console.log(`   Canvas style: ${window.getComputedStyle(canvas).display}`);
        console.log(`   Canvas z-index: ${window.getComputedStyle(canvas).zIndex}`);
        
        // Riempie tutto il canvas di verde per 2 secondi
        testCtx.fillStyle = '#00FF00';
        testCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Testo di test grande
        testCtx.fillStyle = '#000000';
        testCtx.font = 'bold 60px monospace';
        testCtx.textAlign = 'center';
        testCtx.fillText('CANVAS WORKING!', canvas.width / 2, canvas.height / 2);
        
        testCtx.font = 'bold 30px monospace';
        testCtx.fillText('Click PLAY to start visualizer', canvas.width / 2, canvas.height / 2 + 50);
        
        console.log('✅ Canvas test drawn - you should see GREEN screen');
        
        // Rimuovi il test dopo 3 secondi
        setTimeout(() => {
            testCtx.fillStyle = '#000000';
            testCtx.fillRect(0, 0, canvas.width, canvas.height);
            console.log('🧹 Test cleared - canvas ready');
        }, 3000);
    }

    /**
     * Inizializza Web Audio API
     * Deve essere chiamato dopo una interazione dell'utente (policy browser)
     */
    function initAudioContext() {
        if (isInitialized) return;

        try {
            // Crea AudioContext
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Crea l'analizzatore
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // Risoluzione dell'analisi (potenza di 2)
            analyser.smoothingTimeConstant = 0.8; // Smoothing per ridurre il flickering
            
            // Crea il source dal MediaElement
            source = audioContext.createMediaElementSource(audioElement);
            
            // Collega i nodi: source -> analyser -> destination (speakers)
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Crea l'array per i dati di frequenza
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            isInitialized = true;
            console.log('🎧 Web Audio API initialized');
            
        } catch (error) {
            console.error('❌ Errore inizializzazione Web Audio API:', error);
            alert('Errore nell\'inizializzazione dell\'audio. Riprova.');
        }
    }

    /**
     * Toggle Play/Pause
     */
    function togglePlayPause() {
        if (!isInitialized) {
            // Prima interazione - inizializza Web Audio API
            initAudioContext();
        }

        if (isPlaying) {
            // PAUSE
            audioElement.pause();
            
            if (audioContext) {
                audioContext.suspend();
            }
            
            // Ferma l'animazione
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            // Aggiorna UI
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
            playPauseBtn.classList.remove('playing');
            
            console.log('⏸️ Paused');
            
        } else {
            // PLAY
            showLoadingSpinner(true);
            
            // Nascondi le istruzioni
            if (instructions) {
                instructions.classList.add('hidden');
            }
            
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (audioContext && audioContext.state === 'suspended') {
                        audioContext.resume();
                    }
                    
                    // Avvia il loop di animazione
                    startAnimationLoop();
                    
                    // Aggiorna UI
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'inline';
                    playPauseBtn.classList.add('playing');
                    
                    showLoadingSpinner(false);
                    console.log('▶️ Playing');
                    
                }).catch(error => {
                    console.error('❌ Errore durante play:', error);
                    showLoadingSpinner(false);
                    alert('Errore durante la riproduzione. Riprova.');
                });
            }
        }
        
        isPlaying = !isPlaying;
    }

    /**
     * Loop di animazione principale
     * Aggiorna il visualizer ad ogni frame
     */
    function startAnimationLoop() {
        console.log('🎬 Starting animation loop');
        console.log(`   isPlaying: ${isPlaying}`);
        console.log(`   analyser: ${!!analyser}`);
        console.log(`   dataArray: ${!!dataArray}`);
        
        let frameCount = 0;
        
        function animate() {
            if (!isPlaying) {
                console.log('⏸️ Animation stopped - not playing');
                return;
            }
            
            frameCount++;
            
            // Log ogni 60 frames (circa 1 secondo)
            if (frameCount % 60 === 0) {
                console.log(`🎞️ Frame ${frameCount} - animation running`);
            }
            
            // Richiedi il prossimo frame
            animationId = requestAnimationFrame(animate);
            
            // Aggiorna il visualizer
            if (analyser && dataArray) {
                Visualizer.draw(analyser, dataArray);
            } else {
                console.warn('⚠️ Missing analyser or dataArray');
            }
        }
        
        animate();
    }

    /**
     * Controllo volume con posizione Y del mouse
     * Top = volume max (1.0), Bottom = volume min (0.0)
     */
    function handleVolumeControl(e) {
        if (!audioElement) return;
        
        // Calcola la posizione Y normalizzata (0 a 1)
        const normalizedY = e.clientY / window.innerHeight;
        
        // Inverti (top = 1, bottom = 0) e imposta il volume
        const volume = 1 - normalizedY;
        audioElement.volume = Math.max(0, Math.min(1, volume));
        
        // Mostra indicatore volume
        showVolumeIndicator(Math.round(volume * 100));
    }

    /**
     * Controllo volume con touch (mobile)
     */
    function handleVolumeControlTouch(e) {
        if (!audioElement || e.touches.length === 0) return;
        
        const touch = e.touches[0];
        const normalizedY = touch.clientY / window.innerHeight;
        const volume = 1 - normalizedY;
        audioElement.volume = Math.max(0, Math.min(1, volume));
        
        showVolumeIndicator(Math.round(volume * 100));
        e.preventDefault();
    }

    /**
     * Mostra l'indicatore del volume
     */
    function showVolumeIndicator(volumePercent) {
        if (!volumeIndicator) return;
        
        volumeIndicator.textContent = `VOL: ${volumePercent}%`;
        volumeIndicator.classList.add('show');
        
        // Nascondi dopo 1 secondo
        setTimeout(() => {
            volumeIndicator.classList.remove('show');
        }, 1000);
    }

    /**
     * Mostra/nascondi loading spinner
     */
    function showLoadingSpinner(show) {
        if (!loadingSpinner) return;
        
        if (show) {
            loadingSpinner.classList.add('visible');
        } else {
            loadingSpinner.classList.remove('visible');
        }
    }

    // === GESTIONE DRAG PER CAMBIO STILE VISUALIZER ===

    function handleDragStart(e) {
        dragStartX = e.clientX;
        isDragging = false; // Reset
    }

    function handleDragMove(e) {
        if (dragStartX === 0) return;
        
        const dragDistance = Math.abs(e.clientX - dragStartX);
        
        // Considera un drag se lo spostamento è > 30px (più sensibile)
        if (dragDistance > 30) {
            isDragging = true;
        }
    }

    function handleDragEnd(e) {
        if (isDragging) {
            const dragDelta = e.clientX - dragStartX;
            
            // Drag orizzontale significativo -> cambia stile (soglia ridotta)
            if (Math.abs(dragDelta) > 30) {
                changeVisualizerStyle();
            }
        }
        
        dragStartX = 0;
        isDragging = false;
    }

    // Touch events per mobile
    function handleTouchStart(e) {
        if (e.touches.length > 0) {
            dragStartX = e.touches[0].clientX;
            isDragging = false;
        }
    }

    function handleTouchMove(e) {
        if (dragStartX === 0 || e.touches.length === 0) return;
        
        const touch = e.touches[0];
        const dragDistance = Math.abs(touch.clientX - dragStartX);
        
        // Soglia ridotta per mobile
        if (dragDistance > 30) {
            isDragging = true;
            e.preventDefault(); // Previeni lo scroll
        }
    }

    function handleTouchEnd(e) {
        if (isDragging) {
            changeVisualizerStyle();
        }
        
        dragStartX = 0;
        isDragging = false;
    }

    /**
     * Cambia lo stile del visualizer
     */
    function changeVisualizerStyle() {
        const newStyle = Visualizer.nextStyle();
        showStyleIndicator(newStyle);
        console.log(`🎨 Visualizer style: ${newStyle}`);
    }

    /**
     * Mostra l'indicatore dello stile corrente
     */
    function showStyleIndicator(styleName) {
        if (!styleIndicator) return;
        
        styleIndicator.textContent = styleName;
        styleIndicator.classList.add('show');
        
        // Nascondi dopo 2 secondi
        setTimeout(() => {
            styleIndicator.classList.remove('show');
        }, 2000);
    }

    // === INIZIALIZZAZIONE AL CARICAMENTO ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
