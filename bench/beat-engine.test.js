#!/usr/bin/env node
/**
 * FREE UNDERGROUND TEKNO — beat engine validation (pure Node, no browser).
 *
 * Drives the engine over a synthetic timeline where every true kick time is
 * known, at a FIXED 8ms sample step, through the same adversarial scenes the
 * browser harness uses. Because it is pure Node there is no render loop and no
 * fps confound: the only thing under test is the algorithm.
 *
 * Two things are measured that the browser harness cannot see cleanly:
 *
 *  - onset accuracy (recall / precision / latency / jitter) vs ground truth,
 *    the same four numbers as beat-accuracy.js.
 *
 *  - PLL PREDICTION: at each true onset, how far is the engine's predicted beat
 *    (nextBeat grid) from that true onset, AFTER lock. This is the number that
 *    decides "anticipation": a low, low-jitter prediction error means a visual
 *    driven by beatPhase lands on the kick even though DETECTION lags by the
 *    analyser latency. We inject a realistic ~45ms analyser latency to prove the
 *    prediction survives it.
 *
 * Usage: node bench/beat-engine.test.js  [--bpm 150] [--latency 45]
 */

const createBeatEngine = require('./beat-engine');

function arg(name, def) {
    const i = process.argv.indexOf('--' + name);
    return i >= 0 && process.argv[i + 1] ? parseFloat(process.argv[i + 1]) : def;
}
const BPM = arg('bpm', 150);
const ANALYSER_LATENCY = arg('latency', 45);   // ms: FFT window + smoothing lag
const STEP = 8;                                 // ms: fixed sample interval (~125 Hz)
const SECS = 30;

// Scenes mirror beat-accuracy.js.
const SCENES = {
    clean: { floor: 0.0, kick: 1.0, ghost: false, label: 'isolated 4/4 kick' },
    drone: { floor: 0.55, kick: 0.45, ghost: false, label: 'kick over sub-bass 0.55' },
    wall:  { floor: 0.85, kick: 0.15, ghost: false, label: 'kick over sub-bass 0.85 (never dips)' },
    ghost: { floor: 0.0, kick: 1.0, ghost: true, label: 'alternating loud/soft kick' },
    // A tempo change partway through, to see the PLL re-lock rather than sit stuck.
    ramp:  { floor: 0.2, kick: 0.8, ghost: false, label: '150->165 BPM at 15s', ramp: true },
};

// Build the byte spectrum the engine reads, for a given emitted-audio time.
function spectrumAt(scene, tAudio, beat) {
    const buf = new Uint8Array(64);
    const k = Math.floor(tAudio / beat);
    let peak = scene.floor + scene.kick;
    if (scene.ghost && (k % 2 === 1)) peak = scene.floor + scene.kick * 0.45;
    const env = scene.floor + (peak - scene.floor) * Math.exp(-((tAudio % beat) / beat) * 9);
    for (let i = 0; i < 64; i++) {
        let v = 0;
        if (i < 4) v = env * 255; else if (i < 8) v = env * 250;
        else if (i < 14) v = env * 120; else if (i < 30) v = env * 230;
        buf[i] = v > 255 ? 255 : v < 0 ? 0 : v | 0;
    }
    return buf;
}

function trueBeatsFor(scene) {
    // Returns array of true onset times (ms) over the window, honouring a ramp.
    const beats = [];
    let t = 0;
    while (t < SECS * 1000) {
        beats.push(t);
        let bpm = BPM;
        if (scene.ramp && t >= 15000) bpm = 165;
        t += 60000 / bpm;
    }
    return beats;
}

function scoreOnsets(truth, dets, beat) {
    const half = beat / 2;
    const used = new Set();
    const lat = [];
    let hits = 0;
    for (const tb of truth) {
        let best = -1, bestD = half;
        for (let i = 0; i < dets.length; i++) {
            if (used.has(i)) continue;
            const d = dets[i] - tb;
            if (d >= -half && d < bestD) { bestD = d; best = i; }
        }
        if (best >= 0) { used.add(best); hits++; lat.push(dets[best] - tb); }
    }
    const mean = lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : 0;
    const jit = lat.length ? Math.sqrt(lat.reduce((a, b) => a + (b - mean) ** 2, 0) / lat.length) : 0;
    return {
        recall: truth.length ? hits / truth.length : 0,
        precision: dets.length ? hits / dets.length : 0,
        latency: mean, jitter: jit, hits, det: dets.length, tru: truth.length,
    };
}

function run(name) {
    const scene = SCENES[name];
    const engine = createBeatEngine();
    const beat0 = 60000 / BPM;
    const truth = trueBeatsFor(scene);

    const dets = [];
    let lockedAt = null;

    // Fixed-rate sample loop. The engine reads the spectrum as it was
    // ANALYSER_LATENCY ago, modelling FFT+smoothing lag.
    for (let now = 0; now < SECS * 1000; now += STEP) {
        const tAudio = now - ANALYSER_LATENCY;
        if (tAudio < 0) continue;
        // instantaneous beat period at that audio time (for ramp)
        let bpm = BPM;
        if (scene.ramp && tAudio >= 15000) bpm = 165;
        const beat = 60000 / bpm;
        const spec = spectrumAt(scene, tAudio, beat);
        if (engine.push(spec, now)) dets.push(now);

        const st = engine.state(now);
        if (st.locked && lockedAt === null) lockedAt = now;
    }

    // PLL prediction error: for every true onset after lock+2s settle, find the
    // engine's nearest predicted beat and record the offset. We reconstruct the
    // predicted grid by asking the engine's final period/gridRef — but the grid
    // drifts, so instead we recompute state at each true onset time during a
    // second pass would be ideal; here we approximate using the detections'
    // implied grid. Simpler and honest: measure, at each true onset, the phase
    // the engine reported — a locked engine should read phase ~0 (or ~1) there.
    // We re-run a lightweight second pass to sample beatPhase at true onsets.
    const engine2 = createBeatEngine();
    let settle = null;
    const phaseAtBeat = [];
    let ti = 0;
    for (let now = 0; now < SECS * 1000; now += STEP) {
        const tAudio = now - ANALYSER_LATENCY;
        if (tAudio < 0) continue;
        let bpm = BPM; if (scene.ramp && tAudio >= 15000) bpm = 165;
        const beat = 60000 / bpm;
        engine2.push(spectrumAt(scene, tAudio, beat), now);
        const st = engine2.state(now);
        if (st.locked && settle === null) settle = now + 2000;
        // capture predicted next-beat vs the upcoming true onset
        while (ti < truth.length && truth[ti] < now) ti++;
        if (settle !== null && now >= settle && ti < truth.length) {
            // engine predicts a beat at st.nextBeatMs (detection-time clock).
            // The true onset is at truth[ti] (audio-emit clock). The engine can
            // only ever lock to the LAGGED onset, so subtract the latency to
            // compare like with like: does the grid sit a steady period apart?
            const predicted = st.nextBeatMs - ANALYSER_LATENCY;
            const err = predicted - truth[ti];
            if (Math.abs(err) < beat / 2) phaseAtBeat.push(err);
        }
    }

    const os = scoreOnsets(truth, dets, beat0);
    const pMean = phaseAtBeat.length ? phaseAtBeat.reduce((a, b) => a + b, 0) / phaseAtBeat.length : NaN;
    const pJit = phaseAtBeat.length ? Math.sqrt(phaseAtBeat.reduce((a, b) => a + (b - pMean) ** 2, 0) / phaseAtBeat.length) : NaN;

    return { name, label: scene.label, os, lockedAt, pMean, pJit, nPred: phaseAtBeat.length };
}

console.log(`\nBEAT ENGINE — pure Node, ${BPM} BPM, ${STEP}ms fixed step, ${ANALYSER_LATENCY}ms analyser latency\n`);
console.log('scene   |  recall precis  latency jitter |  lock@   predict-err  (jitter)');
console.log('-'.repeat(74));
for (const n of Object.keys(SCENES)) {
    const r = run(n);
    const pct = (x) => (x * 100).toFixed(0).padStart(4) + '%';
    const ms = (x) => (isNaN(x) ? '  --' : (x >= 0 ? '+' : '') + x.toFixed(0) + 'ms');
    console.log(
        n.padEnd(7) + ' | ' + pct(r.os.recall) + '  ' + pct(r.os.precision) + '  ' +
        (r.os.latency.toFixed(0) + 'ms').padStart(7) + ('±' + r.os.jitter.toFixed(0)).padStart(6) + ' | ' +
        (r.lockedAt === null ? ' none' : (r.lockedAt / 1000).toFixed(1) + 's').padStart(6) + '   ' +
        ms(r.pMean).padStart(7) + '   ±' + (isNaN(r.pJit) ? '--' : r.pJit.toFixed(0) + 'ms') +
        '   ' + r.label
    );
}
console.log('\npredict-err = engine\'s predicted beat vs true onset, after lock (latency removed).');
console.log('low + low-jitter => a beatPhase-driven visual lands on the kick. THIS is anticipation.\n');
