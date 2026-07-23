/**
 * FREE UNDERGROUND TEKNO — beat engine.
 *
 * One object that owns the audio -> rhythm mapping: spectral-flux onset
 * detection, a self-calibrating threshold, and a phase-locked beat clock that
 * PREDICTS the next beat instead of only reacting to the last one.
 *
 * It is deliberately pure and DOM-free so it can be validated in Node against a
 * synthetic timeline (see beat-engine.test.js) where every true beat time is
 * known — the same discipline as the rest of bench/. This file is the source of
 * truth; docs/index.html inlines the SAME algorithm (the createBeatEngine body
 * below), minus this UMD wrapper and the doc comments. Keep the algorithm — the
 * onset math, the PLL update, reset(), and the cfg defaults — in sync across
 * both; the wrapper and comments are allowed to differ.
 *
 * Three properties, each measured, not assumed:
 *
 *  1. Onset, not level. flux = sum of POSITIVE spectral change over the kick
 *     bins. A kick riding a loud sustained bass still produces a flux spike
 *     (the level gate does not), and a soft kick produces one scaled to its own
 *     attack (a fixed level threshold misses it).
 *
 *  2. Fixed-rate, not per-frame. push() is meant to be called on a fixed
 *     interval independent of the render loop, and every time-constant is
 *     derived from the real dt, so the detector behaves the same at 30 fps and
 *     at 120 fps. This is what the render loop's frame rate must NOT change.
 *
 *  3. Locked, not chasing. A PLL tracks period and phase from the onsets and
 *     exposes a continuous beatPhase in [0,1). Visuals read the phase and can
 *     pre-roll into the beat, hiding both the analyser latency and their own
 *     spring rise-time — landing on the kick instead of after it.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.createBeatEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function createBeatEngine(opts) {
        opts = opts || {};
        var cfg = {
            // --- onset ---
            fluxBins: opts.fluxBins || 32,          // sub+body+punch, ~0-650 Hz at fftSize 2048
            refractoryMs: opts.refractoryMs || 110, // min gap between onsets (sharp, not the level gate's 200)
            thresholdK: opts.thresholdK || 2.0,     // fire when flux > mean + K*std
            fluxTauMs: opts.fluxTauMs || 1000,      // window of the adaptive flux statistics
            // --- PLL ---
            minPeriodMs: opts.minPeriodMs || 60000 / 200, // 200 BPM ceiling
            maxPeriodMs: opts.maxPeriodMs || 60000 / 80,  //  80 BPM floor
            phaseGain: opts.phaseGain || 0.10,      // grid phase correction per aligned onset
            periodGain: opts.periodGain || 0.05,    // period correction per aligned onset
            lockTolerance: opts.lockTolerance || 0.18, // |phase error| (fraction of a beat) counted as "on grid"
            confTauOnsets: opts.confTauOnsets || 8, // confidence EMA horizon, in onsets
        };

        // onset state
        var prevMag = new Float32Array(cfg.fluxBins);
        var havePrev = false;
        var fluxMean = 0, fluxVar = 0, fluxSeen = 0;
        var prevFlux = 0;
        var lastOnsetAt = -1e9;
        var lastPush = 0;

        // PLL state
        var period = 0;             // ms; 0 until bootstrapped
        var gridRef = 0;            // ms; time of one grid beat, the phase origin
        var confidence = 0;         // 0..1, EMA of how well onsets land on the grid
        var bootIntervals = [];     // inter-onset intervals collected before lock
        var lastOnsetForBoot = 0;

        function wrapPhaseErr(e) {
            // signed phase error in [-0.5, 0.5) beats
            e -= Math.round(e);
            return e;
        }

        function registerOnset(now) {
            // --- bootstrap the period from raw inter-onset intervals ---
            if (period === 0) {
                if (lastOnsetForBoot > 0) {
                    var iv = now - lastOnsetForBoot;
                    if (iv >= cfg.minPeriodMs && iv <= cfg.maxPeriodMs) {
                        bootIntervals.push(iv);
                        if (bootIntervals.length > 8) bootIntervals.shift();
                        if (bootIntervals.length >= 4) {
                            var s = bootIntervals.slice().sort(function (a, b) { return a - b; });
                            period = s[s.length >> 1];   // median
                            gridRef = now;               // lock phase to this onset
                            confidence = 0.3;
                        }
                    }
                }
                lastOnsetForBoot = now;
                return;
            }
            lastOnsetForBoot = now;

            // --- phase-locked correction ---
            // Where does this onset fall relative to the predicted grid?
            var beatsSinceRef = (now - gridRef) / period;
            var phaseErr = wrapPhaseErr(beatsSinceRef);   // [-0.5,0.5) beats
            var errMs = phaseErr * period;

            // Nudge the grid toward the onset (phase correction).
            gridRef += cfg.phaseGain * errMs;

            // Nudge the period using the fractional error's implied drift, but
            // only when the onset is genuinely near a beat — a hit landing near
            // the half-beat is a ghost/hat, not tempo information.
            if (Math.abs(phaseErr) < cfg.lockTolerance) {
                period += cfg.periodGain * errMs;
                if (period < cfg.minPeriodMs) period = cfg.minPeriodMs;
                if (period > cfg.maxPeriodMs) period = cfg.maxPeriodMs;
            }

            // Confidence: 1 when the onset is dead on grid, 0 at the tolerance edge.
            var aligned = Math.max(0, 1 - Math.abs(phaseErr) / cfg.lockTolerance);
            var a = 2 / (cfg.confTauOnsets + 1);
            confidence += a * (aligned - confidence);
        }

        return {
            /**
             * Feed one spectrum sample. `bytes` is the Uint8Array from
             * getByteFrequencyData; `now` is a monotonic ms clock. Returns true
             * if an onset fired on this sample. Call at a FIXED interval.
             */
            push: function (bytes, now) {
                // spectral flux over the kick region
                var f = 0, n = cfg.fluxBins;
                for (var i = 0; i < n; i++) {
                    var m = bytes[i] / 255;
                    if (havePrev) { var d = m - prevMag[i]; if (d > 0) f += d; }
                    prevMag[i] = m;
                }
                havePrev = true;
                f /= n;

                var fired = false;
                if (fluxSeen > 6) {
                    var std = Math.sqrt(fluxVar > 0 ? fluxVar : 0);
                    var thr = fluxMean + cfg.thresholdK * std;
                    // peak-pick: only the rising edge crossing the threshold
                    if (f > thr && f >= prevFlux && (now - lastOnsetAt) > cfg.refractoryMs) {
                        lastOnsetAt = now;
                        registerOnset(now);
                        fired = true;
                    }
                }

                // adaptive flux statistics — EMA over ~fluxTauMs, dt-aware so the
                // window is the same wall-clock length at any sample rate.
                var dt = lastPush ? (now - lastPush) : 8;
                lastPush = now;
                if (dt < 1) dt = 1; if (dt > 250) dt = 250;
                var alpha = 1 - Math.exp(-dt / cfg.fluxTauMs);
                var dm = f - fluxMean;
                fluxMean += alpha * dm;
                fluxVar += alpha * (dm * dm - fluxVar);
                prevFlux = f;
                if (fluxSeen <= 6) fluxSeen++;

                return fired;
            },

            /**
             * Current rhythm state at time `now`. beatPhase is the predicted
             * position within the beat: it reaches 1.0 exactly at the next
             * predicted kick, so a visual can pre-roll as it approaches 1.
             */
            state: function (now) {
                if (period === 0) {
                    return { locked: false, bpm: 0, period: 0, beatPhase: 0,
                             confidence: 0, nextBeatMs: 0, sinceBeat: 1 };
                }
                var beats = (now - gridRef) / period;
                var frac = beats - Math.floor(beats);      // [0,1) since last grid beat
                var nextBeatMs = gridRef + Math.ceil((now - gridRef) / period) * period;
                return {
                    locked: confidence > 0.5,
                    bpm: Math.round(60000 / period),
                    period: period,
                    beatPhase: frac,                        // 0 at beat, ->1 approaching next
                    confidence: confidence,
                    nextBeatMs: nextBeatMs,
                    sinceBeat: frac,
                };
            },

            /**
             * Clear all onset and PLL state. Call when the audio stops, so a later
             * restart does not inherit a stale grid — otherwise the next play would
             * report locked=true against a gridRef minutes in the past, giving an
             * arbitrary beatPhase until fresh onsets re-lock (~first bars).
             */
            reset: function () {
                havePrev = false;
                fluxMean = 0; fluxVar = 0; fluxSeen = 0; prevFlux = 0;
                lastOnsetAt = -1e9; lastPush = 0;
                period = 0; gridRef = 0; confidence = 0;
                bootIntervals = []; lastOnsetForBoot = 0;
                for (var i = 0; i < prevMag.length; i++) prevMag[i] = 0;
            },
        };
    }

    return createBeatEngine;
});
