# AI-Powered E-Commerce Command Center

## Vision

A single dashboard where anyone can run a profitable e-commerce store without expertise in marketing, tech, or operations. AI handles the complexity.

**Tagline:** "Your AI co-pilot for e-commerce. Discover, sell, fulfill, grow - all in one place."

## Core Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI COMMAND CENTER                                     │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│  DISCOVER   │    SELL     │   FULFILL   │   MARKET    │      ANALYZE        │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────────┤
│ • TikTok    │ • Product   │ • Order     │ • AI copy   │ • Sales dashboard   │
│   trends    │   catalog   │   queue     │   writer    │ • Product perf      │
│ • AI score  │ • Storefront│ • Supplier  │ • Ad gen    │ • AI insights       │
│ • 1-click   │ • Checkout  │   routing   │ • Social    │ • Customer data     │
│   import    │ • Pricing   │ • Tracking  │   posts     │ • Forecasting       │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────────┘
```

---

## Module 1: DISCOVER (Product Intelligence)

### What Exists
- TikTok data ingestion via RapidAPI (`engine/services/tiktok_service.py`)
- AI scoring with Claude (`engine/services/ai_service.py`)
- Basic product model with trend_score

### What to Build

**1.1 Trend Feed UI** (New)
- Real-time feed of trending products with scores
- Filter by category, price range, trend velocity
- "Rising fast" vs "Established trend" indicators

**1.2 One-Click Import** (New)
- Parse AliExpress/CJ product URLs
- Auto-extract: images, description, variants, supplier price
- AI generates optimized title and description
- Suggest retail price based on market data

**1.3 Product Research** (New)
- Competition analysis (how many stores sell this?)
- Profit margin calculator
- Seasonality indicator
- AI recommendation: "Import" / "Skip" / "Watch"

### Database Changes
```sql
ALTER TABLE products ADD COLUMN supplier_url TEXT;
ALTER TABLE products ADD COLUMN supplier_cost_cents INTEGER;
ALTER TABLE products ADD COLUMN profit_margin DECIMAL(5,2);
ALTER TABLE products ADD COLUMN ai_recommendation TEXT;
ALTER TABLE products ADD COLUMN import_source VARCHAR(50); -- 'tiktok', 'aliexpress', 'manual'
```

---

## Module 2: SELL (Storefront & Catalog)

### What Exists
- Premium landing page with all sections
- Product detail pages (`/p/[slug]`)
- Stripe checkout integration
- Product CRUD API

### What to Build

**2.1 Catalog Management UI** (Refactor admin)
- Grid view of all products with status
- Bulk actions: publish, unpublish, delete
- Quick edit: price, stock status
- Drag-drop reorder for featured products

**2.2 Storefront Settings** (New)
- Store name, logo, favicon
- Color theme picker (primary, accent colors)
- Social links
- Contact info, policies

**2.3 Pricing Intelligence** (New)
- AI-suggested pricing based on competitor analysis
- A/B price testing
- Discount/coupon system
- Urgency features (countdown, stock warnings)

### Refactor
- Move current `/admin` to `/dashboard`
- Consumer storefront stays at `/`
- Dashboard becomes the command center

---

## Module 3: FULFILL (Order Operations)

### What Exists
- Order model in database
- Stripe webhook for payment confirmation
- Basic order list in admin

### What to Build

**3.1 Order Queue** (New)
- Kanban view: New → Processing → Shipped → Delivered
- One-click "Order from Supplier" button
- Auto-copy shipping address
- Link to supplier order page

**3.2 Supplier Integration** (New)
- AliExpress API integration (or Chrome extension bridge)
- CJ Dropshipping API
- Auto-order capability (Phase 2)
- Cost tracking per order

**3.3 Shipping & Tracking** (New)
- Manual tracking number entry
- Auto-notify customer on shipment
- Tracking page for customers
- Delivery confirmation

**3.4 Returns & Issues** (New)
- Return request management
- Refund processing via Stripe
- Issue tracking with supplier

### Database Changes
```sql
CREATE TABLE order_fulfillment (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    supplier_order_id VARCHAR(100),
    supplier_name VARCHAR(50),
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    status VARCHAR(20), -- 'pending', 'ordered', 'shipped', 'delivered'
    cost_cents INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE returns (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    reason TEXT,
    status VARCHAR(20), -- 'requested', 'approved', 'refunded', 'denied'
    refund_amount_cents INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Module 4: MARKET (AI Content & Promotion)

### What Exists
- AI service with Claude integration
- Product descriptions in database

### What to Build

**4.1 AI Copywriter** (New)
- Generate product descriptions (multiple tones: casual, professional, urgent)
- Generate SEO meta titles/descriptions
- Rewrite/improve existing copy
- Multi-language support

**4.2 Ad Generator** (New)
- Facebook/Instagram ad copy
- TikTok ad scripts
- Google Shopping descriptions
- A/B variations

**4.3 Social Media Manager** (New)
- Generate posts for Instagram, TikTok, Facebook
- Content calendar view
- Hashtag suggestions
- Best posting times (AI suggested)

**4.4 Email Campaigns** (Phase 2)
- Abandoned cart emails
- Order confirmation templates
- Review request emails
- Promotional campaigns

### New API Endpoints
```
POST /api/ai/generate-description
POST /api/ai/generate-ad-copy
POST /api/ai/generate-social-post
POST /api/ai/improve-copy
```

---

## Module 5: ANALYZE (Intelligence Dashboard)

### What Exists
- Basic admin stats endpoint (`/admin/stats`)
- Product view tracking model

### What to Build

**5.1 Sales Dashboard** (New)
- Revenue: today, 7d, 30d, all-time
- Orders: count, average value, conversion rate
- Visual charts: line (revenue over time), bar (top products)
- Real-time updates

**5.2 Product Performance** (New)
- Best sellers ranking
- Worst performers (candidates to drop)
- Conversion rate per product
- View-to-purchase funnel

**5.3 AI Insights** (New)
- Daily digest: "Here's what happened"
- Recommendations: "Consider removing Product X (low conversion)"
- Trend alerts: "Product Y is spiking on TikTok"
- Profit analysis: "Your margin on Product Z dropped 10%"

**5.4 Customer Analytics** (New)
- Customer acquisition source
- Repeat customer rate
- Geographic distribution
- Device/browser breakdown

### Database Changes
```sql
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50), -- 'page_view', 'add_to_cart', 'checkout_start', 'purchase'
    product_id INTEGER REFERENCES products(id),
    session_id VARCHAR(100),
    source VARCHAR(50), -- 'direct', 'google', 'tiktok', 'facebook'
    device VARCHAR(20),
    country VARCHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE daily_metrics (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE,
    revenue_cents INTEGER,
    orders_count INTEGER,
    visitors INTEGER,
    conversion_rate DECIMAL(5,4),
    top_product_id INTEGER REFERENCES products(id)
);
```

---

## Module 6: INTEGRATIONS (Multi-Channel Commerce)

### Overview
Connect your command center to all major e-commerce platforms. Manage everything from one place, sell everywhere.

```
                    ┌─────────────────────┐
                    │   COMMAND CENTER    │
                    │   (Single Source    │
                    │    of Truth)        │
                    └──────────┬──────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┐
        ▼          ▼           ▼           ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Shopify │ │  Woo    │ │ TikTok  │ │ Amazon  │ │  Your   │
   │         │ │Commerce │ │  Shop   │ │         │ │ Store   │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Supported Platforms

**Tier 1 - Full Integration (Phase 1-2)**
| Platform | Products | Orders | Inventory | Analytics |
|----------|----------|--------|-----------|-----------|
| Your Storefront | ✅ | ✅ | ✅ | ✅ |
| Shopify | ✅ | ✅ | ✅ | ✅ |
| WooCommerce | ✅ | ✅ | ✅ | ✅ |
| TikTok Shop | ✅ | ✅ | ✅ | ✅ |

**Tier 2 - Extended (Phase 3+)**
| Platform | Products | Orders | Inventory | Analytics |
|----------|----------|--------|-----------|-----------|
| Amazon Seller | ✅ | ✅ | ✅ | 🔄 |
| eBay | ✅ | ✅ | ✅ | 🔄 |
| Etsy | ✅ | ✅ | ✅ | 🔄 |
| BigCommerce | ✅ | ✅ | ✅ | ✅ |
| Magento | ✅ | ✅ | ✅ | ✅ |

### Integration Features

**6.1 Product Sync**
- Push products to all connected channels
- Map categories per platform
- Platform-specific pricing (different margins per channel)
- Bulk publish/unpublish across channels
- Variant mapping (sizes, colors)

**6.2 Order Aggregation**
- All orders from all channels in one queue
- Unified order processing workflow
- Channel-specific fulfillment rules
- Cross-platform order analytics

**6.3 Inventory Sync**
- Real-time stock levels across all channels
- Low stock alerts
- Auto-pause listing when out of stock
- Reserve stock per channel

**6.4 Unified Analytics**
- Revenue per channel
- Best performing channel per product
- Channel comparison dashboard
- ROI per channel

### Architecture

```
engine/
├── integrations/
│   ├── base.py              # Abstract integration class
│   ├── shopify/
│   │   ├── client.py        # Shopify API client
│   │   ├── sync.py          # Product/order sync logic
│   │   └── webhooks.py      # Shopify webhooks
│   ├── woocommerce/
│   │   ├── client.py
│   │   ├── sync.py
│   │   └── webhooks.py
│   ├── tiktok_shop/
│   │   ├── client.py
│   │   ├── sync.py
│   │   └── webhooks.py
│   └── amazon/
│       ├── client.py
│       ├── sync.py
│       └── feeds.py         # Amazon SP-API feeds
```

### Database Changes

```sql
CREATE TABLE integrations (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL, -- 'shopify', 'woocommerce', 'tiktok_shop', etc.
    store_url TEXT,
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20), -- 'synced', 'syncing', 'error'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_channel_listings (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    integration_id INTEGER REFERENCES integrations(id),
    external_product_id VARCHAR(100), -- ID in the external platform
    external_url TEXT,
    channel_price_cents INTEGER, -- Can differ from main price
    is_published BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP,
    UNIQUE(product_id, integration_id)
);

CREATE TABLE channel_orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    integration_id INTEGER REFERENCES integrations(id),
    external_order_id VARCHAR(100),
    channel_fee_cents INTEGER, -- Platform fees
    raw_data JSONB -- Store original order data
);
```

### API Endpoints

```
# Connection management
POST   /api/integrations/connect/{platform}
DELETE /api/integrations/{id}
GET    /api/integrations
POST   /api/integrations/{id}/test

# Sync operations
POST   /api/integrations/{id}/sync/products
POST   /api/integrations/{id}/sync/orders
POST   /api/integrations/{id}/sync/inventory
GET    /api/integrations/{id}/sync/status

# Product publishing
POST   /api/products/{id}/publish/{platform}
DELETE /api/products/{id}/unpublish/{platform}
POST   /api/products/bulk-publish

# Webhooks (receive from platforms)
POST   /webhooks/shopify
POST   /webhooks/woocommerce
POST   /webhooks/tiktok-shop
```

### OAuth Flows

**Shopify:**
1. User clicks "Connect Shopify"
2. Redirect to Shopify OAuth
3. User authorizes app
4. Receive access token
5. Store encrypted credentials
6. Initial sync

**WooCommerce:**
1. User enters store URL
2. Generate API keys in WooCommerce
3. Enter keys in command center
4. Verify connection
5. Initial sync

**TikTok Shop:**
1. User clicks "Connect TikTok Shop"
2. Redirect to TikTok OAuth
3. User authorizes app
4. Receive access token
5. Initial sync

---

## Module 7: SUPPORT (Customer Service) - Phase 2

### What to Build

**7.1 AI Chatbot**
- Answer common questions (shipping, returns, product info)
- Order status lookup
- Escalate to human when needed

**7.2 Help Center**
- FAQ management
- Policy pages (shipping, returns, privacy)
- Contact form

---

## Tech Stack

### Existing (Keep)
- **Frontend:** Next.js 16, React 19, TailwindCSS 3, Framer Motion
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Auth:** NextAuth with Google OAuth
- **Payments:** Stripe
- **AI:** Anthropic Claude API
- **Data:** RapidAPI for TikTok
- **Infra:** Docker, Kubernetes, Helm

### Add
- **Charts:** Recharts or Tremor for dashboards
- **State:** Zustand for dashboard state management
- **Real-time:** Server-Sent Events for live updates
- **Background jobs:** Celery + Redis for scheduled tasks

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Refactor `/admin` → `/dashboard` as command center
2. Build sales dashboard with charts (Recharts)
3. Build order management queue (Kanban)
4. Add supplier URL/cost fields to products
5. Basic storefront settings page

### Phase 2: Discovery & AI (Week 2-3)
6. Build trend feed UI with existing data
7. One-click product import from URL (AliExpress parser)
8. AI product description generator
9. AI pricing suggestions
10. AI ad copy generator

### Phase 3: Integrations (Week 3-4)
11. Integration architecture + base classes
12. Shopify integration (OAuth + product sync)
13. WooCommerce integration (API keys + sync)
14. Order aggregation from all channels
15. Inventory sync across channels

### Phase 4: Marketing & Analytics (Week 4-5)
16. Social post generator
17. Content calendar
18. Analytics events tracking
19. AI insights engine
20. Channel comparison dashboard

### Phase 5: Advanced Integrations (Week 5-6)
21. TikTok Shop integration
22. Amazon Seller integration
23. eBay integration
24. Bulk operations across channels

### Phase 6: Polish & Scale (Week 6+)
25. Mobile-responsive dashboard
26. AI customer support chatbot
27. Advanced fulfillment automation
28. Performance optimization

---

## File Structure Changes

```
web/src/app/
├── (storefront)/          # Customer-facing pages
│   ├── page.tsx           # Landing page
│   ├── p/[slug]/          # Product pages
│   └── checkout/          # Checkout flow
├── dashboard/             # Command center (was /admin)
│   ├── page.tsx           # Overview + quick stats
│   ├── discover/          # Trend feed + import
│   ├── products/          # Catalog management
│   ├── orders/            # Order queue
│   ├── marketing/         # AI content tools
│   ├── analytics/         # Sales dashboard
│   └── settings/          # Store settings
└── api/
    └── auth/              # NextAuth
```

---

## Success Metrics

1. **Time to first sale:** < 1 hour from signup
2. **Daily active usage:** Dashboard opened daily
3. **AI adoption:** 80%+ products use AI descriptions
4. **Order processing time:** < 2 min per order

---

## Monetization (Future)

- **Free tier:** 10 products, basic analytics
- **Pro ($29/mo):** Unlimited products, AI features, priority support
- **Scale ($99/mo):** Multiple stores, API access, white-label
- **Transaction fee:** 2% on all tiers
