import {
  CustomerRecord,
  Spending,
  Kirkol,
  WorkType,
  Category,
  WorkStatus,
  TotalsSummary,
  AgentMessage,
  AgentPersonaId,
  AgentSuggestedAction,
  formatCurrency,
} from './types';
import { llmService } from './ai/llmService';
import type { BackendHealthStatus } from './ai/llmService';
import { crmToolRouter } from './ai/toolRouter';

export interface AIDataContext {
  customers: CustomerRecord[];
  spendings: Spending[];
  kirkol: Kirkol[];
  workTypes: WorkType[];
  categories: Category[];
  workStatuses: WorkStatus[];
  totals: TotalsSummary;
  supabaseConnected: boolean;
}

export interface ProactiveInsight {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'critical';
  title: string;
  description: string;
  metric?: string;
  action?: any;
}

export type { BackendHealthStatus };

export class AIAgentEngine {
  /**
   * Health status check for the self-hosted AI model server.
   */
  public async checkBackendHealth(): Promise<BackendHealthStatus> {
    try {
      return await llmService.getHealth();
    } catch (err: any) {
      return {
        status: 'unavailable',
        model_loaded: false,
        device: 'CPU',
        supabase_connected: false,
        error: err.message || 'Server offline',
      };
    }
  }

  /**
   * Main entrypoint calling the AI:
   * First tries the self-hosted FastAPI Transformer model.
   * If the local Python server is unreachable, executes grounded deterministic CRM tools over active context.
   */
  public async processQueryAsync(
    query: string,
    preferredPersona: AgentPersonaId = 'master',
    context?: AIDataContext,
    history: any[] = []
  ): Promise<AgentMessage> {
    try {
      const result = await llmService.chat(query, history);
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        persona: preferredPersona === 'master' ? 'crm' : preferredPersona,
        agentName: '🤖 Al Uzer Transformer AI',
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        intent: result.intentName || 'MODEL_RESPONSE',
        dataSourcesUsed: ['Self-Hosted Transformer', 'Supabase'],
        content: result.reply,
        suggestedActions: (result.suggestedActions as any) || [],
      };
    } catch (err) {
      // Execute grounded CRM semantic tools on live memory context
      if (context) {
        const toolRes = crmToolRouter.processQuery(query, context, history);
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          persona: preferredPersona === 'master' ? 'crm' : preferredPersona,
          agentName: '🤖 Al Uzer AI Intelligence',
          timestamp: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          intent: toolRes.toolName,
          dataSourcesUsed: ['Supabase Live Context', 'Google Sheets'],
          content: toolRes.summaryText,
          suggestedActions: (toolRes.suggestedActions as any) || [],
        };
      }

      throw err;
    }
  }

  /**
   * Synchronous signature fallback for instant initial greeting.
   */
  public processQuery(
    query: string = 'overview',
    preferredPersona: AgentPersonaId = 'master',
    context?: AIDataContext
  ): AgentMessage {
    const dummyCtx: AIDataContext = context || {
      customers: [],
      spendings: [],
      kirkol: [],
      workTypes: [],
      categories: [],
      workStatuses: [],
      totals: {
        totalAmount: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        customerIncome: 0,
        kirkolIncome: 0,
        totalIncome: 0,
        workExpense: 0,
        totalSpending: 0,
        totalExpense: 0,
        remainingAmount: 0,
        jobsCount: 0,
        pendingWorkCount: 0,
        spendingsCount: 0,
        kirkolCount: 0,
      },
      supabaseConnected: false,
    };

    const toolRes = crmToolRouter.processQuery(query, dummyCtx);
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      persona: preferredPersona,
      agentName: '🤖 Al Uzer Master AI',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      intent: toolRes.toolName,
      dataSourcesUsed: ['Supabase', 'Google Sheets'],
      content: toolRes.summaryText,
      suggestedActions: (toolRes.suggestedActions as any) || [],
    };
  }

  /**
   * Deterministic real-time proactive telemetry metrics.
   */
  public generateProactiveInsights(ctx: AIDataContext): ProactiveInsight[] {
    const { totals, customers } = ctx;
    const insights: ProactiveInsight[] = [];

    const debtors = customers.filter(
      (c) => (Number(c.total_amount) || 0) - (Number(c.paid) || 0) > 0
    );
    if (debtors.length > 0 && totals.pendingAmount > 0) {
      insights.push({
        id: 'ins-overdue-debtors',
        type: 'warning',
        title: `${debtors.length} Clients with Pending Balance`,
        description: `Total ₹${totals.pendingAmount.toLocaleString('en-IN')} uncollected. Top debtor: ${debtors[0].customer_name}.`,
        metric: formatCurrency(totals.pendingAmount),
        action: {
          id: 'act-ins-debtors',
          label: 'Recover Balances',
          actionType: 'filter_customers',
          payload: { search: 'PENDING' },
          variant: 'primary',
        },
      });
    }

    return insights;
  }
}

export const aiAgentEngine = new AIAgentEngine();
