#!/bin/bash

# Script per scaricare i testi della KB di Zantara
# Usage: ./scripts/download-kb-texts.sh

KB_BASE="/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/KB/zantara-personal"

echo "📚 Downloading Zantara Knowledge Base..."
echo "========================================"

# Create log file
LOG_FILE="$KB_BASE/download.log"
echo "Download started: $(date)" > "$LOG_FILE"

# Function to download and log
download_text() {
  local url="$1"
  local output="$2"
  local description="$3"

  echo ""
  echo "📖 Downloading: $description"
  echo "   → $output"

  if curl -L -f -o "$output" "$url" 2>/dev/null; then
    echo "   ✅ Success"
    echo "$(date) - SUCCESS: $description - $url" >> "$LOG_FILE"
  else
    echo "   ❌ Failed"
    echo "$(date) - FAILED: $description - $url" >> "$LOG_FILE"
  fi
}

# ========================================
# 1. CLASSICI - Project Gutenberg & Archive.org
# ========================================
echo ""
echo "1️⃣  Downloading Classical Texts..."

# Ramayana (versione inglese)
download_text \
  "https://www.gutenberg.org/files/25865/25865-0.txt" \
  "$KB_BASE/classici/ramayana-valmiki-eng.txt" \
  "Ramayana (Valmiki, English)"

# Mahabharata (versione inglese ridotta)
download_text \
  "https://www.gutenberg.org/files/15474/15474-0.txt" \
  "$KB_BASE/classici/mahabharata-eng.txt" \
  "Mahabharata (English)"

# Hikayat Hang Tuah
download_text \
  "https://archive.org/download/hikayathangtuah00unkngoog/hikayathangtuah00unkngoog.pdf" \
  "$KB_BASE/classici/hikayat-hang-tuah.pdf" \
  "Hikayat Hang Tuah"

# ========================================
# 2. FILOSOFIA
# ========================================
echo ""
echo "2️⃣  Downloading Philosophy Texts..."

# Ki Hajar Dewantara writings
download_text \
  "https://archive.org/download/ki-hajar-dewantara-writings/ki-hajar-dewantara.txt" \
  "$KB_BASE/filosofia/ki-hajar-dewantara.txt" \
  "Ki Hajar Dewantara - Writings"

# ========================================
# 3. LETTERATURA MODERNA
# ========================================
echo ""
echo "3️⃣  Downloading Modern Literature..."

# Pramoedya - This Earth of Mankind (inglese)
download_text \
  "https://archive.org/download/this-earth-of-mankind/this-earth-of-mankind.txt" \
  "$KB_BASE/moderna/pramoedya-this-earth-of-mankind.txt" \
  "Pramoedya - This Earth of Mankind"

# Chairil Anwar - Poesie
download_text \
  "https://archive.org/download/chairil-anwar-poems/chairil-anwar-poems.txt" \
  "$KB_BASE/moderna/chairil-anwar-poems.txt" \
  "Chairil Anwar - Selected Poems"

# ========================================
# 4. STORIA & ANTROPOLOGIA
# ========================================
echo ""
echo "4️⃣  Downloading History & Anthropology..."

# Clifford Geertz - The Religion of Java (estratti)
download_text \
  "https://archive.org/download/religionofjava00geer/religionofjava00geer.pdf" \
  "$KB_BASE/storia/geertz-religion-java.pdf" \
  "Geertz - The Religion of Java"

# Benedict Anderson - Imagined Communities (estratti)
download_text \
  "https://archive.org/download/imaginedcommunitiesreflectionsontheoriginandspreadofnationalismbenedictanderson/Imagined%20Communities%20Reflections%20on%20the%20Origin%20and%20Spread%20of%20Nationalism%20Benedict%20Anderson.pdf" \
  "$KB_BASE/storia/anderson-imagined-communities.pdf" \
  "Anderson - Imagined Communities"

# ========================================
# 5. CULTURA
# ========================================
echo ""
echo "5️⃣  Downloading Cultural Studies..."

# Pancasila texts
cat > "$KB_BASE/cultura/pancasila.txt" << 'EOF'
# Pancasila - Lima Sila (The Five Principles)

## 1. Ketuhanan Yang Maha Esa
Belief in the One and Only God

## 2. Kemanusiaan yang Adil dan Beradab
Just and Civilized Humanity

## 3. Persatuan Indonesia
The Unity of Indonesia

## 4. Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan
Democracy Led by the Inner Wisdom in the Unanimity Arising Out of Deliberations Among Representatives

## 5. Keadilan Sosial bagi Seluruh Rakyat Indonesia
Social Justice for All Indonesian People

---

Pancasila adalah dasar negara Republik Indonesia yang dirumuskan oleh Soekarno pada 1 Juni 1945.
Pancasila is the philosophical foundation of the Indonesian state formulated by Sukarno on June 1, 1945.
EOF

echo "   ✅ Created Pancasila text"

# Gotong Royong
cat > "$KB_BASE/cultura/gotong-royong.txt" << 'EOF'
# Gotong Royong - Mutual Cooperation

## Definisi / Definition

**Bahasa Indonesia:**
Gotong royong adalah filosofi sosial dalam budaya Indonesia yang menekankan pada semangat kerja sama dan saling membantu dalam masyarakat.

**English:**
Gotong royong is a social philosophy in Indonesian culture that emphasizes the spirit of cooperation and mutual assistance within a community.

**Italiano:**
Il gotong royong è una filosofia sociale nella cultura indonesiana che enfatizza lo spirito di cooperazione e aiuto reciproco all'interno della comunità.

## Prinsip / Principles / Principi

1. **Kebersamaan** / Togetherness / Solidarietà
2. **Saling Membantu** / Mutual Help / Aiuto reciproco
3. **Tanggung Jawab Bersama** / Shared Responsibility / Responsabilità condivisa
4. **Kerelaan Berkorban** / Willingness to Sacrifice / Disponibilità al sacrificio

## Contoh Praktis / Practical Examples / Esempi Pratici

- Membangun rumah bersama / Building houses together / Costruire case insieme
- Membersihkan kampung / Cleaning the village / Pulire il villaggio
- Membantu tetangga dalam kesulitan / Helping neighbors in need / Aiutare i vicini in difficoltà
- Kerja bakti / Community service / Servizio comunitario
EOF

echo "   ✅ Created Gotong Royong text"

# ========================================
# 6. RELIGIONE
# ========================================
echo ""
echo "6️⃣  Downloading Religion & Spirituality..."

# Kejawen (Javanese mysticism)
cat > "$KB_BASE/religione/kejawen.txt" << 'EOF'
# Kejawen - Misticismo Giavanese / Javanese Mysticism

## Introduzione / Introduction

**Bahasa Indonesia:**
Kejawen adalah kepercayaan spiritual yang berakar dari tradisi Jawa kuno, menggabungkan unsur animisme, Hindu-Buddha, dan Islam.

**English:**
Kejawen is a spiritual belief rooted in ancient Javanese traditions, combining elements of animism, Hindu-Buddhist, and Islamic teachings.

**Italiano:**
Il Kejawen è una credenza spirituale radicata nelle antiche tradizioni giavanese, che combina elementi di animismo, induismo-buddismo e islam.

## Konsep Utama / Main Concepts / Concetti Principali

### 1. Sangkan Paraning Dumadi
Asal dan tujuan kehidupan / Origin and purpose of life / Origine e scopo della vita

### 2. Manunggaling Kawula Gusti
Penyatuan hamba dengan Tuhan / Union of servant with God / Unione del servo con Dio

### 3. Rasa (Perasaan Batin)
Intuisi spiritual / Spiritual intuition / Intuizione spirituale

### 4. Ngelmu (Pengetahuan Spiritual)
Pengetahuan mistis / Mystical knowledge / Conoscenza mistica

## Praktik / Practices / Pratiche

- Meditasi (Samadhi)
- Puasa spiritual (Tapa)
- Tirakat (Asketisme)
- Laku spiritual (Spiritual exercises)
EOF

echo "   ✅ Created Kejawen text"

# ========================================
# 7. ARTI PERFORMATIVE
# ========================================
echo ""
echo "7️⃣  Downloading Performing Arts..."

# Wayang
cat > "$KB_BASE/arti/wayang.txt" << 'EOF'
# Wayang - Teatro delle Ombre Indonesiano / Indonesian Shadow Puppetry

## Storia / History / Sejarah

Il Wayang è una forma d'arte teatrale tradizionale indonesiana, riconosciuta dall'UNESCO come Patrimonio Culturale Immateriale dell'Umanità nel 2003.

Wayang is a traditional Indonesian theatrical art form, recognized by UNESCO as a Masterpiece of Oral and Intangible Heritage of Humanity in 2003.

Wayang adalah bentuk seni teater tradisional Indonesia, diakui UNESCO sebagai Karya Agung Warisan Budaya Lisan dan Takbenda Manusia pada tahun 2003.

## Tipi di Wayang / Types of Wayang / Jenis-jenis Wayang

### 1. Wayang Kulit (Shadow Puppets)
- Boneka kulit kerbau / Buffalo leather puppets / Burattini di pelle di bufalo
- Diproyeksikan di layar / Projected on screen / Proiettato su schermo
- Diiringi gamelan / Accompanied by gamelan / Accompagnato dal gamelan

### 2. Wayang Golek (Rod Puppets)
- Boneka kayu tiga dimensi / Three-dimensional wooden puppets
- Khas Jawa Barat / Typical of West Java / Tipico di Giava occidentale

### 3. Wayang Orang (Human Theatre)
- Aktor manusia / Human actors / Attori umani
- Drama musikal / Musical drama / Dramma musicale

## Cerita / Stories / Storie

**Lakon Utama:**
1. Mahabharata
2. Ramayana
3. Panji cycles
4. Cerita Islam (Menak)

## Tokoh Utama / Main Characters / Personaggi Principali

**Pandawa Lima:**
- Yudhistira (il saggio / the wise)
- Bima (il forte / the strong)
- Arjuna (l'eroe / the hero)
- Nakula (il bello / the handsome)
- Sadewa (il giovane / the young)

**Punakawan (Clowns/Servants):**
- Semar (consigliere divino / divine advisor)
- Gareng
- Petruk
- Bagong

## Dalang (Maestro delle Marionette)

Il dalang è:
- Narratore / Narrator / Narator
- Burattinaio / Puppeteer / Dalang
- Direttore musicale / Music director / Direktur musik
- Filosofo / Philosopher / Filosof

## Filosofia

Wayang mengajarkan:
- Kebaikan vs Kejahatan / Good vs Evil / Bene vs Male
- Dharma (dovere) / Duty / Kewajiban
- Karma (azione e conseguenza)
- Moksha (liberazione spirituale)
EOF

echo "   ✅ Created Wayang text"

# Gamelan
cat > "$KB_BASE/arti/gamelan.txt" << 'EOF'
# Gamelan - Orchestra Tradizionale Indonesiana

## Introduzione

**Bahasa Indonesia:**
Gamelan adalah ensembel musik tradisional Indonesia yang terdiri dari instrumen perkusi logam, gong, kendang, dan instrumen lainnya.

**English:**
Gamelan is a traditional Indonesian musical ensemble consisting of metallic percussion instruments, gongs, drums, and other instruments.

**Italiano:**
Il Gamelan è un ensemble musicale tradizionale indonesiano composto da strumenti a percussione metallici, gong, tamburi e altri strumenti.

## Strumenti / Instruments / Instrumen

### Percussioni Metalliche:
1. **Saron** - metallofono con piastre di bronzo
2. **Gender** - metallofono con risonatori di bambù
3. **Bonang** - gong orizzontali su telaio
4. **Kenong** - gong medio
5. **Kempul** - gong appeso medio
6. **Gong Ageng** - grande gong (il più importante)

### Percussioni:
- **Kendang** - tamburo a due facce
- **Ketipung** - piccolo tamburo

### Altri:
- **Suling** - flauto di bambù
- **Rebab** - violino a due corde
- **Siter/Celempung** - cetra

## Scale Musicali / Musical Scales / Tangga Nada

### 1. Slendro (5 toni)
Sistema pentatonico / Pentatonic system / Sistema pentatonico

### 2. Pelog (7 toni)
Sistema eptatonico / Heptatonic system / Sistema eptatonico

## Stili Regionali:

- **Gamelan Jawa** (Yogyakarta, Surakarta)
- **Gamelan Bali** (più dinamico)
- **Gamelan Sunda** (Giava occidentale)

## Funzioni:

- Accompagnamento Wayang
- Cerimonie di corte (keraton)
- Matrimoni e celebrazioni
- Danza tradizionale
- Meditazione e spiritualità

## Filosofia

Il Gamelan rappresenta:
- Armonia comunitaria (gotong royong)
- Equilibrio (cosmico e sociale)
- Rispetto gerarchico (gong = leader)
- Sincronizzazione perfetta
EOF

echo "   ✅ Created Gamelan text"

# ========================================
# 8. COLONIALISMO
# ========================================
echo ""
echo "8️⃣  Downloading Colonial & Resistance Texts..."

# Multatuli - Max Havelaar (estratti)
download_text \
  "https://www.gutenberg.org/files/3046/3046-0.txt" \
  "$KB_BASE/colonialismo/multatuli-max-havelaar.txt" \
  "Multatuli - Max Havelaar"

# Kartini Letters
download_text \
  "https://archive.org/download/lettersofjavaneseprincessradenadjenghkartini/Letters%20of%20a%20Javanese%20Princess%20-%20Raden%20Adjeng%20Kartini.txt" \
  "$KB_BASE/colonialismo/kartini-letters.txt" \
  "Kartini - Letters of a Javanese Princess"

# ========================================
# SUMMARY
# ========================================
echo ""
echo "========================================"
echo "✅ Download Complete!"
echo ""
echo "📊 Summary:"
echo "   - Classici: Ramayana, Mahabharata, Hikayat"
echo "   - Filosofia: Ki Hajar Dewantara"
echo "   - Moderna: Pramoedya, Chairil Anwar"
echo "   - Storia: Geertz, Anderson"
echo "   - Cultura: Pancasila, Gotong Royong"
echo "   - Religione: Kejawen"
echo "   - Arti: Wayang, Gamelan"
echo "   - Colonialismo: Multatuli, Kartini"
echo ""
echo "📝 Log file: $LOG_FILE"
echo ""
echo "🚀 Next: Review texts and add to Zantara's context"
echo "========================================"