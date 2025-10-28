# Featured Articles Layout - Puzzle Design Guidelines

**Date**: 2025-10-26  
**Status**: Production Ready  
**File**: `/website/components/featured-articles.tsx`

---

## 📐 Layout Specifications

### Grid Configuration
```css
display: grid
grid-template-columns: 6 columns
gap: 0.5 (2px) - spazio minimo per effetto puzzle compatto
auto-rows: 125px - altezza base per ogni riga
```

### Card Positioning (Explicit Grid Placement)

#### 🟡 Bali Floods (Article 0)
- **Variant**: `medium`
- **Grid Position**: 
  - `col-span-2` `col-start-1` (colonne 1-2)
  - `row-span-5` `row-start-2` (righe 2-6)
- **Adjustments**: 
  - `-mt-[62.5px]` → Spostato 0.5 row verso l'alto
- **Title Font**: `lg:text-[2.25rem]` (36px) - incrementato per enfasi

#### 🔵 Airport (Article 1)
- **Variant**: `featured`
- **Grid Position**:
  - `col-span-2` `col-start-3` (colonne 3-4)
  - `row-span-6` `row-start-2` (righe 2-7)
- **Adjustments**: Nessuno
- **Title Font**: Standard per variant `featured`

#### 🔴 Telkom (Article 2)
- **Variant**: `featured`
- **Grid Position**:
  - `col-span-2` `col-start-5` (colonne 5-6)
  - `row-span-7` `row-start-0` (righe 0-6)
- **Adjustments**: 
  - `-mt-[62.5px]` → Allungato 0.5 row verso l'alto
  - `pb-[62.5px]` → Ridotto 0.5 row in basso
- **Title Font**: Standard per variant `featured`

#### 🟢 Alcohol/SKPL (Article 3)
- **Variant**: `large` (orizzontale)
- **Grid Position**:
  - `col-span-4` `col-start-1` (colonne 1-4)
  - `row-span-5` `row-start-8` (righe 8-12)
- **Adjustments**: 
  - `pr-[25px]` → Ridotto 0.2 da destra per spaziatura con OSS
- **Title Font**: Standard per variant `large`

#### 🔵 OSS (Article 4)
- **Variant**: `small`
- **Grid Position**:
  - `col-span-2` `col-start-5` (colonne 5-6)
  - `row-span-5` `row-start-8` (righe 8-12)
- **Adjustments**: 
  - `-mt-[50px]` → Spostato 0.4 row verso l'alto (avvicinato a Telkom)
- **Title Font**: Standard per variant `small`

---

## 🎨 Visual Effect - "Puzzle Layout"

### Obiettivo Design
Creare un layout asimmetrico con card che si incastrano come un puzzle, con spazi minimi (2px) tra gli elementi per effetto di continuità visiva.

### Allineamenti Chiave
1. **Row 2**: Floods e Airport iniziano sulla stessa riga (baseline comune)
2. **Row 0**: Telkom parte più in alto, esteso verso il top
3. **Row 8**: Alcohol e OSS sulla stessa baseline, con OSS spostato verso Telkom
4. **Offset negativi**: Usati per microaggiustamenti (0.2-0.5 rows) senza rompere la griglia

### Spazi e Respiro
- **Gap**: 0.5 (2px) - minimo visibile ma percettibile
- **Padding custom**: Solo dove necessario per bilanciamento visivo
- **Margin negativi**: Per sovrapporre leggermente e creare tensione visiva

---

## 🔧 Modifiche Future

### Per aggiungere nuove card:
1. Mantenere `gap-0.5` per coerenza
2. Usare `col-start` e `row-start` espliciti per posizionamento
3. Aggiungere offset con margini negativi (`-mt-[Xpx]`) per microaggiustamenti
4. Testare su viewport large (1920px+) per verifica allineamenti

### Per modificare font titoli:
I titoli sono definiti in `/components/article/article-card.tsx` nella funzione `getTitleSize()`:
- `featured`: `text-2xl md:text-3xl lg:text-4xl`
- `large`: `text-xl md:text-2xl lg:text-3xl`
- `medium`: `text-xl md:text-2xl lg:text-[2.25rem]` (custom per Bali Floods)
- `small`: `text-lg md:text-xl lg:text-2xl`

### Per modificare card aspect ratio:
Gli aspect ratio sono definiti in `getAspectRatio()`:
- `featured/medium/small`: `aspect-[3/4]` (verticale)
- `large`: `aspect-[16/9]` (orizzontale)

---

## ⚠️ Note Tecniche

### Row Start "0"
Telkom usa `row-start-0` che in CSS Grid significa "prima della row 1". Combinato con `-mt-[62.5px]` crea l'effetto di estensione verso l'alto oltre il confine della griglia.

### Calcolo Offset
```
1 row = 125px
0.5 row = 62.5px
0.4 row = 50px
0.3 row = 37.5px
0.2 row = 25px
```

### Browser Compatibility
Layout testato su:
- Chrome/Edge (Chromium)
- Safari (WebKit)
- Firefox (Gecko)

Grid layout con `col-start` e `row-start` è supportato da tutti i browser moderni (2020+).

---

## 📱 Responsive Behavior

### Mobile (`< lg` breakpoint)
Il layout passa a colonna singola automaticamente grazie a `grid-cols-1` sul breakpoint base.

### Tablet/Desktop (`lg+` breakpoint)
Il puzzle layout si attiva con le classi `lg:` prefixed.

---

## 🎯 Risultato Finale

**Layout compatto** con card che si incastrano perfettamente, spazi minimi (2px), e microaggiustamenti per bilanciamento visivo ottimale. L'effetto è di un "magazine spread" moderno con elementi che dialogano tra loro attraverso prossimità e tensione spaziale.

**Performance**: Nessun JavaScript richiesto - puro CSS Grid Layout.

---

**Maintainer**: Bali Zero Development Team  
**Last Updated**: 2025-10-26
