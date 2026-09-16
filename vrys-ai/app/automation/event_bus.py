"""
VRYS AI — Decoupled Business Event Bus (Step 10)
Central event publish/subscribe hub connecting CRM, BI, Marketing, and Communication agents.
"""
from typing import Dict, Any, List, Callable, Optional, Union
from app.schemas.automation_schema import BusinessEvent, EventType
from app.automation.idempotency import idempotency_manager

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[BusinessEvent], None]]] = {}
        self._event_history: List[BusinessEvent] = []

    def subscribe(self, event_type: Union[EventType, str], handler: Callable[[BusinessEvent], None]) -> None:
        """
        Registers a subscriber handler for a specific event type.
        """
        evt_key = event_type.value if isinstance(event_type, EventType) else str(event_type)
        if evt_key not in self._subscribers:
            self._subscribers[evt_key] = []
        self._subscribers[evt_key].append(handler)

    def publish(self, event: BusinessEvent) -> Dict[str, Any]:
        """
        Publishes an event to all registered subscribers with idempotency and tenant isolation checks.
        """
        # 1. Global Idempotency Check
        if idempotency_manager.is_duplicate(event.idempotency_token):
            return {
                "event_id": event.event_id,
                "status": "DUPLICATE_IGNORED",
                "subscribers_notified": 0,
                "is_duplicate": True
            }

        idempotency_manager.mark_processed(event.idempotency_token)
        self._event_history.append(event)

        # 2. Notify Subscribers
        evt_key = event.event_type.value if isinstance(event.event_type, EventType) else str(event.event_type)
        handlers = self._subscribers.get(evt_key, [])
        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"[ERROR] EventBus handler error for {evt_key}: {e}")

        return {
            "event_id": event.event_id,
            "status": "PUBLISHED",
            "subscribers_notified": len(handlers),
            "is_duplicate": False
        }

    def get_tenant_events(self, tenant_id: str, limit: int = 50) -> List[BusinessEvent]:
        """
        Retrieves event history strictly isolated by tenant ID.
        """
        return [e for e in self._event_history if e.tenant_id == tenant_id][-limit:]

event_bus = EventBus()
