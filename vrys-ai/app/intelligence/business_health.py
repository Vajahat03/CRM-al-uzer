"""
VRYS AI — Business Health Score Calculator (Step 7)
Computes a transparent, weighted 0–100 composite index from 5 core business pillars:
Sales (25%), Finance (25%), Operations (20%), Customers (15%), Marketing (15%).
"""
from typing import Dict, Any

class BusinessHealthCalculator:
    def __init__(self):
        self.pillar_weights = {
            "sales": 0.25,
            "finance": 0.25,
            "operations": 0.20,
            "customers": 0.15,
            "marketing": 0.15
        }

    def compute_health_score(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes pillar scores and composite health index.
        """
        # 1. Sales Pillar (Lead velocity, conversion rate)
        leads = metrics.get("new_leads", 0)
        conversion_rate = metrics.get("conversion_rate", 0.0)
        sales_score = min(100.0, max(0.0, (conversion_rate / 25.0 * 60.0) + (min(leads, 50) / 50.0 * 40.0)))

        # 2. Finance Pillar (Receivables health, revenue run-rate)
        receivables = metrics.get("outstanding_receivables", 0)
        rev_today = metrics.get("revenue_today", 0)
        finance_score = 80.0
        if receivables > 400000:
            finance_score -= 25.0
        elif receivables > 200000:
            finance_score -= 10.0
        if rev_today > 100000:
            finance_score += 15.0
        finance_score = min(100.0, max(0.0, finance_score))

        # 3. Operations Pillar (Overdue jobs, processing delays)
        active_jobs = max(1, metrics.get("active_jobs", 1))
        overdue_jobs = metrics.get("overdue_jobs", 0)
        delayed_ratio = overdue_jobs / active_jobs
        operations_score = max(0.0, 100.0 - (delayed_ratio * 200.0))

        # 4. Customers Pillar (Document renewals, churn risk)
        expiring_docs = metrics.get("expiring_documents", 0)
        customers_score = max(50.0, 95.0 - (expiring_docs * 3.0))

        # 5. Marketing Pillar (ROAS, CPL stability)
        marketing_score = metrics.get("marketing_score", 72.0)

        # Composite Health Calculation
        composite_health = (
            sales_score * self.pillar_weights["sales"] +
            finance_score * self.pillar_weights["finance"] +
            operations_score * self.pillar_weights["operations"] +
            customers_score * self.pillar_weights["customers"] +
            marketing_score * self.pillar_weights["marketing"]
        )

        overall = round(composite_health, 1)
        if overall >= 80:
            status = "EXCELLENT"
        elif overall >= 70:
            status = "HEALTHY"
        elif overall >= 55:
            status = "NEEDS_ATTENTION"
        else:
            status = "CRITICAL_RISK"

        return {
            "sales_score": round(sales_score, 1),
            "finance_score": round(finance_score, 1),
            "operations_score": round(operations_score, 1),
            "customers_score": round(customers_score, 1),
            "marketing_score": round(marketing_score, 1),
            "overall_health": overall,
            "status": status,
            "weights_used": self.pillar_weights
        }

business_health_calc = BusinessHealthCalculator()
