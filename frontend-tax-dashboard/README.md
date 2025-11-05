# Bali Zero Tax Dashboard

Professional tax management dashboard for Bali Zero's tax department.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:8080`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Test Credentials

```
Email: angel@balizero.com
Password: demo123
```

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── Badge.jsx
│   ├── Button.jsx
│   ├── ClientCard.jsx
│   ├── Layout.jsx
│   └── StatCard.jsx
├── context/         # React contexts
│   └── AuthContext.jsx
├── pages/           # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CompanyForm.jsx
│   └── CompanyProfile.jsx
├── utils/           # Utility functions
│   └── api.js
├── App.jsx          # Main app with routing
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## 🎨 Design System

- **Background**: #FAFAFA (soft gray)
- **Primary**: #0891B2 (calm cyan)
- **Success**: #10B981 (green)
- **Warning**: #F59E0B (amber)
- **Error**: #EF4444 (red)

## 🔌 API Integration

The frontend connects to backend at `/api/tax` (proxied through Vite).

Endpoints:
- `POST /auth/login` - User authentication
- `GET /auth/me` - Current user info
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /companies/:id` - Get company details
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

## 🚢 Deployment

### Cloudflare Pages

```bash
npm run build
# Upload dist/ folder to Cloudflare Pages
```

Environment variables:
- `VITE_API_BASE` - Backend API URL (production)

### Vercel

```bash
vercel
```

### Netlify

```bash
npm run build
# Upload dist/ folder or connect GitHub repo
```

## 📝 Features

- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Company Management (CRUD)
- ✅ Search & Filter
- ✅ Responsive Design
- ✅ Clean, Minimal UI
- ✅ Error Handling
- ✅ Loading States

## 🔧 Backend Requirements

Backend must be running with the following endpoints:
- Auth endpoints at `/api/tax/auth/*`
- Company endpoints at `/api/tax/companies/*`

See backend documentation for setup instructions.

## 📄 License

Copyright © 2025 Bali Zero
