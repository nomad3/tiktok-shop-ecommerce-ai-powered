# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TikTok-inspired e-commerce platform with AI-powered product scoring and urgency mechanics. Monorepo with Next.js frontend (`web/`) and FastAPI backend (`engine/`).

## Development Commands

### Local Development (Recommended)
```bash
docker-compose up                    # Start all services: web (3000), engine (8000), postgres (5432)
```

### Frontend (web/)
```bash
cd web
npm run dev                          # Next.js dev server on port 3000
npm run build                        # Production build
npm run lint                         # ESLint
```

### Backend (engine/)
```bash
cd engine
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Seed Demo Data
```bash
curl -X POST http://localhost:8000/seed
```

### Kubernetes
```bash
helm install tiktok-urgency ./k8s/tiktok-urgency
```

## Architecture

```
├── web/                    # Next.js 16 (App Router, React 19, TailwindCSS 3)
│   └── src/
│       ├── app/           # Pages: / (feed), /p/[slug] (product), /checkout/success
│       ├── components/ui/ # HeroSection, ProductCard, BottomNav, BuyButton
│       └── lib/api.ts     # Backend fetch wrappers
├── engine/                # FastAPI (Python 3.11)
│   ├── main.py           # API endpoints: /products, /create-checkout-session
│   ├── models.py         # SQLAlchemy: Product, TrendSignal, Order
│   ├── schemas.py        # Pydantic validation
│   └── crud.py           # Database queries
├── k8s/tiktok-urgency/   # Helm charts
└── docker-compose.yml    # Local orchestration
```

## API Endpoints (engine)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (sorted by trend_score) |
| GET | `/products/{slug}` | Single product by slug |
| POST | `/products` | Create product |
| POST | `/seed` | Seed 3 demo products |
| POST | `/create-checkout-session` | Stripe checkout |

## Design System

TikTok-native dark theme with custom colors in `web/tailwind.config.ts`:
- `tiktok-black` (#010101), `tiktok-dark` (#121212), `tiktok-gray` (#161823)
- `tiktok-red` (#FE2C55) - primary actions
- `tiktok-cyan` (#25F4EE) - accent/secondary

Mobile-first design constrained to max-width 448px. Product media uses 9:16 vertical aspect ratio.

## Environment Variables

**web/.env**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**engine/.env**
```
DATABASE_URL=postgresql://user:pass@db:5432/tiktok_urgency
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

## Key Patterns

- **Product Status Lifecycle**: TESTING → LIVE → PAUSED → KILLED (in `models.py`)
- **Client Components**: Use `"use client"` directive for interactive components (BuyButton, countdown timers)
- **Standalone Output**: Next.js configured for containerized deployment
- **Dual DB Support**: PostgreSQL in production, SQLite fallback for local dev without Docker
