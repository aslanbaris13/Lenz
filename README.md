# Lenz 🛍️

> Multi-agent AI co-pilot for marketplace sellers — turn a single product photo into a complete, platform-ready listing, and keep your catalog healthy with autonomous agents.

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat&logo=next.js&logoColor=white)
![fal.ai](https://img.shields.io/badge/fal.ai-Visual_Generation-FF4D4D?style=flat)
![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=flat&logo=openai&logoColor=white)
![Challenge](https://img.shields.io/badge/Fal.ai_API-Challenge-blue?style=flat)

> 🚀 Built for the **Fal.ai API Challenge** by **Team Lenz**

---

## Overview

Lenz is a **multi-agent AI platform for e-commerce / marketplace sellers** that combines two capabilities behind one workflow:

1. **Listing Studio** — from a *single* product image, Lenz generates marketplace-ready visuals (multiple angles, product & lifestyle shots, short video) **and** an auto-filled listing (title, description, specs, SEO tags) — tailored per marketplace.
2. **Catalog Intelligence** — autonomous agents continuously analyze your existing SKUs and surface a prioritized, root-cause–driven action list.

The frontend orchestrates onboarding, a listing generator, and a per-SKU intelligence dashboard.

---

## Multi-Agent Architecture

A central **Orchestrator** fans out to specialist agents in parallel (`asyncio.gather`), then synthesizes the findings into a **root cause + prioritized actions** report with GPT-4o.

| Agent | What it does |
|---|---|
| **Orchestrator** | Fan-out to all agents → LLM synthesis (root cause, prioritized actions). Two modes: `sweep` (scan whole catalog) & `reactive` (single SKU deep-dive). |
| **Catalog + Listing** | SKU quality score (0–100: visuals, description, specs, category) **and** new-product auto-listing via the FAL visual pipeline. |
| **Competitive Intelligence** | Scrapes competitor pages (`httpx` + `BeautifulSoup`): price gap, attribute coverage, and stock-out opportunity signals. |
| **Review Sentiment** | Detects recurring complaints, converts positives into selling points, and raises service alerts. |
| **Flow + Bundle** | Funnel & cart-abandonment analysis + cross-sell bundle ROI suggestions. |
| **Returns Intelligence** | Turns return patterns into LLM root-cause analysis; *conditionally regenerates visuals* when "misleading image" returns spike. |

---

## Visual Generation Pipeline (fal.ai)

A single product photo is transformed into a full gallery through a staged, partly-parallel pipeline with safe per-stage fallbacks:

```
Stage 1 (sequential)  BiRefNet v2          → master cutout (background removal)
Stage 2 (parallel)    Qwen angles × 5      → alternate product angles
                      BRIA Product-Shot × 3 → studio product shots
                      Kling Video × 1       → short product video (tenant-based)
                      Florence-2 × 1        → caption / context
Stage 3 (parallel)    Florence-2           → automated quality control
Stage 4 (sequential)  GPT-4o               → listing-form filling (title, desc, specs, SEO)
Stage 5 (sequential)  Gallery package      → marketplace-ready output bundle
```

---

## Multi-Tenant by Marketplace

Each marketplace is a **tenant preset** (`amazon`, `etsy`, `teknosa`, `trendyol`) defining its own visual rules, lifestyle scenes, listing fields, competitors, SEO target, LLM model, and tag/title limits — so the same image produces a listing shaped for the right platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, FastAPI, asyncio |
| **Generative AI** | fal.ai — BiRefNet, FLUX, Qwen, BRIA Product-Shot, Kling Video, Florence-2 |
| **LLM** | OpenAI GPT-4o / GPT-4o-mini |
| **Scraping** | httpx, BeautifulSoup |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Radix UI, Recharts |
| **Architecture** | Multi-tenant, multi-agent fan-out/synthesis |

---

## API (selected endpoints)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload a product image → public URL |
| `POST` | `/listing/generate` | Image → full listing + visual gallery |
| `POST` | `/analyze/{sku_id}` | Multi-agent analysis of a single SKU |
| `POST` | `/sweep` | Scan the whole catalog for risky SKUs |
| `POST` | `/onboarding` | Create a marketplace tenant config |
| `GET` | `/skus` · `/agents/status` · `/health` | Catalog, agent metrics, health check |

---

## Getting Started

> The application code lives on the `develop` branch (`backend/` + `frontend/`).

**Backend**
```bash
cd backend
pip install -r requirements.txt
# .env: FAL_KEY=...  OPENAI_API_KEY=...
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

---

## Built for

The **Fal.ai API Challenge** — showcasing what an agentic, fal.ai-powered workflow can do for real marketplace sellers.
