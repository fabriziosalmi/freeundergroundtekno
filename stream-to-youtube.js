#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Try to require puppeteer
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.error('❌ Puppeteer not installed. Run: npm install');
  process.exit(1);
}

class YouTubeStreamer {
  constructor(options = {}) {
    this.streamKey = options.streamKey;
    this.pageUrl = options.pageUrl || 'http://listen.free-tekno.com';
    this.youtubeUrl = 'rtmps://a.rtmp.youtube.com/live2';
    this.resolution = options.resolution || '1280x720';
    this.bitrate = options.bitrate || '2000k';
    this.maxRetries = 10;
    this.retryDelay = 5;
    this.logFile = path.join(process.cwd(), 'youtube-stream.log');
    this.ffmpegLog = path.join(os.tmpdir(), 'ffmpeg-stream.log');
    this.platform = os.platform();
    this.browser = null;
    this.ffmpegProcess = null;
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[34m',
      SUCCESS: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      DEBUG: '\x1b[36m'
    };
    const color = colors[level] || '';
    const reset = '\x1b[0m';
    const line = `[${level}] ${message}`;
    console.log(`${color}${line}${reset}`);
    fs.appendFileSync(this.logFile, `${timestamp} ${line}\n`);
  }

  checkRequirements() {
    this.log('INFO', '🔍 Checking requirements...');

    try {
      execSync('ffmpeg -version', { stdio: 'pipe' });
      this.log('SUCCESS', '✓ FFmpeg installed');
    } catch {
      this.log('ERROR', 'FFmpeg not found!');
      this.log('INFO', 'Install: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)');
      process.exit(1);
    }

    try {
      execSync('curl --version', { stdio: 'pipe' });
      this.log('SUCCESS', '✓ curl installed');
    } catch {
      this.log('ERROR', 'curl not found!');
      process.exit(1);
    }
  }

  validateStreamKey() {
    if (!this.streamKey || this.streamKey.length < 20) {
      this.log('ERROR', 'Invalid Stream Key!');
      this.log('INFO', 'Get it from: https://studio.youtube.com → Stream settings');
      process.exit(1);
    }
    this.log('SUCCESS', '✓ Stream Key validated');
  }

  async checkPageReachable() {
    this.log('INFO', `Checking page: ${this.pageUrl}`);
    try {
      execSync(`curl -s --max-time 10 "${this.pageUrl}" > /dev/null`, { stdio: 'pipe' });
      this.log('SUCCESS', '✓ Page is reachable');
      return true;
    } catch {
      this.log('ERROR', `Cannot reach ${this.pageUrl}`);
      return false;
    }
  }

  async launchBrowser() {
    this.log('INFO', '🌐 Launching headless browser...');
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--mute-audio'
        ]
      });

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      this.log('INFO', `Loading: ${this.pageUrl}`);
      await page.goto(this.pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      this.log('SUCCESS', '✓ Browser loaded and ready');
    } catch (err) {
      this.log('ERROR', `Browser launch failed: ${err.message}`);
      throw err;
    }
  }

  getDisplayConfig() {
    if (this.platform === 'linux') {
      const display = process.env.DISPLAY || ':99';
      return ['-f', 'x11grab', '-i', display, '-video_size', this.resolution];
    } else if (this.platform === 'darwin') {
      return ['-f', 'avfoundation', '-i', '1', '-video_size', this.resolution];
    } else if (this.platform === 'win32') {
      return ['-f', 'gdigrab', '-i', 'desktop', '-video_size', this.resolution];
    }
    throw new Error(`Unsupported platform: ${this.platform}`);
  }

  async startStreaming(retryCount = 0) {
    return new Promise((resolve, reject) => {
      if (retryCount >= this.maxRetries) {
        reject(new Error(`Max retries (${this.maxRetries}) reached`));
        return;
      }

      if (retryCount > 0) {
        this.log('INFO', `Attempt ${retryCount + 1}/${this.maxRetries}...`);
      }

      const displayConfig = this.getDisplayConfig();

      const ffmpegArgs = [
        '-rtbufsize', '100M',

        // Audio from HTTP stream
        '-i', this.pageUrl,

        // Video from display
        ...displayConfig,
        '-r', '30',

        // Video encoding
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '18',
        '-maxrate', this.bitrate,
        '-bufsize', (parseInt(this.bitrate) * 2) + 'k',
        '-g', '60',

        // Audio encoding
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '44100',

        // Output
        '-f', 'flv',
        `${this.youtubeUrl}/${this.streamKey}`,

        '-loglevel', 'warning'
      ];

      this.log('INFO', '🎬 Starting stream to YouTube...');
      this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      let hasError = false;

      this.ffmpegProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg.includes('error') || msg.includes('Connection refused')) {
          hasError = true;
          this.log('ERROR', `FFmpeg: ${msg}`);
        } else if (msg && !msg.includes('frame=')) {
          this.log('DEBUG', msg);
        }
      });

      this.ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          this.log('SUCCESS', '✓ Stream ended');
          resolve();
        } else {
          this.log('WARN', `Stream disconnected (code: ${code})`);

          // Retry with exponential backoff
          setTimeout(() => {
            this.startStreaming(retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, this.retryDelay * 1000);

          this.retryDelay = Math.min(this.retryDelay + 5, 60);
        }
      });

      this.ffmpegProcess.on('error', (err) => {
        this.log('ERROR', `FFmpeg error: ${err.message}`);
        reject(err);
      });
    });
  }

  async run() {
    try {
      console.log('\n╔═══════════════════════════════════════════════════════╗');
      console.log('║    🎵 FREE UNDERGROUND TEKNO - YouTube Streamer      ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');

      // Checks
      this.checkRequirements();
      this.validateStreamKey();

      if (!(await this.checkPageReachable())) {
        throw new Error('Page not reachable');
      }

      // Launch browser
      await this.launchBrowser();

      // Display config
      this.log('INFO', '');
      this.log('INFO', `Stream Key: ${this.streamKey.substring(0, 8)}...`);
      this.log('INFO', `Page URL: ${this.pageUrl}`);
      this.log('INFO', `Resolution: ${this.resolution}`);
      this.log('INFO', `Bitrate: ${this.bitrate}`);
      this.log('INFO', '');
      this.log('INFO', 'Press Ctrl+C to stop');
      this.log('INFO', '');

      // Start streaming
      await this.startStreaming();

      this.log('SUCCESS', '✓ Stream completed!');
    } catch (err) {
      this.log('ERROR', `Failed: ${err.message}`);
      this.cleanup();
      process.exit(1);
    }
  }

  cleanup() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGTERM');
    }
    if (this.browser) {
      this.browser.close().catch(() => {});
    }
  }
}

// CLI
function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     FREE UNDERGROUND TEKNO - YouTube Streamer             ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  node stream-to-youtube.js -k <KEY> [OPTIONS]

REQUIRED:
  -k, --stream-key KEY    YouTube Stream Key (from studio.youtube.com)

OPTIONS:
  -u, --url URL           Page URL (default: http://listen.free-tekno.com)
  -r, --resolution RES    Resolution (default: 1280x720)
  -b, --bitrate BITS      Bitrate (default: 2000k)
  --dry-run               Check setup without streaming
  -h, --help              Show help

EXAMPLES:
  # Basic streaming
  node stream-to-youtube.js -k "xxxx-xxxx-xxxx-xxxx"

  # Custom quality
  node stream-to-youtube.js -k "xxxx" -b "4500k" -r "1920x1080"

  # Test setup
  node stream-to-youtube.js --dry-run

SETUP:
  1. npm install
  2. Get key from: https://studio.youtube.com
  3. node stream-to-youtube.js -k "YOUR_KEY"

LOGS:
  ./youtube-stream.log
  /tmp/ffmpeg-stream.log

SECURITY:
  export YOUTUBE_STREAM_KEY="xxxx-xxxx-xxxx-xxxx"
  node stream-to-youtube.js -k "$YOUTUBE_STREAM_KEY"
`);
}

let streamKey = null;
let pageUrl = 'http://listen.free-tekno.com';
let resolution = '1280x720';
let bitrate = '2000k';
let dryRun = false;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '-h' || arg === '--help') {
    showHelp();
    process.exit(0);
  } else if (arg === '--dry-run') {
    dryRun = true;
  } else if ((arg === '-k' || arg === '--stream-key') && process.argv[i + 1]) {
    streamKey = process.argv[++i];
  } else if ((arg === '-u' || arg === '--url') && process.argv[i + 1]) {
    pageUrl = process.argv[++i];
  } else if ((arg === '-r' || arg === '--resolution') && process.argv[i + 1]) {
    resolution = process.argv[++i];
  } else if ((arg === '-b' || arg === '--bitrate') && process.argv[i + 1]) {
    bitrate = process.argv[++i];
  }
}

const streamer = new YouTubeStreamer({ streamKey, pageUrl, resolution, bitrate });

if (dryRun) {
  streamer.checkRequirements();
  streamer.validateStreamKey();
  streamer.checkPageReachable().then(() => {
    streamer.log('SUCCESS', '✓ Setup OK! Ready to stream.');
    process.exit(0);
  });
} else {
  if (!streamKey) {
    console.error('❌ Stream key required! Use: node stream-to-youtube.js -h');
    process.exit(1);
  }

  streamer.run();

  process.on('SIGINT', () => {
    streamer.log('WARN', 'Stopping stream...');
    streamer.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    streamer.cleanup();
    process.exit(0);
  });
}
