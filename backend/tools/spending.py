"""
Spending and Outflow Analytics Tools
"""

from typing import Dict, Any
from datetime import datetime, timedelta
from backend.database.supabase import get_supabase_client

def get_spending(period: str = "this_month", category: str = "") -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        now = datetime.now()
        query = supabase.table("spendings").select("*")
        if period == "today":
            target = now.strftime("%Y-%m-%d")
            query = query.gte("created_at", f"{target}T00:00:00").lte("created_at", f"{target}T23:59:59")
        elif period == "yesterday":
            target = (now - timedelta(days=1)).strftime("%Y-%m-%d")
            query = query.gte("created_at", f"{target}T00:00:00").lte("created_at", f"{target}T23:59:59")
        else:
            start_date = f"{now.year}-{now.month:02d}-01T00:00:00"
            query = query.gte("created_at", start_date)

        if category:
            query = query.ilike("category", f"%{category}%")

        res = query.order("amount", desc=True).execute()
        records = res.data or []
        total = sum(float(r.get("amount") or 0) for r in records)

        return {
            "success": True,
            "period": period,
            "total_spending": total,
            "count": len(records),
            "data": records[:15]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_top_expenses() -> Dict[str, Any]:
    return get_spending(period="this_month")

def get_pending_jobs() -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        res = supabase.table("customer_records").select("*").or_("work_status.ilike.%pending%,work_status.ilike.%in progress%").limit(20).execute()
        return {"success": True, "count": len(res.data or []), "data": res.data or []}
    except Exception as e:
        return {"success": False, "error": str(e)}
