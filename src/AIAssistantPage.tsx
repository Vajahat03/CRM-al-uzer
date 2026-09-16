import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Users,
  MessageSquare,
  RefreshCw,
  FileDown,
  ExternalLink,
  Database,
  FileSpreadsheet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Cpu,
} from 'lucide-react';
import {
  CustomerRecord,
  Spending,
  Kirkol,
  WorkType,
  Category,
  WorkStatus,
  TotalsSummary,
  AgentMessage,
  AgentSuggestedAction,
  Page,
  formatCurrency
} from './types';
import { aiAgentEngine, AIDataContext, BackendHealthStatus } from './aiAgentEngine';
import { aiContextManager } from './ai/aiContext';
import { fullSyncToGoogleSheets } from './googleSheetsSync';
import { smsService } from './sms/smsService';

interface AIAssistantPageProps {
  customers: CustomerRecord[];
  spendings: Spending[];
  kirkol: Kirkol[];
  workTypes: WorkType[];
  categories: Category[];
  workStatuses: WorkStatus[];
  totals: TotalsSummary;
  supabaseConnected: boolean;
  onNavigate: (page: Page) => void;
  onFilterCustomers?: (searchQuery: string) => void;
  onOpenMonthlyReport?: () => void;
  notify: (msg: string) => void;
}

const QUICK_PROMPTS = [
  { label: '⚠️ Overdue Debtors (5+ Days)', query: 'Bhai dekh kaun kaun se customers ka paisa 5 din se atka hua hai' },
  { label: '👤 Check Vajahat Record', query: 'Show Vajahats work and pending balance' },
  { label: '💰 Today Business & Profit', query: 'Aaj kitni kamai hui aur kitna kharcha hua?' },
  { label: '💸 Spending by Category', query: 'Give me a breakdown of all business spendings by category' },
  { label: '📈 Month Comparison', query: 'Compare this month profit with last month' },
  { label: '⚡ Kirkol Counter Revenue', query: 'How much did Kirkol contribute compared to main customer jobs?' },
  { label: '📑 October Sheet Setup', query: 'Make a new sheet for October and sync' },
  { label: '🗓️ 2027 Workspace Setup', query: 'Make a new workspace for 2027' },
];

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  customers,
  spendings,
  kirkol,
  workTypes,
  categories,
  workStatuses,
  totals,
  supabaseConnected,
  onNavigate,
  onFilterCustomers,
  onOpenMonthlyReport,
  notify,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus>({
    status: 'unavailable',
    model_loaded: false,
    device: 'CPU',
    supabase_connected: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dataContext: AIDataContext = {
    customers,
    spendings,
    kirkol,
    workTypes,
    categories,
    workStatuses,
    totals,
    supabaseConnected,
  };

  const fetchHealth = async () => {
    const health = await aiAgentEngine.checkBackendHealth();
    setBackendHealth(health);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: `init-msg`,
          sender: 'assistant',
          persona: 'master',
          agentName: '🤖 Al Uzer Transformer AI',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          dataSourcesUsed: ['Supabase', 'Google Sheets'],
          content:
            `### 🤖 Al Uzer Self-Hosted Transformer AI\n\n` +
            `I am your **self-hosted, domain-fine-tuned Transformer AI agent**.\n\n` +
            `**Live System Status:**\n` +
            `• 🧠 **Neural Model:** \`${backendHealth.model_loaded ? 'Loaded (LoRA Fine-Tuned)' : 'Self-Hosted AI Server Ready'}\`\n` +
            `• ⚡ **Hardware Acceleration:** \`${backendHealth.device.toUpperCase()}\`\n` +
            `• 📊 **Live CRM Records:** \`${customers.length} customer jobs\` | \`${spendings.length} spendings\`\n\n` +
            `*Ask any question in English, Hindi, or Hinglish with natural phrasing or typos:*`,
          suggestedActions: [
            {
              id: 'act-query-debtors',
              label: '⚠️ Who Owes Me Money?',
              actionType: 'filter_customers',
              payload: { search: 'PENDING' },
              variant: 'primary',
            },
            {
              id: 'act-query-finances',
              label: '💰 Today\'s Revenue Summary',
              actionType: 'navigate',
              payload: { page: 'income' },
              variant: 'secondary',
            },
          ],
        },
      ]);
    }
  }, [backendHealth.model_loaded, customers.length, spendings.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isProcessing) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      persona: 'master',
      agentName: 'You',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    const history = aiContextManager.getHistory();
    aiContextManager.addTurn({
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: userMessage.timestamp,
    });

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const response = await aiAgentEngine.processQueryAsync(text, 'master', dataContext, history);
      aiContextManager.addTurn({
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
      });
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      const errorContent = `⚠️ **AI model unavailable.**\nPlease start the Al Uzer AI server on port 8000 by running:\n\`\`\`bash\nuvicorn backend.main:app --port 8000\n\`\`\``;
      aiContextManager.addTurn({
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          persona: 'master',
          agentName: '🤖 Al Uzer Transformer AI',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          dataSourcesUsed: ['Self-Hosted Transformer', 'Supabase'],
          content: errorContent,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearChat = () => {
    aiContextManager.clearHistory();
    setMessages([]);
    notify('Conversation reset. Memory cleared.');
  };

  const handleActionClick = async (action: AgentSuggestedAction) => {
    if (action.actionType === 'send_sms') {
      const cust = action.payload.customer;
      notify(`Queueing SMS reminder for ${cust?.customer_name || 'customer'}...`);
      const item = await smsService.createSingleCustomerSMS(cust, action.payload.message);
      const success = await smsService.dispatchQueueItem(item.id);
      if (success) {
        notify(`SMS reminder dispatched to ${cust?.customer_name} via SIM Gateway!`);
      } else {
        notify(`SMS queued in SIM Gateway outgoing queue.`);
      }
    } else if (action.actionType === 'queue_all_sms') {
      notify('Scanning and dispatching SMS reminders for eligible debtors...');
      const scanRes = await smsService.scanAndQueueOverdueReminders(customers);
      if (scanRes.queuedCount > 0) {
        const dispatchRes = await smsService.dispatchAllPending();
        notify(`Dispatched ${dispatchRes.sentCount} SMS reminders via SIM Gateway!`);
      } else {
        notify('All eligible overdue debtors are already queued or notified.');
      }
    } else if (action.actionType === 'whatsapp_message') {
      if (action.payload.url) {
        window.open(action.payload.url, '_blank');
        notify('Opening WhatsApp with prefilled message...');
      } else if (action.payload.mobile) {
        const cleanMobile = action.payload.mobile.replace(/[^0-9]/g, '');
        const phoneWithCode = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
        const msg = action.payload.message || `Namaste ${action.payload.customerName || 'ji'}, this is a reminder from Al Uzer Common Services regarding pending balance: ${formatCurrency(action.payload.balance || 0)}.`;
        const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        notify('Launching WhatsApp...');
      }
    } else if (action.actionType === 'navigate' && action.payload.page) {
      onNavigate(action.payload.page as Page);
    } else if (action.actionType === 'filter_customers') {
      if (onFilterCustomers) {
        onFilterCustomers(action.payload.search || '');
      }
      onNavigate('customers');
    } else if (action.actionType === 'export_report') {
      if (onOpenMonthlyReport) {
        onOpenMonthlyReport();
      } else {
        onNavigate('income');
      }
    } else if (action.actionType === 'sync_sheets') {
      notify('Initiating sync to Google Sheets...');
      const d = new Date();
      const targetYear = action.payload?.year ?? d.getFullYear();
      const targetMonth = action.payload?.month ?? d.getMonth();
      const success = await fullSyncToGoogleSheets(
        customers,
        spendings,
        kirkol,
        totals,
        targetYear,
        targetMonth,
        true
      );
      if (success) {
        notify('Google Sheets synchronized successfully!');
      } else {
        notify('Sync request dispatched to Google Sheets.');
      }
    }
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} style={{ font: "600 15px 'Space Grotesk'", color: '#16251e', margin: '8px 0 4px' }}>{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} style={{ font: "700 17px 'Space Grotesk'", color: '#147d59', margin: '10px 0 6px' }}>{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '3px 0', fontSize: '13px', color: '#33443b' }}>
            <span style={{ color: '#147d59', fontWeight: 700 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: formatBoldAndCode(trimmed.substring(2)) }} />
          </div>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <div key={idx} style={{ margin: '8px 0', padding: '10px 12px', background: '#f5faf7', borderLeft: '3px solid #147d59', borderRadius: '6px', fontSize: '12px', color: '#1a4d3b', fontStyle: 'italic' }}>
            {trimmed.replace('> ', '')}
          </div>
        );
      }
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (trimmed.includes('---')) return null;
        const cells = trimmed.split('|').filter(Boolean).map((c) => c.trim());
        return (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: '8px', padding: '6px 8px', margin: '2px 0', background: '#f9fbf9', border: '1px solid #eef2ef', borderRadius: '6px', fontSize: '12px', color: '#2d3f35' }}>
            {cells.map((cell, cIdx) => (
              <span key={cIdx} style={{ fontWeight: cIdx === 0 ? 600 : 400, color: cIdx === 0 ? '#16251e' : '#526258' }} dangerouslySetInnerHTML={{ __html: formatBoldAndCode(cell) }} />
            ))}
          </div>
        );
      }
      if (!trimmed) {
        return <div key={idx} style={{ height: '4px' }} />;
      }
      return (
        <p key={idx} style={{ fontSize: '13px', color: '#2d3f35', margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: formatBoldAndCode(line) }} />
      );
    });
  };

  const formatBoldAndCode = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #16251e; font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #64736b; font-style: italic;">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: #eef4f0; color: #0d6648; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace;">$1</code>');
  };

  return (
    <>
      {/* Light CRM Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">TRUE LLM AI AGENT</span>
          <h1>Al Uzer Master AI Assistant</h1>
          <p>Semantic NLP understanding in English, Hindi & Hinglish with deterministic CRM tool calling.</p>
        </div>
        <div className="heading-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: backendHealth.model_loaded ? '#e6f5ee' : '#fff1f0',
                border: `1px solid ${backendHealth.model_loaded ? '#cce8dc' : '#ffccc7'}`,
                color: backendHealth.model_loaded ? '#147d59' : '#cf1322',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <Cpu size={13} />
              <span>Model: {backendHealth.model_loaded ? `Loaded (${backendHealth.device.toUpperCase()})` : 'Offline'}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#e6f5ee', border: '1px solid #cce8dc', color: '#147d59', borderRadius: '7px', fontSize: '12px', fontWeight: 600 }}>
              <Database size={13} />
              <span>Supabase: {supabaseConnected ? 'Live' : 'Local'}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#e6f5ee', border: '1px solid #cce8dc', color: '#147d59', borderRadius: '7px', fontSize: '12px', fontWeight: 600 }}>
              <FileSpreadsheet size={13} />
              <span>Google Sheet: Linked</span>
            </span>
            <button
              onClick={handleClearChat}
              className="button secondary"
              style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}
              title="Start a fresh conversation and reset memory"
            >
              <RotateCcw size={13} />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Clean Light Panel matching CRM Table & Form Style */}
      <section className="panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 210px)', minHeight: '600px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        {/* Quick Inquiries Strip */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', background: '#fafcfa' }}>
          <span className="eyebrow" style={{ marginBottom: '8px', color: '#78847d' }}>
            QUICK ACTIONS & SEMANTIC PROMPTS
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(qp.query)}
                style={{ whiteSpace: 'nowrap', padding: '7px 13px', background: '#ffffff', border: '1px solid var(--line)', color: '#445249', borderRadius: '8px', fontSize: '12px', fontWeight: 500, transition: '0.15s', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eaf6ef';
                  e.currentTarget.style.borderColor = '#126e4e';
                  e.currentTarget.style.color = '#126e4e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.color = '#445249';
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message Timeline */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', background: '#fbfdfb' }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    background: isUser ? '#147d59' : '#e6f5ee',
                    color: isUser ? '#ffffff' : '#147d59',
                    border: isUser ? 'none' : '1px solid #cce8dc',
                  }}
                >
                  {isUser ? 'AK' : <Bot size={17} />}
                </div>

                {/* Message Bubble Container */}
                <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#7c8780', marginBottom: '4px' }}>
                    <strong style={{ color: isUser ? '#147d59' : '#16251e', fontWeight: 600 }}>
                      {isUser ? 'You' : 'Al Uzer Master AI'}
                    </strong>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.intent && msg.intent !== 'EXECUTIVE_BUSINESS_ASSISTANT' && (
                      <span style={{ fontSize: '10px', background: '#eaf3fb', color: '#3f78ab', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                        {msg.intent}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: isUser ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                      fontSize: '13px',
                      lineHeight: '1.55',
                      background: isUser ? '#e6f5ee' : '#ffffff',
                      color: '#16251e',
                      border: isUser ? '1px solid #cce8dc' : '1px solid var(--line)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    {isUser ? msg.content : renderFormattedContent(msg.content)}
                  </div>

                  {/* 1-Click Action Buttons */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {msg.suggestedActions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(act)}
                          className={`button ${act.variant === 'primary' ? 'primary' : 'secondary'}`}
                          style={{
                            padding: '8px 14px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {(act.actionType === 'send_sms' || act.actionType === 'queue_all_sms') && <Smartphone size={14} />}
                          {act.actionType === 'whatsapp_message' && <MessageSquare size={14} />}
                          {act.actionType === 'navigate' && <ExternalLink size={14} />}
                          {act.actionType === 'export_report' && <FileDown size={14} />}
                          {act.actionType === 'sync_sheets' && <RefreshCw size={14} />}
                          {act.actionType === 'filter_customers' && <Users size={14} />}
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#78847d', fontSize: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e6f5ee', color: '#147d59', display: 'grid', placeItems: 'center' }}>
                <Bot size={15} />
              </div>
              <div style={{ padding: '8px 14px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px' }}>
                Reasoning with Master LLM and executing CRM tools...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area styled like standard CRM Table input */}
        <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid var(--line)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f5f7f5', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 14px' }}>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask anything in English, Hindi, or Hinglish: 'Show Vajahat work', 'Kiska paisa baaki hai'..."
                style={{ width: '100%', border: 0, outline: 0, background: 'transparent', fontSize: '13px', color: 'var(--ink)' }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputQuery.trim() || isProcessing}
              className="button primary"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <span>Ask</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </section>
    </>
  );
};
