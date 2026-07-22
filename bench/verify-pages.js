#!/usr/bin/env node
/**
 * Load every published page and assert nothing 404s.
 *
 * The pages reference assets three different ways — <script src>, CSS url(),
 * and paths built in JS (`images/${i}.webp`) — and only the browser resolves
 * all three. A static grep over the sources misses the JS-built ones, which is
 * exactly the class of reference an asset cleanup is most likely to break.
 *
 * Radio traffic is blocked and the autoplay path stubbed (see harness.js), so
 * this checks asset wiring, not the stream.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const { neutralize } = require('./harness');

const DOCS = path.join(__dirname, '..', 'docs');
const PAGES = ['index.html', 'radio/index.html', 'video/index.html', 'rave-framework/example-scene.html'];

// radio-logo-pulse.js probes for a .webp logo and falls back to .png on error.
// That miss is by design, not a broken reference.
const EXPECTED_MISSES = [/images\/logo\.webp$/];

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
    });
    let failed = 0;

    for (const rel of PAGES) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        const misses = [];
        const errors = [];
        page.on('requestfailed', (r) => {
            const u = r.url();
            if (u.includes('radio.freeundergroundtekno.org')) return;   // blocked on purpose
            if (u.startsWith('http')) return;                            // CDNs, offline runs
            misses.push(u);
        });
        page.on('response', (r) => {
            if (r.status() >= 400 && !r.url().startsWith('http')) misses.push(r.url());
        });
        page.on('pageerror', (e) => errors.push(e.message));

        await neutralize(page);
        await page.goto('file://' + path.join(DOCS, rel), { waitUntil: 'load' });
        // Let JS-built asset requests (slideshow frames, logo probe) actually fire.
        await new Promise((r) => setTimeout(r, 4000));

        // index.html only requests its dream images when a flash fires, which is
        // a rare random event — so waiting would leave 18 paths unexercised and
        // the check would pass with them broken. Request them explicitly instead.
        const lazy = await page.evaluate(async () => {
            if (typeof dreamImagePaths === 'undefined') return null;
            const results = await Promise.all(dreamImagePaths.map((p) => new Promise((res) => {
                const im = new Image();
                im.onload = () => res(null);
                im.onerror = () => res(p);
                im.src = p;
            })));
            return results.filter(Boolean);
        }).catch(() => null);
        if (lazy && lazy.length) misses.push(...lazy.map((p) => 'dreamImagePaths: ' + p));

        await page.close();

        const real = misses.filter((u) => !EXPECTED_MISSES.some((re) => re.test(u)));
        const expected = misses.length - real.length;
        const ok = real.length === 0 && errors.length === 0;
        if (!ok) failed++;
        console.log(`${ok ? 'ok  ' : 'FAIL'}  ${rel.padEnd(38)} ` +
            `${real.length} missing, ${errors.length} js errors` +
            (expected ? `  (${expected} expected miss)` : ''));
        for (const u of real.slice(0, 8)) console.log('        missing: ' + u.replace('file://' + DOCS, ''));
        for (const e of errors.slice(0, 4)) console.log('        error:   ' + e.slice(0, 120));
    }

    await browser.close();
    console.log(failed ? `\n${failed} page(s) broken\n` : '\nall pages resolve every asset\n');
    process.exit(failed ? 1 : 0);
})();
