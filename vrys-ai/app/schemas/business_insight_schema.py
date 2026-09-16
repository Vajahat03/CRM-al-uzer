"""
VRYS AI — Business Insight Standard Schema (Step 7)
Defines the strict schema for structured business insights and decision recommendations.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class BusinessInsight(BaseModel):
    title: str
    category: str = Field(..., description="sales, finance, operations, customers, marketing")
    severity: str = Field(..., description="critical, high, medium, low")
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: List[str]
    impact: Dict[str, Any] = Field(default_factory=dict, description="Estimated monetary risk or operational delay")
    recommendation: List[str]
    requires_confirmation: bool = True
    suggested_action_type: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None

class BusinessHealthBreakdown(BaseModel):
    sales_score: float
    finance_score: float
    operations_score: float
    customers_score: float
    marketing_score: float
    overall_health: float
    status: str
