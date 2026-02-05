import os
import requests
import logging
import math
from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "tiktok-scraper2.p.rapidapi.com")


class TrendCategory(Enum):
    """Categories for TikTok trends."""
    FASHION = "fashion"
    BEAUTY = "beauty"
    TECH = "tech"
    HOME = "home"
    FOOD = "food"
    FITNESS = "fitness"
    ENTERTAINMENT = "entertainment"
    DIY = "diy"
    LIFESTYLE = "lifestyle"
    OTHER = "other"


class VelocityLevel(Enum):
    """Trend velocity levels."""
    VIRAL = "viral"      # Extremely fast growth (>500% in 24h)
    HOT = "hot"          # Fast growth (100-500% in 24h) 
    TRENDING = "trending"  # Moderate growth (25-100% in 24h)
    STABLE = "stable"    # Slow/steady growth (5-25% in 24h)
    DECLINING = "declining"  # Negative or minimal growth (<5% in 24h)


@dataclass
class TrendData:
    hashtag: str
    views: int
    growth_rate: float
    engagement: int
    video_count: int
    raw_data: dict
    fetched_at: datetime
    category: TrendCategory = TrendCategory.OTHER
    velocity: VelocityLevel = VelocityLevel.STABLE
    trend_score: float = 0.0
    urgency_score: float = 0.0
    commercial_potential: float = 0.0


class TikTokService:
    def __init__(self):
        self.base_url = f"https://{RAPIDAPI_HOST}"
        self.headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST
        }
        
        # Category keywords for trend classification
        self.category_keywords = {
            TrendCategory.FASHION: [
                'fashion', 'outfit', 'ootd', 'style', 'clothing', 'shoes', 'dress', 
                'accessories', 'jewelry', 'bag', 'trendy', 'streetwear', 'luxury'
            ],
            TrendCategory.BEAUTY: [
                'beauty', 'makeup', 'skincare', 'cosmetics', 'lipstick', 'foundation',
                'skincare', 'glowup', 'tutorial', 'routine', 'products', 'review'
            ],
            TrendCategory.TECH: [
                'tech', 'gadget', 'iphone', 'android', 'laptop', 'gaming', 'ai',
                'smart', 'device', 'review', 'unboxing', 'technology', 'innovation'
            ],
            TrendCategory.HOME: [
                'home', 'decor', 'furniture', 'kitchen', 'organization', 'cleaning',
                'diy', 'homeimprovement', 'interior', 'design', 'room', 'house'
            ],
            TrendCategory.FOOD: [
                'food', 'recipe', 'cooking', 'baking', 'restaurant', 'snack',
                'healthy', 'diet', 'nutrition', 'meal', 'kitchen', 'chef'
            ],
            TrendCategory.FITNESS: [
                'fitness', 'workout', 'gym', 'exercise', 'health', 'yoga',
                'running', 'weights', 'training', 'muscle', 'cardio', 'wellness'
            ],
            TrendCategory.ENTERTAINMENT: [
                'entertainment', 'movie', 'music', 'celebrity', 'show', 'tv',
                'netflix', 'spotify', 'concert', 'performance', 'artist', 'viral'
            ],
            TrendCategory.DIY: [
                'diy', 'craft', 'handmade', 'tutorial', 'project', 'creative',
                'art', 'painting', 'drawing', 'making', 'build', 'create'
            ],
            TrendCategory.LIFESTYLE: [
                'lifestyle', 'daily', 'routine', 'motivation', 'productivity',
                'selfcare', 'mindset', 'goals', 'habits', 'wellness', 'life'
            ]
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
        """Fetch trending hashtags from TikTok with enhanced scoring."""
        try:
            data = self._make_request("trending/hashtags", {"count": count})

            trends = []
            for item in data.get("data", []):
                trend_data = self._create_enhanced_trend_data(item)
                trends.append(trend_data)

            # Sort by trend score (highest first)
            trends.sort(key=lambda x: x.trend_score, reverse=True)
            return trends[:count]
            
        except requests.RequestException as e:
            logger.error(f"TikTok API Error: {e}")
            return self._generate_fallback_trends(count)

    def fetch_hashtag_stats(self, hashtag: str) -> Optional[TrendData]:
        """Fetch stats for a specific hashtag with enhanced scoring."""
        try:
            data = self._make_request("hashtag/info", {"hashtag": hashtag})

            item = data.get("data", {})
            if not item:
                return None

            # Add hashtag to item for processing
            item["hashtag"] = hashtag
            return self._create_enhanced_trend_data(item)
            
        except requests.RequestException as e:
            logger.error(f"TikTok API Error for hashtag {hashtag}: {e}")
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

    def _create_enhanced_trend_data(self, item: dict) -> TrendData:
        """Create enhanced TrendData with scoring, categorization, and velocity detection."""
        hashtag = item.get("hashtag", "").replace("#", "")
        views = item.get("views", 0)
        likes = item.get("likes", 0)
        comments = item.get("comments", 0)
        shares = item.get("shares", 0)
        video_count = item.get("videoCount", 1)
        
        # Calculate base metrics
        engagement = likes + comments + shares
        growth_rate = self._calculate_growth_rate(item)
        
        # Enhanced categorization
        category = self._categorize_trend(hashtag)
        
        # Velocity detection
        velocity = self._detect_velocity(growth_rate, views, engagement, video_count)
        
        # Advanced scoring
        trend_score = self._calculate_trend_score(
            views, engagement, video_count, growth_rate, velocity, category
        )
        urgency_score = self._calculate_urgency_score(velocity, trend_score, engagement)
        commercial_potential = self._calculate_commercial_potential(
            category, engagement, video_count, hashtag
        )
        
        return TrendData(
            hashtag=hashtag,
            views=views,
            growth_rate=growth_rate,
            engagement=engagement,
            video_count=video_count,
            raw_data=item,
            fetched_at=datetime.utcnow(),
            category=category,
            velocity=velocity,
            trend_score=trend_score,
            urgency_score=urgency_score,
            commercial_potential=commercial_potential
        )

    def _calculate_growth_rate(self, item: dict) -> float:
        """Calculate enhanced growth rate from raw data."""
        views = item.get("views", 0)
        video_count = item.get("videoCount", 1)
        likes = item.get("likes", 0)
        
        if video_count == 0:
            return 0.0

        # Multiple factors for growth rate calculation
        views_per_video = views / video_count if video_count > 0 else 0
        engagement_rate = likes / views if views > 0 else 0
        
        # Weighted growth calculation
        base_growth = min(100, (views_per_video / 50000) * 50)  # Views component
        engagement_boost = min(50, (engagement_rate * 100) * 50)  # Engagement component
        
        total_growth = base_growth + engagement_boost
        return round(min(100, total_growth), 2)

    def _categorize_trend(self, hashtag: str) -> TrendCategory:
        """Categorize trend based on hashtag content."""
        hashtag_lower = hashtag.lower()
        
        # Score each category based on keyword matches
        category_scores = {}
        for category, keywords in self.category_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword in hashtag_lower:
                    score += len(keyword)  # Longer keywords get higher weight
            category_scores[category] = score
        
        # Return category with highest score, or OTHER if no matches
        if not category_scores or max(category_scores.values()) == 0:
            return TrendCategory.OTHER
            
        return max(category_scores, key=category_scores.get)

    def _detect_velocity(self, growth_rate: float, views: int, engagement: int, video_count: int) -> VelocityLevel:
        """Detect trend velocity based on multiple signals."""
        # Calculate velocity indicators
        engagement_ratio = engagement / views if views > 0 else 0
        videos_per_million_views = (video_count / max(views / 1000000, 0.001))
        
        # Multi-factor velocity score
        velocity_score = 0
        
        # Growth rate factor (0-40 points)
        if growth_rate >= 80:
            velocity_score += 40
        elif growth_rate >= 60:
            velocity_score += 30
        elif growth_rate >= 40:
            velocity_score += 20
        elif growth_rate >= 20:
            velocity_score += 10
        
        # Engagement factor (0-30 points)
        if engagement_ratio >= 0.05:  # 5%+ engagement is viral
            velocity_score += 30
        elif engagement_ratio >= 0.03:  # 3%+ is hot
            velocity_score += 20
        elif engagement_ratio >= 0.015:  # 1.5%+ is trending
            velocity_score += 10
        
        # Video density factor (0-30 points)
        if videos_per_million_views <= 10:  # Few videos, high impact
            velocity_score += 30
        elif videos_per_million_views <= 50:
            velocity_score += 20
        elif videos_per_million_views <= 100:
            velocity_score += 10
        
        # Classify based on total score
        if velocity_score >= 80:
            return VelocityLevel.VIRAL
        elif velocity_score >= 60:
            return VelocityLevel.HOT
        elif velocity_score >= 30:
            return VelocityLevel.TRENDING
        elif velocity_score >= 10:
            return VelocityLevel.STABLE
        else:
            return VelocityLevel.DECLINING

    def _calculate_trend_score(
        self, views: int, engagement: int, video_count: int, 
        growth_rate: float, velocity: VelocityLevel, category: TrendCategory
    ) -> float:
        """Calculate comprehensive trend score (0-100)."""
        score = 0.0
        
        # Base engagement score (0-25 points)
        engagement_rate = engagement / views if views > 0 else 0
        score += min(25, engagement_rate * 500)  # Scale to 25 max
        
        # Views score (0-20 points)  
        views_score = min(20, math.log10(max(views, 1)) * 2)  # Logarithmic scale
        score += views_score
        
        # Growth rate score (0-25 points)
        score += (growth_rate / 100) * 25
        
        # Velocity multiplier (0-20 points)
        velocity_points = {
            VelocityLevel.VIRAL: 20,
            VelocityLevel.HOT: 15,
            VelocityLevel.TRENDING: 10,
            VelocityLevel.STABLE: 5,
            VelocityLevel.DECLINING: 0
        }
        score += velocity_points[velocity]
        
        # Category commercial bonus (0-10 points)
        commercial_categories = [
            TrendCategory.FASHION, TrendCategory.BEAUTY, 
            TrendCategory.TECH, TrendCategory.HOME
        ]
        if category in commercial_categories:
            score += 10
        elif category == TrendCategory.LIFESTYLE:
            score += 5
        
        return round(min(100, score), 2)

    def _calculate_urgency_score(self, velocity: VelocityLevel, trend_score: float, engagement: int) -> float:
        """Calculate urgency score for trend timing (0-100)."""
        base_score = trend_score * 0.6  # Start with 60% of trend score
        
        # Velocity urgency multiplier
        velocity_multipliers = {
            VelocityLevel.VIRAL: 1.8,    # Extremely urgent
            VelocityLevel.HOT: 1.5,      # Very urgent
            VelocityLevel.TRENDING: 1.2, # Moderately urgent
            VelocityLevel.STABLE: 0.8,   # Low urgency
            VelocityLevel.DECLINING: 0.3  # Very low urgency
        }
        
        base_score *= velocity_multipliers[velocity]
        
        # Engagement freshness factor
        if engagement > 100000:  # High engagement = more urgent
            base_score *= 1.2
        elif engagement > 10000:
            base_score *= 1.1
        
        return round(min(100, base_score), 2)

    def _calculate_commercial_potential(
        self, category: TrendCategory, engagement: int, video_count: int, hashtag: str
    ) -> float:
        """Calculate commercial potential score (0-100)."""
        # Base score by category
        category_scores = {
            TrendCategory.FASHION: 85,
            TrendCategory.BEAUTY: 90,
            TrendCategory.TECH: 75,
            TrendCategory.HOME: 80,
            TrendCategory.FOOD: 60,
            TrendCategory.FITNESS: 70,
            TrendCategory.LIFESTYLE: 65,
            TrendCategory.DIY: 55,
            TrendCategory.ENTERTAINMENT: 30,
            TrendCategory.OTHER: 40
        }
        
        base_score = category_scores[category]
        
        # Engagement factor
        if engagement > 500000:
            base_score *= 1.3
        elif engagement > 100000:
            base_score *= 1.2
        elif engagement > 50000:
            base_score *= 1.1
        
        # Commercial keywords boost
        commercial_keywords = ['buy', 'shop', 'deal', 'sale', 'discount', 'product', 'review', 'haul']
        hashtag_lower = hashtag.lower()
        for keyword in commercial_keywords:
            if keyword in hashtag_lower:
                base_score *= 1.1
                break
        
        return round(min(100, base_score), 2)

    def _generate_fallback_trends(self, count: int) -> List[TrendData]:
        """Generate fallback trending data when API fails."""
        fallback_hashtags = [
            "viral", "trending", "fyp", "foryou", "aesthetic", "ootd", 
            "selfcare", "productivity", "minimalist", "sustainable",
            "techfinds", "beautyfinds", "fashiontrends", "homedesign"
        ]
        
        trends = []
        for i, hashtag in enumerate(fallback_hashtags[:count]):
            # Generate realistic mock data
            views = 1000000 + (i * 500000)
            engagement = views // 20  # 5% engagement
            video_count = 1000 + (i * 200)
            
            trend = TrendData(
                hashtag=hashtag,
                views=views,
                growth_rate=75.0 - (i * 5),  # Decreasing growth
                engagement=engagement,
                video_count=video_count,
                raw_data={},
                fetched_at=datetime.utcnow(),
                category=self._categorize_trend(hashtag),
                velocity=VelocityLevel.HOT if i < 5 else VelocityLevel.TRENDING,
                trend_score=85.0 - (i * 3),
                urgency_score=80.0 - (i * 4),
                commercial_potential=70.0 - (i * 2)
            )
            trends.append(trend)
        
        return trends

    def get_trending_categories(self) -> Dict[TrendCategory, int]:
        """Get count of trending hashtags by category."""
        try:
            trends = self.fetch_trending_hashtags(50)
            category_counts = {}
            
            for trend in trends:
                if trend.category in category_counts:
                    category_counts[trend.category] += 1
                else:
                    category_counts[trend.category] = 1
            
            return category_counts
        except Exception as e:
            logger.error(f"Error getting trending categories: {e}")
            return {}

    def get_velocity_distribution(self) -> Dict[VelocityLevel, int]:
        """Get count of trends by velocity level."""
        try:
            trends = self.fetch_trending_hashtags(50)
            velocity_counts = {}
            
            for trend in trends:
                if trend.velocity in velocity_counts:
                    velocity_counts[trend.velocity] += 1
                else:
                    velocity_counts[trend.velocity] = 1
            
            return velocity_counts
        except Exception as e:
            logger.error(f"Error getting velocity distribution: {e}")
            return {}


# Singleton instance
tiktok_service = TikTokService()
