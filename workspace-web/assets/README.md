# 🎨 WORKSPACE ASSETS

This folder contains all visual assets for the Bali Zero Workspace.

---

## 📦 **REQUIRED ASSETS**

Place the following generated images in this folder:

### 1. **hero-background.png**
- **Size**: 1920x1080px
- **Purpose**: Hero section background
- **Style**: Purple-blue gradient with floating palm leaves
- **Transparency**: No (full background)

### 2. **empty-state-no-projects.png**
- **Size**: 400x400px
- **Purpose**: Empty state illustration
- **Style**: Lotus with floating documents
- **Transparency**: Yes (PNG with alpha)

### 3. **lotus-icon-abstract.png**
- **Size**: 256x256px
- **Purpose**: Brand icon, hero section
- **Style**: Clean geometric lotus
- **Transparency**: Yes (PNG with alpha)

### 4. **project-icons-set.png**
- **Size**: 512x512px (9 icons in grid)
- **Purpose**: Project type indicators
- **Style**: Minimal line icons (code, design, marketing, sales, etc.)
- **Transparency**: Yes (PNG with alpha)

### 5. **decorative-corners.png**
- **Size**: 128x128px
- **Purpose**: Card ornaments
- **Style**: Subtle lotus petal shapes
- **Transparency**: Yes (PNG with alpha)

---

## 🎯 **ASSET STATUS**

Track your progress:

- [ ] hero-background.png (generated via Imagine.art)
- [ ] empty-state-no-projects.png (generated via Imagine.art)
- [ ] lotus-icon-abstract.png (generated via Imagine.art)
- [ ] project-icons-set.png (generated via Imagine.art)
- [ ] decorative-corners.png (generated via Imagine.art)

---

## 🚀 **GENERATION INSTRUCTIONS**

### **Using Imagine.art**

1. Go to https://www.imagine.art
2. Select "Art" mode
3. Use the prompts from `../MIDJOURNEY_PROMPTS.md`
4. Generate in high resolution (1024x1024 or higher)
5. Download PNG files
6. Place in this folder

### **Optimization**

After placing files, optimize them:

```bash
# Using ImageOptim (Mac)
open -a ImageOptim assets/*.png

# Using TinyPNG CLI
tinypng assets/*.png

# Using imagemagick (resize if needed)
mogrify -resize 1920x1080 hero-background.png
```

---

## 📐 **FILE SPECIFICATIONS**

| Asset | Format | Max Size | Transparency |
|-------|--------|----------|--------------|
| hero-background.png | PNG | 500 KB | No |
| empty-state-no-projects.png | PNG | 100 KB | Yes |
| lotus-icon-abstract.png | PNG | 50 KB | Yes |
| project-icons-set.png | PNG | 150 KB | Yes |
| decorative-corners.png | PNG | 30 KB | Yes |

---

## 🎨 **COLOR CONSISTENCY**

Ensure all assets use the brand colors:

**ZANTARA Lotus**:
- Deep Purple: `#4A3A7A`
- Royal Purple: `#6B4FA8`
- Ocean Blue: `#2D5F8D`
- Chakra Cyan: `#4FD1C5`

**Bali Zero**:
- Energy Red: `#E31E24`
- Warm Orange: `#F7931E`
- Sunset Gold: `#FDC830`

---

## 🔧 **FALLBACK BEHAVIOR**

If an asset is missing, the HTML will gracefully fall back to:
- Emoji placeholders (🪷)
- CSS gradients
- SVG shapes

This ensures the workspace always looks good, even without assets!

---

## 📝 **NOTES**

- All assets should be **optimized** for web
- Use **PNG format** for transparency
- Keep **file sizes small** for fast loading
- Maintain **brand consistency** across all visuals

---

**Ready to place your generated assets? Just drag and drop them here!** 🚀

