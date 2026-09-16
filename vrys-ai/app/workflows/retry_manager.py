"""
VRYS AI — Workflow & Dispatch Retry Manager (Step 8)
Enforces a maximum 3-attempt exponential backoff retry policy for external API dispatches.
"""
from typing import Dict, Any, Callable
import time

class RetryManager:
    def __init__(self, max_retries: int = 3, base_backoff_sec: float = 0.5):
        self.max_retries = max_retries
        self.base_backoff_sec = base_backoff_sec

    def execute_with_retry(self, operation: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes an operation up to 3 times before declaring FAILED state.
        """
        attempts = 0
        last_error = None

        while attempts < self.max_retries:
            try:
                attempts += 1
                result = operation()
                result["retry_attempts"] = attempts
                return result
            except Exception as e:
                last_error = str(e)
                if attempts < self.max_retries:
                    time.sleep(self.base_backoff_sec * (2 ** (attempts - 1)))

        return {
            "status": "FAILED",
            "retry_attempts": attempts,
            "max_retries_exceeded": True,
            "error": last_error or "Unknown dispatch error"
        }

retry_manager = RetryManager()
