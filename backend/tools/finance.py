"""
Financial Analytics Tools
Calculates revenue, profit, margins, and comparative summaries from live Supabase tables.
"""

from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from backend.database.supabase import get_supabase_client

def get_daily_revenue(date_str: str = "today") -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        now = datetime.now()
        target_date = now.strftime("%Y-%m-%d")
        if date_str == "yesterday":
            target_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")

        cust_res = supabase.table("customer_records").select("paid, income, expense, created_at").gte("created_at", f"{target_date}T00:00:00").lte("created_at", f"{target_date}T23:59:59").execute()
        kirkol_res = supabase.table("kirkol").select("price, created_at").gte("created_at", f"{target_date}T00:00:00").lte("created_at", f"{target_date}T23:59:59").execute()
        spend_res = supabase.table("spendings").select("amount, created_at").gte("created_at", f"{target_date}T00:00:00").lte("created_at", f"{target_date}T23:59:59").execute()

        cust_income = sum(float(r.get("income") or r.get("paid") or 0) for r in (cust_res.data or []))
        kirkol_income = sum(float(r.get("price") or 0) for r in (kirkol_res.data or []))
        total_income = cust_income + kirkol_income
        total_spending = sum(float(r.get("amount") or 0) for r in (spend_res.data or []))
        net_profit = total_income - total_spending

        return {
            "success": True,
            "date": target_date,
            "customer_jobs_income": cust_income,
            "kirkol_income": kirkol_income,
            "total_income": total_income,
            "total_spending": total_spending,
            "net_profit": net_profit,
            "jobs_count": len(cust_res.data or [])
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_monthly_summary(period: str = "this_month", group_by: str = "") -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database client unavailable"}

    try:
        now = datetime.now()
        year = now.year
        month = now.month
        if period == "last_month":
            if month == 1:
                month = 12
                year -= 1
            else:
                month -= 1

        start_date = f"{year}-{month:02d}-01T00:00:00"
        end_date = f"{year + (1 if month == 12 else 0)}-{1 if month == 12 else month + 1:02d}-01T00:00:00"

        cust_res = supabase.table("customer_records").select("*").gte("created_at", start_date).lt("created_at", end_date).execute()
        kirkol_res = supabase.table("kirkol").select("*").gte("created_at", start_date).lt("created_at", end_date).execute()
        spend_res = supabase.table("spendings").select("*").gte("created_at", start_date).lt("created_at", end_date).execute()

        cust_records = cust_res.data or []
        cust_income = sum(float(r.get("income") or r.get("paid") or 0) for r in cust_records)
        kirkol_income = sum(float(r.get("price") or 0) for r in (kirkol_res.data or []))
        total_income = cust_income + kirkol_income
        total_spending = sum(float(r.get("amount") or 0) for r in (spend_res.data or []))
        net_profit = total_income - total_spending

        result = {
            "success": True,
            "period": period,
            "year": year,
            "month": month,
            "total_income": total_income,
            "customer_income": cust_income,
            "kirkol_income": kirkol_income,
            "total_spending": total_spending,
            "net_profit": net_profit,
            "total_jobs": len(cust_records)
        }

        if group_by == "work_type":
            type_map = {}
            for r in cust_records:
                wt = r.get("work_type") or "General"
                inc = float(r.get("income") or r.get("paid") or 0)
                type_map[wt] = type_map.get(wt, 0.0) + inc
            sorted_types = sorted(type_map.items(), key=lambda x: x[1], reverse=True)
            result["work_type_breakdown"] = [{"work_type": k, "income": v} for k, v in sorted_types]

        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_profit(period: str = "this_month") -> Dict[str, Any]:
    return get_monthly_summary(period=period)

def compare_periods(current: str = "this_month", previous: str = "last_month", metric: str = "all") -> Dict[str, Any]:
    curr = get_monthly_summary(period=current)
    prev = get_monthly_summary(period=previous)

    if not curr.get("success") or not prev.get("success"):
        return {"success": False, "error": "Could not compute period comparison"}

    diff_income = curr["total_income"] - prev["total_income"]
    diff_profit = curr["net_profit"] - prev["net_profit"]
    diff_spending = curr["total_spending"] - prev["total_spending"]

    pct_profit = ((diff_profit / prev["net_profit"]) * 100) if prev["net_profit"] != 0 else 0.0

    return {
        "success": True,
        "current_period": current,
        "previous_period": previous,
        "current_profit": curr["net_profit"],
        "previous_profit": prev["net_profit"],
        "profit_change_amount": diff_profit,
        "profit_change_percent": round(pct_profit, 2),
        "current_revenue": curr["total_income"],
        "previous_revenue": prev["total_income"],
        "revenue_change": diff_income,
        "current_spending": curr["total_spending"],
        "previous_spending": prev["total_spending"]
    }
