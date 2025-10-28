# 📝 Article Setup Guide - Bali Zero Website

## 🎯 Overview
This guide explains how to properly set up articles in the Bali Zero website to avoid common errors and ensure consistent, professional styling.

## 📁 File Structure
```
website/
├── content/articles/           # Markdown article files
│   ├── article-slug.md
│   └── ...
├── components/article/
│   ├── article-content.tsx     # Main article component
│   └── article-hero.tsx
├── app/article/[slug]/
│   └── page.tsx               # Article page component
└── lib/
    └── api.ts                 # Article data processing
```

## 🔧 Component Architecture

### 1. Article Content Component (`components/article/article-content.tsx`)

**Key Features:**
- Uses **inline styles** for maximum CSS specificity
- Implements **magazine-style typography**
- Includes **category-specific colors**
- Features **responsive design** with `clamp()`
- Has **fog effect overlay** for cinematic feel

**Required Props:**
```typescript
interface ArticleContentProps {
  content: string      // HTML content from markdown
  excerpt: string     // Article excerpt
  category?: string   // Category for styling (property, tax, ai, immigration, business)
}
```

**Category Colors:**
- `property` → Red (#dc2626)
- `tax` → Aqua Blue (#0891b2)
- `ai` → Amber Gold (#d97706)
- `immigration` → Purple (#7c3aed)
- `business` → Green (#059669)

### 2. Article Page Component (`app/article/[slug]/page.tsx`)

**Critical:** Must pass `category` prop to `ArticleContent`:
```typescript
<ArticleContent 
  content={article.content} 
  excerpt={article.excerpt} 
  category={article.category}  // ← ESSENTIAL!
/>
```

### 3. API Layer (`lib/api.ts`)

**Process:**
1. Reads markdown file from `content/articles/`
2. Parses frontmatter with `gray-matter`
3. Converts markdown to HTML with `marked.parse()`
4. Returns article object with HTML content

## 📝 Creating New Articles

### Step 1: Create Markdown File
```bash
# Create new article in content/articles/
touch content/articles/my-article-slug.md
```

### Step 2: Add Frontmatter
```markdown
---
title: "Your Article Title"
excerpt: "Compelling excerpt that hooks readers"
category: "property"  # property, tax, ai, immigration, business
image: "/path/to/hero-image.jpg"
publishedAt: "2025-01-01"
updatedAt: "2025-01-01"
readTime: 8
author: "Bali Zero Research Team"
featured: true
tags: ["tag1", "tag2", "tag3"]
relatedArticles: ["other-article-slug"]
---
```

### Step 3: Write Content
- Use standard markdown syntax
- Include images with proper alt text
- Add captions with `<em>` tags
- Use `##` for main headings, `###` for subheadings

### Step 4: Add to API (`lib/api.ts`)
Add article to `mockArticles` array:
```typescript
{
  slug: 'my-article-slug',
  title: "Your Article Title",
  excerpt: "Compelling excerpt...",
  category: 'property',
  image: '/path/to/hero-image.jpg',
  publishedAt: '2025-01-01',
  updatedAt: '2025-01-01',
  readTime: 8,
  author: 'Bali Zero Research Team',
  featured: true,
  content: 'Full article in /content/articles/my-article-slug.md',
  tags: ['tag1', 'tag2', 'tag3'],
  relatedArticles: ['other-article-slug']
}
```

## 🎨 Design System

### Typography
- **Headings:** Georgia serif, large sizes (42px H2, 32px H3)
- **Body:** Inter sans-serif, responsive sizing (18-22px)
- **Line Height:** 1.8 for body, 1.2-1.3 for headings
- **Spacing:** Generous margins (48px between paragraphs)

### Layout
- **Max Width:** 680px for content, 1200px for container
- **Padding:** 80px vertical, 24px horizontal
- **Background:** White with subtle fog overlay

### Visual Elements
- **Category Badge:** Colored background, uppercase text
- **Excerpt:** Italic, large font (28px), left border
- **Images:** Full width, rounded corners, shadows
- **Links:** Category-colored, underlined
- **Tags:** Rounded pills, hover effects

## 🚨 Common Errors & Solutions

### Error 1: "Design not applying"
**Cause:** Missing `category` prop
**Solution:** Ensure `category={article.category}` is passed to `ArticleContent`

### Error 2: "Styles not working"
**Cause:** CSS specificity issues
**Solution:** Component uses inline styles for maximum specificity

### Error 3: "Images not loading"
**Cause:** Incorrect image paths
**Solution:** Use absolute paths from `/public` directory

### Error 4: "Server not updating"
**Cause:** Next.js caching
**Solution:** 
```bash
# Force rebuild
rm -rf .next
npm run dev
```

## 🔄 Development Workflow

### 1. Make Changes
Edit `article-content.tsx` or markdown files

### 2. Restart Server
```bash
cd website
pkill -f "npm run dev"
npm run dev
```

### 3. Test Article
Visit `http://localhost:3000/article/your-article-slug`

### 4. Verify Elements
- [ ] Category badge visible and colored
- [ ] Spacing looks generous
- [ ] Images load correctly
- [ ] Typography is readable
- [ ] Fog effect present
- [ ] Bali Zero logo at bottom
- [ ] Read Next section present

## 📊 Performance Considerations

### Image Optimization
- Use `sips` to resize images:
```bash
sips -Z 1200 /path/to/image.jpg --out /path/to/resized-image.jpg
```

### Content Length
- Target: 1,500+ words per article
- Include images every 400-500 words
- Use pull-quotes to break up text

### SEO
- Descriptive titles and excerpts
- Proper meta tags in page component
- Alt text for all images
- Structured data markup

## 🎯 Best Practices

### Content
1. **Write compelling headlines** that hook readers
2. **Use data and statistics** to support arguments
3. **Include expert quotes** for credibility
4. **Add visual breaks** with images and pull-quotes
5. **End with clear CTAs** for engagement

### Technical
1. **Always pass category prop** to ArticleContent
2. **Use semantic HTML** in markdown
3. **Optimize images** before uploading
4. **Test on mobile** devices
5. **Validate HTML** output

### Design
1. **Maintain consistent spacing** throughout
2. **Use category colors** appropriately
3. **Ensure good contrast** for readability
4. **Keep mobile-first** approach
5. **Test different screen sizes**

## 🚀 Deployment Checklist

Before deploying new articles:

- [ ] Article appears correctly in browser
- [ ] All images load properly
- [ ] Category badge displays with correct color
- [ ] Spacing looks professional
- [ ] Mobile responsive design works
- [ ] SEO meta tags are complete
- [ ] Related articles link correctly
- [ ] No console errors
- [ ] Performance is acceptable

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify all props are passed correctly
3. Ensure server is restarted after changes
4. Check image paths are correct
5. Validate markdown syntax

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Maintainer:** Bali Zero Development Team
