"""Social content generation service for multiple platforms."""

import os
from typing import List, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class InstagramPost:
    """Generated Instagram post content."""
    caption: str
    hashtags: List[str]
    suggested_image_style: str
    best_posting_time: str


@dataclass
class TikTokCaption:
    """Generated TikTok caption content."""
    caption: str
    hashtags: List[str]
    trending_sounds: List[str]
    video_ideas: List[str]


@dataclass
class FacebookPost:
    """Generated Facebook post content."""
    text: str
    call_to_action: str
    suggested_link_preview: str


@dataclass
class TwitterThread:
    """Generated Twitter thread."""
    tweets: List[str]
    hashtags: List[str]


@dataclass
class PinterestPin:
    """Generated Pinterest pin content."""
    title: str
    description: str
    board_suggestions: List[str]
    keywords: List[str]


class SocialContentService:
    """Service for generating social media content using AI."""

    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("OPENAI_API_KEY")

    async def generate_instagram_post(
        self,
        product_name: str,
        key_features: List[str],
        style: str = "lifestyle",
        include_hashtags: bool = True,
        hashtag_count: int = 20
    ) -> InstagramPost:
        """Generate an Instagram post for a product."""
        if not self.api_key:
            return self._generate_fallback_instagram(product_name, key_features, style, hashtag_count)

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Create an engaging Instagram post for this product:

Product: {product_name}
Key Features: {', '.join(key_features)}
Style: {style}

Guidelines:
- Start with a hook that stops the scroll
- Use emojis strategically (3-5 total)
- Include a clear call to action
- Write in {style} tone
- Keep caption under 2200 characters

Return in this exact format:
CAPTION: [your engaging caption here]
HASHTAGS: [comma-separated list of {hashtag_count} relevant hashtags without # symbol]
IMAGE_STYLE: [brief description of ideal image style]
BEST_TIME: [suggested posting time like "7-9 PM EST"]"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_instagram_response(response_text, product_name)

        except Exception as e:
            logger.error(f"Error generating Instagram post: {e}")
            return self._generate_fallback_instagram(product_name, key_features, style, hashtag_count)

    async def generate_tiktok_caption(
        self,
        product_name: str,
        hook: str,
        include_trending_sounds: bool = True
    ) -> TikTokCaption:
        """Generate a TikTok caption for a product."""
        if not self.api_key:
            return self._generate_fallback_tiktok(product_name, hook)

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Create a TikTok caption for this product:

Product: {product_name}
Video hook: {hook}

Guidelines:
- Keep caption short and punchy (under 150 characters)
- Use trending language/slang naturally
- Include 3-5 hashtags max
- Make it feel authentic, not salesy
- Think about what would make someone watch to the end

Return in this exact format:
CAPTION: [your caption here]
HASHTAGS: [comma-separated list of 4-5 hashtags without # symbol]
SOUNDS: [comma-separated list of 3 trending TikTok sound suggestions]
VIDEO_IDEAS: [3 video concept ideas, separated by |]"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_tiktok_response(response_text, product_name, hook)

        except Exception as e:
            logger.error(f"Error generating TikTok caption: {e}")
            return self._generate_fallback_tiktok(product_name, hook)

    async def generate_facebook_post(
        self,
        product_name: str,
        description: str,
        post_type: str = "product"
    ) -> FacebookPost:
        """Generate a Facebook post for a product."""
        if not self.api_key:
            return self._generate_fallback_facebook(product_name, description)

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Create a Facebook post for this product:

Product: {product_name}
Description: {description}
Post Type: {post_type}

Guidelines:
- Write conversationally for Facebook's audience
- For {post_type} posts, focus on {"direct product benefits" if post_type == "product" else "storytelling" if post_type == "story" else "engagement" if post_type == "question" else "urgency and value"}
- Include a clear call to action
- Keep it under 500 characters for best engagement

Return in this exact format:
TEXT: [your post text here]
CTA: [call to action text like "Shop Now" or "Learn More"]
PREVIEW: [suggested link preview description]"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_facebook_response(response_text, product_name)

        except Exception as e:
            logger.error(f"Error generating Facebook post: {e}")
            return self._generate_fallback_facebook(product_name, description)

    async def generate_twitter_thread(
        self,
        product_name: str,
        key_points: List[str],
        tweet_count: int = 5
    ) -> TwitterThread:
        """Generate a Twitter thread for a product."""
        if not self.api_key:
            return self._generate_fallback_twitter(product_name, key_points)

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Create a Twitter/X thread for this product:

Product: {product_name}
Key Points: {', '.join(key_points)}
Number of tweets: {tweet_count}

Guidelines:
- First tweet should be a strong hook
- Each tweet under 280 characters
- Use thread style (1/, 2/, etc.)
- Last tweet should have a clear CTA
- Use 2-3 relevant hashtags total

Return in this exact format:
TWEET1: [first tweet]
TWEET2: [second tweet]
...
HASHTAGS: [comma-separated hashtags without # symbol]"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_twitter_response(response_text, tweet_count)

        except Exception as e:
            logger.error(f"Error generating Twitter thread: {e}")
            return self._generate_fallback_twitter(product_name, key_points)

    async def generate_pinterest_pin(
        self,
        product_name: str,
        category: str
    ) -> PinterestPin:
        """Generate Pinterest pin content."""
        if not self.api_key:
            return self._generate_fallback_pinterest(product_name, category)

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_key)

            prompt = f"""Create Pinterest pin content for this product:

Product: {product_name}
Category: {category}

Guidelines:
- Title should be descriptive and searchable (max 100 chars)
- Description should be keyword-rich and helpful
- Suggest relevant boards
- Include SEO keywords

Return in this exact format:
TITLE: [pin title]
DESCRIPTION: [pin description, 2-3 sentences]
BOARDS: [comma-separated board suggestions]
KEYWORDS: [comma-separated SEO keywords]"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            return self._parse_pinterest_response(response_text, product_name)

        except Exception as e:
            logger.error(f"Error generating Pinterest pin: {e}")
            return self._generate_fallback_pinterest(product_name, category)

    def get_trending_hashtags(
        self,
        platform: str,
        category: str,
        count: int = 20
    ) -> List[str]:
        """Get trending hashtags for a platform and category."""
        # Static trending hashtags by platform/category
        hashtag_db = {
            "instagram": {
                "fashion": ["ootd", "fashionista", "styleinspo", "outfitoftheday", "fashionblogger", "trendy", "instafashion", "streetstyle", "fashiongram", "lookbook"],
                "beauty": ["beautytips", "makeuplover", "skincare", "beautycare", "glowup", "beautyhacks", "makeuptutorial", "skincareroutine", "beautycommunity", "glow"],
                "tech": ["techgadgets", "innovation", "gadgetlover", "techtok", "smarthome", "techlife", "futuretech", "gadgetreview", "techlover", "newtech"],
                "home": ["homedecor", "homedesign", "interiorinspo", "homegoals", "cozyhome", "homestyle", "interiordesign", "homeinspiration", "homestyling", "decorideas"],
                "default": ["viral", "trending", "musthave", "fyp", "lifestyle", "shopnow", "newdrop", "exclusive", "limited", "dealoftheday"],
            },
            "tiktok": {
                "fashion": ["fashiontok", "ootd", "stylecheck", "getreadywithme", "grwm", "fashionfinds", "trendyfinds", "outfitideas", "fashionhacks"],
                "beauty": ["beautytok", "makeuptok", "skincaretok", "glow", "beautyhacks", "grwm", "makeuproutine", "skincareroutine", "beautytips"],
                "tech": ["techtok", "gadgets", "techfinds", "amazonfinds", "cooltech", "techreview", "unboxing", "techgadgets", "musthave"],
                "home": ["hometok", "amazonhomefinds", "homehacks", "organizingtiktok", "cleaninghacks", "cozyhome", "roomtour", "homedecor"],
                "default": ["fyp", "foryou", "viral", "trending", "tiktokshop", "tiktokmademebuyit", "amazonfinds", "musthave", "lifehack"],
            },
        }

        platform_hashtags = hashtag_db.get(platform.lower(), hashtag_db.get("instagram"))
        category_hashtags = platform_hashtags.get(category.lower(), platform_hashtags.get("default", []))

        return category_hashtags[:count]

    def get_best_posting_times(
        self,
        platform: str,
        audience_timezone: str = "America/New_York"
    ) -> List[dict]:
        """Get best posting times for a platform."""
        best_times = {
            "instagram": [
                {"day": "Monday", "times": ["11 AM", "2 PM"], "engagement_score": 0.85},
                {"day": "Tuesday", "times": ["10 AM", "1 PM", "7 PM"], "engagement_score": 0.90},
                {"day": "Wednesday", "times": ["11 AM", "3 PM"], "engagement_score": 0.88},
                {"day": "Thursday", "times": ["12 PM", "7 PM"], "engagement_score": 0.87},
                {"day": "Friday", "times": ["10 AM", "2 PM"], "engagement_score": 0.82},
                {"day": "Saturday", "times": ["9 AM", "11 AM"], "engagement_score": 0.75},
                {"day": "Sunday", "times": ["10 AM", "7 PM"], "engagement_score": 0.80},
            ],
            "tiktok": [
                {"day": "Monday", "times": ["6 AM", "10 AM", "10 PM"], "engagement_score": 0.85},
                {"day": "Tuesday", "times": ["2 AM", "4 AM", "9 AM"], "engagement_score": 0.88},
                {"day": "Wednesday", "times": ["7 AM", "8 AM", "11 PM"], "engagement_score": 0.90},
                {"day": "Thursday", "times": ["9 AM", "12 PM", "7 PM"], "engagement_score": 0.92},
                {"day": "Friday", "times": ["5 AM", "1 PM", "3 PM"], "engagement_score": 0.89},
                {"day": "Saturday", "times": ["11 AM", "7 PM", "8 PM"], "engagement_score": 0.86},
                {"day": "Sunday", "times": ["7 AM", "8 AM", "4 PM"], "engagement_score": 0.83},
            ],
            "facebook": [
                {"day": "Monday", "times": ["9 AM", "12 PM"], "engagement_score": 0.78},
                {"day": "Tuesday", "times": ["9 AM", "1 PM", "4 PM"], "engagement_score": 0.82},
                {"day": "Wednesday", "times": ["9 AM", "12 PM", "3 PM"], "engagement_score": 0.85},
                {"day": "Thursday", "times": ["8 AM", "12 PM", "5 PM"], "engagement_score": 0.84},
                {"day": "Friday", "times": ["9 AM", "11 AM", "2 PM"], "engagement_score": 0.80},
                {"day": "Saturday", "times": ["12 PM"], "engagement_score": 0.65},
                {"day": "Sunday", "times": ["12 PM", "3 PM"], "engagement_score": 0.68},
            ],
            "twitter": [
                {"day": "Monday", "times": ["8 AM", "10 AM", "12 PM"], "engagement_score": 0.82},
                {"day": "Tuesday", "times": ["9 AM", "12 PM", "3 PM"], "engagement_score": 0.88},
                {"day": "Wednesday", "times": ["9 AM", "12 PM", "5 PM"], "engagement_score": 0.90},
                {"day": "Thursday", "times": ["8 AM", "11 AM", "1 PM"], "engagement_score": 0.87},
                {"day": "Friday", "times": ["9 AM", "10 AM", "11 AM"], "engagement_score": 0.83},
                {"day": "Saturday", "times": ["10 AM"], "engagement_score": 0.60},
                {"day": "Sunday", "times": ["9 AM", "12 PM"], "engagement_score": 0.65},
            ],
        }

        return best_times.get(platform.lower(), best_times["instagram"])

    # Parsing helpers
    def _parse_instagram_response(self, text: str, product_name: str) -> InstagramPost:
        """Parse AI response into InstagramPost."""
        lines = text.strip().split("\n")
        caption = ""
        hashtags = []
        image_style = "Product lifestyle shot"
        best_time = "6-9 PM EST"

        for line in lines:
            if line.startswith("CAPTION:"):
                caption = line.replace("CAPTION:", "").strip()
            elif line.startswith("HASHTAGS:"):
                hashtags = [h.strip().replace("#", "") for h in line.replace("HASHTAGS:", "").split(",")]
            elif line.startswith("IMAGE_STYLE:"):
                image_style = line.replace("IMAGE_STYLE:", "").strip()
            elif line.startswith("BEST_TIME:"):
                best_time = line.replace("BEST_TIME:", "").strip()

        return InstagramPost(
            caption=caption or f"Check out our amazing {product_name}! Link in bio.",
            hashtags=hashtags or self.get_trending_hashtags("instagram", "default", 20),
            suggested_image_style=image_style,
            best_posting_time=best_time
        )

    def _parse_tiktok_response(self, text: str, product_name: str, hook: str) -> TikTokCaption:
        """Parse AI response into TikTokCaption."""
        lines = text.strip().split("\n")
        caption = ""
        hashtags = []
        sounds = []
        video_ideas = []

        for line in lines:
            if line.startswith("CAPTION:"):
                caption = line.replace("CAPTION:", "").strip()
            elif line.startswith("HASHTAGS:"):
                hashtags = [h.strip().replace("#", "") for h in line.replace("HASHTAGS:", "").split(",")]
            elif line.startswith("SOUNDS:"):
                sounds = [s.strip() for s in line.replace("SOUNDS:", "").split(",")]
            elif line.startswith("VIDEO_IDEAS:"):
                video_ideas = [v.strip() for v in line.replace("VIDEO_IDEAS:", "").split("|")]

        return TikTokCaption(
            caption=caption or f"{hook} Check link in bio!",
            hashtags=hashtags or self.get_trending_hashtags("tiktok", "default", 5),
            trending_sounds=sounds or ["original sound", "trending audio", "viral sound"],
            video_ideas=video_ideas or [
                f"POV: You discover {product_name}",
                f"Things TikTok made me buy - {product_name} edition",
                f"Review: Is {product_name} worth it?"
            ]
        )

    def _parse_facebook_response(self, text: str, product_name: str) -> FacebookPost:
        """Parse AI response into FacebookPost."""
        lines = text.strip().split("\n")
        post_text = ""
        cta = "Shop Now"
        preview = ""

        for line in lines:
            if line.startswith("TEXT:"):
                post_text = line.replace("TEXT:", "").strip()
            elif line.startswith("CTA:"):
                cta = line.replace("CTA:", "").strip()
            elif line.startswith("PREVIEW:"):
                preview = line.replace("PREVIEW:", "").strip()

        return FacebookPost(
            text=post_text or f"Introducing {product_name} - your new must-have! Click to learn more.",
            call_to_action=cta,
            suggested_link_preview=preview or f"Shop {product_name} - Limited Time Offer"
        )

    def _parse_twitter_response(self, text: str, tweet_count: int) -> TwitterThread:
        """Parse AI response into TwitterThread."""
        lines = text.strip().split("\n")
        tweets = []
        hashtags = []

        for line in lines:
            if line.startswith("TWEET"):
                tweet = line.split(":", 1)[1].strip() if ":" in line else ""
                if tweet:
                    tweets.append(tweet)
            elif line.startswith("HASHTAGS:"):
                hashtags = [h.strip().replace("#", "") for h in line.replace("HASHTAGS:", "").split(",")]

        return TwitterThread(
            tweets=tweets[:tweet_count] if tweets else [f"{i+1}/ Tweet about the product" for i in range(tweet_count)],
            hashtags=hashtags or ["trending", "musthave", "shopnow"]
        )

    def _parse_pinterest_response(self, text: str, product_name: str) -> PinterestPin:
        """Parse AI response into PinterestPin."""
        lines = text.strip().split("\n")
        title = ""
        description = ""
        boards = []
        keywords = []

        for line in lines:
            if line.startswith("TITLE:"):
                title = line.replace("TITLE:", "").strip()
            elif line.startswith("DESCRIPTION:"):
                description = line.replace("DESCRIPTION:", "").strip()
            elif line.startswith("BOARDS:"):
                boards = [b.strip() for b in line.replace("BOARDS:", "").split(",")]
            elif line.startswith("KEYWORDS:"):
                keywords = [k.strip() for k in line.replace("KEYWORDS:", "").split(",")]

        return PinterestPin(
            title=title or product_name,
            description=description or f"Discover {product_name} - perfect for your collection!",
            board_suggestions=boards or ["Products I Love", "Must Haves", "Shopping List"],
            keywords=keywords or [product_name.lower(), "trending", "must have", "shop"]
        )

    # Fallback generators
    def _generate_fallback_instagram(self, product_name: str, features: List[str], style: str, hashtag_count: int) -> InstagramPost:
        """Generate fallback Instagram post without AI."""
        feature_text = " and ".join(features[:2]) if features else "amazing features"
        caption = f"Meet your new favorite: {product_name}! With {feature_text}, this is a must-have. Link in bio to shop now!"

        return InstagramPost(
            caption=caption,
            hashtags=self.get_trending_hashtags("instagram", "default", hashtag_count),
            suggested_image_style=f"{style.capitalize()} product photography",
            best_posting_time="6-9 PM EST"
        )

    def _generate_fallback_tiktok(self, product_name: str, hook: str) -> TikTokCaption:
        """Generate fallback TikTok caption without AI."""
        return TikTokCaption(
            caption=f"{hook} Link in bio!",
            hashtags=self.get_trending_hashtags("tiktok", "default", 5),
            trending_sounds=["original sound", "trending audio", "viral sound"],
            video_ideas=[
                f"POV: You discover {product_name}",
                f"Things TikTok made me buy",
                f"Honest review: {product_name}"
            ]
        )

    def _generate_fallback_facebook(self, product_name: str, description: str) -> FacebookPost:
        """Generate fallback Facebook post without AI."""
        return FacebookPost(
            text=f"Check out {product_name}! {description[:200]}... Click to learn more!",
            call_to_action="Shop Now",
            suggested_link_preview=f"Shop {product_name}"
        )

    def _generate_fallback_twitter(self, product_name: str, key_points: List[str]) -> TwitterThread:
        """Generate fallback Twitter thread without AI."""
        tweets = [f"1/ Introducing {product_name} - a thread about why you need this:"]
        for i, point in enumerate(key_points[:4], 2):
            tweets.append(f"{i}/ {point}")
        tweets.append(f"{len(tweets)+1}/ Ready to get yours? Check the link below!")

        return TwitterThread(
            tweets=tweets,
            hashtags=["trending", "musthave", "shopnow"]
        )

    def _generate_fallback_pinterest(self, product_name: str, category: str) -> PinterestPin:
        """Generate fallback Pinterest pin without AI."""
        return PinterestPin(
            title=f"{product_name} - Must Have {category.title()} Find",
            description=f"Discover {product_name} - the perfect addition to your {category} collection. Click to shop!",
            board_suggestions=[f"{category.title()} Finds", "Products I Love", "Shopping List"],
            keywords=[product_name.lower(), category.lower(), "trending", "must have"]
        )


# Singleton instance
social_content_service = SocialContentService()
