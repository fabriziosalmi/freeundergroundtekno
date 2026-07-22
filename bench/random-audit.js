#!/usr/bin/env node
/**
 * FREE UNDERGROUND TEKNO — random-gate audit.
 *
 * The scene is supposed to be acoustically driven: what you see should be a
 * function of what you hear. animate() contains ~87 Math.random() calls, and
 * roughly 30 of them are *gates* — a coin flip that vetoes an event the audio
 * has already justified (`bassLevel > 0.6 && Math.random() > 0.7`).
 *
 * A gate is only defensible if it fires at a rate tied to the MUSIC. This
 * script measures whether that holds, by running the same synthetic track at
 * several frame rates and counting how often the scene actually reacts.
 *
 *   - A per-BEAT gate fires at a rate set by the BPM. Frame rate must not
 *     change it. Its events/sec stays flat as fps moves.
 *   - A per-FRAME gate fires at (probability × fps). Its events/sec tracks the
 *     frame rate, so the same track looks different on a 60Hz laptop, a 120Hz
 *     ProMotion panel and the capture box — and the visuals stop being a
 *     function of the audio.
 *
 * Events are counted without touching the page: a MutationObserver watches the
 * class/style attributes of the decorative layers, and the few global trigger
 * functions are wrapped. Beats/sec is the control — it is set by the synthetic
 * track and must stay flat across every row.
 *
 * Usage:
 *   node bench/random-audit.js
 *   node bench/random-audit.js --secs 15 --scene wall
 */

const puppeteer = require('puppeteer');
const path = require('path');

const PAGE = path.join(__dirname, '..', 'docs', 'index.html');

function arg(name, def) {
    const i = process.argv.indexOf('--' + name);
    return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const SECS = parseFloat(arg('secs', '12'));
const SCENE_NAME = arg('scene', 'wall');

// Same synthetic scenes as bench.js.
const SCENES = {
    wall: { bpm: 150, kick: 1.0, hats: 0.75, lead: 0.55 },
    minimal: { bpm: 138, kick: 0.55, hats: 0.25, lead: 0.30 },
    breakdown: { bpm: 150, kick: 0.0, hats: 0.35, lead: 0.70 },
};

// Frame rates to sample. CPU throttling is the only portable way to move the
// frame rate without editing the page's own throttle logic.
const THROTTLES = [1, 4, 8, 16];

function installAudit(scene, seed) {
    let s = seed >>> 0;
    Math.random = function () {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const BINS = 1024;
    const buf = new Uint8Array(BINS);
    const t0 = performance.now();
    const beat = scene.bpm > 0 ? 60000 / scene.bpm : 0;

    function fill() {
        const now = performance.now() - t0;
        let kickEnv = 0;
        if (beat > 0 && scene.kick > 0) kickEnv = Math.exp(-((now % beat) / beat) * 9) * scene.kick;
        let hatEnv = 0;
        if (beat > 0 && scene.hats > 0) {
            const p = ((now + beat / 2) % (beat / 2)) / (beat / 2);
            hatEnv = Math.exp(-p * 14) * scene.hats;
        }
        const leadEnv = scene.lead * (0.6 + 0.4 * Math.sin(now * 0.0011));
        for (let i = 0; i < BINS; i++) {
            let v;
            if (i < 4) v = kickEnv * 255;
            else if (i < 8) v = kickEnv * 250;
            else if (i < 14) v = kickEnv * 120;
            else if (i < 30) v = kickEnv * 230;
            else if (i < 40) v = leadEnv * 120;
            else if (i < 120) v = leadEnv * 255;
            else if (i < 150) v = (leadEnv * 0.4 + hatEnv * 0.4) * 255;
            else if (i < 300) v = hatEnv * 255;
            else v = hatEnv * 90 * Math.max(0, 1 - (i - 300) / 500);
            buf[i] = v > 255 ? 255 : v < 0 ? 0 : v | 0;
        }
        return buf;
    }

    analyser = {
        fftSize: 2048, frequencyBinCount: BINS,
        getByteFrequencyData(target) { target.set(fill()); },
    };
    dataArray = new Uint8Array(BINS);
    isPlaying = true;

    const A = window.__audit = { frames: 0, beats: 0, counts: {}, t0: 0 };
    const bump = (k) => { A.counts[k] = (A.counts[k] || 0) + 1; };

    // Which group a mutated element belongs to. Groups mirror the ablation
    // groups in bench.js so cost and firing rate can be read side by side.
    function groupOf(el) {
        const c = el.className;
        const cls = typeof c === 'string' ? c : '';
        const id = el.id || '';
        if (/fractal-tear|silver-glow|spiral-whirl|shimmer-twinkle|circular-strobo/.test(cls)) return 'confetti';
        if (/distortion-zone|warp-zone|chroma-zone/.test(cls)) return 'distort';
        if (/geo-strobe/.test(cls) || id === 'strobeFlash' || id === 'crowdStrobe') return 'strobes';
        if (/spiral-vortex/.test(cls) || id === 'spatialStrobo') return 'vortex';
        if (/rotating-rays/.test(cls) || id === 'negativeLayer') return 'rays';
        if (/dream-image/.test(cls) || id === 'dreamLayer') return 'dream';
        return null;
    }

    // Count only *activations* (a class being added), not every style write —
    // otherwise the per-frame .style writes on #background would drown the
    // discrete events we are trying to see.
    new MutationObserver((muts) => {
        for (const m of muts) {
            if (m.attributeName !== 'class') continue;
            const el = m.target;
            const g = groupOf(el);
            if (!g) continue;
            const now = typeof el.className === 'string' ? el.className : '';
            const before = m.oldValue || '';
            if (now.length > before.length) bump(g);
        }
    }).observe(document.body, {
        subtree: true, attributes: true,
        attributeFilter: ['class'], attributeOldValue: true,
    });

    // Global trigger functions: wrap to count calls directly.
    if (typeof triggerDreamFlash === 'function') {
        const o = triggerDreamFlash;
        triggerDreamFlash = function (...a) { bump('dreamFlash'); return o.apply(this, a); };
    }
    if (typeof changeState === 'function') {
        const o = changeState;
        changeState = function (...a) { bump('changeState'); return o.apply(this, a); };
    }

    // Frame counter + beat counter (the control). beatCount is the page's own
    // monotonic beat counter, driven by bassLevel crossing its threshold.
    const rafTick = () => { A.frames++; requestAnimationFrame(rafTick); };
    requestAnimationFrame(rafTick);

    animate();

    window.__auditStart = () => {
        A.frames = 0; A.counts = {}; A.beat0 = beatCount; A.t0 = performance.now();
    };
    window.__auditRead = () => {
        const secs = (performance.now() - A.t0) / 1000;
        const out = { secs, fps: A.frames / secs, beatsPerSec: (beatCount - A.beat0) / secs, rates: {} };
        for (const k of Object.keys(A.counts)) out.rates[k] = A.counts[k] / secs;
        return out;
    };
}

(async () => {
    const scene = SCENES[SCENE_NAME];
    if (!scene) { console.error('unknown scene:', SCENE_NAME); process.exit(1); }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required',
               '--enable-gpu-rasterization', '--hide-scrollbars'],
    });

    console.log(`\nRANDOM-GATE AUDIT — scene "${SCENE_NAME}" @ ${scene.bpm} BPM, ${SECS}s per row\n`);
    console.log('Same track every row. Only the frame rate changes.');
    console.log('A gate driven by the MUSIC keeps its rate flat. A gate driven by the');
    console.log('FRAME LOOP tracks the fps column.\n');

    const rows = [];
    for (const th of THROTTLES) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        if (th > 1) await page.emulateCPUThrottling(th);
        await page.goto('file://' + PAGE + '?profile=0', { waitUntil: 'load' });
        await page.evaluate(installAudit, scene, 0x1337beef);
        await new Promise((r) => setTimeout(r, 2500));      // let BPM lock
        await page.evaluate(() => window.__auditStart());
        await new Promise((r) => setTimeout(r, SECS * 1000));
        const r = await page.evaluate(() => window.__auditRead());
        await page.close();
        rows.push({ th, ...r });
    }
    await browser.close();

    const keys = [...new Set(rows.flatMap((r) => Object.keys(r.rates)))].sort();
    const pad = (s, n) => String(s).padStart(n);
    console.log('cpu      fps   beats/s | ' + keys.map((k) => pad(k, 11)).join(''));
    console.log('-'.repeat(28 + keys.length * 11));
    for (const r of rows) {
        console.log('×' + String(r.th).padEnd(4) + pad(r.fps.toFixed(0), 6) +
            pad(r.beatsPerSec.toFixed(2), 9) + ' | ' +
            keys.map((k) => pad((r.rates[k] || 0).toFixed(2), 11)).join(''));
    }

    // Correlation with fps: 1.0 means the event rate is a pure multiple of the
    // frame rate (worst case), 0 means it is independent of it (what we want).
    console.log('\nper-event verdict — ratio of (events/sec) between the fastest and slowest row:');
    console.log('  ≈1.0  music-driven, frame-rate independent   ·   ≈fps ratio  frame-rate driven\n');
    const fast = rows.reduce((a, b) => (a.fps > b.fps ? a : b));
    const slow = rows.reduce((a, b) => (a.fps < b.fps ? a : b));
    const fpsRatio = fast.fps / slow.fps;
    console.log(`  fps ratio between rows: ${fpsRatio.toFixed(2)}×   (beats/s ratio: ` +
                `${(fast.beatsPerSec / slow.beatsPerSec).toFixed(2)}× — the control)\n`);
    for (const k of keys) {
        const a = slow.rates[k] || 0, b = fast.rates[k] || 0;
        if (!a && !b) continue;
        const ratio = a ? b / a : Infinity;
        // Attribute to whichever model the observed ratio sits closer to, in log
        // space so "flat" and "tracks fps" are compared on equal footing.
        const dMusic = Math.abs(Math.log(ratio || 1e-6));
        const dFrame = Math.abs(Math.log((ratio || 1e-6) / fpsRatio));
        const verdict = dMusic < dFrame ? 'music-driven' : 'FRAME-RATE DRIVEN';
        console.log('  ' + k.padEnd(14) + (ratio === Infinity ? '  inf' : ratio.toFixed(2) + '×').padStart(7) +
                    '   ' + verdict);
    }
    console.log('');
})();
