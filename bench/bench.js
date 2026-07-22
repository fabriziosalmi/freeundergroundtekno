#!/usr/bin/env node
/**
 * FREE UNDERGROUND TEKNO — deterministic render benchmark.
 *
 * Drives docs/index.html in headless Chrome with a *synthetic* analyser: no
 * radio stream, no network, no microphone. The spectrum is generated from a
 * scripted scene (4/4 wall, breakdown, silence, ...) so two runs of the same
 * scene feed the renderer byte-identical audio data. Math.random is replaced
 * with a seeded PRNG for the same reason. What is left varying between runs is
 * the thing we actually want to measure: how long a frame takes to draw.
 *
 * Usage:
 *   node bench/bench.js                          # all scenes, 12s each
 *   node bench/bench.js --scene wall --secs 20
 *   node bench/bench.js --throttle 6             # emulate a mid-range phone / LXC box
 *   node bench/bench.js --mobile --throttle 12   # 390x844@3x, low-end android
 *   node bench/bench.js --url 'stream=1'         # extra query params (STREAM_MODE)
 *   node bench/bench.js --ablate all --repeat 3  # per-layer cost sweep
 *   node bench/bench.js --json out.json          # machine-readable, for A/B diffs
 *   node bench/bench.js --compare base.json      # delta vs a previous run
 *
 * Reading the numbers:
 *   js/f    time inside animate(), from the page's own ?profile=1 profiler
 *   bg/f    drawProceduralBg() share of js/f
 *   style   RecalcStyleDuration per frame — driven by the ~70 .style writes/frame
 *   layout  LayoutDuration per frame — should be ~0 for a canvas scene
 *   task    total main-thread time per frame. This is the budget: 16.6ms at 60fps
 *   rAF     frames the loop manages per second (uncapped in headless)
 *   painted composited frames actually delivered to the capture pipe
 *
 * Run-to-run spread is about ±8%. Do not believe a smaller difference.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { neutralize, installLoopCounter, assertSingleLoop } = require('./harness');

const PAGE = path.join(__dirname, '..', 'docs', 'index.html');
const VIEWPORT = { width: 1920, height: 1080 };

// ---------------------------------------------------------------- CLI
function arg(name, def) {
    const i = process.argv.indexOf('--' + name);
    return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const OPT = {
    scene: arg('scene', null),
    throttle: parseFloat(arg('throttle', '1')),   // CPU slowdown: 1 = native, 6 ≈ mid-range phone
    mobile: process.argv.includes('--mobile'),
    secs: parseFloat(arg('secs', '12')),
    extraQuery: arg('url', ''),
    json: arg('json', null),
    compare: arg('compare', null),
    headful: process.argv.includes('--headful'),
    ablate: arg('ablate', null),
    repeat: parseInt(arg('repeat', '1'), 10),
};

// ---------------------------------------------------------------- ablations
// Hide a group of layers with CSS and re-measure. Nothing in the render loop
// changes: the JS still computes and still writes styles, so the delta isolates
// exactly what that group costs the browser in style/layout/paint/composite.
// `node bench/bench.js --ablate list` prints the groups.
const ABLATIONS = {
    none: '',
    bgcanvas: '#proceduralBg{display:none!important}',
    bgimage: '#background{display:none!important}',
    pupil: '#pupilCanvas,canvas#pupil{display:none!important}',
    rays: '#negativeLayer{display:none!important}',
    strobes: '.geo-strobe,#spatialStrobo,.spiral-vortex,#strobeFlash,#crowdStrobe,#bcFlash{display:none!important}',
    pulse: '#circlePulse,.speaker-flash{display:none!important}',
    confetti: '.distortion-zone,.warp-zone,.chroma-zone,.circular-strobo,.fractal-tear,' +
              '.silver-glow-particle,.spiral-whirl,.shimmer-twinkle{display:none!important}',
    dream: '#dreamLayer{display:none!important}',
    cssfx: '#vhsLines,#grainOverlay{display:none!important}',
};

// ---------------------------------------------------------------- scenes
// Each scene is a pure function (t seconds) -> band levels 0..1, evaluated
// inside the page to fill the 1024-bin Uint8Array the renderer reads.
const SCENES = {
    // Sustained 150 BPM wall with all three kick layers stacked: the worst case,
    // and the state the radio spends most of its time in.
    wall: { bpm: 150, kick: 1.0, hats: 0.75, lead: 0.55, label: '4/4 wall, 3-layer kick' },
    // Kick gone, mids/pads only — exercises the decay/spring paths and the
    // "pupil deflates" branches.
    breakdown: { bpm: 150, kick: 0.0, hats: 0.35, lead: 0.70, label: 'breakdown, no kick' },
    // Minimal 4/4: single kick layer, sparse top end.
    minimal: { bpm: 138, kick: 0.55, hats: 0.25, lead: 0.30, label: 'minimal, 1-layer kick' },
    // Dead air — should drop to the 10fps battery path.
    silence: { bpm: 0, kick: 0, hats: 0, lead: 0, label: 'silence (10fps cap path)' },
};

// ---------------------------------------------------------------- harness
// Injected into the page. Replaces the analyser and the RNG, then starts the
// render loop by hand (bypassing startAudio(), which needs a live stream).
function installHarness(scene, seed) {
    // Seeded PRNG (mulberry32) — identical random gates across runs.
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
        // Kick envelope: sharp attack, exponential decay over the beat.
        let kickEnv = 0;
        if (beat > 0 && scene.kick > 0) {
            const phase = (now % beat) / beat;
            kickEnv = Math.exp(-phase * 9) * scene.kick;
        }
        // Hats on the off-beat.
        let hatEnv = 0;
        if (beat > 0 && scene.hats > 0) {
            const phase = ((now + beat / 2) % (beat / 2)) / (beat / 2);
            hatEnv = Math.exp(-phase * 14) * scene.hats;
        }
        // Lead: slow LFO so mid-driven springs actually move.
        const leadEnv = scene.lead * (0.6 + 0.4 * Math.sin(now * 0.0011));

        for (let i = 0; i < BINS; i++) {
            let v = 0;
            if (i < 4) v = kickEnv * 255;                        // sub  30-65 Hz
            else if (i < 8) v = kickEnv * 250;                   // body 85-170 Hz
            else if (i < 14) v = kickEnv * 120;
            else if (i < 30) v = kickEnv * 230;                  // punch 300-650 Hz
            else if (i < 40) v = leadEnv * 120;
            else if (i < 120) v = leadEnv * 255;                 // mid band
            else if (i < 150) v = (leadEnv * 0.4 + hatEnv * 0.4) * 255;
            else if (i < 300) v = hatEnv * 255;                  // treble band
            else v = hatEnv * 90 * Math.max(0, 1 - (i - 300) / 500);
            buf[i] = v > 255 ? 255 : v < 0 ? 0 : v | 0;
        }
        return buf;
    }

    // The page declares these as top-level `let` bindings, which live in the
    // global lexical scope and are writable from here.
    analyser = {
        fftSize: 2048,
        frequencyBinCount: BINS,
        getByteFrequencyData(target) { target.set(fill()); },
    };
    dataArray = new Uint8Array(BINS);
    isPlaying = true;

    // Collect the profiler output ourselves rather than scraping console text.
    window.__bench = { samples: [] };
    const origLog = console.log;
    console.log = function (...a) {
        if (typeof a[0] === 'string' && a[0].includes('[PROFILE]')) {
            const m = /frame ([\d.]+)ms \(~(\d+) real fps\)\s+\|\s+bg ([\d.]+)ms\/f \(([\d.]+)ms ×(\d+)\)\s+\|\s+pupil ([\d.]+)ms\s+\|\s+rest ([\d.]+)ms\s+\|\s+skipped (\d+)/.exec(a[0]);
            if (m) window.__bench.samples.push({
                frame: +m[1], fps: +m[2], bgPerFrame: +m[3],
                bgPerCall: +m[4], bgCalls: +m[5], pupil: +m[6],
                rest: +m[7], skipped: +m[8],
            });
            return;
        }
        return origLog.apply(console, a);
    };

    animate();
}

// ---------------------------------------------------------------- stats
function stats(samples) {
    if (!samples.length) return null;
    const pick = (k) => samples.map((s) => s[k]).sort((a, b) => a - b);
    const med = (a) => a[Math.floor(a.length / 2)];
    const p95 = (a) => a[Math.min(a.length - 1, Math.floor(a.length * 0.95))];
    const f = pick('frame');
    return {
        n: samples.length,
        frameMed: med(f), frameP95: p95(f),
        bgMed: med(pick('bgPerFrame')),
        bgPerCall: med(pick('bgPerCall')),
        pupilMed: med(pick('pupil')),
        restMed: med(pick('rest')),
        fpsMed: med(pick('fps')),
    };
}

async function runScene(browser, name) {
    const scene = SCENES[name];
    const page = await browser.newPage();
    await page.setViewport(OPT.mobile ? { width: 390, height: 844, deviceScaleFactor: 3 } : VIEWPORT);
    if (OPT.throttle > 1) {
        // Emulate a slower CPU (phone, or the CPU-only LXC streamer box). This is
        // the only knob that makes the desktop numbers say anything about the
        // devices where the render loop actually struggles.
        await page.emulateCPUThrottling(OPT.throttle);
    }
    // Silence the app's own chatter; we only care about PROFILE lines.
    page.on('pageerror', (e) => console.error('  ! page error:', e.message));
    // Stop the page autoplaying into a second render loop. See harness.js.
    await neutralize(page);
    if (OPT.ablate && OPT.ablate !== 'none') {
        const css = ABLATIONS[OPT.ablate];
        if (css == null) { console.error('unknown ablation:', OPT.ablate); process.exit(1); }
        await page.evaluateOnNewDocument((c) => {
            document.addEventListener('DOMContentLoaded', () => {
                const st = document.createElement('style');
                st.textContent = c;
                document.head.appendChild(st);
            });
        }, css);
    }
    const q = '?profile=1' + (OPT.extraQuery ? '&' + OPT.extraQuery.replace(/^[?&]/, '') : '');
    await page.goto('file://' + PAGE + q, { waitUntil: 'load' });
    await page.evaluate(installLoopCounter);
    await page.evaluate(installHarness, scene, 0x1337beef);

    // Force real compositing. Without a screencast, headless Chrome records the
    // draw commands but never rasterizes the layer tree, so every CSS blur,
    // box-shadow and mask in the scene measures as free — which is exactly the
    // cost we are trying to see. The screencast is also the production path:
    // it is how stream-to-youtube.js captures frames.
    const cdp = await page.createCDPSession();
    let castFrames = 0;
    cdp.on('Page.screencastFrame', async (f) => {
        castFrames++;
        try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 30, everyNthFrame: 1 });

    // Warm-up window before we start counting browser-side work.
    await new Promise((r) => setTimeout(r, 1500));
    const m0 = await page.metrics();
    castFrames = 0;
    const castT0 = Date.now();
    await new Promise((r) => setTimeout(r, OPT.secs * 1000));
    const castFps = castFrames / ((Date.now() - castT0) / 1000);
    const m1 = await page.metrics();
    try { await cdp.send('Page.stopScreencast'); } catch {}
    const samples = await page.evaluate(() => window.__bench.samples);
    const loopRatio = await assertSingleLoop(page, 'scene ' + name);
    await page.close();
    // Drop the first sample: cold JIT + first-paint noise.
    const st = stats(samples.slice(1)) || stats(samples);
    if (st) {
        // Browser-side cost the in-page profiler cannot see: style recalc,
        // layout and paint driven by the ~70 element.style writes per frame.
        const wall = m1.Timestamp - m0.Timestamp;   // seconds
        const perFrame = (k) => ((m1[k] - m0[k]) / wall) * (1000 / st.fpsMed);
        st.styleMs = perFrame('RecalcStyleDuration');
        st.layoutMs = perFrame('LayoutDuration');
        st.taskMs = perFrame('TaskDuration');
        st.nodes = m1.Nodes;
        // Composited frames per second actually delivered to the capture pipe.
        // This is the number that decides whether the YouTube stream is smooth.
        st.castFps = castFps;
        st.loopRatio = loopRatio;
    }
    return st;
}

// Columns are space-separated on purpose: the output is meant to be piped
// through awk when sweeping, and glued numbers make that a trap.
function fmt(n) { return (n == null ? '--' : n.toFixed(2)).padStart(7) + ' '; }

const HEADER = 'scene           js/f    bg/f   pupil   style  layout    task |    rAF painted';

function row(label, r, suffix = '') {
    return label.padEnd(13) + fmt(r.frameMed) + fmt(r.bgMed) + fmt(r.pupilMed) +
           fmt(r.styleMs) + fmt(r.layoutMs) + fmt(r.taskMs) + '|' +
           fmt(r.fpsMed) + fmt(r.castFps) + suffix;
}

// Repeat a measurement and keep the best run per metric. Noise on a desktop is
// one-sided — background load can only ever make a run slower — so the minimum
// is a better estimator of the true cost than the mean. Measured run-to-run
// spread is about ±8%; treat anything smaller than that as no difference.
async function measure(browser, sceneName) {
    let best = null;
    for (let i = 0; i < OPT.repeat; i++) {
        const r = await runScene(browser, sceneName);
        if (!r) continue;
        if (!best) { best = r; continue; }
        for (const k of ['frameMed', 'bgMed', 'pupilMed', 'styleMs', 'layoutMs', 'taskMs']) {
            if (r[k] < best[k]) best[k] = r[k];
        }
        for (const k of ['fpsMed', 'castFps']) if (r[k] > best[k]) best[k] = r[k];
    }
    return best;
}

(async () => {
    if (OPT.ablate === 'list') {
        console.log('ablation groups:\n  ' + Object.keys(ABLATIONS).join('\n  ') + '\n  all  (sweep every group)');
        return;
    }
    if (!fs.existsSync(PAGE)) { console.error('page not found:', PAGE); process.exit(1); }
    const browser = await puppeteer.launch({
        headless: !OPT.headful,
        args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required',
               '--enable-gpu-rasterization', '--hide-scrollbars'],
    });

    const where = OPT.mobile ? '390x844@3x' : VIEWPORT.width + 'x' + VIEWPORT.height;
    console.log(`\nFREE UNDERGROUND TEKNO — render bench  (${where}, ${OPT.secs}s ×${OPT.repeat}` +
                `, cpu ×${OPT.throttle}${OPT.extraQuery ? ', ' + OPT.extraQuery : ''})\n`);

    const out = { viewport: where, secs: OPT.secs, repeat: OPT.repeat, cpu: OPT.throttle,
                  query: OPT.extraQuery, scenes: {}, ablations: {} };

    if (OPT.ablate === 'all') {
        // Cost of each layer group, on one scene. js/f is the control column: it
        // is pure JS and must NOT move between groups, since hiding an element
        // changes nothing the render loop computes. If it does move by more than
        // the noise floor, the machine was busy and the sweep is worthless.
        const scene = OPT.scene || 'wall';
        console.log(`layer ablation on scene "${scene}" — js/f is the control column\n`);
        console.log(HEADER);
        console.log('-'.repeat(HEADER.length));
        for (const a of Object.keys(ABLATIONS)) {
            OPT.ablate = a;
            const r = await measure(browser, scene);
            out.ablations[a] = r;
            if (r) console.log(row(a === 'none' ? 'none (base)' : a, r));
        }
    } else {
        console.log(HEADER);
        console.log('-'.repeat(HEADER.length));
        for (const n of (OPT.scene ? [OPT.scene] : Object.keys(SCENES))) {
            if (!SCENES[n]) { console.error('unknown scene:', n); continue; }
            const r = await measure(browser, n);
            out.scenes[n] = r;
            if (!r) { console.log(n.padEnd(13) + 'no samples (increase --secs)'); continue; }
            console.log(row(n, r, '  ' + SCENES[n].label));
        }
    }
    await browser.close();

    if (OPT.json) { fs.writeFileSync(OPT.json, JSON.stringify(out, null, 2)); console.log('\nwrote ' + OPT.json); }

    if (OPT.compare) {
        const base = JSON.parse(fs.readFileSync(OPT.compare, 'utf8'));
        const mine = Object.keys(out.ablations).length ? out.ablations : out.scenes;
        const theirs = Object.keys(base.ablations || {}).length ? base.ablations : base.scenes;
        console.log('\ndelta vs ' + OPT.compare + '  (negative = faster; |Δ| under 8% is noise)\n');
        console.log('name              js/frame          task/frame');
        console.log('-'.repeat(50));
        const d = (x, y) => {
            const abs = y - x, pct = x ? (abs / x) * 100 : 0;
            return ((abs >= 0 ? '+' : '') + abs.toFixed(2) + 'ms (' +
                    (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%)').padEnd(18);
        };
        for (const n of Object.keys(mine)) {
            const a = theirs[n], b = mine[n];
            if (!a || !b) continue;
            console.log(n.padEnd(14) + d(a.frameMed, b.frameMed) + d(a.taskMs, b.taskMs));
        }
    }
    console.log('');
})();
