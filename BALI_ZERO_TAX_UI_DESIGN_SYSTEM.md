# 🎨 BALI ZERO TAX PLATFORM - UI Design System

**Version:** 1.0
**Date:** 2025-11-05
**Design Philosophy:** Minimal, Professional, Calming

---

## 🎨 Color Palette

### Primary Colors (Inspired by Professional Tax Services)

```css
/* Neutral Base - Clean & Professional */
--color-white: #FFFFFF;
--color-background: #FAFAFA;        /* Very light gray - easy on eyes */
--color-surface: #FFFFFF;
--color-border: #E5E7EB;            /* Light gray borders */

/* Text Colors - Readable & Clear */
--color-text-primary: #1F2937;      /* Dark gray - main text */
--color-text-secondary: #6B7280;    /* Medium gray - secondary text */
--color-text-muted: #9CA3AF;        /* Light gray - hints */

/* Brand Accent - Calm & Trustworthy */
--color-primary: #0891B2;           /* Cyan 600 - professional blue-green */
--color-primary-light: #06B6D4;     /* Cyan 500 - lighter accent */
--color-primary-dark: #0E7490;      /* Cyan 700 - darker shade */
--color-primary-hover: #0E7490;

/* Success - Tax Approved/Paid */
--color-success: #10B981;           /* Green 500 - positive actions */
--color-success-light: #D1FAE5;     /* Green 100 - success background */
--color-success-dark: #059669;      /* Green 600 */

/* Warning - Pending/Review */
--color-warning: #F59E0B;           /* Amber 500 - attention needed */
--color-warning-light: #FEF3C7;     /* Amber 100 - warning background */
--color-warning-dark: #D97706;      /* Amber 600 */

/* Error - Overdue/Rejected */
--color-error: #EF4444;             /* Red 500 - errors */
--color-error-light: #FEE2E2;       /* Red 100 - error background */
--color-error-dark: #DC2626;        /* Red 600 */

/* Info - Information */
--color-info: #3B82F6;              /* Blue 500 - informational */
--color-info-light: #DBEAFE;        /* Blue 100 - info background */
--color-info-dark: #2563EB;         /* Blue 600 */
```

### Color Usage Guide

```
Background:      #FAFAFA (soft white-gray)
Cards/Surfaces:  #FFFFFF (pure white)
Text Primary:    #1F2937 (dark gray)
Text Secondary:  #6B7280 (medium gray)
Borders:         #E5E7EB (light gray)
Primary Action:  #0891B2 (calm cyan)
Hover:           #0E7490 (darker cyan)
```

**Why This Palette:**
- **Soft backgrounds** reduce eye strain (important for long work hours)
- **Cyan tones** are calming and professional (not aggressive)
- **High contrast text** ensures readability
- **Minimal color** keeps focus on data, not decoration

---

## 📐 Typography

### Font Stack

```css
/* System Font Stack - Fast & Native */
--font-sans:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;

/* Monospace for Numbers */
--font-mono:
  "SF Mono",
  "Monaco",
  "Consolas",
  "Liberation Mono",
  "Courier New",
  monospace;
```

### Type Scale

```css
/* Headings */
--text-5xl: 3rem;      /* 48px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Section titles */
--text-3xl: 1.875rem;  /* 30px - Card titles */
--text-2xl: 1.5rem;    /* 24px - Subsections */
--text-xl: 1.25rem;    /* 20px - Large text */

/* Body */
--text-lg: 1.125rem;   /* 18px - Large body */
--text-base: 1rem;     /* 16px - Body text */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Captions */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Usage

```
Page Title:       3xl, semibold
Section Title:    2xl, semibold
Card Title:       xl, medium
Body:             base, normal
Labels:           sm, medium
Hints:            xs, normal
Numbers (Money):  base, mono, semibold
```

---

## 🧩 Spacing System

```css
/* Spacing Scale (Tailwind-inspired) */
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

**Usage:**
- Component padding: `space-4` or `space-6`
- Between sections: `space-8` or `space-12`
- Card margins: `space-4`
- Input padding: `space-3`

---

## 🔲 Components

### Buttons

```css
/* Primary Button */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  transition: background-color 200ms ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

/* Success Button */
.btn-success {
  background-color: var(--color-success);
  color: var(--color-white);
}

/* Danger Button */
.btn-danger {
  background-color: var(--color-error);
  color: var(--color-white);
}
```

### Cards

```css
.card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.card-body {
  color: var(--color-text-secondary);
}
```

### Input Fields

```css
.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: var(--text-base);
  background-color: var(--color-white);
  transition: border-color 200ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}
```

### Status Badges

```css
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 500;
}

.badge-success {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.badge-warning {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.badge-error {
  background-color: var(--color-error-light);
  color: var(--color-error-dark);
}

.badge-info {
  background-color: var(--color-info-light);
  color: var(--color-info-dark);
}
```

---

## 📱 Layout

### Container

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.container-narrow {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
```

### Grid

```css
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}
```

---

## 🎭 Status Colors

### Calculation Status

```
Draft:          Gray (#6B7280)
Pending Review: Amber (#F59E0B)
Approved:       Green (#10B981)
Rejected:       Red (#EF4444)
Filed:          Blue (#3B82F6)
```

### Payment Status

```
Unpaid:         Amber (#F59E0B)
Paid:           Green (#10B981)
Overdue:        Red (#EF4444)
Partial:        Blue (#3B82F6)
```

### Consultant Roles

```
Tax Manager:    Cyan (#0891B2) - Primary
Tax Expert:     Blue (#3B82F6) - Professional
Tax Consultant: Purple (#8B5CF6) - Standard
Customer Service: Gray (#6B7280) - Support
```

---

## 🖼️ Icons

**Icon Library:** Lucide Icons (minimal, consistent)

**Usage:**
- 24px for buttons
- 20px for inline text
- 16px for small indicators
- 32px+ for headers

**Common Icons:**
```
Home:           home
Clients:        users
Calculator:     calculator
Documents:      file-text
Settings:       settings
Approval:       check-circle
Warning:        alert-circle
Success:        check
Error:          x-circle
Info:           info
Money:          dollar-sign
Calendar:       calendar
Download:       download
Sync:           refresh-cw
```

---

## 📐 Shadows

```css
/* Minimal shadows - subtle depth */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.05);

/* Hover shadows */
--shadow-hover: 0 10px 20px rgba(0, 0, 0, 0.1);
```

---

## 🎯 Design Principles

### 1. **Minimal is More**
- Clean layouts, plenty of white space
- No unnecessary decorations
- Focus on data and function

### 2. **Readable First**
- High contrast text
- Generous spacing
- Clear hierarchy

### 3. **Calming Colors**
- Soft backgrounds (#FAFAFA)
- No bright, aggressive colors
- Cyan accent (professional, trustworthy)

### 4. **Consistent Spacing**
- Use spacing scale (4, 8, 12, 16, 24px)
- Consistent padding in all cards
- Predictable layouts

### 5. **Professional Feel**
- Clean borders, subtle shadows
- No gradients, no animations (unless functional)
- Business-like, not playful

### 6. **Data-Focused**
- Numbers use monospace font
- Currency formatted consistently
- Clear labels for all fields

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Mobile */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large Desktop */
```

---

## 🚫 What NOT to Do

❌ **No cartoons or illustrations** (too playful)
❌ **No bright, vibrant colors** (too aggressive)
❌ **No complex animations** (distracting)
❌ **No cluttered layouts** (overwhelming)
❌ **No Comic Sans or decorative fonts** (unprofessional)
❌ **No auto-playing anything** (annoying)

---

## ✅ Example Screen

```
┌─────────────────────────────────────────────────────────┐
│ [Header: White background, border-bottom]               │
│                                                         │
│  🏢 BALI ZERO TAX          [👤 Veronika ▼]            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Body: #FAFAFA background, generous padding]           │
│                                                         │
│  Dashboard / My Clients                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Card: White, subtle border, shadow-sm]         │  │
│  │                                                  │  │
│  │ 👥 Your Clients                                 │  │
│  │                                                  │  │
│  │ ┌────────────────────────────────────────────┐ │  │
│  │ │ PT Example Indonesia                       │ │  │
│  │ │ NPWP: 12.345.678.9-123.000                 │ │  │
│  │ │ [✅ Active] [View Profile]                 │ │  │
│  │ └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Colors Used:
- Background: #FAFAFA (soft gray)
- Card: #FFFFFF (white)
- Border: #E5E7EB (light gray)
- Text: #1F2937 (dark gray)
- Badge: #10B981 (success green)
- Button: #0891B2 (primary cyan)
```

---

## 🎨 Tailwind CSS Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891B2',
          light: '#06B6D4',
          dark: '#0E7490',
        },
        background: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
}
```

---

**Design System Status:** ✅ Ready for Implementation
**UI Library:** Tailwind CSS + Shadcn UI components
**Icons:** Lucide Icons
**Philosophy:** Minimal, Professional, Calming

---

*End of Design System*
