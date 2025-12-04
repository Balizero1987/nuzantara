# Riri-a-Porter MVP

A personal fashion PWA for Riri, featuring Gaston the AI Stylist.

## 📂 Structure

-   **backend/**: Python FastAPI application (Gaston's brain).
-   **frontend/**: Next.js 15 PWA (The interface).
-   **schema.sql**: Database schema for Supabase.

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1.  Create a new Supabase project.
2.  Go to the **SQL Editor**.
3.  Copy the content of `schema.sql` and run it to create the tables.
4.  Get your `SUPABASE_URL` and `SUPABASE_KEY` from Project Settings > API.

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and Supabase credentials
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:3000`.

## 📱 Features
-   **Gaston**: Chat with the snob Parisian stylist.
-   **Magic VTO**: Upload a photo to see a (mocked) virtual try-on result.
-   **Wardrobe**: View your collection (mocked data).
