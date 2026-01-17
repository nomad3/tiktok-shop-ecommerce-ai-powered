# Phase 1: Foundation

**Duration:** Week 1-2
**Goal:** Transform admin into a powerful command center with sales dashboard and order management

---

## 1.1 Refactor Admin to Dashboard

### Tasks

**1.1.1 Rename and restructure routes**
```
web/src/app/
├── admin/          → DELETE (move to dashboard)
├── dashboard/      → NEW command center
│   ├── layout.tsx           # Sidebar + header layout
│   ├── page.tsx             # Overview/home
│   ├── products/
│   │   └── page.tsx         # Product management
│   ├── orders/
│   │   └── page.tsx         # Order queue
│   ├── analytics/
│   │   └── page.tsx         # Sales dashboard
│   └── settings/
│       └── page.tsx         # Store settings
```

**1.1.2 Create dashboard layout component**
- File: `web/src/app/dashboard/layout.tsx`
- Collapsible sidebar with navigation
- Top header with store name, notifications, profile
- Main content area
- Mobile-responsive (hamburger menu)

**1.1.3 Create sidebar navigation**
- File: `web/src/components/dashboard/Sidebar.tsx`
- Links:
  - Overview (home icon)
  - Discover (search icon) - Phase 2
  - Products (box icon)
  - Orders (shopping-cart icon)
  - Marketing (megaphone icon) - Phase 2
  - Analytics (chart icon)
  - Integrations (plug icon) - Phase 3
  - Settings (gear icon)
- Active state highlighting
- Collapse to icons on mobile

**1.1.4 Update middleware for /dashboard**
- File: `web/src/middleware.ts`
- Change protected routes from `/admin/*` to `/dashboard/*`
- Keep NextAuth authentication

**1.1.5 Create dashboard header**
- File: `web/src/components/dashboard/DashboardHeader.tsx`
- Store name display
- Quick actions dropdown
- Notification bell (placeholder)
- User profile menu

### Files to Create
- `web/src/app/dashboard/layout.tsx`
- `web/src/app/dashboard/page.tsx`
- `web/src/components/dashboard/Sidebar.tsx`
- `web/src/components/dashboard/DashboardHeader.tsx`
- `web/src/components/dashboard/MobileNav.tsx`

### Files to Modify
- `web/src/middleware.ts` - Update protected routes

### Files to Delete
- `web/src/app/admin/*` - After migration complete

---

## 1.2 Build Sales Dashboard

### Tasks

**1.2.1 Install chart library**
```bash
cd web && npm install recharts
```

**1.2.2 Create stats cards component**
- File: `web/src/components/dashboard/StatsCard.tsx`
- Props: title, value, change (%), icon, trend (up/down)
- Variants: revenue, orders, conversion, visitors

**1.2.3 Create revenue chart component**
- File: `web/src/components/dashboard/RevenueChart.tsx`
- Line chart showing revenue over time
- Toggle: 7d, 30d, 90d, 1y
- Tooltip with daily breakdown

**1.2.4 Create orders chart component**
- File: `web/src/components/dashboard/OrdersChart.tsx`
- Bar chart showing orders per day
- Color coding by status

**1.2.5 Create top products component**
- File: `web/src/components/dashboard/TopProducts.tsx`
- Table: rank, product name, revenue, units sold
- Sparkline mini-chart per product

**1.2.6 Build analytics page**
- File: `web/src/app/dashboard/analytics/page.tsx`
- Layout:
  ```
  ┌─────────┬─────────┬─────────┬─────────┐
  │ Revenue │ Orders  │ Conv.   │ Visitors│
  ├─────────┴─────────┴─────────┴─────────┤
  │         Revenue Over Time             │
  ├───────────────────┬───────────────────┤
  │   Orders Chart    │   Top Products    │
  └───────────────────┴───────────────────┘
  ```

**1.2.7 Create backend analytics endpoints**
- File: `engine/analytics.py`
- Endpoints:
  - `GET /analytics/overview` - Summary stats
  - `GET /analytics/revenue?period=7d` - Revenue time series
  - `GET /analytics/orders?period=7d` - Orders time series
  - `GET /analytics/top-products?limit=10` - Best sellers

**1.2.8 Create analytics database queries**
- File: `engine/crud.py` (extend)
- Functions:
  - `get_revenue_by_period()`
  - `get_orders_by_period()`
  - `get_top_products()`
  - `get_conversion_rate()`

### Files to Create
- `web/src/components/dashboard/StatsCard.tsx`
- `web/src/components/dashboard/RevenueChart.tsx`
- `web/src/components/dashboard/OrdersChart.tsx`
- `web/src/components/dashboard/TopProducts.tsx`
- `web/src/app/dashboard/analytics/page.tsx`
- `engine/analytics.py`

### Files to Modify
- `engine/main.py` - Add analytics router
- `engine/crud.py` - Add analytics queries

### Database Queries Needed
```sql
-- Revenue by day
SELECT DATE(created_at) as date, SUM(total_cents) as revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Orders by day with status
SELECT DATE(created_at) as date, status, COUNT(*) as count
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), status
ORDER BY date;

-- Top products by revenue
SELECT p.id, p.name, p.main_image_url,
       COUNT(oi.id) as units_sold,
       SUM(oi.price_cents * oi.quantity) as revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id
ORDER BY revenue DESC
LIMIT 10;
```

---

## 1.3 Build Order Management Queue

### Tasks

**1.3.1 Create order status enum**
- File: `engine/models.py` (extend)
- Statuses: NEW, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED

**1.3.2 Create Kanban board component**
- File: `web/src/components/dashboard/OrderKanban.tsx`
- Columns: New, Processing, Shipped, Delivered
- Drag-and-drop between columns
- Order count per column

**1.3.3 Create order card component**
- File: `web/src/components/dashboard/OrderCard.tsx`
- Display: order ID, customer name, items count, total, date
- Quick actions: view details, copy address, mark shipped
- Status badge

**1.3.4 Create order detail modal**
- File: `web/src/components/dashboard/OrderDetailModal.tsx`
- Sections:
  - Customer info (name, email, address)
  - Order items (product, quantity, price)
  - Payment info (total, Stripe payment ID)
  - Fulfillment (supplier link, tracking)
  - Timeline (status history)

**1.3.5 Build orders page**
- File: `web/src/app/dashboard/orders/page.tsx`
- Views: Kanban (default), List (table)
- Filters: status, date range, search
- Bulk actions: mark shipped, export

**1.3.6 Create order API endpoints**
- File: `engine/orders.py`
- Endpoints:
  - `GET /orders` - List with filters
  - `GET /orders/{id}` - Single order details
  - `PATCH /orders/{id}/status` - Update status
  - `POST /orders/{id}/tracking` - Add tracking info
  - `GET /orders/stats` - Count by status

**1.3.7 Add fulfillment fields to order**
- Database migration:
```sql
ALTER TABLE orders ADD COLUMN supplier_order_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP;
```

### Files to Create
- `web/src/components/dashboard/OrderKanban.tsx`
- `web/src/components/dashboard/OrderCard.tsx`
- `web/src/components/dashboard/OrderDetailModal.tsx`
- `web/src/components/dashboard/OrderListView.tsx`
- `web/src/app/dashboard/orders/page.tsx`
- `engine/orders.py`

### Files to Modify
- `engine/models.py` - Add order status enum, fulfillment fields
- `engine/schemas.py` - Add order schemas
- `engine/main.py` - Add orders router

---

## 1.4 Add Supplier Fields to Products

### Tasks

**1.4.1 Database migration**
```sql
ALTER TABLE products ADD COLUMN supplier_url TEXT;
ALTER TABLE products ADD COLUMN supplier_name VARCHAR(100);
ALTER TABLE products ADD COLUMN supplier_cost_cents INTEGER;
ALTER TABLE products ADD COLUMN profit_margin DECIMAL(5,2);
ALTER TABLE products ADD COLUMN import_source VARCHAR(50) DEFAULT 'manual';
```

**1.4.2 Update product model**
- File: `engine/models.py`
- Add new fields to Product class

**1.4.3 Update product schemas**
- File: `engine/schemas.py`
- Add fields to ProductCreate, Product schemas

**1.4.4 Update product form in dashboard**
- File: `web/src/app/dashboard/products/page.tsx`
- Add fields:
  - Supplier URL (text input)
  - Supplier Name (dropdown or text)
  - Supplier Cost (number input)
  - Auto-calculate profit margin

### Files to Modify
- `engine/models.py`
- `engine/schemas.py`
- `web/src/app/dashboard/products/page.tsx`

---

## 1.5 Basic Store Settings Page

### Tasks

**1.5.1 Create store settings model**
- File: `engine/models.py` (extend)
```python
class StoreSettings(Base):
    __tablename__ = "store_settings"
    id = Column(Integer, primary_key=True)
    store_name = Column(String(100), default="My Store")
    store_logo_url = Column(Text)
    store_favicon_url = Column(Text)
    primary_color = Column(String(7), default="#FE2C55")
    accent_color = Column(String(7), default="#25F4EE")
    contact_email = Column(String(255))
    social_instagram = Column(Text)
    social_tiktok = Column(Text)
    social_facebook = Column(Text)
    shipping_policy = Column(Text)
    return_policy = Column(Text)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

**1.5.2 Create settings API endpoints**
- File: `engine/settings.py`
- Endpoints:
  - `GET /settings` - Get current settings
  - `PUT /settings` - Update settings

**1.5.3 Build settings page**
- File: `web/src/app/dashboard/settings/page.tsx`
- Tabs:
  - General (store name, logo, favicon)
  - Appearance (colors)
  - Contact (email, social links)
  - Policies (shipping, returns)
- Save button with loading state

**1.5.4 Create color picker component**
- File: `web/src/components/dashboard/ColorPicker.tsx`
- Preset colors + custom hex input

**1.5.5 Create image upload component**
- File: `web/src/components/dashboard/ImageUpload.tsx`
- Drag-drop or click to upload
- Preview thumbnail
- Store in local filesystem or S3 (Phase 2)

### Files to Create
- `engine/settings.py`
- `web/src/app/dashboard/settings/page.tsx`
- `web/src/components/dashboard/ColorPicker.tsx`
- `web/src/components/dashboard/ImageUpload.tsx`

### Files to Modify
- `engine/models.py` - Add StoreSettings model
- `engine/schemas.py` - Add settings schemas
- `engine/main.py` - Add settings router

---

## 1.6 Dashboard Overview Page

### Tasks

**1.6.1 Create overview page**
- File: `web/src/app/dashboard/page.tsx`
- Quick stats row (revenue today, orders today, pending orders)
- Recent orders (last 5)
- Quick actions:
  - Add product
  - View all orders
  - Check trends (links to discover)
- Activity feed (recent events)

**1.6.2 Create quick actions component**
- File: `web/src/components/dashboard/QuickActions.tsx`
- Grid of action cards with icons

**1.6.3 Create recent orders component**
- File: `web/src/components/dashboard/RecentOrders.tsx`
- Compact list of 5 most recent orders
- Click to open detail modal

### Files to Create
- `web/src/app/dashboard/page.tsx`
- `web/src/components/dashboard/QuickActions.tsx`
- `web/src/components/dashboard/RecentOrders.tsx`

---

## Testing Checklist

- [ ] Dashboard loads without auth → redirects to login
- [ ] Dashboard loads with auth → shows overview
- [ ] Sidebar navigation works on desktop
- [ ] Sidebar collapses on mobile
- [ ] Analytics charts render with mock data
- [ ] Analytics charts render with real data
- [ ] Order kanban displays orders correctly
- [ ] Drag-drop order status works
- [ ] Order detail modal opens
- [ ] Settings save and persist
- [ ] Product supplier fields save

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/overview` | Dashboard summary |
| GET | `/analytics/revenue` | Revenue time series |
| GET | `/analytics/orders` | Orders time series |
| GET | `/analytics/top-products` | Best sellers |
| GET | `/orders` | List orders |
| GET | `/orders/{id}` | Order details |
| PATCH | `/orders/{id}/status` | Update status |
| POST | `/orders/{id}/tracking` | Add tracking |
| GET | `/settings` | Get store settings |
| PUT | `/settings` | Update settings |

---

## Dependencies to Install

```bash
# Frontend
cd web
npm install recharts @dnd-kit/core @dnd-kit/sortable

# Backend (already installed)
# No new dependencies
```
