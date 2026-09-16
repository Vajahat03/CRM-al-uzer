/**
 * Al Uzer Self-Hosted Transformer LLM Client
 * Pure backend client that communicates with the FastAPI /api/chat endpoint.
 *
 * NO Gemini API.
 * NO OpenAI API.
 * NO Cloud LLM API.
 * NO Semantic Parser / Keyword Matching in frontend.
 */

import { AIChatTurn, AIAgentAction, AIToolResult } from './intentTypes';

export interface BackendHealthStatus {
  status: 'ok' | 'unavailable' | string;
  model_loaded: boolean;
  adapter_loaded?: boolean;
  device: string;
  supabase_connected: boolean;
  error?: string;
}

export interface BackendChatResponse {
  reply: string;
  intentName?: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  toolResults?: AIToolResult[];
  suggestedActions?: AIAgentAction[];
  pendingConfirmation?: {
    actionType: string;
    description: string;
    payload: Record<string, unknown>;
  };
  model?: {
    name: string;
    device: string;
    adapterLoaded: boolean;
  };
}

export class LLMService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_BACKEND_URL) ||
      'http://127.0.0.1:8000';
  }

  public async chat(
    message: string,
    history: AIChatTurn[] = []
  ): Promise<BackendChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history.map((h) => ({ role: h.role, content: h.content })),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`AI backend unavailable (${response.status}): ${body}`);
    }

    return response.json();
  }

  public async getHealth(): Promise<BackendHealthStatus> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      return {
        status: 'unavailable',
        model_loaded: false,
        device: 'unknown',
        supabase_connected: false,
        error: `Server returned HTTP ${response.status}`,
      };
    }
    return response.json();
  }

  public async getModelInfo() {
    const response = await fetch(`${this.baseUrl}/api/model`);
    if (!response.ok) {
      throw new Error('AI model information unavailable');
    }
    return response.json();
  }
}

export const llmService = new LLMService();
