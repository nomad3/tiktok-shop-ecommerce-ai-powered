# Project Antigravity: TikTok Urgency Shelf - Implementation Plan

## 1. Executive Summary
**Goal**: Build a "Trend Interception Engine" with a checkout attached.
**Core Concept**: A high-velocity, multi-product "urgency shelf" (5-20 items max) fed by TikTok trends.
**Key Differentiator**: Speed and Urgency. No catalog browsing. Products expire.

## 2. Technical Architecture

### 2.1. Tech Stack
*   **Frontend**: Next.js 14+ (App Router), React, TailwindCSS, Framer Motion.
    *   *Why*: Best-in-class performance, SEO, and "rich aesthetics" capabilities.
*   **Backend / Engine**: Python (FastAPI).
    *   *Why*: Superior ecosystem for Data Scraping, AI/LLM integration, and Data Science (Pandas/NumPy).
*   **Database**: PostgreSQL.
    *   *Why*: Relational integrity for Orders and Products is critical.
*   **AI Layer**: OpenAI API (GPT-4o) or Anthropic (Claude 3.5 Sonnet).
    *   *Role*: Scoring trends, generating copy, analyzing sentiment.

### 2.2. System Components
1.  **`web` (Next.js)**:
    *   User-facing store (Feed, PDP, Checkout).
    *   Admin dashboard (for manual oversight of the "Engine").
2.  **`engine` (Python/FastAPI)**:
    *   **Discovery Service**: Polls TikTok Creative Center, scrapes signals.
    *   **Scoring Service**: Normalizes data, runs AI scoring.
    *   **Lifecycle Service**: Promotes/Demotes/Kills products based on rules.
3.  **`db` (Postgres)**: Shared source of truth.

---

## 3. Detailed Build Plan

### Phase 1: The Foundation (Week 1)
**Objective**: A working "Urgency Shelf" where we can manually drop products and sell them.

#### 1.1. Project Setup
*   Initialize Monorepo (`/web`, `/engine`).
*   Setup PostgreSQL (Docker or Supabase).
*   Configure TailwindCSS with a "Premium/Urgent" design system (Vibrant colors, dark mode default).

#### 1.2. Database Modeling
*   Implement `Product` table (slug, price, status, urgency_score).
*   Implement `Order` table.
*   Implement `TrendSignal` table (preparatory for Phase 2).

#### 1.3. Frontend: The "Live Shelf"
*   **Urgency Feed (`/`)**:
    *   Card design: "TikTok Native" feel (vertical video aspect ratios, auto-playing previews if available).
    *   Sorting logic: Trend Score > Recency.
    *   Scarcity indicators: "X people bought in last hour", "Expires in 12h".
*   **Product Detail Page (`/p/:slug`)**:
    *   Focused conversion funnel.
    *   Sticky "Buy Now" button.
    *   Social proof highlights.

#### 1.4. Transactional Layer
*   Stripe integration.
*   Cart logic (minimal, direct-to-checkout preferred).
*   Success page.

### Phase 2: The Engine (Week 2)
**Objective**: Automate the discovery and scoring of products.

#### 2.1. Data Ingestion (The "Ears")
*   **Source A: TikTok Creative Center**:
    *   Scraper/API to fetch "Trending Now" products.
*   **Source B: Affiliate Data**:
    *   Ingest top affiliate products.

#### 2.2. The AI Brain
*   **Clustering**: Group similar signals (e.g., 50 videos about "spinning scrubber" = 1 Product Candidate).
*   **Scoring Pipeline**:
    *   Input: View velocity, Comment sentiment, Ad spend growth.
    *   Process: LLM evaluation of "Problem/Solution" fit.
    *   Output: 0-100 `urgency_score`.

#### 2.3. Admin "God Mode"
*   Review queue for AI-suggested products.
*   One-click "Approve to Test" (Generates draft PDP copy).

### Phase 3: Growth & Ops (Week 3)
**Objective**: Close the loop with ads and lifecycle management.

#### 3.1. Content Ops
*   AI generation of "Angle Briefs" for creators.
*   Asset management for product videos.

#### 3.2. Lifecycle Automation
*   **Auto-Kill**: If conversion rate < X% after 1000 views -> Status: Killed.
*   **Auto-Scale**: If ROAS > Y -> Alert for Spark Ads.

---

## 4. Immediate Next Steps (Today)
1.  **Scaffold Project**: Create directories and install dependencies.
2.  **Database Init**: Create the schema.
3.  **Frontend Skeleton**: Build the "Urgency Feed" UI mockups.
