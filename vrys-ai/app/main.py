"""
VRYS AI — FastAPI Gateway Application
Self-hosted multi-model AI brain running locally without third-party LLM APIs.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import time

from app.orchestrator import orchestrator
from app.models.intent_classifier import intent_model
from app.models.lead_scorer import lead_scorer_model
from app.models.nlp_parser import nlp_parser
from app.models.customer_intelligence import customer_intelligence_model
from app.engine.tool_engine import tool_engine
from app.memory.tenant_memory import tenant_memory
from app.security.owner_auth import router as owner_auth_router

app = FastAPI(
    title="VRYS Self-Hosted AI Engine",
    description="Isolated multi-agent intelligence and predictive ML for VRYS CRM",
    version="1.0.0"
)

# Mount security and owner authentication router
app.include_router(owner_auth_router)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request / Response Schemas
class AgentQueryRequest(BaseModel):
    query: str
    organizationId: str
    userName: str
    preferredAgent: Optional[str] = None

class LeadScoreRequest(BaseModel):
    name: str
    source: Optional[str] = "Direct"
    interestedService: Optional[str] = "General Inquiry"
    estimatedValue: Optional[float] = 0.0
    priority: Optional[str] = "medium"

class NLPMessageRequest(BaseModel):
    message: str

class CustomerIntelligenceRequest(BaseModel):
    customerId: str
    totalSpent: float
    totalJobs: int
    balanceAmount: float

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "VRYS Self-Hosted AI Engine",
        "version": "1.0.0",
        "loaded_models": [
            intent_model.model_name,
            lead_scorer_model.model_name,
            nlp_parser.model_name,
            customer_intelligence_model.model_name
        ]
    }

@app.post("/api/v1/agent/query")
def process_agent_query(req: AgentQueryRequest):
    try:
        response = orchestrator.process_query(
            query=req.query,
            org_id=req.organizationId,
            user_name=req.userName,
            preferred_agent=req.preferredAgent
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/models/lead-score")
def score_lead(req: LeadScoreRequest):
    return lead_scorer_model.predict_score(req.model_dump())

@app.post("/api/v1/models/nlp-parse")
def parse_customer_message(req: NLPMessageRequest):
    return nlp_parser.parse_message(req.message)

@app.post("/api/v1/models/customer-intelligence")
def analyze_customer(req: CustomerIntelligenceRequest):
    return customer_intelligence_model.analyze_customer(req.model_dump())

@app.get("/api/v1/models/status")
def get_models_status():
    return {
        "engine": "VRYS Local AI Microservice",
        "timestamp": time.time(),
        "models": {
            "intent_classifier": {
                "name": intent_model.model_name,
                "version": intent_model.version,
                "status": "active_in_memory",
                "supported_intents": intent_model.supported_intents
            },
            "lead_scorer": {
                "name": lead_scorer_model.model_name,
                "version": lead_scorer_model.version,
                "status": "active_in_memory",
                "algorithm": "Feature-Weighted Gradient Ensembling"
            },
            "nlp_parser": {
                "name": nlp_parser.model_name,
                "version": nlp_parser.version,
                "status": "active_in_memory",
                "tasks": ["Intent", "Amount Extraction", "Date Reference", "Sentiment"]
            },
            "customer_intelligence": {
                "name": customer_intelligence_model.model_name,
                "version": customer_intelligence_model.version,
                "status": "active_in_memory",
                "metrics": ["LTV Prediction", "Churn Probability", "Next Best Action"]
            }
        },
        "registered_tools": list(tool_engine.registered_tools.keys())
    }
