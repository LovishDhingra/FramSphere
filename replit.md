# Workspace

## Overview

AI-powered Farmer Market Intelligence Platform — helps Indian farmers detect price exploitation, find best markets, and get AI-driven selling advice. Built on a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Recharts, wouter
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2) with custom RAG pipeline

## Features

1. **RAG Pipeline** (`artifacts/api-server/src/lib/rag.ts`)
   - In-memory vector store with cosine similarity search
   - Embedding layer using TF-IDF approximation
   - Retrieval layer finds relevant context for user queries
   - Generation layer uses OpenAI GPT to produce answers

2. **Price Fairness Engine** — detects middleman exploitation by comparing offered price vs mandi modal price and MSP. Produces anomaly score (0-1) and fair/suspicious/exploitative verdict.

3. **AI Chatbot** (`/chat`) — RAG-powered assistant using the vector store seeded with mandi knowledge, MSP data, and farming advisories.

4. **Dashboard** — Fair Price Index, active alerts, top gainers/losers, top crops table with MSP comparison.

5. **Price Explorer** — Browse and filter 45 days of historical mandi price data across 14+ mandis and 10+ crops.

6. **Market Finder** — Recommend best markets for a crop based on current prices.

7. **Fairness Analyzer** — Analyze any transaction for exploitation risk.

8. **Weather Predictions** — 7-day price forecast with weather impact modeling.

9. **Alerts Feed** — Exploitation alerts, MSP violations, market crashes.

10. **Government Schemes** — Browse PM-KISAN, PMFBY, KCC, PMKSY, e-NAM and more.

## Architecture

```
artifacts/
  farmer-market/     # React + Vite frontend
  api-server/        # Express API server
    src/
      lib/
        rag.ts       # RAG pipeline + price fairness engine
      routes/
        prices.ts    # Mandi price data endpoints
        msp.ts       # MSP data endpoints
        markets.ts   # Market listings + recommendations
        fairness.ts  # Price fairness analysis + anomalies
        chat.ts      # RAG chatbot endpoints
        alerts.ts    # Alert feed
        schemes.ts   # Government schemes
        weather.ts   # Weather-based price predictions
        dashboard.ts # Dashboard summary data

lib/
  api-spec/          # OpenAPI spec (source of truth)
  api-client-react/  # Generated React Query hooks
  api-zod/           # Generated Zod validation schemas
  db/                # Drizzle ORM schema + DB client
    src/schema/
      mandiPrices.ts
      msp.ts
      markets.ts
      alerts.ts
      schemes.ts
      chatMessages.ts
      anomalies.ts
  integrations-openai-ai-server/  # OpenAI client wrapper
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Data

- 14+ markets seeded across India (Delhi, Punjab, Maharashtra, MP, Rajasthan, Karnataka, Gujarat, Bihar)
- 10+ crops with 45 days of historical price data (~1440 records)
- 14 MSP records for all major crops (2024-25)
- 7 active exploitation/anomaly alerts
- 7 government schemes with eligibility and benefits

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
