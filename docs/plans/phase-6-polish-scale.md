# Phase 6: Polish & Scale

**Duration:** Week 6+
**Goal:** Mobile optimization, AI customer support, advanced automation, and performance at scale

---

## 6.1 Mobile-Responsive Dashboard

### Tasks

**6.1.1 Audit current responsive design**
- Test all dashboard pages on mobile breakpoints
- Identify components that don't work well on mobile
- Create list of required changes

**6.1.2 Create mobile-optimized layout**
- File: `web/src/components/dashboard/MobileLayout.tsx`
```typescript
// Features:
// - Bottom navigation bar (like native apps)
// - Swipe gestures for navigation
// - Collapsible sections
// - Touch-optimized buttons and inputs
// - Pull-to-refresh on data pages
```

**6.1.3 Create bottom navigation**
- File: `web/src/components/dashboard/BottomNav.tsx`
- Icons: Home, Products, Orders, Analytics, More
- Active state indicator
- Badge for notification count

**6.1.4 Create mobile-specific components**
- `web/src/components/dashboard/mobile/MobileOrderCard.tsx`
- `web/src/components/dashboard/mobile/MobileProductCard.tsx`
- `web/src/components/dashboard/mobile/MobileStatsCard.tsx`
- `web/src/components/dashboard/mobile/SwipeableList.tsx`

**6.1.5 Implement swipe actions**
- File: `web/src/hooks/useSwipeActions.ts`
- Swipe left: Quick actions (delete, archive)
- Swipe right: Primary action (view, edit)
- Pull down: Refresh data

**6.1.6 Optimize charts for mobile**
- Smaller chart heights
- Horizontal scrolling for time series
- Tap to show details instead of hover
- Simplified legends

**6.1.7 Mobile-optimized forms**
- Full-width inputs
- Native date/time pickers
- Step-by-step wizards instead of long forms
- Floating action button for primary action

### Files to Create
- `web/src/components/dashboard/MobileLayout.tsx`
- `web/src/components/dashboard/BottomNav.tsx`
- `web/src/components/dashboard/mobile/MobileOrderCard.tsx`
- `web/src/components/dashboard/mobile/MobileProductCard.tsx`
- `web/src/components/dashboard/mobile/MobileStatsCard.tsx`
- `web/src/components/dashboard/mobile/SwipeableList.tsx`
- `web/src/hooks/useSwipeActions.ts`
- `web/src/hooks/useMobileDetect.ts`

### Dependencies
```bash
cd web && npm install react-swipeable framer-motion
```

---

## 6.2 AI Customer Support Chatbot

### Tasks

**6.2.1 Create chatbot service**
- File: `engine/services/chatbot_service.py`
```python
from typing import List, Optional
import anthropic

class ChatbotService:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.system_prompt = """
        You are a helpful customer support assistant for an e-commerce store.
        You can help with:
        - Order status inquiries
        - Product questions
        - Shipping information
        - Return and refund policies
        - General store questions

        Be friendly, concise, and helpful. If you cannot answer a question,
        offer to connect the customer with human support.

        Store Information:
        {store_info}

        Current Policies:
        - Shipping: {shipping_policy}
        - Returns: {return_policy}
        """

    async def get_response(
        self,
        message: str,
        conversation_history: List[dict],
        customer_context: dict = None  # Order history, etc.
    ) -> dict:
        """
        Returns: {
            response: str,
            suggested_actions: list[str],  # Quick reply buttons
            needs_human: bool,
            confidence: float
        }
        """
        pass

    async def lookup_order_status(self, order_id: str) -> dict:
        """Get order status for chatbot response"""
        pass

    async def get_product_info(self, product_id: str) -> dict:
        """Get product details for chatbot"""
        pass

    async def create_support_ticket(
        self,
        customer_email: str,
        subject: str,
        conversation_history: List[dict]
    ) -> dict:
        """Escalate to human support"""
        pass
```

**6.2.2 Create chatbot API endpoints**
- File: `engine/chatbot.py`
```python
from fastapi import APIRouter

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

@router.post("/message")
async def send_message(
    message: str,
    session_id: str,
    customer_email: str = None
):
    """Send message to chatbot"""
    pass

@router.get("/session/{session_id}/history")
async def get_conversation_history(session_id: str):
    """Get conversation history"""
    pass

@router.post("/session/{session_id}/escalate")
async def escalate_to_human(session_id: str, reason: str = None):
    """Escalate conversation to human support"""
    pass
```

**6.2.3 Create chatbot data models**
- File: `engine/models.py` (extend)
```python
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(100), unique=True)
    customer_email = Column(String(255))
    customer_name = Column(String(255))

    status = Column(String(20), default='active')  # active, escalated, resolved
    escalated_at = Column(DateTime)
    resolved_at = Column(DateTime)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('chat_sessions.id'))

    role = Column(String(20))  # 'user', 'assistant', 'system'
    content = Column(Text)
    metadata = Column(JSON)  # Suggested actions, confidence, etc.

    created_at = Column(DateTime, default=func.now())

    session = relationship("ChatSession", back_populates="messages")
```

**6.2.4 Create chatbot widget**
- File: `web/src/components/storefront/ChatWidget.tsx`
```typescript
// Features:
// - Floating chat button in corner
// - Expandable chat window
// - Message input with send button
// - Suggested quick replies
// - Typing indicator
// - Order lookup by email/order number
// - Escalation button
```

**6.2.5 Create chat admin panel**
- File: `web/src/app/dashboard/support/page.tsx`
- View all chat sessions
- Filter by status (active, escalated, resolved)
- Real-time chat monitoring
- Take over escalated chats

**6.2.6 Create chat interface for admin**
- File: `web/src/components/dashboard/ChatInterface.tsx`
- Real-time message display
- Send messages as support agent
- View customer info sidebar
- Order history for customer

### Files to Create
- `engine/services/chatbot_service.py`
- `engine/chatbot.py`
- `web/src/components/storefront/ChatWidget.tsx`
- `web/src/components/storefront/ChatMessage.tsx`
- `web/src/components/storefront/QuickReplies.tsx`
- `web/src/app/dashboard/support/page.tsx`
- `web/src/app/dashboard/support/[sessionId]/page.tsx`
- `web/src/components/dashboard/ChatInterface.tsx`
- `web/src/components/dashboard/ChatSessionList.tsx`

---

## 6.3 Advanced Fulfillment Automation

### Tasks

**6.3.1 Create auto-ordering service**
- File: `engine/services/auto_fulfillment_service.py`
```python
class AutoFulfillmentService:
    """Automatically process orders with suppliers"""

    async def auto_order_from_supplier(self, order_id: int) -> dict:
        """
        Automatically place order with supplier:
        1. Get order details
        2. Get supplier info for products
        3. Place order via supplier API (if supported)
        4. Store supplier order reference
        5. Update order status
        """
        pass

    async def process_fulfillment_queue(self):
        """
        Background job to process orders:
        1. Get orders in 'processing' status
        2. Check supplier availability
        3. Place orders or flag issues
        """
        pass

    async def check_supplier_availability(self, product_id: int) -> dict:
        """
        Check if product is available at supplier:
        Returns: {
            available: bool,
            quantity: int,
            price: int,
            estimated_shipping_days: int
        }
        """
        pass

    async def get_best_supplier(self, product_id: int) -> dict:
        """
        If multiple suppliers, find best option based on:
        - Price
        - Shipping time
        - Reliability score
        """
        pass
```

**6.3.2 Create supplier management**
- File: `engine/models.py` (extend)
```python
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    platform = Column(String(50))  # aliexpress, cj, etc.

    # API credentials
    api_credentials_encrypted = Column(Text)

    # Settings
    auto_order_enabled = Column(Boolean, default=False)
    max_order_value_cents = Column(Integer)
    reliability_score = Column(Float, default=5.0)

    # Stats
    total_orders = Column(Integer, default=0)
    successful_orders = Column(Integer, default=0)
    avg_shipping_days = Column(Float)

    created_at = Column(DateTime, default=func.now())


class ProductSupplier(Base):
    __tablename__ = "product_suppliers"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'))
    supplier_id = Column(Integer, ForeignKey('suppliers.id'))

    supplier_product_url = Column(Text)
    supplier_sku = Column(String(100))
    supplier_price_cents = Column(Integer)
    shipping_cost_cents = Column(Integer)
    is_primary = Column(Boolean, default=True)

    last_checked_at = Column(DateTime)
    is_available = Column(Boolean, default=True)
```

**6.3.3 Create fulfillment rules engine**
- File: `engine/services/fulfillment_rules.py`
```python
class FulfillmentRulesEngine:
    """Configure and execute fulfillment rules"""

    async def evaluate_order(self, order_id: int) -> dict:
        """
        Apply rules to determine fulfillment action:
        - Auto-fulfill if total < threshold
        - Hold for review if first-time customer
        - Flag if product has issues
        """
        pass

    async def get_rules(self) -> List[dict]:
        """Get all active rules"""
        pass

    async def create_rule(self, rule_data: dict) -> dict:
        """Create new fulfillment rule"""
        pass
```

**6.3.4 Create fulfillment automation UI**
- File: `web/src/app/dashboard/settings/fulfillment/page.tsx`
- Enable/disable auto-ordering
- Set value thresholds
- Configure supplier preferences
- View fulfillment logs

### Files to Create
- `engine/services/auto_fulfillment_service.py`
- `engine/services/fulfillment_rules.py`
- `web/src/app/dashboard/settings/fulfillment/page.tsx`
- `web/src/app/dashboard/suppliers/page.tsx`
- `web/src/components/dashboard/SupplierCard.tsx`
- `web/src/components/dashboard/FulfillmentRuleEditor.tsx`

---

## 6.4 Background Jobs & Scheduling

### Tasks

**6.4.1 Set up Celery with Redis**
- File: `engine/celery_app.py`
```python
from celery import Celery
from celery.schedules import crontab
import os

celery_app = Celery(
    'tiktok_urgency',
    broker=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Scheduled tasks
celery_app.conf.beat_schedule = {
    'sync-all-integrations': {
        'task': 'tasks.sync_all_integrations',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'refresh-trends': {
        'task': 'tasks.refresh_trend_data',
        'schedule': crontab(hour='*/4'),  # Every 4 hours
    },
    'generate-daily-digest': {
        'task': 'tasks.generate_daily_digest',
        'schedule': crontab(hour=8, minute=0),  # 8 AM daily
    },
    'process-fulfillment-queue': {
        'task': 'tasks.process_fulfillment_queue',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'cleanup-old-analytics': {
        'task': 'tasks.cleanup_old_analytics',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
}
```

**6.4.2 Create Celery tasks**
- File: `engine/tasks.py`
```python
from celery_app import celery_app
from services.order_sync_service import OrderSyncService
from services.insights_service import InsightsService

@celery_app.task
def sync_all_integrations():
    """Sync products and orders from all connected integrations"""
    pass

@celery_app.task
def sync_integration(integration_id: int):
    """Sync single integration"""
    pass

@celery_app.task
def refresh_trend_data():
    """Refresh TikTok trend data"""
    pass

@celery_app.task
def generate_daily_digest():
    """Generate and email daily digest"""
    pass

@celery_app.task
def process_fulfillment_queue():
    """Process pending orders for fulfillment"""
    pass

@celery_app.task
def send_notification(user_id: int, notification_type: str, data: dict):
    """Send notification (email, push, in-app)"""
    pass

@celery_app.task
def cleanup_old_analytics():
    """Archive old analytics events"""
    pass
```

**6.4.3 Create jobs dashboard**
- File: `web/src/app/dashboard/settings/jobs/page.tsx`
- View scheduled jobs
- View job history
- Trigger manual runs
- View error logs

### Files to Create
- `engine/celery_app.py`
- `engine/tasks.py`
- `web/src/app/dashboard/settings/jobs/page.tsx`
- `web/src/components/dashboard/JobsList.tsx`
- `web/src/components/dashboard/JobLogs.tsx`

### Infrastructure Updates
```yaml
# docker-compose.yml additions
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  celery_worker:
    build: ./engine
    command: celery -A celery_app worker --loglevel=info
    depends_on:
      - redis
      - db
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://user:pass@db:5432/tiktok_urgency

  celery_beat:
    build: ./engine
    command: celery -A celery_app beat --loglevel=info
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0

volumes:
  redis_data:
```

---

## 6.5 Performance Optimization

### Tasks

**6.5.1 Database optimization**
- Add indexes for common queries
```sql
-- Analytics queries
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_product ON analytics_events(product_id);

-- Order queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Product queries
CREATE INDEX idx_products_trend_score ON products(trend_score DESC);
CREATE INDEX idx_products_status ON products(status);

-- Integration sync
CREATE INDEX idx_product_listings_integration ON product_channel_listings(integration_id);
CREATE INDEX idx_channel_orders_integration ON channel_orders(integration_id);
```

**6.5.2 API response caching**
- File: `engine/cache.py`
```python
import redis
import json
from functools import wraps

redis_client = redis.Redis.from_url(os.environ.get('REDIS_URL'))

def cache_response(ttl: int = 60):
    """Cache API response decorator"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{json.dumps(args)}:{json.dumps(kwargs)}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

**6.5.3 Frontend optimization**
- Image lazy loading
- Code splitting by route
- Service worker for offline support
- Virtual scrolling for long lists

**6.5.4 Create performance monitoring**
- File: `engine/middleware/performance.py`
```python
import time
from fastapi import Request

async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    # Log slow requests
    if duration > 1.0:
        logger.warning(f"Slow request: {request.url.path} took {duration:.2f}s")

    response.headers["X-Response-Time"] = str(duration)
    return response
```

### Files to Create
- `engine/cache.py`
- `engine/middleware/performance.py`
- `web/src/components/VirtualList.tsx`
- `web/src/service-worker.ts`

---

## 6.6 Notification System

### Tasks

**6.6.1 Create notification service**
- File: `engine/services/notification_service.py`
```python
class NotificationService:
    async def send_email(
        self,
        to: str,
        subject: str,
        template: str,
        data: dict
    ):
        """Send email notification"""
        pass

    async def send_push(self, user_id: int, title: str, body: str, data: dict = None):
        """Send push notification"""
        pass

    async def create_in_app(self, user_id: int, notification_type: str, data: dict):
        """Create in-app notification"""
        pass

    async def send_daily_digest(self, user_id: int):
        """Send daily digest email"""
        pass
```

**6.6.2 Create notification preferences**
- Email notifications (daily digest, orders, alerts)
- Push notifications (mobile)
- In-app notifications
- Notification frequency settings

**6.6.3 Create notification UI**
- Notification bell with badge
- Notification dropdown
- Notification settings page

### Files to Create
- `engine/services/notification_service.py`
- `engine/notifications.py`
- `web/src/components/dashboard/NotificationBell.tsx`
- `web/src/components/dashboard/NotificationDropdown.tsx`
- `web/src/app/dashboard/settings/notifications/page.tsx`

---

## Testing Checklist

- [ ] Dashboard works well on mobile (iOS Safari, Android Chrome)
- [ ] Bottom navigation responds correctly
- [ ] Swipe actions work
- [ ] Charts are readable on mobile
- [ ] Chatbot responds to common questions
- [ ] Chatbot can look up order status
- [ ] Chat escalation works
- [ ] Admin can view and respond to chats
- [ ] Auto-fulfillment processes orders
- [ ] Celery worker runs scheduled tasks
- [ ] Redis caching works
- [ ] Database queries are fast (<100ms)
- [ ] Email notifications send
- [ ] In-app notifications appear

---

## API Endpoints Summary (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chatbot/message` | Send chatbot message |
| GET | `/chatbot/session/{id}/history` | Get chat history |
| POST | `/chatbot/session/{id}/escalate` | Escalate to human |
| GET | `/notifications` | Get user notifications |
| PUT | `/notifications/{id}/read` | Mark as read |
| GET | `/notifications/preferences` | Get preferences |
| PUT | `/notifications/preferences` | Update preferences |
| GET | `/jobs` | List scheduled jobs |
| POST | `/jobs/{name}/run` | Trigger job manually |
| GET | `/jobs/history` | Get job run history |

---

## Infrastructure Requirements

```bash
# Additional services needed:
# - Redis (for caching + Celery)
# - SMTP server or SendGrid/Mailgun for emails
# - Optional: Firebase for push notifications

# Environment variables
REDIS_URL=redis://localhost:6379/0
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
```

---

## Dependencies to Install

```bash
# Backend
cd engine
pip install celery redis aiosmtplib jinja2

# Add to requirements.txt:
# celery==5.3.0
# redis==5.0.0
# aiosmtplib==3.0.0
# jinja2==3.1.0

# Frontend
cd web
npm install react-swipeable workbox-webpack-plugin
```

---

## Deployment Notes

1. **Redis**: Add Redis service to Kubernetes cluster
2. **Celery**: Deploy as separate pods (worker + beat)
3. **Monitoring**: Add Prometheus metrics for Celery
4. **Scaling**: Celery workers can be horizontally scaled
5. **Email**: Configure SMTP or use managed service (SendGrid)
