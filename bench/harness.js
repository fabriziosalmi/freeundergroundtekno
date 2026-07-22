/**
 * Shared page preparation for the bench harnesses.
 *
 * docs/index.html tries to autoplay on load (see the `window.addEventListener
 * ('load', ...)` block near the liveToggle wiring). For a measurement run that
 * is actively harmful, in two ways:
 *
 *   1. startAudio() ends with its own animate() call. The harness also starts
 *      animate() by hand, so the page ends up with TWO independent rAF chains
 *      driving the same renderer. Every frame is rendered twice, and because
 *      the two calls land back to back inside one vsync, `frameScale` — which
 *      is just (time since the previous animate call) / 16.6667 — collapses
 *      toward zero. Motion freezes and every frameScale-dependent term reads a
 *      meaningless value.
 *   2. It fetches the live radio over the network, so the run depends on the
 *      internet and on whatever is playing at the time.
 *
 * neutralize() stubs startAudio before the load event can fire and blocks the
 * stream at the network layer. assertSingleLoop() then verifies, from inside
 * the page, that exactly one animate() call happens per animation frame — the
 * check that would have caught this immediately.
 */

const AUDIO_HOST = 'radio.freeundergroundtekno.org';

async function neutralize(page) {
    // Kill the autoplay path. evaluateOnNewDocument runs before any page
    // script; DOMContentLoaded fires after the inline <script> has defined
    // startAudio but before the 'load' handler that calls it.
    await page.evaluateOnNewDocument(() => {
        document.addEventListener('DOMContentLoaded', () => {
            window.startAudio = async function benchStubbedStartAudio() {};
        });
    });

    // Belt and braces: no radio traffic at all, so a run never depends on the
    // network or on what happens to be playing.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.url().includes(AUDIO_HOST)) req.abort().catch(() => {});
        else req.continue().catch(() => {});
    });
}

/**
 * Instrument animate() and report calls-per-animation-frame. Must be called
 * from inside page.evaluate BEFORE the harness starts its own animate() loop.
 */
function installLoopCounter() {
    window.__loop = { animateCalls: 0, rafTicks: 0 };
    const orig = animate;
    animate = function () { window.__loop.animateCalls++; return orig.apply(this, arguments); };
    const tick = () => { window.__loop.rafTicks++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
}

/**
 * Read the counter back and throw if more than one render loop is running.
 * A ratio near 1.0 is correct. 2.0 means two rAF chains, which silently
 * doubles the measured cost and corrupts frameScale.
 */
async function assertSingleLoop(page, label) {
    const l = await page.evaluate(() => window.__loop);
    if (!l || !l.rafTicks) return null;
    const ratio = l.animateCalls / l.rafTicks;
    if (ratio > 1.5) {
        throw new Error(
            `${label}: ${ratio.toFixed(2)} animate() calls per animation frame — ` +
            `more than one render loop is running, so these numbers are invalid.`
        );
    }
    return ratio;
}

module.exports = { neutralize, installLoopCounter, assertSingleLoop };
