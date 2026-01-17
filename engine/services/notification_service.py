"""Notification Service for managing user notifications.

Handles in-app notifications, email notifications, and notification preferences.
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class NotificationType(str, Enum):
    ORDER = "order"
    ALERT = "alert"
    SYSTEM = "system"
    INSIGHT = "insight"
    INTEGRATION = "integration"
    PRODUCT = "product"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class NotificationData:
    """Notification data structure."""
    id: str
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str]
    priority: str
    is_read: bool
    created_at: str


# In-memory storage for notifications (in production, use database)
_notifications: Dict[str, List[Dict[str, Any]]] = {}
_notification_counter = 0


class NotificationService:
    """Service for managing user notifications."""

    def __init__(self):
        self.smtp_host = os.environ.get("SMTP_HOST")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER")
        self.smtp_password = os.environ.get("SMTP_PASSWORD")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@tiktokshop.com")

    async def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        link: Optional[str] = None,
        priority: str = "medium"
    ) -> Dict[str, Any]:
        """
        Create a new in-app notification.

        Args:
            user_id: The user to notify
            notification_type: Type of notification (order, alert, system, etc.)
            title: Notification title
            message: Notification message
            link: Optional link to related page
            priority: Priority level (low, medium, high, urgent)

        Returns:
            The created notification
        """
        global _notification_counter
        _notification_counter += 1

        notification = {
            "id": f"notif_{_notification_counter}",
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "link": link,
            "priority": priority,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        }

        if user_id not in _notifications:
            _notifications[user_id] = []

        _notifications[user_id].insert(0, notification)  # Add to front

        # Keep only last 100 notifications per user
        if len(_notifications[user_id]) > 100:
            _notifications[user_id] = _notifications[user_id][:100]

        return notification

    async def get_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get notifications for a user.

        Args:
            user_id: The user ID
            unread_only: Only return unread notifications
            notification_type: Filter by notification type
            limit: Maximum notifications to return

        Returns:
            List of notifications
        """
        user_notifications = _notifications.get(user_id, [])

        # Apply filters
        if unread_only:
            user_notifications = [n for n in user_notifications if not n["is_read"]]

        if notification_type:
            user_notifications = [n for n in user_notifications if n["type"] == notification_type]

        return user_notifications[:limit]

    async def mark_as_read(self, user_id: str, notification_id: str) -> bool:
        """Mark a notification as read."""
        user_notifications = _notifications.get(user_id, [])

        for notification in user_notifications:
            if notification["id"] == notification_id:
                notification["is_read"] = True
                notification["read_at"] = datetime.utcnow().isoformat()
                return True

        return False

    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        user_notifications = _notifications.get(user_id, [])
        count = 0

        for notification in user_notifications:
            if not notification["is_read"]:
                notification["is_read"] = True
                notification["read_at"] = datetime.utcnow().isoformat()
                count += 1

        return count

    async def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification."""
        if user_id in _notifications:
            original_len = len(_notifications[user_id])
            _notifications[user_id] = [
                n for n in _notifications[user_id] if n["id"] != notification_id
            ]
            return len(_notifications[user_id]) < original_len
        return False

    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user."""
        user_notifications = _notifications.get(user_id, [])
        return sum(1 for n in user_notifications if not n["is_read"])

    async def send_email_notification(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """
        Send an email notification.

        Note: Requires SMTP configuration to be set up.
        """
        # Check if SMTP is configured
        if not all([self.smtp_host, self.smtp_user, self.smtp_password]):
            print("SMTP not configured, skipping email notification")
            return False

        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to_email

            # Plain text version
            msg.attach(MIMEText(body, "plain"))

            # HTML version (if provided)
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())

            return True

        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    # ============== Convenience Methods for Common Notifications ==============

    async def notify_new_order(
        self,
        user_id: str,
        order_id: str,
        total_cents: int
    ) -> Dict[str, Any]:
        """Create notification for new order."""
        return await self.create_notification(
            user_id=user_id,
            notification_type="order",
            title="New Order Received",
            message=f"Order #{order_id} received for ${total_cents / 100:.2f}",
            link=f"/dashboard/orders/{order_id}",
            priority="high"
        )

    async def notify_order_shipped(
        self,
        user_id: str,
        order_id: str,
        tracking_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create notification for shipped order."""
        message = f"Order #{order_id} has been shipped"
        if tracking_number:
            message += f". Tracking: {tracking_number}"

        return await self.create_notification(
            user_id=user_id,
            notification_type="order",
            title="Order Shipped",
            message=message,
            link=f"/dashboard/orders/{order_id}",
            priority="medium"
        )

    async def notify_low_inventory(
        self,
        user_id: str,
        product_name: str,
        current_stock: int
    ) -> Dict[str, Any]:
        """Create notification for low inventory."""
        return await self.create_notification(
            user_id=user_id,
            notification_type="alert",
            title="Low Inventory Alert",
            message=f"{product_name} has only {current_stock} units remaining",
            link="/dashboard/products",
            priority="high"
        )

    async def notify_integration_error(
        self,
        user_id: str,
        platform: str,
        error_message: str
    ) -> Dict[str, Any]:
        """Create notification for integration error."""
        return await self.create_notification(
            user_id=user_id,
            notification_type="integration",
            title=f"{platform} Integration Error",
            message=error_message,
            link="/dashboard/integrations",
            priority="urgent"
        )

    async def notify_ai_insight(
        self,
        user_id: str,
        insight_title: str,
        insight_message: str
    ) -> Dict[str, Any]:
        """Create notification for AI insight."""
        return await self.create_notification(
            user_id=user_id,
            notification_type="insight",
            title=insight_title,
            message=insight_message,
            link="/dashboard/analytics/insights",
            priority="medium"
        )

    async def notify_trending_product(
        self,
        user_id: str,
        product_name: str,
        trend_score: float
    ) -> Dict[str, Any]:
        """Create notification for trending product."""
        return await self.create_notification(
            user_id=user_id,
            notification_type="product",
            title="Product Trending",
            message=f"{product_name} is trending with a score of {trend_score:.0f}",
            link="/dashboard/trends",
            priority="medium"
        )


# Singleton instance
notification_service = NotificationService()
