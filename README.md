# 🌾 AgroVani — Smart Agricultural Ecosystem & Sustainable Residue Management

🔗 **Live Production Deployment:** [https://agro-vani.vercel.app](https://agro-vani.vercel.app)

> **Bridging the gap between farmers, machinery sellers, and sustainable agriculture through data-driven advisory, circular residue management, and AI-powered matchmaking.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-green?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blueviolet?style=flat)](https://web.dev/progressive-web-apps/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5-orange?style=flat)](https://deepmind.google/technologies/gemini/)

---

## 📌 Problem Statement

1. **Crop Residue Burning & Environmental Degradation:** In agricultural hubs across South Asia, burning crop stubble (paddy residue) generates severe atmospheric pollution and loss of essential soil nutrients.
2. **Asymmetric Access to Buyers & Machinery:** Farmers lack direct access to biomass plants, custom hiring centers, and buyers who can monetize their residue.
3. **Information & Language Barriers:** Actionable agro-meteorological advisories rarely reach farmers in their native tongue or with geospatial context.

---

## 💡 Our Unique Selling Proposition (USP): Automated Stubble & Residue Management

**AgroVani's core USP is the end-to-end automation of crop residue management.** Instead of burning stubble, farmers are instantly matched with verified buyers and machinery rentals capable of clearing or monetizing the waste.

We utilize a **Dual AI Matchmaking System** powered by Google's latest Gemini 1.5 architecture:
- **Standard Matchmaking (Gemini 1.5 Pro):** Instantly analyzes logistics, crop types, and distance to pair farmers with nearby biomass buyers and machinery providers.
- **Advanced Matchmaking (Vertex AI Fine-Tuned Model):** Leverages a specialized Gemini 1.5 model fine-tuned on regional agricultural transaction data to provide hyper-accurate, high-confidence matches and pricing predictions for residue off-take.

---

## 🚀 Key Features

### 📱 1. Installable Mobile App (PWA)
AgroVani is built as a Progressive Web App (PWA). You can install it directly on your iOS or Android device without an app store. 
- **Offline Reliability:** Caches essential routes and resources for low-connectivity rural areas.
- **Native Experience:** Launches from your home screen with a dedicated icon and no browser chrome.

### 🧠 2. AI Matchmaking (Farmers 🤝 Buyers)
- **`POST /api/matchmaking/standard`**: Uses `gemini-1.5-pro` to connect residue supply with local demand.
- **`POST /api/matchmaking/finetuned`**: Uses Google Vertex AI for advanced, context-aware logistical matchmaking.

### 🚜 3. Farmer Portal & Interactive Mapping
- **Interactive Farm Mapping:** Integrated dynamic Leaflet mapping with smooth Framer Motion tracking to pinpoint live driver locations and view nearby machinery providers.
- **Machinery Booking Engine:** Instant discovery and reservation of verified farm implements (tractors, balers, seeders).

### 🌐 4. Multilingual Localization (i18n)
- Seamless real-time context switching across **English**, **Hindi (हिन्दी)**, and **Punjabi (ਪੰਜਾਬੀ)** across all dashboards.

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                   Next.js 14 App Router (PWA)            │
│  ┌───────────────────┐  ┌─────────────────────────────┐  │
│  │   Farmer Portal   │  │   Seller & Admin Portals    │  │
│  │  - Live Tracking  │  │  - Machinery Catalog        │  │
│  │  - Residue Match  │  │  - Booking Dispatch Engine  │  │
│  └─────────┬─────────┘  └──────────────┬──────────────┘  │
│            └──────────────┬────────────┘                 │
│                           ▼                              │
│       Shared UI System (Radix UI / Shadcn / Tailwind)    │
└───────────────────────────┬──────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Matchmaking Engines   │ │     Real-time Services    │
│ - Gemini 1.5 Pro          │ │ - WebSocket Live GPS      │
│ - Vertex AI Fine-Tuned    │ │ - Leaflet / Framer Motion │
└─────────────┬─────────────┘ └─────────────┬─────────────┘
              │                             │
              └─────────────┬───────────────┘
                            ▼
           ┌─────────────────────────────────┐
           │     Supabase / PostgreSQL       │
           │  - Database Tables & Policies   │
           │  - Storage & Geo Queries        │
           └─────────────────────────────────┘
```

---

## 🛠️ Local Development & Setup

### 1. Prerequisites
- Node.js (v18+)
- Google Cloud Platform (GCP) account (for Vertex AI)
- Gemini API Key

### 2. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env.local
```
**Crucial AI Keys Required:**
- `GEMINI_API_KEY`: For the standard matchmaking engine.
- `VERTEX_AI_PROJECT_ID`: Your Google Cloud Project ID.
- `VERTEX_AI_ENDPOINT_ID`: The specific ID of your fine-tuned Gemini model.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your GCP service account JSON file.

### 3. Running Locally
Install dependencies and start the dual-server environment:
```bash
# Terminal 1: Install & start the Next.js PWA
npm install
npm run dev

# Terminal 2: Start the live location WebSocket relay
npm run location:server
```

---

## 🏆 Hackathon Impact & Value Proposition

- **Environmental Sustainability (UN SDG 13 & 15):** Direct impact on reducing stubble burning, air quality hazards, and carbon footprint through intelligent AI-driven residue recycling.
- **Economic Inclusivity (UN SDG 1 & 8):** Eliminates capital expenditure barriers for small farmers by enabling an on-demand machinery rental economy and monetizing waste.
- **Production-Ready Foundation:** Clean Next.js 14 architecture with PWA capabilities, Vertex AI integration, and robust data models.

---

## 👥 Contributors:
Debayan Paul, Annesha Chakraborty, Ayan Chatterjee and Nikita Bose
