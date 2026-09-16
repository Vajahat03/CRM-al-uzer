"""
Customer & Debtors Tools
Executes parameterized queries against Supabase customer records.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from backend.database.supabase import get_supabase_client

def get_customer_balance(customer_name: str) -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        res = supabase.table("customer_records").select("*").ilike("customer_name", f"%{customer_name}%").execute()
        records = res.data or []
        if not records:
            return {"success": True, "message": f"No customer record found matching '{customer_name}'", "data": []}

        results = []
        for r in records:
            total = float(r.get("total_amount") or 0)
            paid = float(r.get("paid") or 0)
            balance = max(0.0, total - paid)
            results.append({
                "id": r.get("id"),
                "customer_name": r.get("customer_name"),
                "mobile": r.get("mobile"),
                "work_type": r.get("work_type"),
                "total_amount": total,
                "paid": paid,
                "balance": balance,
                "payment_status": r.get("payment_status"),
                "work_status": r.get("work_status"),
                "created_at": r.get("created_at")
            })

        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_debtors(minimum_balance: float = 0.0) -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        res = supabase.table("customer_records").select("*").order("created_at", desc=True).execute()
        records = res.data or []

        debtors = []
        total_pending = 0.0
        for r in records:
            total = float(r.get("total_amount") or 0)
            paid = float(r.get("paid") or 0)
            balance = max(0.0, total - paid)
            if balance > minimum_balance:
                debtors.append({
                    "id": r.get("id"),
                    "customer_name": r.get("customer_name"),
                    "mobile": r.get("mobile"),
                    "work_type": r.get("work_type"),
                    "balance": balance,
                    "created_at": r.get("created_at")
                })
                total_pending += balance

        debtors.sort(key=lambda x: x["balance"], reverse=True)
        return {
            "success": True,
            "count": len(debtors),
            "total_pending_amount": total_pending,
            "data": debtors[:20]  # Return top 20
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_overdue_customers(minimumDays: int = 5, minBalance: float = 0.0, minimum_overdue_days: int = None, minimum_balance: float = None) -> Dict[str, Any]:
    threshold_days = minimum_overdue_days if minimum_overdue_days is not None else minimumDays
    threshold_bal = minimum_balance if minimum_balance is not None else minBalance

    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        res = supabase.table("customer_records").select("*").order("created_at", desc=True).execute()
        records = res.data or []
        now = datetime.now(timezone.utc)

        overdue_list = []
        total_overdue = 0.0
        for r in records:
            total = float(r.get("total_amount") or 0)
            paid = float(r.get("paid") or 0)
            balance = max(0.0, total - paid)
            if balance > threshold_bal:
                # Priority: outstanding_since -> due_date -> created_at (documented fallback)
                overdue_str = r.get("outstanding_since") or r.get("due_date") or r.get("created_at")
                days_overdue = 0
                if overdue_str:
                    try:
                        overdue_dt = datetime.fromisoformat(overdue_str.replace("Z", "+00:00"))
                        days_overdue = (now - overdue_dt).days
                    except Exception:
                        days_overdue = 0

                if days_overdue >= threshold_days:
                    overdue_list.append({
                        "id": r.get("id"),
                        "customer_name": r.get("customer_name"),
                        "mobile": r.get("mobile"),
                        "work_type": r.get("work_type"),
                        "balance": balance,
                        "days_overdue": days_overdue,
                        "overdue_since_date": overdue_str,
                        "date_source": "outstanding_since" if r.get("outstanding_since") else ("due_date" if r.get("due_date") else "created_at (fallback)")
                    })
                    total_overdue += balance

        overdue_list.sort(key=lambda x: x["balance"], reverse=True)
        return {
            "success": True,
            "count": len(overdue_list),
            "minimum_overdue_days": minimum_overdue_days,
            "total_overdue_amount": total_overdue,
            "data": overdue_list
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def search_customers(query: str) -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        res = supabase.table("customer_records").select("*").or_(f"customer_name.ilike.%{query}%,mobile.ilike.%{query}%").limit(10).execute()
        return {"success": True, "data": res.data or []}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_customer_history(customer_name: str) -> Dict[str, Any]:
    return get_customer_balance(customer_name)
