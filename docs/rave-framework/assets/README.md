# 📸 RAVE SLIDESHOW - Ciclo di Vita

Le 8 immagini raccontano la storia di un rave illegale underground.

## 🎬 La Storia (64 secondi totali)

### 01.png (0-8s)
**Preparazione / Arrivo**
- I primi arrivano al luogo segreto
- Setup del sound system
- L'energia inizia a crescere

### 02.png (8-16s)
**Build Up**
- La gente inizia ad arrivare
- Il DJ prepara i piatti
- Anticipazione crescente

### 03.png (16-24s)
**Prime Vibrazioni**
- I primi bassline
- La folla reagisce
- L'energia esplode

### 04.png (24-32s)
**Peak Energy**
- Massima intensità
- Tutti ballano
- Bass devastanti

### 05.png (32-40s)
**Trance Collettiva**
- Connessione della folla
- Momento magico
- Unity underground

### 06.png (40-48s)
**Seconda Ondata**
- Nuovo peak
- Più energia
- Rave infinito

### 07.png (48-56s)
**Resistenza**
- La notte continua
- Nessuno si ferma
- Free tekno spirit

### 08.png (56-64s)
**Alba / Ricomincia**
- Il sole sorge ma il rave continua
- Loop infinito
- Ritorno alla 01.png

---

## 🎵 Effetti Audio-Reattivi

Lo slideshow reagisce alla musica:

- **Zoom**: Bassi pulsano → zoom leggero (1.0 - 1.05x)
- **Brightness**: Energia generale → luminosità (0.7 - 1.2)
- **Glitch**: Beat detection → hue rotation casuale
- **Transizione**: 8 secondi per immagine, fade smooth

---

## 🔧 Configurazione

```javascript
{
    transitionDuration: 8,  // secondi per immagine
    loop: true,            // ripete all'infinito
    effectType: 'fade',    // tipo transizione
    opacity: 0.6          // trasparenza per vedere effetti sopra
}
```

---

## 💡 Come Funziona

1. **Layer System**: Slideshow su layer 1 (z-index: 50)
2. **Speakers**: Layer 2 (z-index: 100) - visibili sopra
3. **Effects**: Layer 3 (z-index: 200) - lasers/strobes sopra tutto
4. **Blending**: Opacity 60% per vedere componenti sovrapposti

---

## 🎨 Stile Rave

- Background sempre visibile ma non invasivo
- Racconta la storia mentre gli effetti reagiscono
- Ciclo infinito = rave infinito
- 64 secondi = durata perfetta per un loop completo

---

**Free Underground Tekno Forever** 🔊
