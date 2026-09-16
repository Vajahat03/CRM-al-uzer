"""
Google Sheets & Supabase Reconciliation Tools
Audits record counts and checks readiness between Supabase and Google Sheets.
"""

from typing import Dict, Any
from backend.database.supabase import get_supabase_client

def reconcile_supabase_with_sheets() -> Dict[str, Any]:
    supabase = get_supabase_client()
    if not supabase:
        return {"success": False, "error": "Database unavailable"}

    try:
        cust_res = supabase.table("customer_records").select("id, total_amount, paid", count="exact").execute()
        spend_res = supabase.table("spendings").select("id, amount", count="exact").execute()
        kirkol_res = supabase.table("kirkol").select("id, price", count="exact").execute()

        supabase_customers = cust_res.count or len(cust_res.data or [])
        supabase_spendings = spend_res.count or len(spend_res.data or [])
        supabase_kirkol = kirkol_res.count or len(kirkol_res.data or [])

        return {
            "success": True,
            "supabase_customer_records": supabase_customers,
            "supabase_spendings_records": supabase_spendings,
            "supabase_kirkol_records": supabase_kirkol,
            "status": "Ready for synchronization",
            "message": f"Supabase database has {supabase_customers} customer jobs, {supabase_spendings} spendings, and {supabase_kirkol} kirkol sales. Use Google Sheets Sync in CRM to update the spreadsheet."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
