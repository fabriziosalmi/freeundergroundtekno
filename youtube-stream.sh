#!/bin/bash

################################################################################
# FREE UNDERGROUND TEKNO - YouTube Live Streaming Script
# Robusto con retry automatico e error handling
################################################################################

set -o pipefail

# CONFIGURAZIONE
STREAM_URL="http://listen.free-tekno.com"
YOUTUBE_RTMP_URL="rtmps://a.rtmp.youtube.com/live2"
STREAM_KEY=""  # Inserisci il tuo YouTube Stream Key qui
LOG_FILE="./youtube-stream.log"
RETRY_DELAY=5
MAX_RETRIES=10
FFMPEG_LOG="/tmp/ffmpeg-stream.log"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# FUNZIONI
################################################################################

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $@" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓ SUCCESS]${NC} $@" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[⚠ WARNING]${NC} $@" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[✗ ERROR]${NC} $@" | tee -a "$LOG_FILE"
}

check_requirements() {
    log_info "Verificando requisiti..."

    # Controlla FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        log_error "FFmpeg non installato!"
        log_info "Installa con: brew install ffmpeg (Mac) oppure apt install ffmpeg (Linux)"
        exit 1
    fi

    # Controlla curl
    if ! command -v curl &> /dev/null; then
        log_error "curl non installato!"
        exit 1
    fi

    log_success "Tutti i requisiti soddisfatti"
}

check_stream_url() {
    log_info "Controllando se la pagina è raggiungibile: $STREAM_URL"

    if curl -s --max-time 10 "$STREAM_URL" > /dev/null; then
        log_success "Pagina raggiungibile"
        return 0
    else
        log_error "Impossibile raggiungere $STREAM_URL"
        return 1
    fi
}

validate_stream_key() {
    if [ -z "$STREAM_KEY" ]; then
        log_error "Stream Key non configurato!"
        log_info "Inserisci il tuo YouTube Stream Key nel file youtube-stream.sh"
        log_info "Ottieni la chiave da: https://studio.youtube.com/channel/[TUO_CHANNEL_ID]/livestream"
        exit 1
    fi

    if [ ${#STREAM_KEY} -lt 20 ]; then
        log_error "Stream Key sembra invalido (troppo corto)"
        exit 1
    fi

    log_success "Stream Key validata"
}

get_os_type() {
    case "$(uname -s)" in
        Linux*)  echo "Linux";;
        Darwin*) echo "Mac";;
        CYGWIN*) echo "Windows";;
        MINGW*)  echo "Windows";;
        *)       echo "UNKNOWN";;
    esac
}

get_display_config() {
    local os_type=$(get_os_type)

    case "$os_type" in
        Linux)
            # Rileva il display X11
            if [ -z "$DISPLAY" ]; then
                log_error "DISPLAY non impostato. Assicurati di essere in ambiente X11"
                log_info "Se su Wayland, esegui: export GDK_BACKEND=x11"
                exit 1
            fi

            # Rileva la risoluzione
            local resolution=$(xdpyinfo | grep -A2 "dimensions" | tail -1 | awk '{print $2}')
            if [ -z "$resolution" ]; then
                resolution="1920x1080"
            fi

            echo "-f x11grab -i $DISPLAY -video_size $resolution"
            ;;
        Mac)
            # Su Mac, cattura l'intero schermo
            echo "-f avfoundation -i '1' -video_size 1920x1080"
            ;;
        Windows)
            # Su Windows, cattura il desktop
            echo "-f gdigrab -i desktop -video_size 1920x1080"
            ;;
        *)
            log_error "OS non supportato: $os_type"
            exit 1
            ;;
    esac
}

get_audio_config() {
    local os_type=$(get_os_type)

    case "$os_type" in
        Linux)
            # Usa PulseAudio
            echo "-f pulse -i default"
            ;;
        Mac)
            # Usa CoreAudio (device 0 per system audio)
            echo "-f avfoundation -i ':0'"
            ;;
        Windows)
            # Usa dshow
            echo "-f dshow -i audio=\"Stereo Mix\""
            ;;
    esac
}

start_stream() {
    local retry_count=0
    local os_type=$(get_os_type)

    log_info "===== INIZIO STREAMING ====="
    log_info "OS: $os_type"
    log_info "URL Stream: $STREAM_URL"
    log_info "RTMP Server: $YOUTUBE_RTMP_URL"
    log_info "================================"

    while [ $retry_count -lt $MAX_RETRIES ]; do
        log_info "Tentativo $((retry_count + 1))/$MAX_RETRIES..."

        local display_config=$(get_display_config)
        local audio_config=$(get_audio_config)

        # FFmpeg command con error handling robusto
        ffmpeg \
            -rtbufsize 100M \
            $display_config \
            $audio_config \
            -c:v libx264 \
            -preset veryfast \
            -crf 18 \
            -maxrate 4500k \
            -bufsize 9000k \
            -g 60 \
            -c:a aac \
            -b:a 192k \
            -ar 44100 \
            -f flv \
            "${YOUTUBE_RTMP_URL}/${STREAM_KEY}" \
            -loglevel warning \
            2>> "$FFMPEG_LOG"

        local exit_code=$?

        if [ $exit_code -eq 0 ]; then
            log_success "Stream terminato con successo"
            return 0
        fi

        if [ $exit_code -eq 255 ]; then
            log_error "Errore di connessione o stream key invalido"
            log_error "Verifica il tuo YouTube Stream Key"
            return 1
        fi

        log_warn "Stream interrotto (exit code: $exit_code)"
        log_info "Retry tra ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY

        # Backoff exponenziale
        RETRY_DELAY=$((RETRY_DELAY + 5))
        if [ $RETRY_DELAY -gt 60 ]; then
            RETRY_DELAY=60
        fi

        retry_count=$((retry_count + 1))
    done

    log_error "Numero massimo di retry raggiunto ($MAX_RETRIES)"
    return 1
}

show_help() {
    cat << EOF
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}FREE UNDERGROUND TEKNO - YouTube Stream Script${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

UTILIZZO:
    ./youtube-stream.sh [OPZIONI]

OPZIONI:
    -k, --stream-key KEY     Imposta YouTube Stream Key
    -u, --url URL           Cambia URL stream (default: $STREAM_URL)
    -d, --dry-run           Test senza avviare lo stream
    -h, --help              Mostra questo aiuto

ESEMPI:
    # Con stream key inline
    ./youtube-stream.sh -k "xxxx-xxxx-xxxx-xxxx"

    # URL custom
    ./youtube-stream.sh -k "xxxx" -u "https://miosite.com"

    # Test di connettività
    ./youtube-stream.sh -d

SETUP INIZIALE:
    1. Vai su https://studio.youtube.com/channel/[ID]/livestream
    2. Copia il tuo Stream Key (rtmp://...)
    3. Sostituisci STREAM_KEY nel file o passa con -k

TROUBLESHOOTING:
    - Controlla i log: tail -f $LOG_FILE
    - FFmpeg logs: tail -f $FFMPEG_LOG
    - Assicurati che lo schermo sia acceso durante lo streaming

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
EOF
}

################################################################################
# MAIN
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -k|--stream-key)
            STREAM_KEY="$2"
            shift 2
            ;;
        -u|--url)
            STREAM_URL="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Opzione sconosciuta: $1"
            show_help
            exit 1
            ;;
    esac
done

# Inizializzazione
log_info "Free Underground Tekno - YouTube Stream Script"
log_info "Log file: $LOG_FILE"

# Controlli preliminari
check_requirements
check_stream_url || exit 1
validate_stream_key

if [ "$DRY_RUN" = true ]; then
    log_success "Dry run completato con successo"
    exit 0
fi

# Cattura Ctrl+C per shutdown pulito
trap 'log_warn "Stream interrotto dall'\''utente"; exit 0' INT TERM

# Avvia lo stream
start_stream
exit $?
