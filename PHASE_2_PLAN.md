# Phase 2: The Engine & The Experience

## 1. Executive Summary
**Goal**: Transform the static "Urgency Shelf" into a living, breathing engine fed by real data, and upgrade the frontend to a world-class "TikTok Shop" experience.

## 2. Pending Implementation Tasks

### 2.1. The "Engine" (Backend)
*   **TikTok Data Ingestion**:
    *   Implement `tiktok_service.py` to fetch trends (Creative Center API or scraping).
    *   *Status*: **Pending**. Currently using seed data.
*   **AI Scoring Layer**:
    *   Integrate OpenAI/Anthropic to score products based on "Virality Potential" and "Urgency".
    *   *Status*: **Pending**.
*   **Stripe Webhooks**:
    *   Handle `checkout.session.completed` to update order status and inventory.
    *   *Status*: **Pending**.

### 2.2. DevOps & Deployment
*   **Kubernetes Finalization**:
    *   Verify Helm charts with the new Docker builds.
    *   Setup Ingress and TLS.
    *   *Status*: **In Progress**.

## 3. New Feature: The "TikTok Shop" Landing Page
**Objective**: Create a visually stunning, mobile-first entry point that feels exactly like TikTok Shop.

### 3.1. Design Philosophy
*   **"For You" Aesthetics**: Dark mode, immersive, edge-to-edge content.
*   **Urgency Triggers**: Real-time countdowns, "X people viewing", stock pulse animations.
*   **Micro-Interactions**: Smooth transitions, snap scrolling, heart animations.

### 3.2. UI Components to Build
1.  **Immersive Hero Section**:
    *   A "Daily Drop" highlight with a video background (or high-res image).
    *   Countdown timer to the next "Shelf Refresh".
2.  **Enhanced Product Feed**:
    *   Upgrade `ProductCard` to support "Video Preview" on hover.
    *   Add "Flash Sale" badges with pulsing effects.
3.  **App-Like Navigation**:
    *   Sticky bottom bar (Home, Cart, Orders) for mobile web experience.

---

## 4. Execution Order
1.  **Frontend Polish (The Landing Page)**:
    *   Implement the new Hero Section.
    *   Add "App-like" navigation.
    *   Refine typography and animations.
2.  **The Brain (AI & Data)**:
    *   Connect OpenAI.
    *   Build the Scoring Logic.
3.  **Deployment**:
    *   Push to K8s.
