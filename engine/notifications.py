"""Notification API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from database import get_db
from services.notification_service import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ============== Request/Response Models ==============

class NotificationCreate(BaseModel):
    type: str = "system"
    title: str
    message: str
    link: Optional[str] = None
    priority: str = "medium"


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str]
    priority: str
    is_read: bool
    created_at: str


class NotificationStats(BaseModel):
    total: int
    unread: int
    by_type: Dict[str, int]


# ============== Endpoints ==============

@router.get("", response_model=Dict[str, Any])
async def get_notifications(
    user_id: str = "default_user",
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """
    Get notifications for a user.

    Args:
        user_id: User identifier (defaults to 'default_user' for demo)
        unread_only: Only return unread notifications
        notification_type: Filter by type (order, alert, system, insight, integration, product)
        limit: Maximum notifications to return (max 100)
    """
    notifications = await notification_service.get_notifications(
        user_id=user_id,
        unread_only=unread_only,
        notification_type=notification_type,
        limit=limit
    )

    unread_count = await notification_service.get_unread_count(user_id)

    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total": len(notifications)
    }


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(user_id: str = "default_user"):
    """Get notification statistics for a user."""
    notifications = await notification_service.get_notifications(user_id, limit=100)
    unread_count = await notification_service.get_unread_count(user_id)

    # Count by type
    by_type: Dict[str, int] = {}
    for n in notifications:
        t = n.get("type", "system")
        by_type[t] = by_type.get(t, 0) + 1

    return NotificationStats(
        total=len(notifications),
        unread=unread_count,
        by_type=by_type
    )


@router.post("", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    user_id: str = "default_user"
):
    """Create a new notification."""
    result = await notification_service.create_notification(
        user_id=user_id,
        notification_type=notification.type,
        title=notification.title,
        message=notification.message,
        link=notification.link,
        priority=notification.priority
    )

    return NotificationResponse(**result)


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = "default_user"
):
    """Mark a notification as read."""
    success = await notification_service.mark_as_read(user_id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True, "notification_id": notification_id}


@router.put("/read-all")
async def mark_all_notifications_read(user_id: str = "default_user"):
    """Mark all notifications as read for a user."""
    count = await notification_service.mark_all_as_read(user_id)
    return {"success": True, "marked_count": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = "default_user"
):
    """Delete a notification."""
    success = await notification_service.delete_notification(user_id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True}


@router.get("/unread-count")
async def get_unread_count(user_id: str = "default_user"):
    """Get count of unread notifications."""
    count = await notification_service.get_unread_count(user_id)
    return {"unread_count": count}


# ============== Test/Demo Endpoints ==============

@router.post("/demo/generate")
async def generate_demo_notifications(user_id: str = "default_user"):
    """Generate demo notifications for testing."""
    demo_notifications = [
        {
            "type": "order",
            "title": "New Order Received",
            "message": "Order #1234 received for $49.99",
            "link": "/dashboard/orders",
            "priority": "high"
        },
        {
            "type": "alert",
            "title": "Low Inventory Alert",
            "message": "Galaxy Projector 2.0 has only 5 units remaining",
            "link": "/dashboard/products",
            "priority": "high"
        },
        {
            "type": "insight",
            "title": "Trending Product Detected",
            "message": "Neck Fan is trending up 45% this week",
            "link": "/dashboard/analytics/insights",
            "priority": "medium"
        },
        {
            "type": "integration",
            "title": "Shopify Sync Complete",
            "message": "Successfully synced 15 products from Shopify",
            "link": "/dashboard/integrations",
            "priority": "low"
        },
        {
            "type": "system",
            "title": "Welcome to TikTok Shop",
            "message": "Your account is set up and ready to go!",
            "link": "/dashboard",
            "priority": "low"
        },
    ]

    created = []
    for notif in demo_notifications:
        result = await notification_service.create_notification(
            user_id=user_id,
            notification_type=notif["type"],
            title=notif["title"],
            message=notif["message"],
            link=notif["link"],
            priority=notif["priority"]
        )
        created.append(result)

    return {
        "message": f"Created {len(created)} demo notifications",
        "notifications": created
    }
