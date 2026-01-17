# Phase 2 Engine Design

## Overview

Implementation of the four pending Phase 2 features:
1. TikTok Data Ingestion (RapidAPI)
2. AI Scoring Layer (Anthropic Claude)
3. Stripe Webhooks
4. Kubernetes Finalization

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ENGINE (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐ │
│  │ tiktok_service  │──▶│  ai_service     │──▶│   crud.py     │ │
│  │ (RapidAPI)      │   │  (Claude)       │   │  (DB writes)  │ │
│  └─────────────────┘   └─────────────────┘   └───────────────┘ │
│           │                    │                     │         │
│           ▼                    ▼                     ▼         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     TrendSignal → Product                   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────┐                                           │
│  │ stripe_webhooks │◀── Stripe POST /webhooks/stripe           │
│  └─────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 1. TikTok Data Ingestion

**Source:** RapidAPI TikTok Scraper

**Files:**
- `engine/services/tiktok_service.py`

**Functions:**
- `fetch_trending_products()` → List[TrendSignal]
- `fetch_hashtag_stats(hashtag: str)` → dict
- `search_products(query: str)` → List[dict]

**Endpoints:**
- `POST /trends/ingest` - Trigger data fetch + scoring pipeline
- `GET /trends/signals` - View raw trend signals

**Environment:**
```
RAPIDAPI_KEY=
RAPIDAPI_HOST=tiktok-scraper2.p.rapidapi.com
```

## 2. AI Scoring Layer

**Provider:** Anthropic Claude

**Files:**
- `engine/services/ai_service.py`

**Functions:**
- `score_trend_signal(signal: TrendSignal)` → ScoringResult
- Returns: trend_score (0-100), urgency_score (0-100)

**Prompt Structure:**
```
Analyze this TikTok trend data:
- Views: {views}
- Growth rate: {growth_rate}%
- Engagement: {engagement}
- Hashtag: {hashtag}

Return JSON: {"trend_score": N, "urgency_score": N, "reasoning": "..."}
```

**Environment:**
```
ANTHROPIC_API_KEY=
```

## 3. Stripe Webhooks

**Files:**
- `engine/webhooks.py`

**Endpoint:**
- `POST /webhooks/stripe`

**Events:**
- `checkout.session.completed` → Create Order (status: paid)
- `checkout.session.expired` → Mark abandoned

**Order Status Flow:**
```
pending → paid → fulfilled
              → refunded
```

**Environment:**
```
STRIPE_WEBHOOK_SECRET=
```

## 4. Kubernetes

**New Templates:**
- `k8s/tiktok-urgency/templates/ingress.yaml`
- `k8s/tiktok-urgency/templates/secrets.yaml`

**Ingress:**
- Uses ingress-nginx class
- cert-manager annotation for TLS
- Routes: /api/* → engine, /* → web

**Values additions:**
```yaml
ingress:
  enabled: true
  host: ""
  className: nginx
```

## Environment Variables Summary

```
# TikTok
RAPIDAPI_KEY=
RAPIDAPI_HOST=tiktok-scraper2.p.rapidapi.com

# AI
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Database
DATABASE_URL=

# Frontend
FRONTEND_URL=
```
