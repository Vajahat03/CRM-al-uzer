"""
Al Uzer Self-Hosted Transformer AI Server
FastAPI entrypoint exposing chat, health, and CRM tool endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas.api import ChatRequest, ChatResponse, HealthResponse
from backend.model.loader import model_loader
from backend.model.inference import inference_engine, TOOL_DISPATCH
from backend.database.supabase import get_supabase_client

app = FastAPI(
    title="Al Uzer Self-Hosted AI Server",
    description="Domain-Fine-Tuned Transformer neural network server for Al Uzer CRM",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("[Server] Initializing Al Uzer AI Model Server...")
    model_loader.load_model()

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    supabase = get_supabase_client()
    return HealthResponse(
        status="ok" if model_loader.is_loaded else "unavailable",
        model_loaded=model_loader.is_loaded,
        adapter_loaded=model_loader.adapter_loaded,
        device=model_loader.device,
        supabase_connected=(supabase is not None),
        error=model_loader.error_message
    )

@app.get("/api/tools")
def list_tools():
    return {
        "count": len(TOOL_DISPATCH),
        "tools": list(TOOL_DISPATCH.keys())
    }

@app.get("/api/model")
def model_info():
    return model_loader.get_metadata()

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    history_dicts = [{"role": h.role, "content": h.content} for h in req.history or []]
    res = inference_engine.process_chat(req.message, history_dicts)

    return ChatResponse(
        reply=res.get("reply", ""),
        intentName=res.get("intentName", "MODEL_RESPONSE"),
        toolCalls=res.get("toolCalls", []),
        toolResults=res.get("toolResults", []),
        suggestedActions=res.get("suggestedActions", []),
        pendingConfirmation=res.get("pendingConfirmation"),
        model=res.get("model", {
            "name": model_loader.model_name,
            "device": model_loader.device,
            "adapterLoaded": model_loader.adapter_loaded
        }),
        error=res.get("error")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
