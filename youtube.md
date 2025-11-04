# 📡 YouTube Live Streaming Guide - FREE UNDERGROUND TEKNO

Stream the FreeTekno radio visualization to YouTube at **2 Mbps / 1280x720** for consistent, high-quality broadcasting.

---

## 🚀 QUICK START (5 minutes)

### 1. Get Your YouTube Stream Key

1. Go to **https://studio.youtube.com**
2. Click **Create** → **Go live**
3. Click **Stream settings** in the left menu
4. Copy your **Stream key** (looks like: `xxxx-xxxx-xxxx-xxxx`)
5. **🔐 Never share this key!**

### 2. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
- Download: https://ffmpeg.org/download.html
- Or use Chocolatey: `choco install ffmpeg`

### 3. Start Streaming

```bash
cd /Users/fab/GitHub/freeundergroundtekno

# Stream with your key
./youtube-stream.sh -k "YOUR_STREAM_KEY_HERE"
```

**Done!** ✅ Your stream is live at YouTube Studio.

---

## 📋 SETTINGS FOR CONSISTENT 2 MBPS / 720P

### Resolution & Bitrate

The script is configured for reliable 720p streaming:

| Setting | Value |
|---------|-------|
| **Resolution** | 1280×720 (720p) |
| **Bitrate** | 2000 kbps (2 Mbps) |
| **Encoding Speed** | veryfast |
| **Frame Rate** | 30 fps |
| **Audio** | 192 kbps AAC @ 44.1kHz |

### Why These Settings?

- **1280×720**: Perfect balance between quality and bandwidth (vs 1080p which needs 3.5-4.5 Mbps)
- **2 Mbps**: Reliable on most internet connections (typically 10+ Mbps available)
- **veryfast**: Lower CPU usage, stable on all devices
- **30 fps**: Smooth motion, lower bitrate than 60fps

---

## ⚙️ MANUAL SETUP (If You Need Different Settings)

### Edit the Script

Open `youtube-stream.sh` in your editor and find these lines (around line 186-195):

```bash
ffmpeg \
    -rtbufsize 100M \
    $display_config \
    $audio_config \
    -c:v libx264 \
    -preset veryfast \        # ← Encoding speed
    -crf 18 \                 # ← Quality (18=high, 23=medium, 28=low)
    -maxrate 2000k \          # ← MAX BITRATE (2 Mbps)
    -bufsize 4000k \          # ← Buffer (2x maxrate)
    -s 1280x720 \             # ← RESOLUTION
    -g 60 \                   # ← Keyframe interval (30fps × 2)
    -c:a aac \
    -b:a 192k \               # ← Audio bitrate
    -ar 44100 \
    -f flv \
    "${YOUTUBE_RTMP_URL}/${STREAM_KEY}" \
    -loglevel warning \
    2>> "$FFMPEG_LOG"
```

### Adjusting Settings

**Lower Bitrate (Slower Connection):**
```bash
-maxrate 1500k        # 1.5 Mbps
-bufsize 3000k
```

**Higher Bitrate (Better Quality):**
```bash
-maxrate 3500k        # 3.5 Mbps (for 1080p)
-bufsize 7000k
-s 1920x1080          # Full HD
```

**Faster Encoding (Lower CPU):**
```bash
-preset ultrafast     # Much lower CPU, slightly lower quality
```

---

## 🎯 MONITORING YOUR STREAM

### Check Stream Status in Real-Time

```bash
# Terminal 1: Watch logs
tail -f youtube-stream.log

# Terminal 2: Watch FFmpeg output
tail -f /tmp/ffmpeg-stream.log
```

### Check Bitrate on YouTube

1. Open YouTube Studio
2. Go to **Stream settings** → **Live content**
3. Watch the **Bitrate graph** and **FPS**
4. Should see:
   - ✅ Bitrate: ~2000 kbps
   - ✅ FPS: 30 fps (stable)
   - ✅ Audio present
   - ✅ No frame drops

### Network Monitoring

On another terminal, check actual connection:

```bash
# macOS
netstat -an | grep 1935

# Linux
ss -an | grep 1935

# Check bandwidth usage
# macOS: Activity Monitor → Network
# Linux: nethogs
```

---

## 🔧 COMMAND-LINE OPTIONS

```bash
./youtube-stream.sh [OPTIONS]

OPTIONS:
  -k, --stream-key KEY    YouTube Stream Key (required)
  -u, --url URL          Page URL (default: http://listen.free-tekno.com)
  -d, --dry-run          Test connection without streaming
  -h, --help             Show help
```

### Examples

```bash
# Standard streaming
./youtube-stream.sh -k "xxxx-xxxx-xxxx-xxxx"

# Test connection first (no actual stream)
./youtube-stream.sh -d

# Custom URL
./youtube-stream.sh -k "xxxx" -u "http://localhost:8000/docs/"

# Using environment variable (more secure)
export YOUTUBE_STREAM_KEY="xxxx-xxxx-xxxx-xxxx"
./youtube-stream.sh -k "$YOUTUBE_STREAM_KEY"
```

---

## 🛡️ SECURITY TIPS

### ❌ DON'T DO THIS
```bash
# Don't save key in plain text
echo "STREAM_KEY=xxxx" > config.txt

# Don't commit to git
git add youtube-stream.sh  # Will expose key!

# Don't share in chat/email
```

### ✅ DO THIS
```bash
# Use environment variable
export YOUTUBE_STREAM_KEY="xxxx-xxxx-xxxx-xxxx"
./youtube-stream.sh -k "$YOUTUBE_STREAM_KEY"

# Or add to .bashrc/.zshrc (local machine only)
echo 'export YOUTUBE_STREAM_KEY="xxxx"' >> ~/.zshrc

# If you edit the script file, add to .gitignore
echo "# Don't commit stream keys" >> .gitignore
```

---

## 🚨 TROUBLESHOOTING

### "FFmpeg not found"
```bash
# Install FFmpeg
brew install ffmpeg          # Mac
sudo apt install ffmpeg      # Linux
```

### "Stream key invalid"
- Verify you copied it **exactly** from YouTube Studio
- No extra spaces
- Get a fresh key from https://studio.youtube.com if needed

### "Connection refused"
- Check your internet connection
- Test: `curl http://listen.free-tekno.com`
- Wait 10 seconds and retry (YouTube has rate limiting)

### "No audio"
**macOS:**
- System Preferences → Security & Privacy → Microphone
- Make sure FreeTekno page has permission

**Linux:**
- Check PulseAudio: `pactl list short sources`
- Set: `export PULSE_SOURCE=default`

**Windows:**
- Control Panel → Sound → Recording
- Enable "Stereo Mix"

### "Video is lagging/distorted"
1. Reduce bitrate: `-maxrate 1500k`
2. Reduce resolution: `-s 1024x576` (instead of 1280x720)
3. Use faster encoding: `-preset ultrafast`
4. Close other programs to free CPU

### "Stream disconnects randomly"
- Script auto-retries up to 10 times with exponential backoff
- If still disconnecting:
  - Check internet stability: `ping youtube.com`
  - Restart your router
  - Use wired connection if possible
  - Check firewall (port 1935 for RTMP)

---

## 📱 RUNNING 24/7 STREAMS

### Using Screen (Detachable Session)

```bash
# Start streaming in background
screen -S fretekno-stream
./youtube-stream.sh -k "xxxx-xxxx-xxxx-xxxx"

# Detach: Ctrl+A, then D
# Later, reattach: screen -r freekno-stream
# List sessions: screen -ls
```

### Using Tmux (More Modern)

```bash
# Start in background
tmux new-session -d -s freekno './youtube-stream.sh -k "xxxx-xxxx-xxxx-xxxx"'

# List: tmux ls
# Attach: tmux attach-session -t freekno
# View logs: tmux capture-pane -t freekno -p
```

### Automatic Start with Crontab

```bash
# Edit crontab
crontab -e

# Add line (starts every day at 8 PM)
0 20 * * * cd /Users/fab/GitHub/freeundergroundtekno && ./youtube-stream.sh -k "$YOUTUBE_STREAM_KEY" >> youtube-cron.log 2>&1
```

---

## 📊 OPTIMAL SETTINGS BY INTERNET SPEED

### Slow Connection (< 5 Mbps)
```bash
-maxrate 1000k        # 1 Mbps
-s 854x480            # 480p
-preset ultrafast
```

### Standard Connection (5-10 Mbps)
```bash
-maxrate 2000k        # 2 Mbps ← RECOMMENDED
-s 1280x720           # 720p   ← RECOMMENDED
-preset veryfast
```

### Fast Connection (> 10 Mbps)
```bash
-maxrate 4500k        # 4.5 Mbps
-s 1920x1080          # 1080p
-preset fast
```

---

## 🎨 TIPS FOR BEST QUALITY

### 1. Test Before Going Live

```bash
# Do a 2-minute test stream
./youtube-stream.sh -k "xxxx-xxxx-xxxx-xxxx"
# Let it run for ~2 minutes
# Ctrl+C to stop
# Check YouTube for quality (bitrate graph, audio, artifacts)
```

### 2. Optimal Environment

- **Lighting**: Good, stable lighting (consistent colors)
- **Screen**: Keep display on (some systems turn off screen during streaming)
- **Network**: Use wired connection if possible (WiFi less stable)
- **CPU**: Close heavy apps (browsers, video editors, games)

### 3. Monitor During Stream

Keep YouTube Studio open in another window:
- Watch **Bitrate graph** (should be steady around 2000 kbps)
- Watch **FPS** (should stay at 30)
- Watch **Dropped frames** (should be 0)

---

## 🛑 STOPPING THE STREAM

### Normal Stop

```bash
# In the terminal where it's running, press:
Ctrl+C

# Or from another terminal:
pkill -f "youtube-stream.sh"
```

### Check It Stopped

```bash
ps aux | grep youtube-stream
# Should see nothing (except grep itself)
```

---

## 📄 LOG FILES

The script creates detailed logs for troubleshooting:

```bash
# Main script log
tail -50 youtube-stream.log

# FFmpeg detailed log
tail -50 /tmp/ffmpeg-stream.log

# Continuous monitoring
tail -f youtube-stream.log /tmp/ffmpeg-stream.log
```

---

## 🎯 PRODUCTION CHECKLIST

Before a long stream, verify:

- [ ] Stream key is correct (test with dry-run: `./youtube-stream.sh -d`)
- [ ] Internet connection is stable (`ping -c 10 youtube.com`)
- [ ] FFmpeg is installed and working (`ffmpeg -version`)
- [ ] Audio is captured (check system audio settings)
- [ ] Video resolution is correct (1280×720)
- [ ] Bitrate is stable (~2000 kbps on YouTube Studio)
- [ ] No dropped frames
- [ ] Test stream looks good before going live

---

## 🆘 GETTING HELP

### Debug Information to Collect

If something goes wrong, gather:

```bash
# Your system info
uname -a

# FFmpeg version
ffmpeg -version

# Network info
curl -I https://studio.youtube.com

# Last 50 lines of logs
tail -50 youtube-stream.log
tail -50 /tmp/ffmpeg-stream.log
```

### Common Issues Checklist

1. **Is FFmpeg installed?** → `ffmpeg -version`
2. **Is the stream key valid?** → Try with `-d` (dry-run)
3. **Is the page reachable?** → `curl http://listen.free-tekno.com`
4. **Is audio working?** → Check system preferences
5. **Is network stable?** → `ping youtube.com` (no packet loss)

---

## 📚 ADDITIONAL RESOURCES

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **YouTube Stream Settings**: https://studio.youtube.com
- **X11/Wayland (Linux)**: Check your display system
- **macOS CoreAudio**: Built-in, usually works automatically

---

## 🎉 YOU'RE ALL SET!

Your FreeTekno radio page is now ready for YouTube streaming at consistent 2 Mbps / 720p quality.

**Questions?** Check the logs: `tail -f youtube-stream.log`

Happy streaming! 🎵
