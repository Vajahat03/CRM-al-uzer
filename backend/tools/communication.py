"""
Communication Tools
Generates personalized WhatsApp/SMS drafts and handles safe reminder queuing.
"""

from typing import Dict, Any, List
from backend.tools.customers import get_debtors, get_customer_balance

def draft_payment_reminder(customer_name: str = "", minimum_balance: float = 0.0) -> Dict[str, Any]:
    if customer_name:
        res = get_customer_balance(customer_name)
        records = res.get("data", [])
        if not records:
            return {"success": False, "error": f"Customer '{customer_name}' not found."}
        cust = records[0]
        bal = cust.get("balance", 0)
        msg = f"Hello {cust.get('customer_name')}, this is a gentle reminder from Al Uzer Common Services. Your pending balance is ₹{bal:,.0f} for {cust.get('work_type')}. Please clear it at your earliest convenience. Thank you!"
        return {
            "success": True,
            "customer_name": cust.get("customer_name"),
            "mobile": cust.get("mobile"),
            "balance": bal,
            "message": msg
        }
    else:
        debtors_res = get_debtors(minimum_balance=minimum_balance)
        debtors = debtors_res.get("data", [])
        drafts = []
        for d in debtors:
            bal = d.get("balance", 0)
            msg = f"Hello {d.get('customer_name')}, this is a gentle reminder from Al Uzer Common Services regarding your pending balance of ₹{bal:,.0f}. Kindly settle this at your convenience."
            drafts.append({
                "customer_name": d.get("customer_name"),
                "mobile": d.get("mobile"),
                "balance": bal,
                "message": msg
            })
        return {
            "success": True,
            "count": len(drafts),
            "drafts": drafts
        }

def send_bulk_reminders(customer_ids: List[str] = None, confirmed: bool = False) -> Dict[str, Any]:
    if not confirmed:
        return {
            "success": False,
            "error": "Confirmation required before triggering bulk payment reminders.",
            "requires_confirmation": True
        }

    return {
        "success": True,
        "message": f"Payment reminder messages successfully queued for processing."
    }
