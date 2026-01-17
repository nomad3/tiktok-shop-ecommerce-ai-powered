# Admin Dashboard Design

## Overview

Full-featured admin dashboard ("God Mode") for managing the TikTok Urgency platform. Built into the existing Next.js app at `/admin/*` routes.

## Architecture

### Routes
```
/admin                → Dashboard home (metrics overview)
/admin/login          → Password gate
/admin/products       → Product management table
/admin/products/[id]  → Edit single product
/admin/queue          → AI suggestion review queue
/admin/orders         → Order list and details
```

### Authentication
- Simple password gate via `ADMIN_PASSWORD` env var
- Session stored as HTTP-only cookie (24h expiry)
- Middleware validates session on all `/admin/*` routes except `/admin/login`

### New API Endpoints
```
GET  /admin/stats           → Dashboard metrics
GET  /admin/queue           → Pending AI suggestions
POST /admin/queue/approve   → Create product from suggestion
POST /admin/queue/reject    → Dismiss suggestion
PATCH /products/{id}        → Update product
POST /products/{slug}/view  → Record product view
```

## Data Model

### TrendSuggestion (new)
```python
class TrendSuggestion(Base):
    id: int (PK)
    hashtag: str
    views: int
    growth_rate: float
    engagement: int
    video_count: int
    trend_score: float
    urgency_score: float
    ai_reasoning: str
    suggested_name: str (nullable)
    suggested_description: str (nullable)
    status: str  # pending, approved, rejected
    created_at: datetime
    reviewed_at: datetime (nullable)
```

### ProductView (new)
```python
class ProductView(Base):
    id: int (PK)
    product_id: int (FK)
    viewed_at: datetime
    session_id: str (nullable)  # for unique visitor tracking
```

## UI Components

### Layout
- Dark theme (TikTok colors)
- Sidebar: Dashboard, Products, Queue, Orders
- Desktop-optimized, responsive

### Dashboard (`/admin`)
- Stats cards: Orders today, Revenue today, Live products, Conversion rate
- Recent orders table

### Queue (`/admin/queue`)
- Cards per suggestion showing:
  - Hashtag, views, growth rate
  - Trend/Urgency score badges
  - AI reasoning
  - Approve/Reject buttons

### Products (`/admin/products`)
- Sortable table: Name, Status, Price, Trend Score, Views, Orders
- Quick status toggle (LIVE/PAUSED/KILLED)
- Edit button → detail page

### Orders (`/admin/orders`)
- Table: Order ID, Product, Email, Amount, Status, Date
- Filter by status

## Environment Variables

```
ADMIN_PASSWORD=your_secure_password
```

## Implementation Order

1. Backend: New models (TrendSuggestion, ProductView)
2. Backend: New endpoints (/admin/*)
3. Frontend: Auth (login page, middleware, session)
4. Frontend: Layout (sidebar, navigation)
5. Frontend: Dashboard page
6. Frontend: Queue page
7. Frontend: Products page
8. Frontend: Orders page
9. Update ingest to create TrendSuggestions instead of direct products
