# GitHub Spark - Bali Zero Tax Platform UI

## 🎯 App Description
Create a minimal, professional tax management dashboard for Bali Zero tax consultants.

## 🎨 Design Requirements

### Color Palette (Calm & Professional)
```css
Background: #FAFAFA
Surface: #FFFFFF
Border: #E5E7EB
Text Primary: #1F2937
Text Secondary: #6B7280
Primary: #0891B2 (cyan)
Primary Hover: #0E7490
Success: #10B981
Warning: #F59E0B
Error: #EF4444
```

### Typography
- Font: System font stack (San Francisco, Segoe UI, Roboto)
- Numbers: Monospace font for money amounts
- Sizes: 48px titles, 16px body, 14px small

### Design Principles
- ❌ NO cartoons, NO decorations, NO animations
- ✅ Minimal, clean, data-focused
- ✅ Generous white space
- ✅ High contrast text (readability)
- ✅ Soft backgrounds (easy on eyes)

---

## 📱 Screens to Build

### 1. Login Screen
```
Simple centered form:
- Email input
- Password input
- Login button (cyan #0891B2)
- "BALI ZERO TAX" logo text
- Clean white background
```

### 2. Dashboard (Main Screen)
```
Header:
- Logo "🏢 BALI ZERO TAX"
- User name + avatar (right side)

Stats Cards (4 cards in grid):
- Total Clients (number)
- Pending Reports (number)
- Upcoming Payments (number)
- This Month Tax (Rp amount)

Client List:
- Search bar
- Filter button
- [+ New Client] button (top right)

Each client card shows:
- Company name (bold, 18px)
- NPWP, KBLI, Status badge
- Last report, next payment
- Buttons: [Calculate Tax] [View Profile] [Documents]
```

### 3. New Client Form
```
Form fields:
- Company Name *
- NPWP
- Email *
- Phone
- KBLI Code
- Legal Entity Type (dropdown: PT, PT PMA, CV, etc.)
- Documents Folder URL

Buttons:
- [Create Client] (primary cyan)
- [Cancel] (secondary gray)
```

### 4. Company Profile
```
Tabs: [Info] [Financials] [Tax] [Invoices]

Info tab shows:
- All company details
- Assigned consultant
- Jurnal.id connection status
- [Sync from Jurnal] button
- Internal notes (text area)
```

---

## 🔌 API Integration

### Backend Base URL
```javascript
const API_BASE = 'http://localhost:8080/api/tax';
// Production: 'https://nuzantara-backend.fly.dev/api/tax'
```

### Authentication
```javascript
// 1. Login
POST ${API_BASE}/auth/login
Body: { email, password }
Response: { token, user }

// Store token
localStorage.setItem('tax_token', token);

// 2. Use token in all requests
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Companies API
```javascript
// List companies
GET ${API_BASE}/companies?status=active&page=1&limit=20

// Create company
POST ${API_BASE}/companies
Body: { company_name, legal_entity_type, email, ... }

// Get single company
GET ${API_BASE}/companies/${id}

// Update company
PUT ${API_BASE}/companies/${id}
Body: { ...updates }
```

---

## 🧩 Components to Create

### StatCard
```jsx
<StatCard>
  <label>Total Clients</label>
  <value>12</value>
  <change>↗ +2 this month</change>
</StatCard>
```

### ClientCard
```jsx
<ClientCard>
  <name>PT Example Indonesia</name>
  <meta>NPWP: ... • KBLI: ...</meta>
  <badge status="active">Active</badge>
  <actions>
    <Button primary>Calculate Tax</Button>
    <Button secondary>View Profile</Button>
  </actions>
</ClientCard>
```

### Button
```jsx
<Button primary>Text</Button>  // Cyan background
<Button secondary>Text</Button> // White with border
<Button success>Text</Button>   // Green
```

### Badge
```jsx
<Badge status="active">Active</Badge>    // Green
<Badge status="pending">Pending</Badge>  // Yellow
<Badge status="error">Overdue</Badge>    // Red
```

---

## 📋 Features Required

### Must Have:
1. ✅ Login with JWT (store token in localStorage)
2. ✅ Dashboard with stats
3. ✅ Client list with search
4. ✅ Create new client form
5. ✅ Company profile view
6. ✅ Logout button
7. ✅ Protected routes (redirect to login if no token)

### Nice to Have:
- Search clients by name/NPWP
- Filter by status
- Pagination (next/prev)
- Loading states
- Error handling (toast notifications)

---

## 🎯 User Flow

```
1. User visits app
   → If no token: show Login
   → If has token: show Dashboard

2. Login
   → Enter email/password
   → POST /auth/login
   → Store token
   → Redirect to Dashboard

3. Dashboard
   → Fetch companies (GET /companies)
   → Show stats cards
   → Show client list
   → Click [+ New Client] → Show form

4. Create Client
   → Fill form
   → POST /companies
   → Redirect to Dashboard
   → Show success message

5. View Client
   → Click client card
   → Fetch details (GET /companies/:id)
   → Show profile page
```

---

## 🔐 Test Credentials

```
Email: angel@balizero.com
Password: demo123
```

---

## 🎨 Example UI Code Reference

Look at file: `BALI_ZERO_TAX_UI_DRAFT.html`
This shows the exact design we want.

Key elements:
- Clean header with logo + user menu
- Stats grid (4 columns)
- White cards with subtle borders
- Search bar with filter
- Client items with hover effect
- Form with proper spacing
- Buttons with cyan primary color

---

## ✅ Validation Rules

### Company Form:
- company_name: required, min 1 char
- legal_entity_type: required, must be one of: PT, PT_PMA, CV, FIRMA, UD, PERORANGAN
- email: required, valid email format
- npwp: optional, format: XX.XXX.XXX.X-XXX.XXX
- phone: optional
- kbli_code: optional, 5 digits

### Login Form:
- email: required, valid email
- password: required, min 1 char

---

## 🚫 What NOT to Do

❌ Don't add: charts, graphs, animations, illustrations
❌ Don't use: bright colors, gradients, shadows
❌ Don't create: complex workflows yet
✅ Keep it: simple, minimal, data-focused

---

## 📱 Responsive

- Mobile: Stack cards vertically
- Tablet: 2 columns
- Desktop: 4 columns for stats, 3 for clients

---

## 🎯 Priority Order

1. Login screen (most important!)
2. Dashboard with client list
3. Create client form
4. Company profile view
5. Search/filter functionality

---

## 💡 Pro Tips for Spark

- Use Tailwind CSS (already knows these classes)
- Use React hooks (useState, useEffect)
- Use fetch API for HTTP requests
- Keep components small and focused
- Handle loading states (show "Loading...")
- Handle errors (show error message)

---

## 📦 What to Return

When done, Spark should give you:
- Live preview URL
- GitHub repository with code
- Deployable to Vercel/Netlify/Cloudflare Pages

---

**Start with:** Login screen + Dashboard
**Then add:** Create client form
**Finally:** Profile view

Keep it minimal and professional! 🚀
