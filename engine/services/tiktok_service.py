import os
import requests
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "tiktok-scraper2.p.rapidapi.com")


@dataclass
class TrendData:
    hashtag: str
    views: int
    growth_rate: float
    engagement: int
    video_count: int
    raw_data: dict
    fetched_at: datetime


class TikTokService:
    def __init__(self):
        self.base_url = f"https://{RAPIDAPI_HOST}"
        self.headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST
        }

    def _make_request(self, endpoint: str, params: dict = None) -> dict:
        """Make a request to the RapidAPI TikTok endpoint."""
        if not RAPIDAPI_KEY:
            raise ValueError("RAPIDAPI_KEY environment variable not set")

        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params or {})
        response.raise_for_status()
        return response.json()

    def fetch_trending_hashtags(self, count: int = 20) -> List[TrendData]:
        """Fetch trending hashtags from TikTok."""
        try:
            data = self._make_request("trending/hashtags", {"count": count})

            trends = []
            for item in data.get("data", []):
                trend = TrendData(
                    hashtag=item.get("hashtag", ""),
                    views=item.get("views", 0),
                    growth_rate=self._calculate_growth_rate(item),
                    engagement=item.get("likes", 0) + item.get("comments", 0) + item.get("shares", 0),
                    video_count=item.get("videoCount", 0),
                    raw_data=item,
                    fetched_at=datetime.utcnow()
                )
                trends.append(trend)

            return trends
        except requests.RequestException as e:
            print(f"TikTok API Error: {e}")
            return []

    def fetch_hashtag_stats(self, hashtag: str) -> Optional[TrendData]:
        """Fetch stats for a specific hashtag."""
        try:
            data = self._make_request("hashtag/info", {"hashtag": hashtag})

            item = data.get("data", {})
            if not item:
                return None

            return TrendData(
                hashtag=hashtag,
                views=item.get("views", 0),
                growth_rate=self._calculate_growth_rate(item),
                engagement=item.get("likes", 0) + item.get("comments", 0) + item.get("shares", 0),
                video_count=item.get("videoCount", 0),
                raw_data=item,
                fetched_at=datetime.utcnow()
            )
        except requests.RequestException as e:
            print(f"TikTok API Error for hashtag {hashtag}: {e}")
            return None

    def search_products(self, query: str, count: int = 10) -> List[dict]:
        """Search for product-related content on TikTok."""
        try:
            data = self._make_request("search/general", {
                "keyword": query,
                "count": count
            })

            return data.get("data", [])
        except requests.RequestException as e:
            print(f"TikTok Search Error: {e}")
            return []

    def _calculate_growth_rate(self, item: dict) -> float:
        """Calculate growth rate from raw data."""
        # RapidAPI may provide different fields depending on the endpoint
        # This is a simplified calculation
        views = item.get("views", 0)
        video_count = item.get("videoCount", 1)

        if video_count == 0:
            return 0.0

        # Views per video as a proxy for engagement velocity
        views_per_video = views / video_count

        # Normalize to a 0-100 scale (arbitrary threshold)
        growth_rate = min(100, (views_per_video / 100000) * 100)
        return round(growth_rate, 2)


# Singleton instance
tiktok_service = TikTokService()
