# 🎵 Stream to YouTube - Node.js Service

Professional YouTube Live streaming for FreeTekno radio with independent audio/video capture and automated retry logic.

---

## 🚀 QUICK START

### 1. Install Dependencies

```bash
npm install
```

### 2. Get YouTube Stream Key

1. Go to **https://studio.youtube.com**
2. Click **Create** → **Go live**
3. Copy your **Stream key** (looks like: `xxxx-xxxx-xxxx-xxxx`)

### 3. Start Streaming

```bash
node stream-to-youtube.js -k "YOUR_STREAM_KEY_HERE"
```

**That's it!** ✅ Your stream is live on YouTube.

---

## 🏗️ ARCHITECTURE

Unlike screen capture which records everything (desktop UI, cursor, window bars), this service is **modular and clean**:

```
┌─────────────────────────────────────────────────┐
│  Puppeteer Browser (Headless)                   │
│  ↓                                              │
│  Loads FreeTekno page + starts autoplay         │
│  ↓                                              │
│  Page keeps audio/video effects in sync         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  FFmpeg Process (Video + Audio Capture)         │
│  ├─ Audio Input: HTTP stream URL                │
│  │  └─ Captures PCM audio directly              │
│  ├─ Video Input: Display/Screen                 │
│  │  └─ Captures browser window (no UI clutter)  │
│  └─ Muxer Output: RTMPS → YouTube               │
│     └─ H.264 video + AAC audio @ 2 Mbps        │
└─────────────────────────────────────────────────┘

Result: Clean stream of just the visualization + audio
```

### Why This Is Better Than Screen Capture

| Feature | Screen Capture | This Service |
|---------|---|---|
| Captures UI/Desktop | ❌ Yes (clutter) | ✅ No (clean) |
| Requires virtual display | ❌ Yes (Xvfb) | ✅ Mostly no |
| Audio from system | ❌ Unreliable | ✅ Direct from stream |
| Works headless | ❌ No | ✅ Yes |
| CPU usage | ❌ Higher | ✅ Lower |
| Portable | ❌ Platform-specific | ✅ Works everywhere |

---

## 📋 REQUIREMENTS

### System Requirements

- **Node.js**: 14+ (`node --version`)
- **FFmpeg**: (`ffmpeg -version`)
- **curl**: (`curl --version`)
- **Internet**: 2+ Mbps stable connection

### Installation

**macOS:**
```bash
brew install node ffmpeg
npm install  # Inside project directory
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install node ffmpeg
npm install
```

**Windows:**
- Download Node.js: https://nodejs.org
- Download FFmpeg: https://ffmpeg.org/download.html
- Run: `npm install`

---

## 🎯 USAGE

### Basic Streaming

```bash
node stream-to-youtube.js -k "xxxx-xxxx-xxxx-xxxx"
```

### With Custom Settings

```bash
# Different resolution and bitrate
node stream-to-youtube.js -k "xxxx" -r "1920x1080" -b "4500k"

# Different page URL (for testing)
node stream-to-youtube.js -k "xxxx" -u "http://localhost:8000/docs/"

# Test setup without streaming
node stream-to-youtube.js --dry-run
```

### All Options

```bash
-k, --stream-key KEY      YouTube Stream Key (required)
-u, --url URL             Page URL (default: http://listen.free-tekno.com)
-r, --resolution RES      Resolution (default: 1280x720)
-b, --bitrate BITS        Bitrate (default: 2000k)
--dry-run                 Check setup, don't stream
-h, --help                Show help
```

---

## ⚙️ CONFIGURATION

### Preset Configurations

**By Internet Speed:**

```bash
# Slow connection (< 5 Mbps)
node stream-to-youtube.js -k "xxxx" -b "1500k" -r "854x480"

# Standard connection (5-10 Mbps) ← RECOMMENDED
node stream-to-youtube.js -k "xxxx" -b "2000k" -r "1280x720"

# Fast connection (> 10 Mbps)
node stream-to-youtube.js -k "xxxx" -b "4500k" -r "1920x1080"
```

### Default Encoding Settings

The script is optimized for **2 Mbps / 720p** but you can customize:

**In the code (stream-to-youtube.js, around line 100):**

```javascript
// Video codec settings
'-preset', 'veryfast',    // ultrafast, superfast, veryfast, faster, fast, medium
'-crf', '18',             // Quality: 18=high, 23=medium, 28=low
'-maxrate', this.bitrate, // Maximum bitrate (default: 2000k)
'-g', '60',               // Keyframe interval (GOP)

// Audio codec settings
'-b:a', '192k',           // Audio bitrate
'-ar', '44100',           // Sample rate
```

**Quick Quality Tuning:**

| Setting | CPU Usage | Quality | Bitrate |
|---------|-----------|---------|---------|
| `preset ultrafast, crf 28` | Very Low | Good | ~1500k |
| `preset veryfast, crf 18` | Medium | High | ~2000k |
| `preset fast, crf 18` | High | Very High | ~2500k |

---

## 📊 MONITORING

### Check Logs During Streaming

**Terminal 1: Main script log**
```bash
tail -f youtube-stream.log
```

**Terminal 2: FFmpeg details**
```bash
tail -f /tmp/ffmpeg-stream.log
```

### Monitor on YouTube

Open **YouTube Studio** while streaming:

- Go to **Live content** → **Livestream settings**
- Watch the **Bitrate graph** (should be steady ~2000 kbps)
- Watch **FPS** (should stay at 30)
- Watch **Dropped frames** (should be 0)

### Expected Log Output

```
[INFO] 🔍 Checking requirements...
[SUCCESS] ✓ FFmpeg installed
[SUCCESS] ✓ curl installed
[SUCCESS] ✓ Stream Key validated
[INFO] Checking page: http://listen.free-tekno.com
[SUCCESS] ✓ Page is reachable
[INFO] 🌐 Launching headless browser...
[INFO] Loading: http://listen.free-tekno.com
[SUCCESS] ✓ Browser loaded and ready
[INFO] 🎬 Starting stream to YouTube...
```

---

## 🔧 TROUBLESHOOTING

### "Puppeteer not installed"
```bash
npm install
```

### "FFmpeg not found"
```bash
# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### "Page not reachable"
```bash
# Check if page is accessible
curl http://listen.free-tekno.com

# Test with local page
node stream-to-youtube.js -k "xxxx" -u "http://localhost:8000/docs/"
```

### "Invalid Stream Key"
- Copy the key **exactly** from YouTube Studio
- No spaces before/after
- Get a fresh key if needed: https://studio.youtube.com → Stream settings

### "Stream disconnects constantly"
1. Check internet stability: `ping youtube.com` (no packet loss)
2. Reduce bitrate: `-b "1500k"`
3. Reduce resolution: `-r "1024x576"`
4. Check firewall (port 1935 for RTMP)

### "No audio in stream"
**macOS:**
- System Preferences → Security & Privacy → Microphone
- Ensure browser has permission

**Linux:**
- Check PulseAudio: `pactl list short sources`
- Set: `export PULSE_SOURCE=default`

**Windows:**
- Control Panel → Sound → Recording
- Enable "Stereo Mix"

### "Video is laggy/distorted"
```bash
# Reduce quality
node stream-to-youtube.js -k "xxxx" -b "1500k" -r "1024x576"

# Or check CPU (should be < 70%)
# Close other heavy apps
```

### "Camera/Display not found (Linux)"
If you get "Unable to open display":

```bash
# Check your display
echo $DISPLAY
# Should show :0 or :1

# If not set, run:
export DISPLAY=:0
node stream-to-youtube.js -k "xxxx"
```

---

## 🛡️ SECURITY

### ⚠️ NEVER

```bash
# Don't save key in scripts
STREAM_KEY="xxxx"  # ❌ BAD

# Don't commit key to git
git add stream-to-youtube.js  # ❌ Will expose key!

# Don't share in emails/chat
```

### ✅ DO

```bash
# Use environment variable
export YOUTUBE_STREAM_KEY="xxxx-xxxx-xxxx-xxxx"
node stream-to-youtube.js -k "$YOUTUBE_STREAM_KEY"

# Or pass from secure source
KEY=$(cat ~/.youtube-key)  # Store in home directory
node stream-to-youtube.js -k "$KEY"

# If editing script locally, add to .gitignore
echo ".env" >> .gitignore
```

---

## 📱 RUNNING 24/7

### Using Screen (Detachable)

```bash
# Start session
screen -S freekno

# Inside screen, start streaming
node stream-to-youtube.js -k "$YOUTUBE_STREAM_KEY"

# Detach: Ctrl+A, then D

# Later, reattach:
screen -r freekno

# List sessions: screen -ls
```

### Using Tmux (Modern Alternative)

```bash
# Start in background
tmux new-session -d -s freekno 'node stream-to-youtube.js -k "$YOUTUBE_STREAM_KEY"'

# Check status
tmux ls

# Attach/view
tmux attach-session -t freekno
```

### Crontab (Auto-start)

```bash
# Edit crontab
crontab -e

# Add (starts every day at 8 PM)
0 20 * * * cd /path/to/freeundergroundtekno && YOUTUBE_STREAM_KEY="xxxx" node stream-to-youtube.js -k "$YOUTUBE_STREAM_KEY" >> youtube-cron.log 2>&1
```

---

## 🎯 PRODUCTION CHECKLIST

Before a long stream:

- [ ] Requirements installed: `node stream-to-youtube.js --dry-run`
- [ ] Stream key is correct (test with dry-run)
- [ ] Internet stable: `ping -c 10 youtube.com` (no packet loss)
- [ ] Audio working (check system sound)
- [ ] Browser can load page: `curl http://listen.free-tekno.com`
- [ ] FFmpeg working: `ffmpeg -version`
- [ ] Test 2-minute stream and check quality on YouTube
- [ ] Monitor bitrate graph (should be steady)
- [ ] Check for dropped frames (should be 0)

---

## 📚 COMPARISON: BASH vs NODE.JS SERVICE

| Feature | `youtube-stream.sh` | `stream-to-youtube.js` |
|---------|---|---|
| Display capture | ✅ Yes | ✅ Yes |
| Browser control | ❌ No | ✅ Puppeteer |
| Audio from stream | ✅ Yes | ✅ Yes |
| Windows support | ⚠️ Limited | ✅ Full |
| Installation | Simple (FFmpeg only) | Requires Node.js |
| Customization | Moderate | High |
| Error handling | Good | Excellent |
| Dependency count | 1 (FFmpeg) | 2 (Node.js, FFmpeg) |

**Choose Bash Script if:**
- You just want to screen-capture your existing desktop
- You prefer minimal dependencies
- You want the simplest setup

**Choose Node.js Service if:**
- You want clean, professional streams (no desktop clutter)
- You want programmatic control over the browser
- You need advanced error handling and retries
- You want to publish for other users to use

---

## 🆘 GETTING HELP

### Collect Debug Info

```bash
# System info
uname -a
node --version
npm --version

# FFmpeg version
ffmpeg -version

# Network check
curl -v https://studio.youtube.com

# Check logs
tail -30 youtube-stream.log
tail -30 /tmp/ffmpeg-stream.log
```

### Common Issues Checklist

1. Is Node.js installed? → `node --version`
2. Are dependencies installed? → `npm install`
3. Is FFmpeg installed? → `ffmpeg -version`
4. Is stream key valid? → Try `--dry-run`
5. Is page reachable? → `curl http://listen.free-tekno.com`
6. Is internet stable? → `ping youtube.com`

---

## 🎉 YOU'RE SET!

Your FreeTekno radio is now ready for professional YouTube streaming.

**Questions?** Check logs:
```bash
tail -f youtube-stream.log
```

Happy streaming! 🎵
