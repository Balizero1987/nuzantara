# 🎨 Bali Zero Website - Image Generation Prompts

Generated: 2025-01-23
For: ImagineArt.ai (https://www.imagineart.ai/)

---

## 📋 Instructions

1. Go to https://www.imagineart.ai/
2. Login with your account
3. For each image below:
   - Copy the **Prompt**
   - Copy the **Negative Prompt**
   - Set the **Aspect Ratio** and **Style**
   - Generate
   - Download the image
   - Save it as the specified **Filename** in `website/public/`

---

## 🌅 IMAGE 1: Hero Section

**Filename:** `hero-bali-ricefield-sunrise.jpg`
**Aspect Ratio:** 16:9
**Style:** Realistic (or Flux-Dev for ultra-quality)

**Prompt:**
```
Ultra-realistic aerial photograph of Bali rice terraces at golden hour sunrise. Emerald green terraced rice paddies with intricate water systems reflecting golden light, morning mist rising from valleys, dramatic warm sunlight breaking through clouds, Mount Agung volcano silhouette in background, traditional Balinese subak irrigation system visible, professional editorial photography style, cinematic composition, National Geographic quality, 8K resolution
```

**Negative Prompt:**
```
cartoon, anime, illustration, painting, drawing, low quality, blurry, distorted, ugly, oversaturated, people, tourists, modern buildings, cars, text, watermark
```

**Usage:** Hero section background image

---

## 🏢 IMAGE 2: Marco's PT PMA Journey

**Filename:** `article-marco-pt-pma-journey.jpg`
**Aspect Ratio:** 16:9
**Style:** Realistic

**Prompt:**
```
Professional realistic photograph of modern co-working space in Bali Indonesia. Elegant wooden desks with MacBooks, tropical plants, traditional Balinese architecture elements mixed with contemporary design, warm natural lighting through large windows showing rice terraces outside, Indonesian businesspeople collaborating, laptop screens showing business documents, professional editorial photography, McKinsey style, shallow depth of field
```

**Negative Prompt:**
```
cartoon, anime, illustration, low quality, blurry, cluttered, messy, dark, gloomy, text, watermark
```

**Usage:** Featured article #1 (large card)

---

## 🕉️ IMAGE 3: Tri Hita Karana Cultural Scene

**Filename:** `article-tri-hita-karana.jpg`
**Aspect Ratio:** 1:1
**Style:** Realistic

**Prompt:**
```
Ultra-realistic photograph of traditional Balinese temple ceremony during golden hour. Intricate stone carvings, colorful ceremonial offerings (canang sari), incense smoke rising, traditional Balinese people in ceremonial dress, tropical flowers, warm sunset lighting, spiritual atmosphere, cultural authenticity, professional editorial photography, National Geographic style, rich colors, 8K quality
```

**Negative Prompt:**
```
cartoon, anime, illustration, modern buildings, tourists, selfies, low quality, blurry, text, watermark
```

**Usage:** Featured article #2 (small card)

---

## 🛂 IMAGE 4: KITAS Visa Guide

**Filename:** `article-kitas-visa-guide.jpg`
**Aspect Ratio:** 1:1
**Style:** Realistic

**Prompt:**
```
Professional realistic photograph of elegant minimalist desk setup with Indonesian passport, visa documents, and KITAS residence permit card. Clean modern office environment, warm natural lighting, laptop displaying Indonesian immigration website, wooden desk surface, tropical plants in background, professional editorial photography, McKinsey consulting style, sharp focus on documents, shallow depth of field
```

**Negative Prompt:**
```
cartoon, anime, illustration, messy, cluttered, dark, blurry, low quality, text watermark, people faces
```

**Usage:** Featured article #3 (small card)

---

## 🏡 IMAGE 5: Finding Home in Bali

**Filename:** `article-bali-home-villa.jpg`
**Aspect Ratio:** 16:9
**Style:** Realistic

**Prompt:**
```
Ultra-realistic architectural photograph of luxury Balinese villa entrance. Traditional candi bentar split gate, tropical garden with frangipani trees, modern tropical architecture blending Balinese tradition, infinity pool visible, rice terrace views in background, warm golden hour lighting, lush greenery, professional real estate photography, editorial quality, 8K resolution
```

**Negative Prompt:**
```
cartoon, anime, illustration, people, tourists, cars, modern buildings, low quality, blurry, overcast, text, watermark
```

**Usage:** Featured article #4 (medium card)

---

## ✅ After Generation Checklist

Once all images are generated and saved in `website/public/`:

1. ✅ All 5 images saved with correct filenames
2. ✅ Image quality checked (ultra-realistic, McKinsey editorial style)
3. ✅ Update components if filenames changed:
   - `website/components/hero-section.tsx` (line 79)
   - `website/components/featured-articles.tsx` (lines 20, 29, 38, 47)
4. ✅ Git add, commit, push
5. ✅ Deploy website to preview

---

## 🎨 Alternative: Auto-Generation via API

If you want to auto-generate via API instead:

```bash
# Set API key
export IMAGINEART_API_KEY="vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp"

# Run generation script
node scripts/generate-website-images.mjs
```

Note: Script may fail in some environments due to network restrictions.

---

**Generated by:** W3 (Claude Code)
**Date:** 2025-01-23
**Project:** Bali Zero Insights Website
**Next.js Version:** 16.0.0
