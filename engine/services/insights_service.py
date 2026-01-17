"""AI Insights service for generating business intelligence and recommendations."""

import os
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
import random

logger = logging.getLogger(__name__)


@dataclass
class DailyDigest:
    """Daily business digest."""
    summary: str
    key_metrics: Dict[str, Any]
    highlights: List[str]
    concerns: List[str]
    recommendations: List[str]


@dataclass
class ProductInsight:
    """Insight for a specific product."""
    product_id: int
    product_name: str
    summary: str
    metrics: Dict[str, Any]
    recommendation: str  # keep, promote, drop, reprice
    reasoning: str


@dataclass
class Anomaly:
    """Detected anomaly or alert."""
    type: str
    severity: str  # info, warning, critical
    message: str
    product_id: Optional[int]
    suggested_action: str
    detected_at: datetime


@dataclass
class TrendPrediction:
    """Predicted trend."""
    product_id: Optional[int]
    product_name: str
    predicted_score: float
    confidence: float
    reasoning: str


@dataclass
class PricingSuggestion:
    """Price optimization suggestion."""
    product_id: int
    product_name: str
    current_price_cents: int
    suggested_price_cents: int
    expected_impact: str
    reasoning: str


class InsightsService:
    """Service for generating AI-powered business insights."""

    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("OPENAI_API_KEY")

    async def generate_daily_digest(
        self,
        metrics: Dict[str, Any],
        yesterday_metrics: Dict[str, Any],
        top_products: List[Dict[str, Any]],
        recent_orders: int = 0
    ) -> DailyDigest:
        """Generate AI-powered daily business digest."""
        if not self.api_key:
            return self._generate_fallback_digest(metrics, yesterday_metrics, top_products)

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Analyze this e-commerce data and provide a daily business digest.

Today's Metrics:
- Revenue: ${metrics.get('revenue_cents', 0) / 100:.2f}
- Orders: {metrics.get('orders', 0)}
- Conversion Rate: {metrics.get('conversion_rate', 0):.2f}%
- Average Order Value: ${metrics.get('avg_order_value_cents', 0) / 100:.2f}

Yesterday's Metrics:
- Revenue: ${yesterday_metrics.get('revenue_cents', 0) / 100:.2f}
- Orders: {yesterday_metrics.get('orders', 0)}
- Conversion Rate: {yesterday_metrics.get('conversion_rate', 0):.2f}%

Top Products Today:
{self._format_top_products(top_products)}

Provide a JSON response with:
1. "summary": A 2-3 sentence summary of how the business is doing
2. "highlights": Array of 2-3 positive developments
3. "concerns": Array of 1-2 concerns (if any, or empty array)
4. "recommendations": Array of 2-3 actionable recommendations

Be specific with numbers and percentages. Be direct and business-focused."""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_digest_response(response_text, metrics)

        except Exception as e:
            logger.error(f"Error generating daily digest: {e}")
            return self._generate_fallback_digest(metrics, yesterday_metrics, top_products)

    async def analyze_product(
        self,
        product_id: int,
        product_name: str,
        price_cents: int,
        cost_cents: int,
        views: int,
        add_to_cart: int,
        purchases: int,
        revenue_cents: int
    ) -> ProductInsight:
        """Generate AI insight for a specific product."""
        conversion_rate = (purchases / views * 100) if views > 0 else 0
        cart_rate = (add_to_cart / views * 100) if views > 0 else 0

        if not self.api_key:
            return self._generate_fallback_product_insight(
                product_id, product_name, price_cents, views, purchases, conversion_rate
            )

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Analyze this product's performance and provide a recommendation.

Product: {product_name}
Price: ${price_cents / 100:.2f}
Cost: ${cost_cents / 100:.2f}
Margin: {((price_cents - cost_cents) / price_cents * 100):.1f}%

Last 30 Days Performance:
- Views: {views:,}
- Add to Cart: {add_to_cart:,} ({cart_rate:.1f}% rate)
- Purchases: {purchases:,}
- Revenue: ${revenue_cents / 100:.2f}
- Conversion Rate: {conversion_rate:.2f}%

Industry average conversion is typically 2-3%.

Should this product be: KEEP, PROMOTE, REPRICE, or DROP?

Respond with:
RECOMMENDATION: [one of KEEP/PROMOTE/REPRICE/DROP]
REASONING: [1-2 sentences explaining why]"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_product_insight(
                response_text, product_id, product_name, views, purchases, revenue_cents, conversion_rate
            )

        except Exception as e:
            logger.error(f"Error analyzing product: {e}")
            return self._generate_fallback_product_insight(
                product_id, product_name, price_cents, views, purchases, conversion_rate
            )

    async def detect_anomalies(
        self,
        current_metrics: Dict[str, Any],
        historical_avg: Dict[str, Any],
        products: List[Dict[str, Any]]
    ) -> List[Anomaly]:
        """Detect anomalies and generate alerts."""
        anomalies = []
        now = datetime.utcnow()

        # Revenue anomaly detection
        revenue_change = self._calculate_change(
            current_metrics.get('revenue_cents', 0),
            historical_avg.get('revenue_cents', 1)
        )

        if revenue_change < -30:
            anomalies.append(Anomaly(
                type="revenue_drop",
                severity="critical" if revenue_change < -50 else "warning",
                message=f"Revenue is down {abs(revenue_change):.0f}% compared to average",
                product_id=None,
                suggested_action="Review traffic sources and conversion funnel",
                detected_at=now
            ))
        elif revenue_change > 50:
            anomalies.append(Anomaly(
                type="revenue_spike",
                severity="info",
                message=f"Revenue is up {revenue_change:.0f}% - great performance!",
                product_id=None,
                suggested_action="Identify what's working and double down",
                detected_at=now
            ))

        # Order anomaly detection
        orders_change = self._calculate_change(
            current_metrics.get('orders', 0),
            historical_avg.get('orders', 1)
        )

        if orders_change < -40:
            anomalies.append(Anomaly(
                type="orders_drop",
                severity="warning",
                message=f"Orders are down {abs(orders_change):.0f}% from average",
                product_id=None,
                suggested_action="Check site performance and marketing campaigns",
                detected_at=now
            ))

        # Low inventory detection
        for product in products:
            stock = product.get('inventory_quantity', 0)
            if stock <= 5 and stock > 0:
                anomalies.append(Anomaly(
                    type="low_inventory",
                    severity="warning",
                    message=f"Low stock alert: {product.get('name', 'Unknown')} has only {stock} units left",
                    product_id=product.get('id'),
                    suggested_action="Reorder inventory or mark as limited edition",
                    detected_at=now
                ))
            elif stock == 0:
                anomalies.append(Anomaly(
                    type="out_of_stock",
                    severity="critical",
                    message=f"Out of stock: {product.get('name', 'Unknown')}",
                    product_id=product.get('id'),
                    suggested_action="Restock immediately or pause advertising",
                    detected_at=now
                ))

        # High performing product detection
        for product in products:
            if product.get('trend_score', 0) > 85:
                anomalies.append(Anomaly(
                    type="trending_product",
                    severity="info",
                    message=f"Product trending: {product.get('name', 'Unknown')} has a trend score of {product.get('trend_score')}",
                    product_id=product.get('id'),
                    suggested_action="Increase ad spend and ensure adequate inventory",
                    detected_at=now
                ))

        return anomalies

    async def predict_trends(
        self,
        products: List[Dict[str, Any]],
        market_signals: List[Dict[str, Any]] = None
    ) -> List[TrendPrediction]:
        """Predict upcoming product trends."""
        predictions = []

        for product in products[:10]:  # Analyze top 10
            # Calculate trend momentum
            trend_score = product.get('trend_score', 50)
            velocity = product.get('trend_velocity', 0)

            # Simple prediction based on current trajectory
            predicted_score = min(100, trend_score + velocity * 7)  # 7-day projection
            confidence = 0.7 if abs(velocity) > 2 else 0.5

            if velocity > 3:
                reasoning = f"Strong upward momentum (+{velocity}/day). Expect continued growth."
            elif velocity > 0:
                reasoning = f"Moderate growth trend. Product is gaining traction."
            elif velocity < -3:
                reasoning = f"Declining interest (-{abs(velocity)}/day). Consider refreshing content."
            else:
                reasoning = f"Stable performance. Maintain current strategy."

            predictions.append(TrendPrediction(
                product_id=product.get('id'),
                product_name=product.get('name', 'Unknown'),
                predicted_score=predicted_score,
                confidence=confidence,
                reasoning=reasoning
            ))

        # Sort by predicted score
        predictions.sort(key=lambda x: x.predicted_score, reverse=True)
        return predictions

    async def suggest_price_optimizations(
        self,
        products: List[Dict[str, Any]]
    ) -> List[PricingSuggestion]:
        """Suggest price optimizations based on performance data."""
        suggestions = []

        for product in products:
            product_id = product.get('id')
            name = product.get('name', 'Unknown')
            price_cents = product.get('price_cents', 0)
            views = product.get('views', 0)
            purchases = product.get('purchases', 0)
            conversion_rate = (purchases / views * 100) if views > 0 else 0

            suggested_price = price_cents
            reasoning = ""
            impact = ""

            # High views, low conversion = possibly too expensive
            if views > 100 and conversion_rate < 1:
                suggested_price = int(price_cents * 0.85)  # 15% reduction
                reasoning = "High traffic but low conversion suggests price sensitivity. A price reduction could boost sales."
                impact = "Expected 20-30% increase in conversion rate"

            # High conversion = can possibly increase price
            elif conversion_rate > 5 and purchases > 10:
                suggested_price = int(price_cents * 1.10)  # 10% increase
                reasoning = "Strong conversion rate indicates price is below market value. Test a higher price point."
                impact = "Expected 10% revenue increase with minimal volume impact"

            # Moderate conversion with good volume
            elif 2 <= conversion_rate <= 4 and purchases > 5:
                suggested_price = int(price_cents * 1.05)  # 5% increase
                reasoning = "Healthy conversion rate. Small price increase could improve margins."
                impact = "Expected 5% margin improvement"

            if suggested_price != price_cents:
                suggestions.append(PricingSuggestion(
                    product_id=product_id,
                    product_name=name,
                    current_price_cents=price_cents,
                    suggested_price_cents=suggested_price,
                    expected_impact=impact,
                    reasoning=reasoning
                ))

        return suggestions

    # Helper methods
    def _calculate_change(self, current: float, previous: float) -> float:
        """Calculate percentage change."""
        if previous == 0:
            return 100 if current > 0 else 0
        return ((current - previous) / previous) * 100

    def _format_top_products(self, products: List[Dict[str, Any]]) -> str:
        """Format top products for prompt."""
        lines = []
        for i, p in enumerate(products[:5], 1):
            lines.append(f"{i}. {p.get('name', 'Unknown')} - {p.get('units_sold', 0)} units, ${p.get('revenue_cents', 0) / 100:.2f}")
        return "\n".join(lines) if lines else "No sales data available"

    def _parse_digest_response(self, text: str, metrics: Dict[str, Any]) -> DailyDigest:
        """Parse AI response into DailyDigest."""
        import json

        try:
            # Try to extract JSON from response
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                data = json.loads(text[start:end])
                return DailyDigest(
                    summary=data.get('summary', 'Business performance summary not available.'),
                    key_metrics=metrics,
                    highlights=data.get('highlights', []),
                    concerns=data.get('concerns', []),
                    recommendations=data.get('recommendations', [])
                )
        except json.JSONDecodeError:
            pass

        # Fallback parsing
        return DailyDigest(
            summary=text[:500] if text else "Unable to generate summary.",
            key_metrics=metrics,
            highlights=["Review the full metrics for detailed analysis"],
            concerns=[],
            recommendations=["Continue monitoring key metrics"]
        )

    def _parse_product_insight(
        self,
        text: str,
        product_id: int,
        product_name: str,
        views: int,
        purchases: int,
        revenue_cents: int,
        conversion_rate: float
    ) -> ProductInsight:
        """Parse AI response into ProductInsight."""
        recommendation = "keep"
        reasoning = text

        text_upper = text.upper()
        if "PROMOTE" in text_upper:
            recommendation = "promote"
        elif "REPRICE" in text_upper:
            recommendation = "reprice"
        elif "DROP" in text_upper:
            recommendation = "drop"

        # Extract reasoning
        if "REASONING:" in text:
            reasoning = text.split("REASONING:")[-1].strip()

        return ProductInsight(
            product_id=product_id,
            product_name=product_name,
            summary=f"Product has {views:,} views with {conversion_rate:.1f}% conversion",
            metrics={
                "views": views,
                "purchases": purchases,
                "revenue_cents": revenue_cents,
                "conversion_rate": conversion_rate
            },
            recommendation=recommendation,
            reasoning=reasoning[:300]
        )

    # Fallback generators
    def _generate_fallback_digest(
        self,
        metrics: Dict[str, Any],
        yesterday_metrics: Dict[str, Any],
        top_products: List[Dict[str, Any]]
    ) -> DailyDigest:
        """Generate fallback digest without AI."""
        revenue = metrics.get('revenue_cents', 0) / 100
        orders = metrics.get('orders', 0)
        yesterday_revenue = yesterday_metrics.get('revenue_cents', 0) / 100

        revenue_change = self._calculate_change(
            metrics.get('revenue_cents', 0),
            yesterday_metrics.get('revenue_cents', 1)
        )

        if revenue_change > 10:
            summary = f"Great day! Revenue of ${revenue:.2f} is up {revenue_change:.0f}% from yesterday."
        elif revenue_change < -10:
            summary = f"Revenue of ${revenue:.2f} is down {abs(revenue_change):.0f}% from yesterday. Worth investigating."
        else:
            summary = f"Steady performance with ${revenue:.2f} in revenue and {orders} orders."

        highlights = []
        if orders > 0:
            highlights.append(f"Received {orders} orders today")
        if top_products:
            highlights.append(f"Top seller: {top_products[0].get('name', 'N/A')}")
        if revenue_change > 0:
            highlights.append(f"Revenue trending up {revenue_change:.0f}%")

        concerns = []
        if revenue_change < -20:
            concerns.append("Significant revenue decline - check traffic and conversions")
        if metrics.get('conversion_rate', 0) < 1:
            concerns.append("Conversion rate below 1% - review product pages and pricing")

        recommendations = [
            "Review your top performing products for upsell opportunities",
            "Consider A/B testing your checkout flow",
            "Engage with customers on social media"
        ]

        return DailyDigest(
            summary=summary,
            key_metrics=metrics,
            highlights=highlights if highlights else ["No notable highlights today"],
            concerns=concerns,
            recommendations=recommendations[:2]
        )

    def _generate_fallback_product_insight(
        self,
        product_id: int,
        product_name: str,
        price_cents: int,
        views: int,
        purchases: int,
        conversion_rate: float
    ) -> ProductInsight:
        """Generate fallback product insight without AI."""
        if conversion_rate > 3:
            recommendation = "promote"
            reasoning = "Strong conversion rate above industry average. Consider increasing ad spend."
        elif conversion_rate < 1 and views > 50:
            recommendation = "reprice"
            reasoning = "Low conversion despite traffic suggests pricing issues. Test lower price point."
        elif views < 10:
            recommendation = "promote"
            reasoning = "Low visibility. Increase marketing to gather more data."
        else:
            recommendation = "keep"
            reasoning = "Performance is average. Continue monitoring."

        return ProductInsight(
            product_id=product_id,
            product_name=product_name,
            summary=f"Product has {views:,} views with {conversion_rate:.1f}% conversion",
            metrics={
                "views": views,
                "purchases": purchases,
                "price_cents": price_cents,
                "conversion_rate": conversion_rate
            },
            recommendation=recommendation,
            reasoning=reasoning
        )


# Singleton instance
insights_service = InsightsService()
