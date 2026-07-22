#!/usr/bin/env node
/**
 * FREE UNDERGROUND TEKNO — beat-detector ground-truth accuracy.
 *
 * "Snappy and locked to the music" is not a feeling you can tune blind. It is
 * four numbers, and this harness measures all four against a track whose beat
 * times are known exactly — because we synthesize the kicks ourselves:
 *
 *   recall     fraction of real beats the detector caught (missed = dead visuals)
 *   precision  fraction of detections that were real beats (extra = twitchy)
 *   latency    ms from the true onset to the detection (lower = snappier)
 *   jitter     std-dev of that latency (LOW = locked; high = visuals swim even
 *              when every beat is caught — this is the one that reads as "loose")
 *
 * The synthetic kick peaks at phase 0 of each beat, so the true onset of beat k
 * is simply audioStart + k × beatPeriod. The page sets `lastBeatTime = Date.now()`
 * at the instant it registers a beat, so detections are timestamped on the page's
 * own clock with no polling quantization. We match each detection to the nearest
 * true onset within half a beat, then tally.
 *
 * Swept across CPU throttles because the current detector is evaluated inside the
 * render loop — so its accuracy is expected to fall apart as the frame rate drops,
 * which is exactly the failure we found in random-audit.js.
 *
 * Usage:
 *   node bench/beat-accuracy.js
 *   node bench/beat-accuracy.js --bpm 150 --secs 30
 */

const puppeteer = require('puppeteer');
const path = require('path');
const { neutralize, installLoopCounter, assertSingleLoop } = require('./harness');

const PAGE = path.join(__dirname, '..', 'docs', 'index.html');

function arg(name, def) {
    const i = process.argv.indexOf('--' + name);
    return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const BPM = parseFloat(arg('bpm', '150'));
const SECS = parseFloat(arg('secs', '25'));
const SCENE = arg('scene', 'all');
// page  = the shipped level-threshold detector (bassLevel > 0.7 + 200ms refractory)
// flux  = candidate: spectral-flux onset with an adaptive threshold, run in the
//         SAME rAF loop reading the SAME spectrum, so the comparison isolates the
//         algorithm, not the sampling rate.
const DETECTOR = arg('detector', 'page');
const THROTTLES = [1, 4, 8, 16];

// Scenes ordered easy -> adversarial. The point is not that the detector works
// on a clean kick (it does) but where it breaks:
//   clean   isolated 4/4 kick, silence between beats. The best case.
//   drone   kick riding a SUSTAINED sub-bass at 0.55 — below threshold, so the
//           composite still dips between kicks. Level detection should cope.
//   wall    kick riding a LOUD sub-bass at 0.85 — ABOVE the 0.7 threshold. Now
//           bassLevel never dips below threshold, so a level gate can only fall
//           back on its 200ms refractory timer: it fires on a clock, not on the
//           music. This is the case a spectral-flux onset detector exists for.
//   ghost   alternating loud/soft kicks (velocity). A fixed threshold set for
//           the loud ones misses every soft one.
const SCENES = {
    clean: { floor: 0.0, kick: 1.0, ghost: false, label: 'isolated 4/4 kick (best case)' },
    drone: { floor: 0.55, kick: 0.45, ghost: false, label: 'kick over sub-bass 0.55 (dips below thr)' },
    wall:  { floor: 0.85, kick: 0.15, ghost: false, label: 'kick over sub-bass 0.85 (never dips)' },
    ghost: { floor: 0.0, kick: 1.0, ghost: true, label: 'alternating loud/soft kick (velocity)' },
};

function installBeatProbe(bpm, scene) {
    const BINS = 1024;
    const buf = new Uint8Array(BINS);
    // Capture both clocks at the same instant so page-clock detections and
    // our true-onset schedule share an origin (skew < 1 ms).
    const perf0 = performance.now();
    const date0 = Date.now();
    const beat = 60000 / bpm;

    function fill() {
        const now = performance.now() - perf0;
        const k = Math.floor(now / beat);
        let peak = scene.floor + scene.kick;
        // Velocity: every other kick at 45% strength.
        if (scene.ghost && (k % 2 === 1)) peak = scene.floor + scene.kick * 0.45;
        const kickEnv = scene.floor + (peak - scene.floor) * Math.exp(-((now % beat) / beat) * 9);
        for (let i = 0; i < BINS; i++) {
            let v = 0;
            if (i < 4) v = kickEnv * 255;
            else if (i < 8) v = kickEnv * 250;
            else if (i < 14) v = kickEnv * 120;
            else if (i < 30) v = kickEnv * 230;
            buf[i] = v > 255 ? 255 : v < 0 ? 0 : v | 0;
        }
        return buf;
    }

    analyser = {
        fftSize: 2048, frequencyBinCount: BINS,
        getByteFrequencyData(t) { t.set(fill()); },
    };
    dataArray = new Uint8Array(BINS);
    isPlaying = true;

    const T = window.__beat = { date0, beat, detections: [], lastSeen: -1 };

    if (window.__detector === 'flux') {
        // ---- CANDIDATE: spectral-flux onset detector ----------------------
        // flux = sum of POSITIVE magnitude changes across the kick bins. It sees
        // the attack (a rising edge in the spectrum), not the level — so a kick
        // riding a loud sustained bass still produces a flux spike, and a soft
        // kick still produces one proportional to its own onset. An adaptive
        // threshold (rolling mean + k·std over ~1s) makes it self-calibrating,
        // so no magic 0.7 to get wrong per track. Runs in the same rAF loop and
        // reads a fresh spectrum each tick, exactly like the page detector.
        const N = 32;                          // sub+body+punch region (0-650 Hz)
        const prev = new Float32Array(N);
        let havePrev = false;
        const HIST = 96;                       // ~1s of flux history at ~100fps
        const hist = new Float32Array(HIST);
        let hi = 0, hn = 0;
        let lastOnset = -1e9;
        const probeBuf = new Uint8Array(BINS);
        const REFRACTORY = 120;                // ms — onsets are sharp, 200 was for level
        const K = 2.2;                         // threshold = mean + K·std
        const flux = () => {
            analyser.getByteFrequencyData(probeBuf);
            let f = 0;
            for (let i = 0; i < N; i++) {
                const m = probeBuf[i] / 255;
                if (havePrev) { const d = m - prev[i]; if (d > 0) f += d; }
                prev[i] = m;
            }
            havePrev = true;
            f /= N;
            // Adaptive threshold from the recent flux distribution.
            let mean = 0; const n = hn;
            if (n > 8) {
                for (let i = 0; i < n; i++) mean += hist[i];
                mean /= n;
                let varc = 0;
                for (let i = 0; i < n; i++) varc += (hist[i] - mean) ** 2;
                const std = Math.sqrt(varc / n);
                const thr = mean + K * std;
                const now = Date.now();
                if (f > thr && now - lastOnset > REFRACTORY) {
                    lastOnset = now;
                    T.detections.push(now);
                }
            }
            hist[hi] = f; hi = (hi + 1) % HIST; if (hn < HIST) hn++;
        };
        const watch = () => { flux(); requestAnimationFrame(watch); };
        requestAnimationFrame(watch);
        // The page still needs SOME loop running for a fair fps reading.
        animate();
    } else {
        // ---- INCUMBENT: read the page's own detections --------------------
        // beatCount increments on every detected beat; lastBeatTime is the
        // page-clock time of that detection.
        const watch = () => {
            if (typeof beatCount === 'number' && beatCount !== T.lastSeen) {
                T.lastSeen = beatCount;
                T.detections.push(lastBeatTime);   // Date.now() terms
            }
            requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
        animate();
    }

    window.__beatRead = (secs) => {
        const { date0, beat, detections } = window.__beat;
        // True onsets over the measured window, in Date.now() terms.
        const truth = [];
        for (let k = 0; k * beat < secs * 1000; k++) truth.push(date0 + k * beat);
        // Only score beats that fall inside the analysis window (skip warmup).
        const startMs = date0 + 1500;                       // let BPM lock first
        const trueBeats = truth.filter((t) => t >= startMs);
        const dets = detections.filter((t) => t >= startMs);

        // Greedy nearest-match within half a beat.
        const half = beat / 2;
        const usedDet = new Set();
        const latencies = [];
        let hits = 0;
        for (const tb of trueBeats) {
            let best = -1, bestD = half;
            for (let i = 0; i < dets.length; i++) {
                if (usedDet.has(i)) continue;
                const d = dets[i] - tb;
                if (d >= -half && d < bestD) { bestD = d; best = i; }
            }
            if (best >= 0) { usedDet.add(best); hits++; latencies.push(dets[best] - tb); }
        }
        const falsePos = dets.length - usedDet.size;
        const mean = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
        const variance = latencies.length
            ? latencies.reduce((a, b) => a + (b - mean) ** 2, 0) / latencies.length : 0;
        return {
            trueBeats: trueBeats.length, detected: dets.length, hits, falsePos,
            recall: trueBeats.length ? hits / trueBeats.length : 0,
            precision: dets.length ? hits / dets.length : 0,
            latencyMean: mean, latencyJitter: Math.sqrt(variance),
        };
    };
}

async function runScene(browser, name) {
    const scene = SCENES[name];
    console.log(`\n${name.toUpperCase()} — ${scene.label}`);
    console.log('cpu     fps  |  recall  precis |  latency  jitter |  true  det  miss  false');
    console.log('-'.repeat(76));
    for (const th of THROTTLES) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        if (th > 1) await page.emulateCPUThrottling(th);
        await neutralize(page);
        await page.goto('file://' + PAGE + '?profile=0', { waitUntil: 'load' });
        await page.evaluateOnNewDocument((d) => { window.__detector = d; }, DETECTOR);
        await page.evaluate((d) => { window.__detector = d; }, DETECTOR);
        await page.evaluate(installLoopCounter);
        await page.evaluate(installBeatProbe, BPM, scene);
        await new Promise((r) => setTimeout(r, SECS * 1000));
        const loops = await page.evaluate(() => window.__loop);
        const r = await page.evaluate((s) => window.__beatRead(s), SECS);
        r.fps = loops.rafTicks / SECS;
        await assertSingleLoop(page, name + ' cpu x' + th);
        await page.close();

        const pct = (x) => (x * 100).toFixed(0).padStart(4) + '%';
        console.log(
            '×' + String(th).padEnd(4) + String(Math.round(r.fps)).padStart(4) + '  | ' +
            pct(r.recall) + '   ' + pct(r.precision) + '  | ' +
            (r.latencyMean.toFixed(0) + 'ms').padStart(7) + '  ' +
            ('±' + r.latencyJitter.toFixed(0) + 'ms').padStart(6) + '  | ' +
            String(r.trueBeats).padStart(4) + String(r.detected).padStart(5) +
            String(r.trueBeats - r.hits).padStart(6) + String(r.falsePos).padStart(6)
        );
    }
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
    });

    console.log(`\nBEAT DETECTOR ACCURACY — detector="${DETECTOR}" — ${BPM} BPM, ${SECS}s per row`);
    console.log('ground truth = known kick onsets, matched within half a beat.');
    console.log('jitter is the "locked" number: low = tight, high = visuals swim.');

    for (const n of (SCENE === 'all' ? Object.keys(SCENES) : [SCENE])) {
        if (!SCENES[n]) { console.error('unknown scene:', n); continue; }
        await runScene(browser, n);
    }
    await browser.close();
    console.log('');
})();
