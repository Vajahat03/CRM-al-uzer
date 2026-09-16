import { AIChatTurn } from './intentTypes';

const CHAT_HISTORY_STORAGE_KEY = 'al_uzer_ai_chat_history';

export class AIContextManager {
  private history: AIChatTurn[] = [];

  constructor() {
    this.history = this.loadHistory();
  }

  public getHistory(): AIChatTurn[] {
    return this.history;
  }

  public addTurn(turn: AIChatTurn): void {
    this.history.push(turn);
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
    this.saveHistory();
  }

  public clearHistory(): void {
    this.history = [];
    try {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    } catch {
      // ignore
    }
  }

  private loadHistory(): AIChatTurn[] {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }
}

export const aiContextManager = new AIContextManager();
