# 🔧 CSS Selector Troubleshooting Guide

**When scrapers stop working, fix them in 5 minutes**

---

## 🚨 Problem: Scraper Returns 0 Articles

**Why this happens**:
- Website changed their HTML structure
- CSS class names updated
- Site redesign
- Anti-scraping measures

**Solution**: Update CSS selectors

---

## 🛠️ Quick Fix (5 Minutes)

### **Step 1: Run Diagnostic Tool**

```bash
cd ~/Desktop/NUZANTARA-2/apps/bali-intel-scraper
python3 scripts/diagnose_source.py https://www.example-news-site.com/
```

**Output example**:
```
📊 Page Structure:
   <article> tags: 15
   <h2> tags: 30
   <a> links: 200

💡 Recommended Selectors:
   ✅ CONTAINER: 'article'
   ✅ TITLE: 'h2' or 'h2.article-title'
   ✅ LINK: 'a' or 'h2 a'
```

---

### **Step 2: Manual Verification (Browser)**

1. **Open the news site** in Chrome/Firefox
2. **Right-click on an article headline** → "Inspect Element"
3. **Find the wrapping container**:
   ```html
   <article class="post-item">   ← THIS is your container
       <h2 class="post-title">    ← THIS is your title
           <a href="/article">     ← THIS is your link
   ```

4. **Note the selectors**:
   - Container: `article.post-item`
   - Title: `h2.post-title`
   - Link: `a`

---

### **Step 3: Update Scraper Config**

**Edit**: `scripts/scrape_immigration.py` (or your topic script)

**Find the source**:
```python
SOURCES = {
    "tier2": [
        {
            "name": "Example News Site",
            "url": "https://www.example.com/",
            "selector": "article.post",           # ← OLD (broken)
            "title_selector": "h3.title",         # ← OLD
            "link_selector": "a",                 # ← OLD
        },
```

**Update with new selectors**:
```python
SOURCES = {
    "tier2": [
        {
            "name": "Example News Site",
            "url": "https://www.example.com/",
            "selector": "article.post-item",      # ← NEW
            "title_selector": "h2.post-title",    # ← NEW
            "link_selector": "a",                 # ← SAME
        },
```

---

### **Step 4: Test**

```bash
python3 scripts/scrape_immigration.py
```

**Look for**:
```
  🔍 Example News Site... ✅ 8 articles
```

**If still 0 articles**:
- Double-check selectors in browser
- Try simplified selectors: `article` instead of `article.post-item`
- Check if site requires login/subscription

---

## 📋 Common Selector Patterns

### **News Sites**

**Container**:
- `article`
- `div.post`
- `div.card`
- `li.item`
- `div.story`

**Title**:
- `h2`
- `h3`
- `h2.title`
- `h3.headline`
- `.entry-title`

**Link**:
- `a`
- `h2 a`
- `a.permalink`

### **Government Sites**

**Container**:
- `div.berita`
- `div.news-item`
- `article`
- `li.list-item`

**Title**:
- `h3`
- `h4`
- `.title`
- `.judul`

**Link**:
- `a`
- `.read-more`

---

## 🔍 Advanced: Finding Selectors Like a Pro

### **Method 1: Browser DevTools**

1. Open site → F12 (DevTools)
2. Click "Select Element" icon (top-left)
3. Hover over article → click
4. DevTools highlights the HTML
5. Right-click element → Copy → Copy Selector

### **Method 2: Python Console**

```python
import requests
from bs4 import BeautifulSoup

url = "https://www.example.com/"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.content, 'html.parser')

# Test different selectors
print(len(soup.select('article')))          # Try this
print(len(soup.select('div.post')))         # Or this
print(len(soup.select('li.news-item')))     # Or this

# Check what's inside
first = soup.select('article')[0]
print(first.find('h2').get_text())          # Title?
print(first.find('a').get('href'))          # Link?
```

### **Method 3: Use SelectorGadget**

1. Install: https://selectorgadget.com/
2. Open news site
3. Click SelectorGadget icon
4. Click on article title → it highlights similar items
5. Copy the suggested selector

---

## ⚠️ Common Pitfalls

### **1. Too Specific Selectors**

❌ **Bad**: `div.container > div.row > div.col-md-8 > article.post-item.featured`

✅ **Good**: `article.post-item`

**Why**: Specific selectors break easily. Use minimal specificity.

---

### **2. Class Names with Spaces**

```html
<div class="news item featured">
```

❌ **Wrong**: `div.news item`
✅ **Correct**: `div.news.item.featured` or just `div.news`

---

### **3. Dynamic Class Names**

```html
<div class="post-abc123xyz">  ← Random hash changes daily
```

**Solution**: Use partial matching or parent selector
```python
"selector": "div[class^='post-']"  # Starts with 'post-'
```

---

### **4. JavaScript-Rendered Content**

**Problem**: BeautifulSoup sees empty page (content loads via JS)

**Solution**: Use Playwright (install first)

```bash
pip3 install playwright
playwright install chromium
```

**Update script to use Playwright**:
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://www.example.com/")
    html = page.content()
    browser.close()

soup = BeautifulSoup(html, 'html.parser')
```

---

## 🎯 Selector Testing Checklist

Before deploying updated selectors:

- [ ] Diagnostic tool shows correct selectors
- [ ] Manually verified in browser DevTools
- [ ] Test scraper finds 5+ articles
- [ ] Article titles are readable (not empty/truncated)
- [ ] Links are absolute URLs (start with `http`)
- [ ] No duplicate articles
- [ ] Script completes in <60 seconds

---

## 📞 When to Ask for Help

**Try yourself first** (5-10 min):
1. Run diagnostic tool
2. Check browser DevTools
3. Update selectors
4. Test

**Ask for help if**:
- Site requires login/paywall
- Content is JavaScript-rendered (needs Playwright)
- Site blocks automated requests (403/429 errors)
- Selectors work in diagnostic but fail in scraper

**Where to ask**:
- Slack: #intel-support
- Email: tech@balizero.com

---

## 📊 Selector Update Log

**Keep track of changes**:

| Date | Source | Old Selector | New Selector | Reason |
|------|--------|--------------|--------------|--------|
| 2025-01-15 | Jakarta Post | `article.latest__item` | `article.story` | Site redesign |
| 2025-01-20 | Coconuts Bali | `div.post` | `article` | HTML cleanup |

**Add to**: `data/selector_changes.md`

---

## 🚀 Pro Tips

1. **Test sources monthly** - Sites change often
2. **Have 2-3 backup sources** per tier - If one breaks, others work
3. **Use generic selectors** - `article` > `article.post-item-featured-2023`
4. **Document changes** - Future you will thank current you
5. **Run diagnostic tool first** - Don't guess selectors

---

## ✅ Quick Reference

**Diagnostic Tool**:
```bash
python3 scripts/diagnose_source.py <URL>
```

**Test Single Source**:
```python
# Add to scraper temporarily
SOURCES = {"tier1": [{"name": "Test", "url": "...", ...}]}
```

**Common Fix**:
1. Run diagnostic
2. Copy suggested selectors
3. Update `SOURCES` in script
4. Test
5. Done ✅

---

**Guide Version**: 1.0.0
**Last Updated**: 2025-10-05
**Estimated Fix Time**: 5-10 minutes per source
