import { CustomerRecord, Spending, Kirkol, WorkType, Category, WorkStatus, TotalsSummary, Page } from '../types';

export type AIIntentName =
  | 'GET_CUSTOMER'
  | 'SEARCH_CUSTOMERS'
  | 'GET_CUSTOMER_BALANCE'
  | 'GET_CUSTOMER_HISTORY'
  | 'GET_CUSTOMER_TRANSACTIONS'
  | 'GET_DEBTORS'
  | 'FIND_OVERDUE_CUSTOMERS'
  | 'GET_PENDING_JOBS'
  | 'GET_DAILY_SUMMARY'
  | 'GET_WEEKLY_SUMMARY'
  | 'GET_MONTHLY_SUMMARY'
  | 'GET_REVENUE'
  | 'GET_EXPENSES'
  | 'GET_SPENDING'
  | 'GET_PROFIT'
  | 'GET_MARGIN'
  | 'GET_CASH_FLOW'
  | 'GET_WORK_TYPE_PERFORMANCE'
  | 'GET_TOP_CUSTOMERS'
  | 'COMPARE_PERIODS'
  | 'DETECT_ANOMALIES'
  | 'GET_GOOGLE_SHEET_STATUS'
  | 'RECONCILE_DATA'
  | 'DRAFT_CUSTOMER_MESSAGE'
  | 'DRAFT_PAYMENT_REMINDER'
  | 'QUEUE_PAYMENT_REMINDER'
  | 'SEND_CUSTOMER_MESSAGE'
  | 'SEND_BULK_REMINDERS'
  | 'CREATE_MONTH_SHEET'
  | 'CREATE_YEAR_WORKSPACE'
  | 'GENERAL_CRM_QUERY'
  | 'GENERAL_CONVERSATION'
  | 'UNKNOWN';

export interface AIIntent {
  intent: AIIntentName;
  parameters: Record<string, any>;
  confidence?: number;
  requiresConfirmation?: boolean;
}

export interface AIToolResult<T = any> {
  success: boolean;
  toolName: string;
  data?: T;
  summaryText: string;
  error?: string;
  suggestedActions?: AIAgentAction[];
}

export interface AIAgentAction {
  id: string;
  label: string;
  actionType:
    | 'whatsapp_message'
    | 'send_sms'
    | 'queue_all_sms'
    | 'filter_customers'
    | 'navigate'
    | 'export_report'
    | 'sync_sheets'
    | 'confirm_action';
  payload: Record<string, any>;
  variant?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation?: boolean;
}

export interface AIChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  toolsExecuted?: string[];
  suggestedActions?: AIAgentAction[];
  pendingConfirmation?: {
    actionType: string;
    description: string;
    payload: Record<string, any>;
  };
}

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'groq' | 'custom';
  apiKey?: string;
  model?: string;
  endpoint?: string;
}
