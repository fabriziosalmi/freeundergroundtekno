# TEKNOVER

Versioning per `freeundergroundtekno`.

```
MAJOR.MINOR.PATCH-PREVIEW
```

## Le tre dimensioni

### `MAJOR` (X.0.0) — **Edition**

Shift d'identità. Solo per cambi che alterano la natura del progetto:

- Cambio della creatura centrale (es. eye → eye-mask page-clip)
- Cambio di sorgente audio
- Rimozione o sostituzione di componenti dichiarati in `LAYERS.html`
- Architectural redesign

Ogni edition ha un **codename**: `Cosmonaut`, `Sound-System`, `Masquerade`, ...

### `MINOR` (1.X.0) — **Track**

Nuova primitiva audio-reattiva o nuovo VFX layer. Aggiunge meccanica.

Esempi storici (retrofit):
- `1.1.0` "Ritual" — ritualScore + bassCharge + sphere shading + motion extension

Ogni track ha un **codename breve** (una parola): `Ritual`, `Lens`, `Pulse`, `Eye`, `Shards`.

### `PATCH` (1.0.X) — **Mix**

Tweak parametri, bugfix, perf neutra-visiva, polish, micro-cambi.
Mai nuova primitiva (quello è Track / MINOR).

### `-PREVIEW` — **B-side**

Suffisso opzionale per WIP non audited: `-alpha`, `-rave`, `-dust`.

## Regole ferree

- ❌ Mai saltare livelli (no `1.0.9 → 1.2.0`)
- ❌ Mai tag senza GH release body
- ❌ Mai push senza green light esplicito
- ✅ Ogni release body **deve** includere:
  - **Headline** — una riga, vibe-led
  - **Tested with** — `artist — track @ bpm` (proof of audition)
  - **Levo / Aggiungo** — bullet list in italiano, autoriale
- ✅ Codename obbligatorio su MAJOR e MINOR

## Branch naming

- `l<edition>-<feature>` — feature branch, dove `<edition>` è il numero MAJOR corrente.
  Esempio: `l1-iris`, `l1-fisheye`, `l1-gaze`.

## Esempio release: v1.1.0 — Ritual

```
Headline: long-form ritual — la pupilla conta le battute, e brucia.
Tested with: FKY — Okupe @ 130 bpm
Levo: nulla
Aggiungo: ritualScore (0→16 su 128 bar), bassCharge meter, sphere shading,
          motion extension (no più tremarella), NaN safety, ambient baseline motion.
```
