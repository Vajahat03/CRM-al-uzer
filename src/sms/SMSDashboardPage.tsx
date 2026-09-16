import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Send,
  RefreshCw,
  Settings as SettingsIcon,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  ShieldCheck,
  MessageSquare,
  Lock
} from 'lucide-react';
import { CustomerRecord, formatCurrency, formatDate } from '../types';
import { smsService } from './smsService';
import { SMSSettings, SMSQueueItem, SMSLogItem, SMSRuleAuditResult } from './smsTypes';
import { SupabaseClient } from '@supabase/supabase-js';

interface SMSDashboardPageProps {
  customers: CustomerRecord[];
  supabase: SupabaseClient | null;
  notify: (msg: string) => void;
}

type TabType = 'scanner' | 'queue' | 'logs' | 'settings' | 'gateway';

export const SMSDashboardPage: React.FC<SMSDashboardPageProps> = ({
  customers,
  supabase,
  notify,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const [settings, setSettings] = useState<SMSSettings>(() => smsService.getSettings());
  const [queue, setQueue] = useState<SMSQueueItem[]>(() => smsService.getQueue());
  const [logs, setLogs] = useState<SMSLogItem[]>(() => smsService.getLogs());
  const [isScanning, setIsScanning] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [searchLog, setSearchLog] = useState('');

  const auditResult: SMSRuleAuditResult = useMemo(() => {
    return smsService.auditOverdueDebtors(customers);
  }, [customers, settings, logs, queue]);

  const pendingQueue = useMemo(() => queue.filter((q) => q.status === 'pending'), [queue]);
  const sentLogs = useMemo(() => logs.filter((l) => l.status === 'sent'), [logs]);

  const filteredLogs = useMemo(() => {
    if (!searchLog) return logs;
    const term = searchLog.toLowerCase();
    return logs.filter(
      (l) =>
        l.customer_name.toLowerCase().includes(term) ||
        l.phone_number.includes(term) ||
        l.message.toLowerCase().includes(term)
    );
  }, [logs, searchLog]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    smsService.saveSettings(settings);
    notify('SMS reminder settings saved successfully!');
  };

  const handleScanAndQueue = async () => {
    setIsScanning(true);
    const result = await smsService.scanAndQueueOverdueReminders(customers, supabase);
    setQueue(smsService.getQueue());
    setIsScanning(false);

    if (result.queuedCount > 0) {
      notify(`Queued ${result.queuedCount} reminders for 5-day overdue accounts!`);
      setActiveTab('queue');
    } else {
      notify('Scan complete: All eligible 5-day overdue accounts are already queued or logged.');
    }
  };

  const handleDispatchAll = async () => {
    if (pendingQueue.length === 0) return;
    setIsDispatching(true);
    const res = await smsService.dispatchAllPending(supabase);
    setQueue(smsService.getQueue());
    setLogs(smsService.getLogs());
    setIsDispatching(false);
    notify(`SMS Dispatch Complete: ${res.sentCount} sent via SIM Gateway, ${res.failedCount} failed.`);
  };

  const handleDispatchSingle = async (queueId: string) => {
    const success = await smsService.dispatchQueueItem(queueId, supabase);
    setQueue(smsService.getQueue());
    setLogs(smsService.getLogs());
    if (success) notify('SMS sent successfully!');
    else notify('SMS delivery failed. Check phone number.');
  };

  const handleRemoveQueueItem = (queueId: string) => {
    smsService.removeQueueItem(queueId, supabase);
    setQueue(smsService.getQueue());
    notify('Removed from SMS queue.');
  };

  const handleRetryFailed = async (queueId: string) => {
    const success = await smsService.retryFailedSMS(queueId, supabase);
    setQueue(smsService.getQueue());
    setLogs(smsService.getLogs());
    if (success) notify('Retried and sent SMS successfully!');
    else notify('Retry failed. Please verify recipient number.');
  };

  const sampleCustomer = customers[0] || {
    id: 'sample',
    customer_name: 'Rahul Verma',
    total_amount: 2000,
    paid: 1000,
    work_type: 'Pan Card & Domicile',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    mobile: '9820012345',
  };

  const samplePreview = smsService.compileMessage(
    settings.messageTemplate,
    sampleCustomer as CustomerRecord,
    1000,
    6,
    settings.businessName
  );

  return (
    <>
      {/* Light CRM Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">AUTOMATED REMINDERS</span>
          <h1>SMS Reminder Control Hub</h1>
          <p>Zero-cost automated SMS reminders through your Android phone SIM card.</p>
        </div>
        <div className="heading-actions">
          <button
            onClick={handleScanAndQueue}
            disabled={isScanning}
            className="button secondary"
            title="Scan Supabase records for customers with balance > 5 days overdue"
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Scanning...' : 'Scan 5-Day Overdue'}</span>
          </button>

          {pendingQueue.length > 0 && (
            <button
              onClick={handleDispatchAll}
              disabled={isDispatching}
              className="button primary"
            >
              <Send size={14} />
              <span>{isDispatching ? 'Dispatching...' : `Dispatch Queue (${pendingQueue.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards matching CRM Dashboard */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon amber">
            <Clock size={19} />
          </div>
          <span className="metric-label">5-Day Overdue Debtors</span>
          <strong className="metric-value">{auditResult.eligibleDebtors.length}</strong>
          <span className="metric-detail">{auditResult.totalDebtors} total debtors</span>
        </div>

        <div className="metric-card">
          <div className="metric-icon blue">
            <Smartphone size={19} />
          </div>
          <span className="metric-label">Pending in SMS Queue</span>
          <strong className="metric-value">{pendingQueue.length}</strong>
          <span className="metric-detail">Awaiting SIM Send</span>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={19} />
          </div>
          <span className="metric-label">Sent Reminders Total</span>
          <strong className="metric-value">{sentLogs.length}</strong>
          <span className="metric-detail">Delivered via SIM</span>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <ShieldCheck size={19} />
          </div>
          <span className="metric-label">SIM Gateway Status</span>
          <strong className="metric-value" style={{ fontSize: '16px', color: '#147d59' }}>
            {settings.enabled ? 'Active (5-Day Rule)' : 'Paused'}
          </strong>
          <span className="metric-detail">{settings.businessName}</span>
        </div>
      </div>

      {/* Clean Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '8px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`button ${activeTab === 'scanner' ? 'primary' : 'secondary'}`}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <ShieldCheck size={14} />
          <span>5-Day Rule Audit</span>
          <span style={{ marginLeft: '6px', background: activeTab === 'scanner' ? '#0d6648' : '#e6f5ee', color: activeTab === 'scanner' ? '#fff' : '#147d59', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
            {auditResult.eligibleDebtors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`button ${activeTab === 'queue' ? 'primary' : 'secondary'}`}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <Clock size={14} />
          <span>SMS Queue</span>
          {pendingQueue.length > 0 && (
            <span style={{ marginLeft: '6px', background: '#c78329', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
              {pendingQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`button ${activeTab === 'logs' ? 'primary' : 'secondary'}`}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <MessageSquare size={14} />
          <span>SMS History & Logs</span>
          <span style={{ marginLeft: '6px', background: activeTab === 'logs' ? '#0d6648' : '#f5f7f5', color: activeTab === 'logs' ? '#fff' : '#78847d', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`button ${activeTab === 'settings' ? 'primary' : 'secondary'}`}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <SettingsIcon size={14} />
          <span>Reminder Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`button ${activeTab === 'gateway' ? 'primary' : 'secondary'}`}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          <Smartphone size={14} />
          <span>Android Gateway Guide</span>
        </button>
      </div>

      {/* Tab 1: 5-Day Rule Audit & Scanner */}
      {activeTab === 'scanner' && (
        <section className="panel table-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ font: "600 17px 'Space Grotesk'", margin: 0, color: '#16251e' }}>
                5-Day Overdue Debtors Audit
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78847d' }}>
                Evaluates unpaid customer balances directly against the <strong>{settings.minDaysOverdue}-day overdue threshold</strong>.
              </p>
            </div>
            {auditResult.eligibleDebtors.length > 0 && (
              <button onClick={handleScanAndQueue} className="button primary" style={{ fontSize: '12px', padding: '8px 14px' }}>
                <Send size={13} />
                <span>Queue All {auditResult.eligibleDebtors.length} Reminders</span>
              </button>
            )}
          </div>

          {auditResult.eligibleDebtors.length > 0 ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Service</th>
                    <th>Pending Balance</th>
                    <th>Overdue Days</th>
                    <th>Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {auditResult.eligibleDebtors.map((item) => (
                    <tr key={item.customer_id}>
                      <td><strong>{item.customer_name}</strong></td>
                      <td><span style={{ fontFamily: 'monospace', color: '#147d59' }}>+91 {item.phone_number}</span></td>
                      <td><span className="work-pill">{item.work_type}</span></td>
                      <td><strong style={{ color: '#c78329' }}>{formatCurrency(item.balance)}</strong></td>
                      <td><span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fff3dd', color: '#b27825', fontWeight: 600, fontSize: '11px' }}>{item.days_overdue} days</span></td>
                      <td><span style={{ color: '#147d59', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}><CheckCircle2 size={13} /> Eligible for reminder</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <CheckCircle2 size={24} style={{ color: '#147d59', margin: '0 auto 8px' }} />
              <h3 style={{ margin: 0, font: "600 15px 'Space Grotesk'", color: '#16251e' }}>No Pending 5-Day Overdue Accounts</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#78847d' }}>
                All active debtors have either paid, are under 5 days, or have already received their scheduled reminders.
              </p>
            </div>
          )}

          {auditResult.skippedDebtors.length > 0 && (
            <div style={{ marginTop: '20px', padding: '14px 16px', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <span className="eyebrow" style={{ color: '#78847d', marginBottom: '8px' }}>
                ACCOUNTS EVALUATED AND SKIPPED (GUARDRAILS)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {auditResult.skippedDebtors.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px' }}>
                    <strong style={{ color: '#16251e' }}>{s.customer_name}</strong>
                    <span style={{ color: '#78847d' }}>{formatCurrency(s.balance)}</span>
                    <span style={{ color: '#c78329', fontSize: '11px', fontFamily: 'monospace' }}>{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: SMS Queue */}
      {activeTab === 'queue' && (
        <section className="panel table-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ font: "600 17px 'Space Grotesk'", margin: 0, color: '#16251e' }}>
                Outgoing SMS Reminder Queue
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78847d' }}>
                Messages waiting to be sent through your Android phone SIM card.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {queue.some((q) => q.status === 'sent') && (
                <button
                  onClick={() => {
                    smsService.clearCompletedQueue();
                    setQueue(smsService.getQueue());
                    notify('Cleared completed items from queue.');
                  }}
                  className="button secondary"
                  style={{ fontSize: '12px' }}
                >
                  Clear Sent
                </button>
              )}
              {pendingQueue.length > 0 && (
                <button
                  onClick={handleDispatchAll}
                  disabled={isDispatching}
                  className="button primary"
                  style={{ fontSize: '12px' }}
                >
                  <Send size={13} />
                  <span>{isDispatching ? 'Dispatching...' : `Dispatch All (${pendingQueue.length})`}</span>
                </button>
              )}
            </div>
          </div>

          {queue.length > 0 ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Pending Amount</th>
                    <th>Message Preview</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: item.status === 'sent' ? '#e6f5ee' : item.status === 'failed' ? '#fff0e8' : '#eaf3fb', color: item.status === 'sent' ? '#147d59' : item.status === 'failed' ? '#cd7051' : '#3f78ab', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                          {item.status}
                        </span>
                      </td>
                      <td><strong>{item.customer_name}</strong></td>
                      <td><span style={{ fontFamily: 'monospace', color: '#147d59' }}>+91 {item.phone_number}</span></td>
                      <td><strong style={{ color: '#c78329' }}>{formatCurrency(item.balance)}</strong></td>
                      <td style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#54625a' }} title={item.message}>
                        {item.message}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {item.status === 'pending' && (
                            <button onClick={() => handleDispatchSingle(item.id)} className="button primary" style={{ padding: '5px 10px', fontSize: '11px' }}>
                              Send
                            </button>
                          )}
                          {item.status === 'failed' && (
                            <button onClick={() => handleRetryFailed(item.id)} className="button secondary" style={{ padding: '5px 10px', fontSize: '11px', color: '#c78329' }}>
                              Retry
                            </button>
                          )}
                          <button onClick={() => handleRemoveQueueItem(item.id)} className="button secondary" style={{ padding: '5px 8px' }} title="Remove from queue">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <Clock size={24} style={{ color: '#78847d', margin: '0 auto 8px' }} />
              <h3 style={{ margin: 0, font: "600 15px 'Space Grotesk'", color: '#16251e' }}>Queue is Empty</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#78847d' }}>
                Click <strong>"Scan 5-Day Overdue"</strong> above to find and queue pending debtor reminders.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: SMS History & Logs */}
      {activeTab === 'logs' && (
        <section className="panel table-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ font: "600 17px 'Space Grotesk'", margin: 0, color: '#16251e' }}>
                SMS Dispatch Audit Trail
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78847d' }}>
                Complete history of all SMS reminders dispatched to customers.
              </p>
            </div>
            <div className="table-search" style={{ width: '220px', background: '#f5f7f5', border: '1px solid var(--line)', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={14} style={{ color: '#869088' }} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                style={{ width: '100%', border: 0, outline: 0, background: 'transparent', fontSize: '12px' }}
              />
            </div>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Pending Amount</th>
                    <th>Message Content</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: log.status === 'sent' ? '#e6f5ee' : '#fff0e8', color: log.status === 'sent' ? '#147d59' : '#cd7051', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ color: '#78847d', fontSize: '12px' }}>{formatDate(log.sent_at)}</td>
                      <td><strong>{log.customer_name}</strong></td>
                      <td><span style={{ fontFamily: 'monospace', color: '#147d59' }}>+91 {log.phone_number}</span></td>
                      <td><strong style={{ color: '#c78329' }}>{formatCurrency(log.balance)}</strong></td>
                      <td style={{ maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#54625a' }} title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <MessageSquare size={24} style={{ color: '#78847d', margin: '0 auto 8px' }} />
              <h3 style={{ margin: 0, font: "600 15px 'Space Grotesk'", color: '#16251e' }}>No SMS Logs Yet</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#78847d' }}>
                Dispatched reminders from your Android gateway will appear here.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tab 4: Reminder Settings & Template */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ font: "600 17px 'Space Grotesk'", margin: 0, color: '#16251e' }}>
              Automated Reminder Configuration
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78847d' }}>
              Configure the 5-day overdue trigger, frequency, and custom SMS template.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Left Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#16251e', display: 'block' }}>Enable Automated Reminders</strong>
                  <span style={{ fontSize: '11px', color: '#78847d' }}>Scan and queue overdue debtors automatically</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#147d59', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#283b31', marginBottom: '4px' }}>
                  Minimum Overdue Threshold (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.minDaysOverdue}
                  onChange={(e) => setSettings({ ...settings, minDaysOverdue: Number(e.target.value) || 5 })}
                  style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '7px', fontSize: '12px' }}
                  required
                />
                <span style={{ fontSize: '10px', color: '#78847d', marginTop: '2px', display: 'block' }}>
                  Rule: Only customers with unpaid balance &gt; {settings.minDaysOverdue} days receive reminders.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#283b31', marginBottom: '4px' }}>
                  Reminder Frequency Gap (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.reminderFrequencyDays}
                  onChange={(e) => setSettings({ ...settings, reminderFrequencyDays: Number(e.target.value) || 5 })}
                  style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '7px', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#283b31', marginBottom: '4px' }}>
                  Maximum Reminders per Debtor
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxReminders}
                  onChange={(e) => setSettings({ ...settings, maxReminders: Number(e.target.value) || 3 })}
                  style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '7px', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#283b31', marginBottom: '4px' }}>
                  Business / Sender Name
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '7px', fontSize: '12px' }}
                  required
                />
              </div>
            </div>

            {/* Right Box: Template & Live Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#283b31', marginBottom: '4px' }}>
                  SMS Message Template
                </label>
                <textarea
                  rows={4}
                  value={settings.messageTemplate}
                  onChange={(e) => setSettings({ ...settings, messageTemplate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '7px', fontSize: '12px', lineHeight: 1.5, resize: 'vertical' }}
                  required
                />
                <div style={{ fontSize: '10px', color: '#78847d', marginTop: '4px' }}>
                  <span>Variables: </span>
                  <code style={{ background: '#eef4f0', color: '#147d59', padding: '1px 4px', borderRadius: '3px' }}>{'{customer_name}'}</code>,{' '}
                  <code style={{ background: '#eef4f0', color: '#147d59', padding: '1px 4px', borderRadius: '3px' }}>{'{balance}'}</code>,{' '}
                  <code style={{ background: '#eef4f0', color: '#147d59', padding: '1px 4px', borderRadius: '3px' }}>{'{work_type}'}</code>,{' '}
                  <code style={{ background: '#eef4f0', color: '#147d59', padding: '1px 4px', borderRadius: '3px' }}>{'{days_pending}'}</code>,{' '}
                  <code style={{ background: '#eef4f0', color: '#147d59', padding: '1px 4px', borderRadius: '3px' }}>{'{business_name}'}</code>
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <span className="eyebrow" style={{ color: '#78847d', marginBottom: '6px' }}>
                  LIVE CUSTOMER PREVIEW (SIM OUTPUT)
                </span>
                <div style={{ padding: '12px 14px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '12px', color: '#16251e', lineHeight: 1.55 }}>
                  {samplePreview}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button type="submit" className="button primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Android Gateway Guide (API Key securely hidden) */}
      {activeTab === 'gateway' && (
        <section className="panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ font: "600 17px 'Space Grotesk'", margin: 0, color: '#16251e' }}>
              Android Phone SIM Gateway Bridge
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78847d' }}>
              How your Android phone acts as your private SMS Gateway with zero monthly fees.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', fontSize: '13px', color: '#33443b' }}>
            <div style={{ padding: '18px', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <h3 style={{ font: "600 14px 'Space Grotesk'", color: '#16251e', margin: '0 0 10px' }}>
                How the Flow Works
              </h3>
              <ol style={{ paddingLeft: '18px', margin: 0, lineHeight: '1.7', color: '#54625a' }}>
                <li>CRM evaluates customers with unpaid balance &gt; 5 days overdue.</li>
                <li>Reminder messages are placed into your <code>sms_queue</code> table.</li>
                <li>Your Android phone connects securely to Supabase.</li>
                <li>Android app pulls pending messages and sends them via your business SIM card.</li>
                <li>Status is automatically updated to <code>sent</code> in the CRM audit trail.</li>
              </ol>
            </div>

            <div style={{ padding: '18px', background: '#fafcfa', border: '1px solid var(--line)', borderRadius: '10px' }}>
              <h3 style={{ font: "600 14px 'Space Grotesk'", color: '#16251e', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} style={{ color: '#147d59' }} />
                Gateway Security & Authentication
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '6px' }}>
                  <span style={{ color: '#78847d' }}>Gateway Device: </span>
                  <strong style={{ color: '#16251e' }}>{settings.gatewayDeviceName || 'Owner SIM Gateway (Android)'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#78847d' }}>Gateway Token: </span>
                  <span style={{ fontFamily: 'monospace', color: '#147d59', fontWeight: 600 }}>•••••••••••••••• (Secure)</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#78847d' }}>
                  🔒 Sensitive gateway credentials are encrypted and hidden to maintain privacy.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
