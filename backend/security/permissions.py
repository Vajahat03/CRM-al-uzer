"""
Security and Permission Validation
Validates tool invocation, arguments, and confirmation safety.
"""

from typing import Dict, Any, Tuple

SAFE_READ_TOOLS = {
    "get_customer_balance",
    "get_debtors",
    "get_overdue_customers",
    "search_customers",
    "get_customer_history",
    "get_daily_revenue",
    "get_monthly_summary",
    "get_profit",
    "compare_periods",
    "get_spending",
    "get_top_expenses",
    "get_pending_jobs",
    "reconcile_supabase_with_sheets",
    "draft_payment_reminder"
}

SENSITIVE_WRITE_TOOLS = {
    "send_bulk_reminders",
    "send_customer_message",
    "record_payment",
    "update_customer",
    "delete_customer"
}

def validate_tool_request(tool_name: str, arguments: Dict[str, Any]) -> Tuple[bool, str, bool]:
    """
    Returns (is_valid, error_message, requires_confirmation)
    """
    if tool_name not in SAFE_READ_TOOLS and tool_name not in SENSITIVE_WRITE_TOOLS:
        return False, f"Unauthorized or unrecognized tool: '{tool_name}'", False

    # Check sensitive writes
    requires_confirmation = tool_name in SENSITIVE_WRITE_TOOLS

    # Validate argument types
    if "minimum_overdue_days" in arguments:
        try:
            days = int(arguments["minimum_overdue_days"])
            if days < 0 or days > 3650:
                return False, "Invalid minimum_overdue_days value", False
        except Exception:
            return False, "minimum_overdue_days must be an integer", False

    if "minimum_balance" in arguments:
        try:
            bal = float(arguments["minimum_balance"])
            if bal < 0:
                return False, "Invalid minimum_balance", False
        except Exception:
            return False, "minimum_balance must be numeric", False

    return True, "", requires_confirmation
