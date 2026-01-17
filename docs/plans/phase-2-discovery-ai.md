# Phase 2: Discovery & AI

**Duration:** Week 2-3
**Goal:** Build product discovery with trend intelligence and AI-powered content generation

---

## 2.1 Trend Feed UI

### Tasks

**2.1.1 Create trend feed page**
- File: `web/src/app/dashboard/discover/page.tsx`
- Layout:
  ```
  ┌─────────────────────────────────────────────────┐
  │ Filters: Category | Price Range | Trend Score  │
  ├─────────────────────────────────────────────────┤
  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
  │ │ Product │ │ Product │ │ Product │ │ Product ││
  │ │  Card   │ │  Card   │ │  Card   │ │  Card   ││
  │ │ [+Add]  │ │ [+Add]  │ │ [+Add]  │ │ [+Add]  ││
  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
  │ │   ...   │ │   ...   │ │   ...   │ │   ...   ││
  └─────────────────────────────────────────────────┘
  ```

**2.1.2 Create trend product card**
- File: `web/src/components/dashboard/TrendProductCard.tsx`
- Display:
  - Product image
  - Name
  - Trend score (0-100 with color: red=hot, yellow=warm, blue=cool)
  - Trend velocity (rising fast, stable, declining)
  - Supplier price
  - Suggested retail price
  - Profit margin estimate
  - "Add to Store" button
- Hover: Show more details

**2.1.3 Create trend score indicator**
- File: `web/src/components/dashboard/TrendScoreIndicator.tsx`
- Circular gauge with score
- Color gradient based on score
- Animation on load

**2.1.4 Create trend filters component**
- File: `web/src/components/dashboard/TrendFilters.tsx`
- Filters:
  - Category (dropdown)
  - Price range (min-max sliders)
  - Minimum trend score (slider)
  - Trend velocity (checkboxes: rising, stable, all)
  - Sort by (trend score, price, newest)

**2.1.5 Create trend data model**
- File: `engine/models.py` (extend)
```python
class TrendData(Base):
    __tablename__ = "trend_data"
    id = Column(Integer, primary_key=True)
    external_id = Column(String(100), unique=True)  # TikTok video/product ID
    title = Column(String(500))
    description = Column(Text)
    image_url = Column(Text)
    video_url = Column(Text)
    source = Column(String(50))  # 'tiktok', 'aliexpress', 'manual'
    category = Column(String(100))

    # Trend metrics
    trend_score = Column(Float, default=0)
    trend_velocity = Column(String(20))  # 'rising', 'stable', 'declining'
    view_count = Column(BigInteger)
    like_count = Column(BigInteger)
    share_count = Column(BigInteger)

    # Pricing
    supplier_url = Column(Text)
    supplier_price_cents = Column(Integer)
    suggested_price_cents = Column(Integer)
    estimated_margin = Column(Float)

    # AI analysis
    ai_recommendation = Column(String(20))  # 'import', 'skip', 'watch'
    ai_reasoning = Column(Text)

    # Timestamps
    first_seen_at = Column(DateTime, default=func.now())
    last_updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Status
    is_imported = Column(Boolean, default=False)
    imported_product_id = Column(Integer, ForeignKey('products.id'), nullable=True)
```

**2.1.6 Create trend API endpoints**
- File: `engine/trends.py`
- Endpoints:
  - `GET /trends` - List trending products with filters
  - `GET /trends/{id}` - Single trend details
  - `POST /trends/refresh` - Trigger new TikTok scan
  - `POST /trends/{id}/import` - Import as product

**2.1.7 Enhance TikTok service**
- File: `engine/services/tiktok_service.py` (extend)
- Add methods:
  - `search_trending(category, limit)` - Search for trending products
  - `get_product_details(video_id)` - Get detailed info
  - `calculate_trend_velocity(historical_data)` - Determine if rising/stable

### Files to Create
- `web/src/app/dashboard/discover/page.tsx`
- `web/src/components/dashboard/TrendProductCard.tsx`
- `web/src/components/dashboard/TrendScoreIndicator.tsx`
- `web/src/components/dashboard/TrendFilters.tsx`
- `engine/trends.py`

### Files to Modify
- `engine/models.py` - Add TrendData model
- `engine/schemas.py` - Add trend schemas
- `engine/main.py` - Add trends router
- `engine/services/tiktok_service.py` - Enhance methods

---

## 2.2 One-Click Product Import

### Tasks

**2.2.1 Create import modal**
- File: `web/src/components/dashboard/ImportProductModal.tsx`
- Input: AliExpress/CJ Dropshipping URL
- Shows loading state while parsing
- Displays extracted data for review
- Editable fields before import
- "Generate AI Description" button
- "Import to Store" button

**2.2.2 Create URL parser service**
- File: `engine/services/product_parser.py`
```python
class ProductParser:
    async def parse_aliexpress(self, url: str) -> dict:
        """
        Extract product data from AliExpress URL
        Returns: {
            title, description, images[], variants[],
            price, shipping, seller_rating, reviews_count
        }
        """

    async def parse_cj_dropshipping(self, url: str) -> dict:
        """Extract from CJ Dropshipping"""

    async def parse_url(self, url: str) -> dict:
        """Auto-detect source and parse"""
```

**2.2.3 Create import API endpoint**
- File: `engine/imports.py`
- Endpoints:
  - `POST /import/parse-url` - Parse URL and return data
  - `POST /import/create-product` - Create product from parsed data

**2.2.4 Create product preview component**
- File: `web/src/components/dashboard/ProductPreview.tsx`
- Shows parsed data in editable form
- Image gallery
- Variant selector
- Price inputs (cost, retail)
- AI description field

**2.2.5 Add AliExpress scraping**
- Options:
  1. Use RapidAPI AliExpress API
  2. Use Puppeteer/Playwright for scraping
  3. Use existing scraping service
- Recommended: RapidAPI for reliability

### Files to Create
- `web/src/components/dashboard/ImportProductModal.tsx`
- `web/src/components/dashboard/ProductPreview.tsx`
- `engine/services/product_parser.py`
- `engine/imports.py`

### Files to Modify
- `engine/main.py` - Add imports router
- `engine/requirements.txt` - Add any new dependencies

---

## 2.3 AI Product Description Generator

### Tasks

**2.3.1 Create AI content service**
- File: `engine/services/ai_content_service.py`
```python
class AIContentService:
    def __init__(self):
        self.client = anthropic.Anthropic()

    async def generate_product_description(
        self,
        product_name: str,
        features: list[str],
        target_audience: str = "general",
        tone: str = "professional",  # casual, professional, urgent, luxury
        length: str = "medium"  # short, medium, long
    ) -> str:
        """Generate compelling product description"""

    async def generate_seo_meta(
        self,
        product_name: str,
        description: str
    ) -> dict:
        """Generate SEO title and meta description"""

    async def improve_copy(
        self,
        original_text: str,
        instruction: str
    ) -> str:
        """Improve existing copy based on instruction"""

    async def generate_bullet_points(
        self,
        product_name: str,
        features: list[str],
        count: int = 5
    ) -> list[str]:
        """Generate benefit-focused bullet points"""
```

**2.3.2 Create AI description prompts**
- File: `engine/services/prompts/product_description.py`
```python
DESCRIPTION_PROMPT = """
You are an expert e-commerce copywriter. Write a compelling product description.

Product: {product_name}
Features: {features}
Target Audience: {target_audience}
Tone: {tone}
Length: {length}

Guidelines:
- Focus on benefits, not just features
- Use sensory language
- Include a call to action
- Avoid clichés
- Be specific and authentic

Write the description now:
"""

SEO_META_PROMPT = """
Generate SEO metadata for this product:

Product: {product_name}
Description: {description}

Return JSON:
{
    "title": "SEO title (max 60 chars)",
    "meta_description": "Meta description (max 160 chars)",
    "keywords": ["keyword1", "keyword2", ...]
}
"""
```

**2.3.3 Create AI content API endpoints**
- File: `engine/ai_content.py`
- Endpoints:
  - `POST /ai/generate-description` - Generate product description
  - `POST /ai/generate-seo` - Generate SEO metadata
  - `POST /ai/improve-copy` - Improve existing text
  - `POST /ai/generate-bullets` - Generate bullet points

**2.3.4 Create AI description UI component**
- File: `web/src/components/dashboard/AIDescriptionGenerator.tsx`
- Options:
  - Tone selector (casual, professional, urgent, luxury)
  - Length selector (short, medium, long)
  - Target audience input
- Generate button
- Preview with copy/use buttons
- Regenerate option
- Edit before using

**2.3.5 Integrate into product form**
- Add "Generate with AI" button next to description field
- Opens AIDescriptionGenerator component
- Inserts generated text into form

### Files to Create
- `engine/services/ai_content_service.py`
- `engine/services/prompts/product_description.py`
- `engine/ai_content.py`
- `web/src/components/dashboard/AIDescriptionGenerator.tsx`

### Files to Modify
- `engine/main.py` - Add AI content router
- `web/src/app/dashboard/products/page.tsx` - Add AI button

---

## 2.4 AI Pricing Suggestions

### Tasks

**2.4.1 Create pricing intelligence service**
- File: `engine/services/pricing_service.py`
```python
class PricingService:
    async def suggest_price(
        self,
        supplier_cost: int,
        category: str,
        competitor_prices: list[int] = None
    ) -> dict:
        """
        Returns: {
            suggested_price: int,
            min_price: int,
            max_price: int,
            margin_percent: float,
            reasoning: str
        }
        """

    async def analyze_competitors(
        self,
        product_name: str,
        category: str
    ) -> list[dict]:
        """Find similar products and their prices"""

    def calculate_margin(
        self,
        cost: int,
        price: int,
        platform_fee_percent: float = 2.9
    ) -> dict:
        """Calculate profit margin after fees"""
```

**2.4.2 Create pricing API endpoint**
- File: `engine/pricing.py`
- Endpoints:
  - `POST /pricing/suggest` - Get price suggestion
  - `POST /pricing/analyze` - Competitor analysis
  - `POST /pricing/calculate-margin` - Margin calculator

**2.4.3 Create pricing suggestion UI**
- File: `web/src/components/dashboard/PricingSuggestion.tsx`
- Input: supplier cost
- Output:
  - Suggested price with explanation
  - Price range slider
  - Margin calculator
  - Competitor comparison (if available)

**2.4.4 Integrate into product form**
- Auto-suggest price when supplier cost is entered
- Show margin in real-time as price changes

### Files to Create
- `engine/services/pricing_service.py`
- `engine/pricing.py`
- `web/src/components/dashboard/PricingSuggestion.tsx`

### Files to Modify
- `engine/main.py` - Add pricing router
- `web/src/app/dashboard/products/page.tsx` - Add pricing UI

---

## 2.5 AI Ad Copy Generator

### Tasks

**2.5.1 Extend AI content service**
- File: `engine/services/ai_content_service.py` (extend)
```python
async def generate_ad_copy(
    self,
    product_name: str,
    description: str,
    platform: str,  # 'facebook', 'instagram', 'tiktok', 'google'
    objective: str = "conversions",  # 'awareness', 'traffic', 'conversions'
    variations: int = 3
) -> list[dict]:
    """
    Returns list of ad variations:
    [{
        headline: str,
        primary_text: str,
        call_to_action: str,
        hashtags: list[str]  # for social
    }]
    """

async def generate_tiktok_script(
    self,
    product_name: str,
    key_benefits: list[str],
    duration: int = 15  # seconds
) -> dict:
    """
    Returns: {
        hook: str,  # First 3 seconds
        body: str,  # Main content
        cta: str,   # Call to action
        full_script: str,
        estimated_duration: int
    }
    """
```

**2.5.2 Create ad prompts**
- File: `engine/services/prompts/ad_copy.py`
- Platform-specific prompts for:
  - Facebook/Instagram ads
  - TikTok ads
  - Google Shopping
  - Email subject lines

**2.5.3 Create ad generator UI**
- File: `web/src/components/dashboard/AdCopyGenerator.tsx`
- Select platform
- Select objective
- Number of variations
- Generate button
- Display variations in cards
- Copy/export buttons

**2.5.4 Create ad copy API endpoint**
- Endpoints:
  - `POST /ai/generate-ad-copy` - Generate ad variations
  - `POST /ai/generate-tiktok-script` - Generate TikTok script

### Files to Create
- `engine/services/prompts/ad_copy.py`
- `web/src/components/dashboard/AdCopyGenerator.tsx`
- `web/src/app/dashboard/marketing/ads/page.tsx`

### Files to Modify
- `engine/services/ai_content_service.py` - Add ad methods
- `engine/ai_content.py` - Add ad endpoints

---

## Testing Checklist

- [ ] Trend feed loads with data
- [ ] Trend filters work correctly
- [ ] Trend score indicator displays correctly
- [ ] Import modal opens and accepts URL
- [ ] AliExpress URL parsing works
- [ ] CJ Dropshipping URL parsing works
- [ ] AI description generates successfully
- [ ] Different tones produce different outputs
- [ ] SEO meta generates correctly
- [ ] Pricing suggestion calculates correctly
- [ ] Margin calculator updates in real-time
- [ ] Ad copy generates for all platforms
- [ ] TikTok script format is correct

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trends` | List trending products |
| GET | `/trends/{id}` | Single trend details |
| POST | `/trends/refresh` | Trigger TikTok scan |
| POST | `/trends/{id}/import` | Import as product |
| POST | `/import/parse-url` | Parse supplier URL |
| POST | `/import/create-product` | Create from parsed |
| POST | `/ai/generate-description` | Generate description |
| POST | `/ai/generate-seo` | Generate SEO meta |
| POST | `/ai/improve-copy` | Improve text |
| POST | `/ai/generate-bullets` | Generate bullets |
| POST | `/ai/generate-ad-copy` | Generate ads |
| POST | `/ai/generate-tiktok-script` | TikTok script |
| POST | `/pricing/suggest` | Price suggestion |
| POST | `/pricing/analyze` | Competitor analysis |

---

## Dependencies to Install

```bash
# Backend
cd engine
pip install beautifulsoup4 lxml  # For parsing
pip install playwright  # For scraping if needed

# Or add to requirements.txt:
# beautifulsoup4==4.12.0
# lxml==5.1.0
```
