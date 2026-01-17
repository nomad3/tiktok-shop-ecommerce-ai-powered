"""Chatbot API endpoints for customer support."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from database import get_db
from services.chatbot_service import chatbot_service

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


# ============== In-Memory Session Storage ==============
# In production, use Redis or database
_sessions: Dict[str, Dict[str, Any]] = {}


def get_or_create_session(session_id: str) -> Dict[str, Any]:
    """Get existing session or create new one."""
    if session_id not in _sessions:
        _sessions[session_id] = {
            "id": session_id,
            "messages": [],
            "customer_email": None,
            "customer_name": None,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "escalated_at": None,
            "resolved_at": None,
        }
    return _sessions[session_id]


# ============== Request/Response Models ==============

class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    order_id: Optional[str] = None
    product_id: Optional[int] = None


class MessageResponse(BaseModel):
    session_id: str
    response: str
    suggested_actions: List[str]
    needs_human: bool
    confidence: float
    intent: str
    timestamp: str


class SessionInfo(BaseModel):
    id: str
    status: str
    message_count: int
    customer_email: Optional[str]
    customer_name: Optional[str]
    created_at: str
    updated_at: str
    last_message: Optional[str]


class ConversationMessage(BaseModel):
    role: str
    content: str
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None


class EscalationRequest(BaseModel):
    reason: Optional[str] = None
    customer_email: Optional[str] = None
    priority: Optional[str] = "medium"


class EscalationResponse(BaseModel):
    ticket_id: str
    message: str
    estimated_response_time: str


# ============== Endpoints ==============

@router.post("/message", response_model=MessageResponse)
async def send_message(
    request: MessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send a message to the chatbot and get a response.

    The chatbot uses AI to understand customer inquiries and provide
    helpful responses about orders, products, shipping, and more.
    """
    # Get or create session
    session_id = request.session_id or str(uuid.uuid4())
    session = get_or_create_session(session_id)

    # Update session with customer info
    if request.customer_email:
        session["customer_email"] = request.customer_email
    if request.customer_name:
        session["customer_name"] = request.customer_name

    # Build customer context
    customer_context: Dict[str, Any] = {}

    if request.customer_name:
        customer_context["customer_name"] = request.customer_name

    # Look up order if provided
    if request.order_id:
        order_info = await chatbot_service.lookup_order_status(request.order_id, db)
        if order_info:
            customer_context["order"] = order_info

    # Look up product if provided
    if request.product_id:
        product_info = await chatbot_service.get_product_info(request.product_id, db)
        if product_info:
            customer_context["product"] = product_info

    # Add message to history
    timestamp = datetime.utcnow().isoformat()
    session["messages"].append({
        "role": "user",
        "content": request.message,
        "timestamp": timestamp
    })

    # Get chatbot response
    response = await chatbot_service.get_response(
        message=request.message,
        conversation_history=session["messages"][:-1],  # Exclude current message
        customer_context=customer_context if customer_context else None
    )

    # Add response to history
    session["messages"].append({
        "role": "assistant",
        "content": response.response,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": {
            "confidence": response.confidence,
            "intent": response.intent,
            "needs_human": response.needs_human
        }
    })

    # Update session
    session["updated_at"] = datetime.utcnow().isoformat()

    # Auto-escalate if needed
    if response.needs_human and session["status"] == "active":
        session["status"] = "pending_escalation"

    return MessageResponse(
        session_id=session_id,
        response=response.response,
        suggested_actions=response.suggested_actions,
        needs_human=response.needs_human,
        confidence=response.confidence,
        intent=response.intent,
        timestamp=timestamp
    )


@router.get("/session/{session_id}/history")
async def get_conversation_history(session_id: str) -> Dict[str, Any]:
    """
    Get the conversation history for a session.

    Returns all messages exchanged in the conversation along with
    session metadata.
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = _sessions[session_id]

    return {
        "session_id": session_id,
        "status": session["status"],
        "customer_email": session.get("customer_email"),
        "customer_name": session.get("customer_name"),
        "messages": [
            ConversationMessage(
                role=msg["role"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                metadata=msg.get("metadata")
            ).model_dump()
            for msg in session["messages"]
        ],
        "created_at": session["created_at"],
        "updated_at": session["updated_at"]
    }


@router.post("/session/{session_id}/escalate", response_model=EscalationResponse)
async def escalate_to_human(
    session_id: str,
    request: EscalationRequest
):
    """
    Escalate the conversation to human support.

    Creates a support ticket with the conversation history and
    connects the customer with a human agent.
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = _sessions[session_id]

    # Update customer email if provided
    if request.customer_email:
        session["customer_email"] = request.customer_email

    # Create support ticket
    ticket = await chatbot_service.create_support_ticket(
        customer_email=session.get("customer_email", "unknown@example.com"),
        subject=request.reason or "Customer requested human support",
        conversation_history=session["messages"],
        priority=request.priority or "medium"
    )

    # Update session status
    session["status"] = "escalated"
    session["escalated_at"] = datetime.utcnow().isoformat()

    # Add system message
    session["messages"].append({
        "role": "system",
        "content": f"Conversation escalated to human support. Ticket #{ticket['ticket_id']} created.",
        "timestamp": datetime.utcnow().isoformat()
    })

    return EscalationResponse(
        ticket_id=ticket["ticket_id"],
        message="Your conversation has been escalated to a human support agent. They will review your case and respond shortly.",
        estimated_response_time="Within 2 hours during business hours (9 AM - 6 PM EST)"
    )


@router.post("/session/{session_id}/resolve")
async def resolve_session(session_id: str):
    """Mark a chat session as resolved."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = _sessions[session_id]
    session["status"] = "resolved"
    session["resolved_at"] = datetime.utcnow().isoformat()

    return {"message": "Session marked as resolved", "session_id": session_id}


@router.get("/sessions")
async def list_sessions(
    status: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    List all chat sessions (for admin dashboard).

    Optionally filter by status: active, escalated, resolved
    """
    sessions_list = []

    for session_id, session in _sessions.items():
        if status and session["status"] != status:
            continue

        last_message = None
        if session["messages"]:
            last_msg = session["messages"][-1]
            last_message = last_msg["content"][:100]  # First 100 chars

        sessions_list.append(SessionInfo(
            id=session_id,
            status=session["status"],
            message_count=len(session["messages"]),
            customer_email=session.get("customer_email"),
            customer_name=session.get("customer_name"),
            created_at=session["created_at"],
            updated_at=session["updated_at"],
            last_message=last_message
        ).model_dump())

    # Sort by updated_at descending
    sessions_list.sort(key=lambda x: x["updated_at"], reverse=True)

    return {
        "sessions": sessions_list[:limit],
        "total": len(sessions_list),
        "filtered_by_status": status
    }


@router.get("/sessions/stats")
async def get_session_stats() -> Dict[str, Any]:
    """Get statistics about chat sessions."""
    total = len(_sessions)
    active = sum(1 for s in _sessions.values() if s["status"] == "active")
    escalated = sum(1 for s in _sessions.values() if s["status"] == "escalated")
    pending = sum(1 for s in _sessions.values() if s["status"] == "pending_escalation")
    resolved = sum(1 for s in _sessions.values() if s["status"] == "resolved")

    return {
        "total_sessions": total,
        "active": active,
        "pending_escalation": pending,
        "escalated": escalated,
        "resolved": resolved,
        "resolution_rate": round(resolved / total * 100, 1) if total > 0 else 0
    }


@router.get("/faq/{topic}")
async def get_faq(topic: str):
    """Get FAQ response for a common topic."""
    response = chatbot_service.get_faq_response(topic)
    if not response:
        raise HTTPException(status_code=404, detail="FAQ topic not found")

    return {
        "topic": topic,
        "response": response
    }


@router.get("/faq")
async def list_faq_topics():
    """List available FAQ topics."""
    topics = [
        {"id": "shipping_cost", "title": "Shipping Costs"},
        {"id": "delivery_time", "title": "Delivery Times"},
        {"id": "return_policy", "title": "Return Policy"},
        {"id": "refund_time", "title": "Refund Processing Time"},
        {"id": "track_order", "title": "How to Track Orders"},
        {"id": "cancel_order", "title": "Cancelling Orders"},
        {"id": "contact", "title": "Contact Us"},
        {"id": "payment_methods", "title": "Payment Methods"},
    ]
    return {"topics": topics}


@router.post("/session/{session_id}/agent-message")
async def send_agent_message(
    session_id: str,
    message: str,
    agent_name: str = "Support Agent"
):
    """
    Send a message as a human support agent (for admin dashboard).
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = _sessions[session_id]

    # Add agent message
    timestamp = datetime.utcnow().isoformat()
    session["messages"].append({
        "role": "assistant",
        "content": message,
        "timestamp": timestamp,
        "metadata": {
            "from_agent": True,
            "agent_name": agent_name
        }
    })

    session["updated_at"] = timestamp

    return {
        "success": True,
        "timestamp": timestamp
    }
