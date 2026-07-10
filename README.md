
Claude finished the response
https://github.com/LovishDhingra/FramSphere

make a  beautiful readme  file to for this repo


Synthesized repository details and architected polished README documentation
Synthesized repository details and architected polished README documentation
Pulled the details straight from your replit.md (stack, features, architecture, commands, seeded data) and turned it into a full README with badges, a features table, architecture tree, and setup steps. Just drop it in the repo root as README.md.


Readme
Document · MD 

Want to be notified when Claude responds?





Claude is AI and can make mistakes. Please double-check cited sources.


Readme · MD
# 🌾 FramSphere
 
**AI-powered Farmer Market Intelligence Platform** — helping Indian farmers detect price exploitation, discover the best markets to sell in, and get AI-driven selling advice.
 
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?logo=postgresql&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
 
---
 
## 📖 Overview
 
Millions of small and marginal farmers in India lose income every season to **middleman exploitation** — being paid far below the mandi (market) modal price or the government's Minimum Support Price (MSP). **FramSphere** is a full-stack platform that arms farmers with real market data and AI-driven insight so they can sell at a fair price.
 
It combines live/seeded mandi price data, MSP benchmarks, and a Retrieval-Augmented Generation (RAG) chatbot to:
 
- 🔍 Detect when a farmer is being offered an exploitative price
- 📊 Recommend the best nearby markets to sell a given crop
- 💬 Answer farming and market questions through an AI assistant
- 🌦️ Forecast price movement using weather-aware modeling
- 🏛️ Surface relevant government schemes (PM-KISAN, PMFBY, KCC, and more)
---
 
## ✨ Features
 
| Feature | Description |
|---|---|
| 🧠 **RAG Pipeline** | In-memory vector store with cosine similarity search, TF-IDF-based embeddings, and an OpenAI GPT generation layer for grounded, context-aware answers |
| ⚖️ **Price Fairness Engine** | Compares an offered price against the mandi modal price and MSP to produce an anomaly score (0–1) and a **fair / suspicious / exploitative** verdict |
| 💬 **AI Chatbot** | RAG-powered assistant seeded with mandi knowledge, MSP data, and farming advisories |
| 📈 **Dashboard** | Fair Price Index, active alerts, top gainers/losers, and an MSP comparison table |
| 🔎 **Price Explorer** | Browse and filter 45 days of historical mandi price data across 14+ mandis and 10+ crops |
| 🗺️ **Market Finder** | Recommends the best markets to sell a given crop based on current prices |
| 🧪 **Fairness Analyzer** | Run any transaction through the exploitation-risk analysis engine |
| ⛅ **Weather Predictions** | 7-day price forecasts with weather impact modeling |
| 🚨 **Alerts Feed** | Real-time feed of exploitation alerts, MSP violations, and market crashes |
| 🏛️ **Government Schemes** | Browse PM-KISAN, PMFBY, KCC, PMKSY, e-NAM, and more |
 
---
 
## 🛠️ Tech Stack
 
| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces |
| **Language** | TypeScript 5.9 |
| **Runtime** | Node.js 24 |
| **API Framework** | Express 5 |
| **Database** | PostgreSQL + Drizzle ORM |
| **Validation** | Zod (`zod/v4`), `drizzle-zod` |
| **API Codegen** | Orval (generated from an OpenAPI spec) |
| **Build** | esbuild (CJS bundle) |
| **Frontend** | React + Vite, Tailwind CSS, shadcn/ui, Recharts, wouter |
| **AI** | OpenAI (GPT-5.2) via Replit AI Integrations, with a custom RAG pipeline |
| **Auth** | Clerk |
 
---
 
## 🏗️ Architecture
 
```
artifacts/
  farmer-market/          # React + Vite frontend
  api-server/              # Express API server
    src/
      lib/
        rag.ts             # RAG pipeline + price fairness engine
      routes/
        prices.ts          # Mandi price data endpoints
        msp.ts             # MSP data endpoints
        markets.ts         # Market listings + recommendations
        fairness.ts        # Price fairness analysis + anomalies
        chat.ts            # RAG chatbot endpoints
        alerts.ts          # Alert feed
        schemes.ts         # Government schemes
        weather.ts         # Weather-based price predictions
        dashboard.ts        # Dashboard summary data
 
lib/
  api-spec/                # OpenAPI spec (source of truth)
  api-client-react/        # Generated React Query hooks
  api-zod/                 # Generated Zod validation schemas
  db/                      # Drizzle ORM schema + DB client
    src/schema/
      mandiPrices.ts
      msp.ts
      markets.ts
      alerts.ts
      schemes.ts
      chatMessages.ts
      anomalies.ts
  integrations-openai-ai-server/   # OpenAI client wrapper
```
 
The frontend never talks to the database directly — it consumes a typed API client generated from the OpenAPI spec (`lib/api-spec`), which is also the source for the Zod validation schemas used on the server. This keeps the frontend, backend, and validation layer in sync from a single source of truth.
 
---
 
## 🚀 Getting Started
 
### Prerequisites
 
- Node.js **24**
- pnpm
- PostgreSQL database (a `DATABASE_URL` connection string)
- An OpenAI API key
- A Clerk account (for authentication)
### 1. Clone the repo
 
```bash
git clone https://github.com/LovishDhingra/FramSphere.git
cd FramSphere
```
 
### 2. Install dependencies
 
```bash
pnpm install
```
 
### 3. Configure environment variables
 
Create a `.env` file (or update the existing one) with:
 
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | [Get one here](https://platform.openai.com/api-keys) |
| `CLERK_SECRET_KEY` | From your Clerk Dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | From your Clerk Dashboard → API Keys (starts with `pk_`) |
| `DATA_GOV_IN_API_KEY` *(optional)* | From [data.gov.in](https://data.gov.in) — enables live mandi price sync. Without it, the app falls back to seeded historical data. |
 
### 4. Set up the database
 
```bash
pnpm --filter @workspace/db run push
```
 
This creates all tables. Run it once after cloning, and again whenever the schema changes.
 
### 5. Run the app
 
```bash
# API server (Express, port 8080)
pnpm --filter @workspace/api-server run dev
 
# Frontend (React + Vite)
pnpm --filter @workspace/farmer-market run dev
```
 
---
 
## 📜 Key Commands
 
| Command | Description |
|---|---|
| `pnpm run typecheck` | Full typecheck across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas from the OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |
| `pnpm --filter @workspace/api-server run dev` | Run the API server locally |
 
---
 
## 📊 Seeded Data
 
- **14+ markets** across India — Delhi, Punjab, Maharashtra, Madhya Pradesh, Rajasthan, Karnataka, Gujarat, Bihar
- **10+ crops** with **45 days** of historical price data (~1,440 records)
- **14 MSP records** for major crops (2024–25 season)
- **7 active** exploitation/anomaly alerts
- **7 government schemes** with eligibility and benefit details
---
 
## 🤝 Contributing
 
Contributions, issues, and feature requests are welcome. If you'd like to contribute:
 
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request
---
 
## 📄 License
 
This project is available under the MIT License.
 
---
 
<p align="center">Built to give India's farmers a fairer market. 🌱</p>
 
