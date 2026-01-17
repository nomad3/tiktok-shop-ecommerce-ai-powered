import os
import json
from typing import Optional
from dataclasses import dataclass
import anthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


@dataclass
class ScoringResult:
    trend_score: float
    urgency_score: float
    reasoning: str
    suggested_name: Optional[str] = None
    suggested_description: Optional[str] = None


@dataclass
class ContentGenerationResult:
    success: bool
    content: str
    variations: list[str]
    tokens_used: int = 0


@dataclass
class PricingRecommendation:
    suggested_price_cents: int
    min_price_cents: int
    max_price_cents: int
    confidence: float
    reasoning: str
    competitor_analysis: Optional[str] = None


@dataclass
class AdCopyResult:
    headline: str
    body: str
    cta: str
    hashtags: list[str]
    variations: list[dict]


class AIService:
    def __init__(self):
        self.client = None
        if ANTHROPIC_API_KEY:
            self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def score_trend(
        self,
        hashtag: str,
        views: int,
        growth_rate: float,
        engagement: int,
        video_count: int
    ) -> ScoringResult:
        """Score a trend using Claude for virality and urgency potential."""

        if not self.client:
            # Fallback to simple heuristic if no API key
            return self._heuristic_score(views, growth_rate, engagement, video_count)

        prompt = f"""Analyze this TikTok trend data and provide scores for a potential e-commerce product opportunity.

Trend Data:
- Hashtag: #{hashtag}
- Total Views: {views:,}
- Growth Rate: {growth_rate}%
- Total Engagement (likes + comments + shares): {engagement:,}
- Number of Videos: {video_count:,}

Provide two scores from 0-100:
1. **trend_score**: How viral/popular is this trend? Consider view velocity, engagement ratio, and video count.
2. **urgency_score**: How time-sensitive is this opportunity? High urgency = trend is peaking NOW and will fade soon. Low urgency = evergreen trend.

Also suggest a potential product name and description if this trend could be monetized.

Respond in JSON format:
{{
    "trend_score": <0-100>,
    "urgency_score": <0-100>,
    "reasoning": "<brief explanation>",
    "suggested_name": "<product name or null>",
    "suggested_description": "<product description or null>"
}}"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Extract JSON from response
            response_text = message.content[0].text

            # Try to parse JSON from the response
            try:
                # Handle case where response might have markdown code blocks
                if "```json" in response_text:
                    json_str = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    json_str = response_text.split("```")[1].split("```")[0]
                else:
                    json_str = response_text

                result = json.loads(json_str.strip())

                return ScoringResult(
                    trend_score=min(100, max(0, float(result.get("trend_score", 50)))),
                    urgency_score=min(100, max(0, float(result.get("urgency_score", 50)))),
                    reasoning=result.get("reasoning", ""),
                    suggested_name=result.get("suggested_name"),
                    suggested_description=result.get("suggested_description")
                )
            except (json.JSONDecodeError, IndexError):
                # Fallback if JSON parsing fails
                return self._heuristic_score(views, growth_rate, engagement, video_count)

        except anthropic.APIError as e:
            print(f"Anthropic API Error: {e}")
            return self._heuristic_score(views, growth_rate, engagement, video_count)

    def _heuristic_score(
        self,
        views: int,
        growth_rate: float,
        engagement: int,
        video_count: int
    ) -> ScoringResult:
        """Fallback heuristic scoring when AI is unavailable."""

        # Trend score based on views and engagement
        view_score = min(50, (views / 10_000_000) * 50)  # Max 50 from views
        engagement_score = min(30, (engagement / 1_000_000) * 30)  # Max 30 from engagement
        velocity_score = min(20, growth_rate * 0.2)  # Max 20 from growth rate

        trend_score = view_score + engagement_score + velocity_score

        # Urgency score based on growth rate and video count
        # High growth + low video count = early trend = high urgency
        # High growth + high video count = peaking trend = very high urgency
        # Low growth = fading or stable = lower urgency

        if growth_rate > 70:
            urgency_base = 80
        elif growth_rate > 40:
            urgency_base = 60
        else:
            urgency_base = 40

        # Adjust based on video count (more videos = trend is more established)
        if video_count > 100000:
            urgency_modifier = 10  # Peak viral, act now
        elif video_count > 10000:
            urgency_modifier = 5
        else:
            urgency_modifier = -10  # Still emerging, less urgent

        urgency_score = min(100, max(0, urgency_base + urgency_modifier))

        return ScoringResult(
            trend_score=round(trend_score, 1),
            urgency_score=round(urgency_score, 1),
            reasoning="Scored using heuristic algorithm (AI unavailable)"
        )

    def generate_product_description(
        self,
        product_name: str,
        category: Optional[str] = None,
        features: Optional[list[str]] = None,
        target_audience: Optional[str] = None,
        tone: str = "engaging",
        length: str = "medium"
    ) -> ContentGenerationResult:
        """Generate compelling product descriptions optimized for e-commerce."""

        if not self.client:
            return self._fallback_description(product_name, features)

        features_text = "\n".join(f"- {f}" for f in (features or [])) if features else "None specified"
        length_guide = {
            "short": "2-3 sentences (50-100 words)",
            "medium": "4-6 sentences (100-200 words)",
            "long": "2-3 paragraphs (200-400 words)"
        }

        prompt = f"""Generate a compelling e-commerce product description for TikTok Shop.

Product: {product_name}
Category: {category or "General"}
Key Features:
{features_text}
Target Audience: {target_audience or "General consumers"}
Tone: {tone} (options: engaging, professional, fun, luxurious, urgent)
Length: {length_guide.get(length, length_guide["medium"])}

Requirements:
- Start with a hook that grabs attention
- Highlight key benefits, not just features
- Include social proof elements where appropriate
- End with a subtle call-to-action
- Optimize for mobile reading (short paragraphs)
- Use emojis sparingly but effectively

Respond in JSON format:
{{
    "description": "<main description>",
    "variations": ["<variation 1>", "<variation 2>"]
}}"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            result = self._parse_json_response(response_text)

            return ContentGenerationResult(
                success=True,
                content=result.get("description", ""),
                variations=result.get("variations", []),
                tokens_used=message.usage.input_tokens + message.usage.output_tokens
            )
        except Exception as e:
            print(f"AI Description Generation Error: {e}")
            return self._fallback_description(product_name, features)

    def _fallback_description(
        self,
        product_name: str,
        features: Optional[list[str]] = None
    ) -> ContentGenerationResult:
        """Fallback description when AI is unavailable."""
        features_text = ""
        if features:
            features_text = " Features include: " + ", ".join(features[:3]) + "."

        description = f"Introducing the {product_name} - the must-have product everyone's talking about!{features_text} Get yours before it's gone!"

        return ContentGenerationResult(
            success=True,
            content=description,
            variations=[description],
            tokens_used=0
        )

    def generate_ad_copy(
        self,
        product_name: str,
        product_description: str,
        platform: str = "tiktok",
        goal: str = "conversions"
    ) -> AdCopyResult:
        """Generate ad copy optimized for social media platforms."""

        if not self.client:
            return self._fallback_ad_copy(product_name)

        prompt = f"""Generate ad copy for a social media advertisement.

Product: {product_name}
Description: {product_description}
Platform: {platform} (tiktok, instagram, facebook)
Goal: {goal} (awareness, engagement, conversions)

Platform-specific requirements for {platform}:
- TikTok: Casual, trendy, uses current slang, hooks in first 2 seconds
- Instagram: Visual-focused, aspirational, hashtag-heavy
- Facebook: More detailed, targets older demographics, clear value proposition

Generate:
1. A headline (max 10 words)
2. Body copy (2-3 sentences)
3. Call-to-action (5 words max)
4. Relevant hashtags (5-8)
5. Two variations of the above

Respond in JSON:
{{
    "headline": "<headline>",
    "body": "<body copy>",
    "cta": "<call to action>",
    "hashtags": ["<hashtag1>", "<hashtag2>", ...],
    "variations": [
        {{"headline": "...", "body": "...", "cta": "...", "hashtags": [...]}},
        {{"headline": "...", "body": "...", "cta": "...", "hashtags": [...]}}
    ]
}}"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            result = self._parse_json_response(response_text)

            return AdCopyResult(
                headline=result.get("headline", ""),
                body=result.get("body", ""),
                cta=result.get("cta", "Shop Now"),
                hashtags=result.get("hashtags", []),
                variations=result.get("variations", [])
            )
        except Exception as e:
            print(f"AI Ad Copy Generation Error: {e}")
            return self._fallback_ad_copy(product_name)

    def _fallback_ad_copy(self, product_name: str) -> AdCopyResult:
        """Fallback ad copy when AI is unavailable."""
        return AdCopyResult(
            headline=f"Get Your {product_name} Today!",
            body=f"Everyone's obsessed with the {product_name}. Join thousands of happy customers and see what the hype is about!",
            cta="Shop Now",
            hashtags=["#trending", "#musthave", "#tiktokmademebuyit", "#viral", "#sale"],
            variations=[]
        )

    def recommend_pricing(
        self,
        product_name: str,
        supplier_cost_cents: int,
        category: Optional[str] = None,
        competitor_prices: Optional[list[int]] = None,
        target_margin: float = 0.5
    ) -> PricingRecommendation:
        """Get AI-powered pricing recommendations."""

        if not self.client:
            return self._heuristic_pricing(supplier_cost_cents, target_margin)

        competitor_text = ""
        if competitor_prices:
            avg = sum(competitor_prices) / len(competitor_prices)
            competitor_text = f"\nCompetitor prices: ${min(competitor_prices)/100:.2f} - ${max(competitor_prices)/100:.2f} (avg: ${avg/100:.2f})"

        prompt = f"""Recommend pricing for an e-commerce product.

Product: {product_name}
Category: {category or "General"}
Supplier Cost: ${supplier_cost_cents/100:.2f}
Target Margin: {target_margin*100:.0f}%{competitor_text}

Consider:
1. Perceived value based on product type
2. TikTok Shop market expectations
3. Psychological pricing (e.g., $19.99 vs $20)
4. Competitive positioning
5. Margin sustainability

Respond in JSON:
{{
    "suggested_price_cents": <int>,
    "min_price_cents": <int>,
    "max_price_cents": <int>,
    "confidence": <0-1>,
    "reasoning": "<explanation>",
    "competitor_analysis": "<if competitors provided>"
}}"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            result = self._parse_json_response(response_text)

            return PricingRecommendation(
                suggested_price_cents=result.get("suggested_price_cents", int(supplier_cost_cents * (1 + target_margin))),
                min_price_cents=result.get("min_price_cents", supplier_cost_cents),
                max_price_cents=result.get("max_price_cents", supplier_cost_cents * 4),
                confidence=result.get("confidence", 0.7),
                reasoning=result.get("reasoning", ""),
                competitor_analysis=result.get("competitor_analysis")
            )
        except Exception as e:
            print(f"AI Pricing Recommendation Error: {e}")
            return self._heuristic_pricing(supplier_cost_cents, target_margin)

    def _heuristic_pricing(
        self,
        supplier_cost_cents: int,
        target_margin: float
    ) -> PricingRecommendation:
        """Fallback pricing when AI is unavailable."""
        base_price = int(supplier_cost_cents * (1 + target_margin))

        # Round to psychological price point
        if base_price < 1000:
            suggested = ((base_price // 100) * 100) + 99  # e.g., 599, 799, 999
        elif base_price < 5000:
            suggested = ((base_price // 500) * 500) + 499  # e.g., 1499, 1999, 2499
        else:
            suggested = ((base_price // 1000) * 1000) + 999  # e.g., 2999, 4999

        return PricingRecommendation(
            suggested_price_cents=suggested,
            min_price_cents=int(supplier_cost_cents * 1.3),
            max_price_cents=int(supplier_cost_cents * 3.5),
            confidence=0.6,
            reasoning="Calculated using standard markup formula with psychological pricing adjustment"
        )

    def _parse_json_response(self, response_text: str) -> dict:
        """Parse JSON from AI response, handling markdown code blocks."""
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]
            else:
                json_str = response_text
            return json.loads(json_str.strip())
        except (json.JSONDecodeError, IndexError):
            return {}


# Singleton instance
ai_service = AIService()
