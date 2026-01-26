# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TikTok-inspired e-commerce platform with AI-powered product scoring and urgency mechanics. A "Trend Interception Engine" with checkout - high-velocity urgency shelf (5-20 items max) fed by TikTok trends. Products expire; no catalog browsing.

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

Monorepo with Next.js 16 frontend (`web/`) and FastAPI backend (`engine/`).

### Frontend Structure (web/src/)
- `app/` - Next.js App Router pages
  - `/` - Urgency feed (storefront)
  - `/p/[slug]` - Product detail page
  - `/checkout/success` - Post-purchase
  - `/dashboard/*` - Admin dashboard (analytics, products, orders, discover, integrations, marketing, support, settings)
  - `/admin/*` - Legacy admin routes
- `components/ui/` - Storefront components (ProductCard, BuyButton, HeroSection)
- `components/dashboard/` - Admin dashboard components
- `components/storefront/` - Customer-facing widgets (ChatWidget)
- `lib/api.ts` - Backend API client with INTERNAL_API_URL for SSR, NEXT_PUBLIC_API_URL for client

### Backend Structure (engine/)
- `main.py` - FastAPI app, core product/checkout endpoints, trend ingestion
- `models.py` - SQLAlchemy models (Product, Order, TrendSignal, TrendSuggestion, Integration, ChatSession, Supplier, etc.)
- `services/` - Business logic services:
  - `ai_service.py` - OpenAI/Anthropic trend scoring
  - `tiktok_service.py` - TikTok Creative Center data fetching
  - `shopify_service.py`, `woocommerce_service.py` - Platform integrations
  - `auto_fulfillment_service.py` - Automated order fulfillment
  - `chatbot_service.py` - AI customer support
  - `notification_service.py`, `insights_service.py`
- Router modules: `admin.py`, `analytics.py`, `trends.py`, `imports.py`, `integration_api.py`, `fulfillment.py`, `chatbot.py`, `notifications.py`, `social_content.py`, `insights.py`

## API Routes

Core endpoints on root:
- `GET /products`, `GET /products/{slug}`, `POST /products`, `POST /seed`
- `POST /create-checkout-session` - Stripe checkout
- `POST /trends/ingest`, `GET /trends/signals`, `POST /trends/score`

Prefixed routers:
- `/webhooks/*` - Stripe webhooks
- `/admin/*` - Product/suggestion management
- `/analytics/*` - Dashboard metrics
- `/settings/*` - Store configuration
- `/api/trends/*`, `/api/ai/*`, `/api/import/*`, `/api/integrations/*`, `/api/social/*`, `/api/insights/*`, `/api/chatbot/*`, `/api/notifications/*`, `/api/fulfillment/*`

## Design System

TikTok-native dark theme in `web/tailwind.config.ts`:
- `tiktok-black` (#010101), `tiktok-dark` (#121212), `tiktok-gray` (#161823)
- `tiktok-red` (#FE2C55) - primary actions
- `tiktok-cyan` (#25F4EE) - accent/secondary
- `urgency.low/medium/high` - Urgency indicators

Mobile-first design (max-width 448px). Product media uses 9:16 vertical aspect ratio.

## Environment Variables

**web/.env**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://engine:8000  # For Docker SSR
```

**engine/.env**
```
DATABASE_URL=postgresql://user:password@db:5432/tiktok_urgency
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

## Key Patterns

- **Product Status Lifecycle**: `TESTING` → `LIVE` → `PAUSED` → `KILLED` (ProductStatus enum)
- **Trend Suggestion Flow**: TikTok data → AI scoring → TrendSuggestion (pending) → Admin review → Product creation
- **Client Components**: Use `"use client"` directive for interactive components (BuyButton, countdown timers, charts)
- **Standalone Output**: Next.js configured for containerized deployment (`output: 'standalone'`)
- **Dual DB Support**: PostgreSQL in production, SQLite fallback for local dev without Docker
- **API URL Resolution**: SSR uses INTERNAL_API_URL (docker hostname), client uses NEXT_PUBLIC_API_URL
