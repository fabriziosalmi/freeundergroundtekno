# 🎵 RAVE FRAMEWORK

**Modular VJ Framework for Audio-Reactive Visuals**

A professional, extensible framework for creating real-time audio-reactive visuals for raves, live performances, and VJ sessions.

---

## 🌟 Features

- **Modular Architecture**: Mix and match components to create custom scenes
- **Advanced Audio Analysis**: 6 frequency bands + 12 audio metrics + beat detection
- **Component System**: Reusable visual building blocks
- **Preset System**: Save and load scene configurations (JSON)
- **Real-time Performance**: Optimized for 60fps live visuals
- **Professional Tools**: Export/import, scene management, performance stats

---

## 📁 Project Structure

```
rave-framework/
├── engine/                      # Core audio and rendering engine
│   ├── AudioAnalyzer.js        # Audio analysis (FFT, beat detection, metrics)
│   └── ComponentManager.js     # Component lifecycle management
├── components/                  # Visual components
│   ├── BaseComponent.js        # Abstract base class
│   └── SpeakerComponent.js     # Cyberpunk speaker (from video-final.html)
├── effects/                     # Post-processing effects
│   └── (coming soon)
├── presets/                     # Scene configurations (JSON)
│   └── (add your custom presets here)
├── assets/                      # Images, videos, sprites
│   └── (add your media files here)
└── example-scene.html          # Working example with 3 presets
```

---

## 🚀 Quick Start

1. **Open the example**:
   ```
   Open: rave-framework/example-scene.html
   ```

2. **Click START** to begin audio analysis

3. **Try the presets**:
   - **Sound System**: Full stereo stack (12 speakers, 6 frequencies × 2 channels)
   - **Minimal**: Single bass speaker
   - **Chaos Mode**: 20 random speakers

4. **Customize**: Add/remove components, export your config

---

## 🎛️ Core Components

### AudioAnalyzer
Advanced audio analysis engine with:
- **6 Frequency Bands**: Sub Bass, Bass, Low Mid, Mid, High Mid, Treble
- **Audio Metrics**: Peak, RMS, Energy, Spectral Centroid, Brightness, Warmth, Punch, etc.
- **Beat Detection**: Kick, snare, hihat detection
- **Onset Detection**: Sudden audio changes

**Usage**:
```javascript
const analyzer = new AudioAnalyzer({ fftSize: 2048, smoothing: 0.8 });
await analyzer.init(audioURL);
analyzer.analyze();
const data = analyzer.getData(); // { bands, metrics, beat, onset }
```

### ComponentManager
Manages component lifecycle, updates, and rendering:

**Usage**:
```javascript
const manager = new ComponentManager(container);
manager.registerType('SpeakerComponent', SpeakerComponent);
manager.addComponent('SpeakerComponent', { 
    speakerType: 'bass', 
    x: 500, 
    y: 300 
});
manager.update(audioData, deltaTime);
manager.render(audioData);
```

### BaseComponent
Abstract base class for all visual components:
- Position, scale, rotation, opacity
- Audio reactivity mapping (automatic frequency → visual property mapping)
- Smooth interpolation
- Export/import configuration

### SpeakerComponent
Cyberpunk-style audio-reactive speaker:
- **6 Types**: Subwoofer, Bass, Low Mid, Mid, High Mid, Tweeter
- **Stereo Channels**: Left, Right, Mono
- **Visual Effects**: Scale, rotation, glow, color intensity based on audio
- **Customizable**: Size, colors, reactivity parameters

---

## 🎨 Creating Custom Components

1. **Extend BaseComponent**:
```javascript
class MyComponent extends BaseComponent {
    constructor(id, config) {
        super(id, config);
        // Custom properties
    }
    
    createElement() {
        // Create DOM structure
        this.element = document.createElement('div');
        this.applyBaseStyles();
        // Add custom styling
    }
    
    update(audioData, deltaTime) {
        super.update(audioData, deltaTime);
        // Custom update logic
    }
    
    render(audioData) {
        // Custom render logic
    }
}
```

2. **Register with ComponentManager**:
```javascript
componentManager.registerType('MyComponent', MyComponent);
```

3. **Add instances**:
```javascript
componentManager.addComponent('MyComponent', { x: 500, y: 300 });
```

---

## 🎵 Audio Mapping

Components automatically map audio data to visual properties:

```javascript
{
    audioMapping: {
        enabled: true,
        band: 'bass',           // subBass, bass, lowMid, mid, highMid, treble
        metric: 'value',        // value, peak, average
        property: 'scale',      // scale, rotation, opacity, x, y
        min: 1,                 // minimum output value
        max: 2,                 // maximum output value
        multiplier: 1,          // scale the mapped value
        offset: 0,              // add constant offset
        smoothing: 0.1          // interpolation speed (0-1)
    }
}
```

**Example**: Bass frequency controls speaker scale from 1x to 2x:
```javascript
const speaker = manager.addComponent('SpeakerComponent', {
    speakerType: 'bass',
    audioMapping: {
        band: 'bass',
        property: 'scale',
        min: 1,
        max: 2,
        smoothing: 0.2
    }
});
```

---

## 💾 Presets System

### Export Configuration
```javascript
const config = componentManager.exportConfig();
// Save to file or localStorage
```

### Import Configuration
```javascript
componentManager.importConfig(config);
```

### Preset Format (JSON)
```json
{
    "components": [
        {
            "id": "speaker_bass_1",
            "type": "SpeakerComponent",
            "config": {
                "speakerType": "bass",
                "channel": "left",
                "x": 400,
                "y": 300,
                "size": 180
            }
        }
    ],
    "updateOrder": ["speaker_bass_1"]
}
```

---

## 📊 Performance Stats

Real-time monitoring:
- **FPS**: Current frame rate
- **Component Count**: Active components
- **Update Time**: Component update duration (ms)
- **Render Time**: Rendering duration (ms)
- **Beat Detection**: Current beat status

---

## 🎯 Roadmap

### Phase 1: Core (COMPLETED ✅)
- [x] Audio Analyzer
- [x] Component Manager
- [x] Base Component
- [x] Speaker Component
- [x] Example Scene
- [x] Documentation

### Phase 2: More Components (NEXT)
- [ ] ParticleComponent (optimized particle system)
- [ ] LaserComponent (beam effects)
- [ ] ShapeComponent (geometric shapes)
- [ ] TextComponent (animated text/logo)
- [ ] ImageComponent (sprite with effects)
- [ ] VideoComponent (reactive video player)

### Phase 3: Effects
- [ ] GlitchEffect (RGB split, data mosh)
- [ ] BlurEffect (motion, radial, zoom)
- [ ] FeedbackEffect (video echo/trail)
- [ ] ColorEffect (hue, saturation, brightness)
- [ ] KaleidoscopeEffect
- [ ] DistortionEffect

### Phase 4: Tools
- [ ] Visual Editor (drag-drop GUI)
- [ ] Player Mode (fullscreen, hotkeys)
- [ ] Asset Manager
- [ ] Scene Transitions
- [ ] MIDI Controller Support
- [ ] OSC Support

---

## 🎤 Professional Use

Created by a rave DJ/VJ with 20 years of radio experience. Designed for:
- **Live VJ Sets**: Real-time visuals synced to music
- **Radio Streaming**: Audio-reactive visuals for online streams
- **Music Production**: Visual feedback during mixing/mastering
- **Rave Events**: Underground freetekno aesthetic
- **Club Nights**: Professional VJ performances

---

## 🔧 Technical Details

### Audio Analysis
- **FFT Size**: 2048 (configurable)
- **Frequency Range**: 20Hz - 20kHz
- **Band Ranges**:
  - Sub Bass: 0-10 bins (20-60Hz)
  - Bass: 10-40 bins (60-250Hz)
  - Low Mid: 40-70 bins (250-500Hz)
  - Mid: 70-150 bins (500-2kHz)
  - High Mid: 150-250 bins (2-4kHz)
  - Treble: 250-512 bins (4-20kHz)

### Performance
- **Target**: 60fps at 1080p
- **Optimization**: Pure CSS transforms (no canvas particles in speaker component)
- **Smooth Interpolation**: Lerp with configurable smoothing
- **Memory**: Minimal garbage collection

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial (Web Audio API quirks)

---

## 📝 License

MIT License - Free to use, modify, and distribute

---

## 🤝 Contributing

Want to add more components or effects? Fork and create your own modules following the BaseComponent pattern!

---

## 📧 Contact

Created for the underground freetekno rave scene 🎉

**Audio Stream**: https://radio.freeundergroundtekno.org/

---

## 🎨 Examples

### Sound System Scene (Default)
Full stereo visualization with 12 speakers (6 frequencies × 2 channels):
- Left stack: Tweeter → High Mid → Mid → Low Mid → Bass → Sub
- Right stack: Tweeter → High Mid → Mid → Low Mid → Bass → Sub
- Each speaker reacts to its specific frequency range
- Stereo channel offset creates visual separation

### Minimal Scene
Single large bass speaker in center - perfect for bass-heavy tekno

### Chaos Mode
20 random speakers scattered across screen - visual madness!

---

**Have fun and keep the underground alive! 🔊🎵**
