"""
VRYS AI — System-Wide Idempotency Manager (Step 10)
Prevents duplicate event processing, redundant workflow runs, and repeat API dispatches.
"""
from typing import Dict, Any, Optional
import time

class IdempotencyManager:
    def __init__(self, ttl_seconds: int = 86400):
        self._processed_tokens: Dict[str, float] = {}
        self.ttl = ttl_seconds

    def is_duplicate(self, token: str) -> bool:
        """
        Returns True if the token was already processed within the TTL window.
        """
        now = time.time()
        if token in self._processed_tokens:
            timestamp = self._processed_tokens[token]
            if now - timestamp < self.ttl:
                return True
        return False

    def mark_processed(self, token: str) -> None:
        """
        Records the token as processed.
        """
        self._processed_tokens[token] = time.time()

idempotency_manager = IdempotencyManager()
