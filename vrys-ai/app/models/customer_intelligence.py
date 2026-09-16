"""
VRYS AI — Customer Intelligence & Churn Predictor
Calculates customer lifetime value (LTV), churn probability, and next-best-action.
"""
from typing import Dict, Any

class CustomerIntelligenceModel:
    def __init__(self):
        self.model_name = "vrys-customer-intelligence-v1"
        self.version = "1.0.0"

    def analyze_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        total_spent = float(customer_data.get("totalSpent", 0))
        total_jobs = int(customer_data.get("totalJobs", 0))
        balance = float(customer_data.get("balanceAmount", 0))

        # 1. Churn Risk Score (0-100%)
        churn_risk = 15
        if balance > 5000:
            churn_risk += 25
        if total_jobs == 1 and total_spent < 2000:
            churn_risk += 30
        elif total_jobs >= 3:
            churn_risk = max(5, churn_risk - 20)

        # 2. Predicted 12-Month LTV
        predicted_ltv = (total_spent / max(1, total_jobs)) * (total_jobs + 2.5)

        # 3. Next Best Action Recommendation
        if balance > 0:
            next_action = f"Dispatch polite WhatsApp balance reminder for ₹{balance:,.0f}"
        elif total_jobs >= 2:
            next_action = "Upsell annual compliance / recurring GST filing package"
        else:
            next_action = "Send post-delivery satisfaction survey & Google Review request"

        return {
            "churn_risk_percent": min(95, churn_risk),
            "customer_tier": "VIP Gold 🏆" if total_spent >= 25000 else "Regular Silver 🥈" if total_spent >= 5000 else "Standard Bronze 🥉",
            "predicted_ltv": round(predicted_ltv, 2),
            "next_best_action": next_action,
            "model_version": self.model_name
        }

customer_intelligence_model = CustomerIntelligenceModel()
