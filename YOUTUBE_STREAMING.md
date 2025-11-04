# 🎬 YouTube Live Streaming - FREE UNDERGROUND TEKNO

Guida completa per trasmettere la pagina web direttamente su YouTube via CLI.

---

## 🚀 QUICK START (5 minuti)

### 1. Ottieni lo Stream Key da YouTube

1. Vai a **https://studio.youtube.com**
2. Clicca **Create** → **Go live**
3. Nel menu a sinistra, clicca **Stream settings**
4. Copia il **Stream key** (es: `xxxx-xxxx-xxxx-xxxx`)
5. **NON CONDIVIDERE** questo codice con nessuno!

### 2. Installa FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install ffmpeg
```

**Windows:**
- Scarica da: https://ffmpeg.org/download.html
- O usa: `choco install ffmpeg` (con Chocolatey)

### 3. Avvia lo Stream

```bash
cd /Users/fab/GitHub/freeundergroundtekno

# Con stream key inline
./youtube-stream.sh -k "COPIA_TUA_STREAM_KEY_QUI"

# O modifica il file e esegui
./youtube-stream.sh
```

Fatto! ✅

---

## ⚙️ SETUP DETTAGLIATO

### Metodo 1: Stream Key nel Comando (Consigliato)

```bash
./youtube-stream.sh -k "xxxx-xxxx-xxxx-xxxx"
```

### Metodo 2: Stream Key nel File

1. Apri `youtube-stream.sh` in un editor
2. Trova questa riga (riga ~13):
   ```bash
   STREAM_KEY=""  # Inserisci il tuo YouTube Stream Key qui
   ```
3. Sostituisci con:
   ```bash
   STREAM_KEY="xxxx-xxxx-xxxx-xxxx"
   ```
4. Esegui:
   ```bash
   ./youtube-stream.sh
   ```

### Metodo 3: Variabile d'Ambiente

```bash
export YOUTUBE_STREAM_KEY="xxxx-xxxx-xxxx-xxxx"
./youtube-stream.sh -k "$YOUTUBE_STREAM_KEY"
```

---

## 📋 OPZIONI DISPONIBILI

```bash
./youtube-stream.sh [OPZIONI]

-k, --stream-key KEY     YouTube Stream Key
-u, --url URL            URL pagina (default: http://listen.free-tekno.com)
-d, --dry-run            Test connessione senza streamare
-h, --help               Mostra aiuto
```

### Esempi

```bash
# Test di connessione
./youtube-stream.sh -d

# Stream con qualità custom (modifica nel file)
./youtube-stream.sh -k "xxxx"

# URL locale (per testing)
./youtube-stream.sh -k "xxxx" -u "http://localhost:8000/docs/"
```

---

## 🔧 CONFIGURAZIONE AVANZATA

### Qualità Video

Nel file `youtube-stream.sh`, modifica queste righe (attorno alla riga 140):

```bash
-preset veryfast        # Velocità encoding: ultrafast, superfast, veryfast, faster, fast
-crf 18                 # Qualità (0-51): 18=alta, 23=media, 28=bassa
-maxrate 4500k          # Bitrate massimo (kbps)
-bufsize 9000k          # Buffer size
```

**Preset consigliati:**
- `ultrafast`: Bassa CPU, qualità media (slow devices)
- `veryfast`: Buon equilibrio (consigliato)
- `fast`: Alta qualità, più CPU
- `medium`: Molto alta qualità, molta CPU

**CRF consigliati:**
- `18`: Qualità molto alta (file grande)
- `23`: Qualità buona (default YouTube)
- `28`: Qualità accettabile (file piccolo)

### Risoluzione

Il script rileva automaticamente la risoluzione. Per forzare una risoluzione specifica:

```bash
# Modifica nel file, linea ~129
# Cambia:
# -video_size 1920x1080

# In:
# -video_size 1280x720    # Per HD ridotto
# -video_size 1920x1080   # Full HD
# -video_size 2560x1440   # 2K
```

---

## 🔍 TROUBLESHOOTING

### "FFmpeg not found"
```bash
# Installa FFmpeg
brew install ffmpeg          # Mac
sudo apt install ffmpeg      # Linux
```

### "Stream key invalido"
- Verifica di aver copiato **esattamente** lo Stream Key
- Non aggiungere spazi
- Ottieni una nuova chiave da YouTube Studio se necessario

### "Pagina non raggiungibile"
```bash
# Testa manualmente
curl http://listen.free-tekno.com

# O specifica un URL locale
./youtube-stream.sh -k "xxxx" -u "http://localhost:8000"
```

### "No audio"
- **macOS**: Controlla Preferenze → Sicurezza e Privacy → Microfono
- **Linux**: Controlla PulseAudio: `pactl list short sources`
- **Windows**: Assicurati che "Stereo Mix" sia abilitato

### "Video laggy/distorto"
1. Riduci risoluzione (1280x720 invece di 1920x1080)
2. Abbassa CRF (qualità): `crf 28` invece di `crf 18`
3. Aumenta preset: `ultrafast` invece di `veryfast`
4. Chiudi altri programmi per liberare CPU

### "Connessione persa - Retrying..."
- Perfetto! Lo script riprova automaticamente
- Controlla la tua connessione Internet
- Lo script tenta fino a 10 volte con backoff esponenziale

---

## 📊 MONITORAGGIO

### Logs in Tempo Reale

```bash
# Guarda i log principal
tail -f youtube-stream.log

# Guarda i log FFmpeg
tail -f /tmp/ffmpeg-stream.log

# Entrambi insieme
tail -f youtube-stream.log /tmp/ffmpeg-stream.log
```

### Controllare Bitrate Effettivo

Su un altro terminal:
```bash
# macOS
netstat -an | grep RTMP

# Linux
ss -an | grep RTMP

# Oppure apri YouTube Studio e guarda il bitrate
```

---

## 🛡️ SICUREZZA

### ⚠️ NON FARE QUESTO
```bash
# ❌ Non salvare Stream Key in plain text pubblicamente
# ❌ Non condividere lo Stream Key via email/chat
# ❌ Non commitare Stream Key nel git
```

### ✅ FAI QUESTO
```bash
# ✅ Usa variabile d'ambiente
export YOUTUBE_STREAM_KEY="xxxx"

# ✅ Passa via CLI
./youtube-stream.sh -k "$YOUTUBE_STREAM_KEY"

# ✅ Se salvi nel file, aggiungi a .gitignore
echo "youtube-stream.sh" >> .gitignore
```

---

## 📱 MULTI-PIATTAFORMA

### macOS
```bash
./youtube-stream.sh -k "xxxx"
# Cattura automaticamente l'intero schermo via avfoundation
```

### Linux
```bash
./youtube-stream.sh -k "xxxx"
# Cattura via X11 (assicurati DISPLAY sia impostato)
export DISPLAY=:0
./youtube-stream.sh -k "xxxx"
```

### Windows
```cmd
# Usa PowerShell o Git Bash
./youtube-stream.sh -k "xxxx"
# Cattura via gdigrab (scena sul desktop)
```

---

## 🎯 PRODUZIONE - BEST PRACTICES

### 1. Test Prima di Andare Live

```bash
# Test dry-run (connessione soltanto)
./youtube-stream.sh -d

# Test con URL locale
./youtube-stream.sh -k "xxxx" -u "http://localhost:8000/docs/"
# Broadcast per 2-3 minuti
# Testa qualità su YouTube
# Ctrl+C per fermare
```

### 2. Usa Screen o Tmux per Persistenza

```bash
# Screen
screen -S free-tekno-stream
./youtube-stream.sh -k "xxxx"
# Ctrl+A D per detach
# Torna al stream: screen -r free-tekno-stream
```

```bash
# Tmux
tmux new-session -d -s free-tekno-stream './youtube-stream.sh -k "xxxx"'
# Lista: tmux ls
# Attach: tmux attach-session -t free-tekno-stream
```

### 3. Crea uno Script Launcher

**launch-stream.sh:**
```bash
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
./youtube-stream.sh -k "${YOUTUBE_STREAM_KEY}"
```

```bash
chmod +x launch-stream.sh
./launch-stream.sh
```

### 4. Monitora lo Stream

Apri YouTube Studio in un browser e controlla:
- ✅ Bitrate stabile (4500 kbps target)
- ✅ FPS stabile (30 fps)
- ✅ Audio presente
- ✅ Zero frame drops

---

## 🚨 ARRESTO PULITO

### Fermare lo Stream
```bash
# Nel terminal dove gira lo stream, premi:
Ctrl+C

# Oppure da un altro terminal
pkill -f "youtube-stream.sh"
```

Lo script si ferma pulitamente e salva i logs.

---

## 📝 AUTOMAZIONE (Crontab)

Per avviare automaticamente lo stream ogni giorno a una certa ora:

```bash
# Modifica crontab
crontab -e

# Aggiungi (ad es. ogni giorno alle 20:00)
0 20 * * * cd /Users/fab/GitHub/freeundergroundtekno && ./youtube-stream.sh -k "xxxx" >> youtube-cron.log 2>&1
```

---

## 🎨 TIPS & TRICKS

### Visualizza Statistiche Encoder
Modifica la riga `loglevel` nel file:
```bash
-loglevel warning      # Cambia in:
-loglevel debug        # Per più dettagli
```

### Salva anche Localmente
Se vuoi salvare il video mentre streamai:
```bash
# Modifica il comando FFmpeg per duplicare output:
# Aggiungi dopo il parametro -f flv:
# -f tee "[f=flv]rtmps://....|[f=mp4]local-recording.mp4"
```

### Usa OBS come Fallback
Se la cattura schermo non funziona, usa OBS:
```bash
# OBS output → ffmpeg input
obs-virtualcam
# Poi seleziona come input
```

---

## 📞 SUPPORTO

Se hai problemi:

1. **Controlla i logs:**
   ```bash
   tail -f youtube-stream.log
   tail -f /tmp/ffmpeg-stream.log
   ```

2. **Test connessione:**
   ```bash
   curl -v http://listen.free-tekno.com
   ```

3. **Verifica Stream Key:**
   - Vai a YouTube Studio
   - Reimposta Stream Key se necessario

4. **Aggiorna FFmpeg:**
   ```bash
   brew upgrade ffmpeg      # Mac
   sudo apt upgrade ffmpeg  # Linux
   ```

---

## 📄 LICENZA

Script released under MIT License - Libero da usare!

---

**Buon streaming! 🎉**

Domande? Controlla i logs!
