"""
VRYS AI — Marketing, Ads & Social Media Intelligence Schemas (Step 9)
Defines strict Pydantic contracts for Campaigns, Normalized Leads,
Revenue Attribution Reports, and Marketing Health Scores.
"""
from typing import Dict, Any, List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import time

class AdPlatform(str, Enum):
    META_ADS = "META_ADS"
    GOOGLE_ADS = "GOOGLE_ADS"
    WHATSAPP_INBOUND = "WHATSAPP_INBOUND"
    ORGANIC_REFERRAL = "ORGANIC_REFERRAL"

class CampaignRecord(BaseModel):
    campaign_id: str
    organization_id: str
    name: str
    platform: AdPlatform
    status: str # ACTIVE, PAUSED, COMPLETED
    daily_budget: float
    total_spend: float
    impressions: int
    clicks: int
    ctr: float
    cpc: float
    leads_count: int
    cpl: float
    paying_customers_count: int
    conversion_rate_pct: float
    invoiced_revenue: float
    collected_revenue: float
    revenue_roas: float
    collected_roas: float

class NormalizedLead(BaseModel):
    lead_id: str
    organization_id: str
    customer_id: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None
    source_platform: AdPlatform
    campaign_id: Optional[str] = None
    ad_id: Optional[str] = None
    form_id: Optional[str] = None
    lead_score: int = 50
    status: str = "NEW"
    created_at: float = Field(default_factory=time.time)
    idempotency_token: str

class AttributionReport(BaseModel):
    organization_id: str
    campaign_id: str
    campaign_name: str
    platform: AdPlatform
    ad_spend: float
    leads_generated: int
    customers_acquired: int
    customer_acquisition_cost: float
    invoiced_revenue: float
    collected_revenue: float
    revenue_roas: float
    collected_roas: float
    ltv_to_cac_ratio: float
    profitability_status: str

class MarketingHealthScore(BaseModel):
    overall_health: float
    lead_gen_score: float
    quality_score: float
    cost_efficiency_score: float
    roas_score: float
    trend_score: float
    status: str
