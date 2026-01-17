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


# Singleton instance
ai_service = AIService()
