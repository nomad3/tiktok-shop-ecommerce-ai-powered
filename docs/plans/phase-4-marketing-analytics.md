# Phase 4: Marketing & Analytics

**Duration:** Week 4-5
**Goal:** AI-powered social content generation, content calendar, and intelligent analytics

---

## 4.1 Social Post Generator

### Tasks

**4.1.1 Create social content service**
- File: `engine/services/social_content_service.py`
```python
from typing import List, Optional
from .ai_content_service import AIContentService

class SocialContentService:
    def __init__(self):
        self.ai = AIContentService()

    async def generate_instagram_post(
        self,
        product_name: str,
        key_features: List[str],
        style: str = "lifestyle",  # lifestyle, promotional, educational, ugc
        include_hashtags: bool = True,
        hashtag_count: int = 20
    ) -> dict:
        """
        Returns: {
            caption: str,
            hashtags: list[str],
            suggested_image_style: str,
            best_posting_time: str
        }
        """

    async def generate_tiktok_caption(
        self,
        product_name: str,
        hook: str,
        include_trending_sounds: bool = True
    ) -> dict:
        """
        Returns: {
            caption: str,
            hashtags: list[str],
            trending_sounds: list[str],
            video_ideas: list[str]
        }
        """

    async def generate_facebook_post(
        self,
        product_name: str,
        description: str,
        post_type: str = "product"  # product, story, question, promotion
    ) -> dict:
        """
        Returns: {
            text: str,
            call_to_action: str,
            suggested_link_preview: str
        }
        """

    async def generate_pinterest_pin(
        self,
        product_name: str,
        category: str
    ) -> dict:
        """
        Returns: {
            title: str,
            description: str,
            board_suggestions: list[str],
            keywords: list[str]
        }
        """

    async def generate_twitter_thread(
        self,
        product_name: str,
        key_points: List[str],
        tweet_count: int = 5
    ) -> List[dict]:
        """Returns list of tweets for a thread"""

    async def get_trending_hashtags(
        self,
        platform: str,
        category: str,
        count: int = 20
    ) -> List[str]:
        """Get trending hashtags for platform/category"""

    async def get_best_posting_times(
        self,
        platform: str,
        audience_timezone: str = "America/New_York"
    ) -> List[dict]:
        """
        Returns: [{
            day: str,
            times: list[str],
            engagement_score: float
        }]
        """
```

**4.1.2 Create social prompts**
- File: `engine/services/prompts/social_content.py`
```python
INSTAGRAM_POST_PROMPT = """
Create an engaging Instagram post for this product:

Product: {product_name}
Key Features: {features}
Style: {style}

Guidelines:
- Start with a hook that stops the scroll
- Use emojis strategically
- Include a clear call to action
- Write in {style} tone
- Keep it under 2200 characters

Return format:
Caption: [your caption]
Hashtags: [list of {hashtag_count} relevant hashtags]
Image suggestion: [describe ideal image]
"""

TIKTOK_CAPTION_PROMPT = """
Create a TikTok caption for this product:

Product: {product_name}
Video hook: {hook}

Guidelines:
- Keep caption short and punchy
- Use trending language/slang
- Include 3-5 hashtags max
- Make it feel authentic, not salesy

Return format:
Caption: [your caption]
Hashtags: [list]
Sound suggestions: [trending sounds that fit]
Video ideas: [3 content ideas]
"""
```

**4.1.3 Create social content API endpoints**
- File: `engine/social_content.py`
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/social", tags=["social"])

@router.post("/generate/instagram")
async def generate_instagram(product_id: int, style: str = "lifestyle"):
    """Generate Instagram post content"""
    pass

@router.post("/generate/tiktok")
async def generate_tiktok(product_id: int, hook: str):
    """Generate TikTok caption"""
    pass

@router.post("/generate/facebook")
async def generate_facebook(product_id: int, post_type: str = "product"):
    """Generate Facebook post"""
    pass

@router.post("/generate/twitter-thread")
async def generate_twitter_thread(product_id: int, tweet_count: int = 5):
    """Generate Twitter thread"""
    pass

@router.get("/trending-hashtags")
async def get_trending_hashtags(platform: str, category: str):
    """Get trending hashtags"""
    pass

@router.get("/best-times")
async def get_best_posting_times(platform: str):
    """Get best posting times"""
    pass
```

**4.1.4 Create social generator UI**
- File: `web/src/app/dashboard/marketing/social/page.tsx`
- Layout:
  ```
  ┌─────────────────────────────────────────────────┐
  │ Select Product: [Dropdown]                       │
  ├─────────────────────────────────────────────────┤
  │ Platforms:  [IG] [TikTok] [FB] [Twitter] [Pin] │
  ├─────────────────────────────────────────────────┤
  │ Style: [Lifestyle] [Promo] [Educational] [UGC] │
  ├─────────────────────────────────────────────────┤
  │ [Generate Content]                               │
  ├─────────────────────────────────────────────────┤
  │ Generated Content:                               │
  │ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
  │ │Instagram│ │ TikTok  │ │Facebook │            │
  │ │ Preview │ │ Preview │ │ Preview │            │
  │ │ [Copy]  │ │ [Copy]  │ │ [Copy]  │            │
  │ └─────────┘ └─────────┘ └─────────┘            │
  └─────────────────────────────────────────────────┘
  ```

**4.1.5 Create platform preview components**
- File: `web/src/components/dashboard/SocialPreview.tsx`
- Instagram preview (phone mockup)
- TikTok preview (phone mockup)
- Facebook preview
- Twitter preview

### Files to Create
- `engine/services/social_content_service.py`
- `engine/services/prompts/social_content.py`
- `engine/social_content.py`
- `web/src/app/dashboard/marketing/social/page.tsx`
- `web/src/components/dashboard/SocialPreview.tsx`
- `web/src/components/dashboard/InstagramPreview.tsx`
- `web/src/components/dashboard/TikTokPreview.tsx`

---

## 4.2 Content Calendar

### Tasks

**4.2.1 Create content calendar model**
- File: `engine/models.py` (extend)
```python
class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True)

    # Content
    platform = Column(String(50), nullable=False)  # instagram, tiktok, facebook, twitter
    content_type = Column(String(50))  # post, story, reel, video
    caption = Column(Text)
    hashtags = Column(JSON)  # List of hashtags
    media_urls = Column(JSON)  # List of image/video URLs
    link_url = Column(Text)

    # Scheduling
    scheduled_at = Column(DateTime, nullable=False)
    timezone = Column(String(50), default='America/New_York')

    # Status
    status = Column(String(20), default='draft')  # draft, scheduled, published, failed
    published_at = Column(DateTime)
    external_post_id = Column(String(100))  # ID on the platform
    error_message = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product")
```

**4.2.2 Create calendar API endpoints**
- File: `engine/calendar.py`
```python
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/posts")
async def get_scheduled_posts(
    start_date: datetime,
    end_date: datetime,
    platform: str = None
):
    """Get scheduled posts for date range"""
    pass

@router.post("/posts")
async def create_scheduled_post(post_data: dict):
    """Create new scheduled post"""
    pass

@router.put("/posts/{post_id}")
async def update_scheduled_post(post_id: int, post_data: dict):
    """Update scheduled post"""
    pass

@router.delete("/posts/{post_id}")
async def delete_scheduled_post(post_id: int):
    """Delete scheduled post"""
    pass

@router.post("/posts/{post_id}/publish-now")
async def publish_now(post_id: int):
    """Publish immediately"""
    pass

@router.get("/suggestions")
async def get_posting_suggestions(
    product_id: int,
    platforms: list[str]
):
    """Get AI suggestions for when to post"""
    pass
```

**4.2.3 Create calendar UI**
- File: `web/src/app/dashboard/marketing/calendar/page.tsx`
- Views: Month, Week, Day, List
- Drag-drop to reschedule
- Click to edit post
- Color coding by platform
- Quick add button

**4.2.4 Create calendar components**
- File: `web/src/components/dashboard/ContentCalendar.tsx`
- Month view grid
- Week view timeline
- Day view detailed

- File: `web/src/components/dashboard/CalendarEvent.tsx`
- Post preview card
- Platform icon
- Status badge
- Quick actions

- File: `web/src/components/dashboard/PostEditor.tsx`
- Modal for creating/editing posts
- Platform selector
- Content editor
- Media uploader
- Schedule picker

### Files to Create
- `engine/calendar.py`
- `web/src/app/dashboard/marketing/calendar/page.tsx`
- `web/src/components/dashboard/ContentCalendar.tsx`
- `web/src/components/dashboard/CalendarEvent.tsx`
- `web/src/components/dashboard/PostEditor.tsx`
- `web/src/components/dashboard/CalendarViews/MonthView.tsx`
- `web/src/components/dashboard/CalendarViews/WeekView.tsx`
- `web/src/components/dashboard/CalendarViews/DayView.tsx`

### Dependencies
```bash
cd web && npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

---

## 4.3 Analytics Events Tracking

### Tasks

**4.3.1 Create analytics event model**
- File: `engine/models.py` (extend)
```python
class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True)
    event_type = Column(String(50), nullable=False)
    # page_view, product_view, add_to_cart, checkout_start, purchase, search

    # Context
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)

    # Session
    session_id = Column(String(100))
    user_id = Column(String(100))  # Anonymous or logged in

    # Attribution
    source = Column(String(50))  # direct, google, tiktok, facebook, email
    medium = Column(String(50))  # organic, cpc, social, referral
    campaign = Column(String(100))
    referrer = Column(Text)

    # Device
    device_type = Column(String(20))  # desktop, mobile, tablet
    browser = Column(String(50))
    os = Column(String(50))

    # Location
    country = Column(String(2))
    region = Column(String(100))
    city = Column(String(100))

    # Extra data
    metadata = Column(JSON)  # Flexible additional data

    # Timestamp
    created_at = Column(DateTime, default=func.now())
```

**4.3.2 Create analytics tracking API**
- File: `engine/analytics_tracking.py`
```python
from fastapi import APIRouter, Request
from user_agents import parse

router = APIRouter(prefix="/track", tags=["tracking"])

@router.post("/event")
async def track_event(
    request: Request,
    event_type: str,
    product_id: int = None,
    metadata: dict = None
):
    """Track analytics event"""
    # Extract user agent, IP, etc.
    user_agent = parse(request.headers.get('user-agent', ''))
    # Get geolocation from IP
    # Store event
    pass

@router.post("/pageview")
async def track_pageview(
    request: Request,
    page: str,
    referrer: str = None
):
    """Track page view"""
    pass
```

**4.3.3 Create frontend tracking utility**
- File: `web/src/lib/analytics.ts`
```typescript
export const analytics = {
  track: async (eventType: string, data?: Record<string, any>) => {
    await fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, ...data })
    });
  },

  pageView: async (page: string) => {
    await analytics.track('page_view', { page, referrer: document.referrer });
  },

  productView: async (productId: string) => {
    await analytics.track('product_view', { product_id: productId });
  },

  addToCart: async (productId: string, quantity: number) => {
    await analytics.track('add_to_cart', { product_id: productId, quantity });
  },

  checkoutStart: async (cartTotal: number) => {
    await analytics.track('checkout_start', { cart_total: cartTotal });
  },

  purchase: async (orderId: string, total: number) => {
    await analytics.track('purchase', { order_id: orderId, total });
  }
};
```

**4.3.4 Add tracking to storefront**
- Add to product pages, cart, checkout
- Use middleware or component wrapper

### Files to Create
- `engine/analytics_tracking.py`
- `web/src/lib/analytics.ts`
- `web/src/components/AnalyticsProvider.tsx`

### Files to Modify
- `web/src/app/p/[slug]/page.tsx` - Add product view tracking
- `web/src/app/checkout/*` - Add checkout tracking

---

## 4.4 AI Insights Engine

### Tasks

**4.4.1 Create insights service**
- File: `engine/services/insights_service.py`
```python
from typing import List
from datetime import datetime, timedelta

class InsightsService:
    async def generate_daily_digest(self) -> dict:
        """
        Returns: {
            summary: str,
            key_metrics: {
                revenue: int,
                revenue_change: float,
                orders: int,
                orders_change: float,
                top_product: str,
                conversion_rate: float
            },
            highlights: list[str],
            concerns: list[str],
            recommendations: list[str]
        }
        """

    async def analyze_product_performance(self, product_id: int) -> dict:
        """
        Returns: {
            summary: str,
            metrics: {
                views: int,
                conversion_rate: float,
                revenue: int,
                trend: str  # up, down, stable
            },
            recommendation: str,  # keep, promote, drop, reprice
            reasoning: str
        }
        """

    async def detect_anomalies(self) -> List[dict]:
        """
        Detect unusual patterns:
        - Sudden drop in sales
        - Spike in cart abandonment
        - Product going viral
        - Inventory running low

        Returns: [{
            type: str,
            severity: str,  # info, warning, critical
            message: str,
            product_id: int (optional),
            suggested_action: str
        }]
        """

    async def predict_trends(self) -> List[dict]:
        """
        Predict upcoming trends based on:
        - TikTok signals
        - Seasonal patterns
        - Category momentum

        Returns: [{
            product_id: int (if existing) or None (if new opportunity),
            product_name: str,
            predicted_score: float,
            confidence: float,
            reasoning: str
        }]
        """

    async def suggest_price_optimization(self) -> List[dict]:
        """
        Analyze pricing opportunities:
        - Products with high views but low conversion (too expensive?)
        - Products selling fast (can increase price?)
        - Competitor price changes

        Returns: [{
            product_id: int,
            current_price: int,
            suggested_price: int,
            expected_impact: str,
            reasoning: str
        }]
        """
```

**4.4.2 Create insights prompts**
- File: `engine/services/prompts/insights.py`
```python
DAILY_DIGEST_PROMPT = """
Analyze this e-commerce data and provide a daily business digest.

Today's Metrics:
{metrics}

Yesterday's Metrics:
{yesterday_metrics}

Top Products:
{top_products}

Recent Trends:
{trends}

Provide:
1. A 2-3 sentence summary of how the business is doing
2. 2-3 key highlights (positive developments)
3. 1-2 concerns to watch (if any)
4. 2-3 actionable recommendations

Be specific with numbers and percentages. Be direct and business-focused.
"""

PRODUCT_ANALYSIS_PROMPT = """
Analyze this product's performance and provide recommendations.

Product: {product_name}
Price: ${price}
Cost: ${cost}

Last 30 Days:
- Views: {views}
- Add to Cart: {add_to_cart}
- Purchases: {purchases}
- Revenue: ${revenue}
- Conversion Rate: {conversion_rate}%

Industry Average Conversion: {industry_avg}%

Should this product be: KEPT, PROMOTED, REPRICED, or DROPPED?
Explain your reasoning briefly.
"""
```

**4.4.3 Create insights API endpoints**
- File: `engine/insights.py`
```python
from fastapi import APIRouter

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/daily-digest")
async def get_daily_digest():
    """Get AI-generated daily business digest"""
    pass

@router.get("/product/{product_id}")
async def get_product_insights(product_id: int):
    """Get AI insights for specific product"""
    pass

@router.get("/anomalies")
async def get_anomalies():
    """Get detected anomalies and alerts"""
    pass

@router.get("/predictions")
async def get_trend_predictions():
    """Get trend predictions"""
    pass

@router.get("/price-optimization")
async def get_price_suggestions():
    """Get pricing optimization suggestions"""
    pass
```

**4.4.4 Create insights dashboard**
- File: `web/src/app/dashboard/analytics/insights/page.tsx`
- Daily digest card
- Alerts/anomalies list
- Product recommendations
- Trend predictions

**4.4.5 Create notification system for insights**
- Email daily digest option
- In-app notifications for anomalies
- Push notifications (future)

### Files to Create
- `engine/services/insights_service.py`
- `engine/services/prompts/insights.py`
- `engine/insights.py`
- `web/src/app/dashboard/analytics/insights/page.tsx`
- `web/src/components/dashboard/DailyDigest.tsx`
- `web/src/components/dashboard/AnomalyAlert.tsx`
- `web/src/components/dashboard/ProductRecommendation.tsx`

---

## 4.5 Channel Comparison Dashboard

### Tasks

**4.5.1 Create channel analytics queries**
- Revenue per channel
- Orders per channel
- Conversion per channel
- Top products per channel
- Channel growth trends

**4.5.2 Create channel comparison API**
- File: `engine/channel_analytics.py`
```python
from fastapi import APIRouter

router = APIRouter(prefix="/analytics/channels", tags=["channel-analytics"])

@router.get("/overview")
async def get_channels_overview(period: str = "30d"):
    """
    Returns: {
        channels: [{
            name: str,
            revenue: int,
            orders: int,
            conversion_rate: float,
            avg_order_value: int,
            growth: float  # vs previous period
        }],
        totals: {...}
    }
    """
    pass

@router.get("/{channel}/products")
async def get_channel_products(channel: str, period: str = "30d"):
    """Top products for specific channel"""
    pass

@router.get("/comparison")
async def compare_channels(channels: list[str], metric: str, period: str = "30d"):
    """Compare specific metric across channels"""
    pass
```

**4.5.3 Create channel comparison UI**
- File: `web/src/app/dashboard/analytics/channels/page.tsx`
- Channel selector (checkboxes)
- Metric selector (revenue, orders, conversion)
- Comparison chart
- Channel cards with key metrics

**4.5.4 Create comparison chart component**
- File: `web/src/components/dashboard/ChannelComparison.tsx`
- Bar chart comparing channels
- Line chart showing trends
- Pie chart for market share

### Files to Create
- `engine/channel_analytics.py`
- `web/src/app/dashboard/analytics/channels/page.tsx`
- `web/src/components/dashboard/ChannelComparison.tsx`
- `web/src/components/dashboard/ChannelCard.tsx`

---

## Testing Checklist

- [ ] Social content generates for all platforms
- [ ] Hashtags are relevant and trendy
- [ ] Calendar displays posts correctly
- [ ] Drag-drop rescheduling works
- [ ] Post creation/editing works
- [ ] Analytics events are tracked
- [ ] Events appear in database
- [ ] Daily digest generates correctly
- [ ] Anomaly detection works
- [ ] Product recommendations are sensible
- [ ] Channel comparison shows correct data
- [ ] All charts render properly

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/social/generate/instagram` | Generate Instagram post |
| POST | `/social/generate/tiktok` | Generate TikTok caption |
| POST | `/social/generate/facebook` | Generate Facebook post |
| GET | `/social/trending-hashtags` | Get trending hashtags |
| GET | `/calendar/posts` | Get scheduled posts |
| POST | `/calendar/posts` | Create scheduled post |
| PUT | `/calendar/posts/{id}` | Update post |
| DELETE | `/calendar/posts/{id}` | Delete post |
| POST | `/track/event` | Track analytics event |
| GET | `/insights/daily-digest` | Get daily digest |
| GET | `/insights/product/{id}` | Product insights |
| GET | `/insights/anomalies` | Get anomalies |
| GET | `/analytics/channels/overview` | Channel overview |
| GET | `/analytics/channels/comparison` | Compare channels |

---

## Dependencies to Install

```bash
# Backend
cd engine
pip install user-agents geoip2

# Frontend
cd web
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns
```
