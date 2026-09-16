"""
FastAPI Request and Response Models for Al Uzer AI Server
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ChatMessageItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"
    history: Optional[List[ChatMessageItem]] = []

class ToolCallItem(BaseModel):
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)

class ToolResultItem(BaseModel):
    tool_name: str
    result: Dict[str, Any]

class SuggestedActionItem(BaseModel):
    id: str
    label: str
    actionType: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    variant: Optional[str] = "primary"
    requiresConfirmation: Optional[bool] = False

class PendingConfirmationItem(BaseModel):
    actionType: str
    description: str
    payload: Dict[str, Any] = Field(default_factory=dict)

class ModelMetadataItem(BaseModel):
    name: str
    device: str
    adapterLoaded: bool

class ChatResponse(BaseModel):
    reply: str
    intentName: Optional[str] = "MODEL_RESPONSE"
    toolCalls: List[ToolCallItem] = Field(default_factory=list)
    toolResults: List[ToolResultItem] = Field(default_factory=list)
    suggestedActions: List[SuggestedActionItem] = Field(default_factory=list)
    pendingConfirmation: Optional[PendingConfirmationItem] = None
    model: ModelMetadataItem
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    adapter_loaded: bool
    device: str
    supabase_connected: bool
    error: Optional[str] = None
