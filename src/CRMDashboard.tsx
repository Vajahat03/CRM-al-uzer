import { useMemo, useState, FormEvent } from 'react';
import {
  Plus, Search, Pencil, Trash2, X, Check, Filter, Wand, FileDown,
  Sparkles, Bot, Smartphone, Calendar, Printer, PieChart, ArrowRight,
  TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, DollarSign, Save
} from 'lucide-react';
import {
  CustomerRecord, Spending, Kirkol, Category, WorkType, WorkStatus,
  formatCurrency, formatDate, getStatus, todayISO, MONTH_NAMES
} from './types';
import { WorkTypeField } from './WorkTypeField';
import { CustomerNameField } from './CustomerNameField';
import { ConfirmDialog } from './ConfirmDialog';
import { printThermalBill } from './billPrinter';

type StatusFilter = 'ALL' | 'Pending' | 'In Progress' | 'Al Uzer' | 'Delivered' | 'Document Required' | 'Completed';

type Props = {
  customers: CustomerRecord[];
  spendings?: Spending[];
  kirkol?: Kirkol[];
  categories?: Category[];
  workTypes: WorkType[];
  workStatuses: WorkStatus[];
  onSaveCustomer: (data: Partial<CustomerRecord>, editingId?: string) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onAddCustomer?: () => void;
  onAddKirkol: () => void;
  onOpenMonthlyReport?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenSMSReminders?: () => void;
};

export function CRMDashboard({
  customers,
  spendings = [],
  kirkol = [],
  categories = [],
  workTypes,
  workStatuses,
  onSaveCustomer,
  onDeleteCustomer,
  onAddCustomer,
  onAddKirkol,
  onOpenMonthlyReport,
  onOpenAIAssistant,
  onOpenSMSReminders,
}: Props) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM' (e.g. '2026-08')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [workFilter, setWorkFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = useState<CustomerRecord | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'status' | 'category' | 'both'>('both');

  // Generate available Month & Year options from recorded customer, spending, and kirkol dates
  const monthOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; year: number; month: number }>();
    const registerDate = (iso?: string) => {
      if (!iso) return;
      try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        if (!map.has(key)) {
          const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          map.set(key, { key, label, year: d.getFullYear(), month: d.getMonth() });
        }
      } catch {}
    };

    // Also register current month and past 3 months
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      registerDate(d.toISOString());
    }

    customers.forEach((c) => registerDate(c.created_at));
    spendings.forEach((s) => registerDate(s.created_at));
    kirkol.forEach((k) => registerDate(k.created_at));

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [customers, spendings, kirkol]);

  // Month-filtered datasets
  const monthFilteredCustomers = useMemo(() => {
    if (selectedMonthKey === 'ALL') return customers;
    return customers.filter((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      return key === selectedMonthKey;
    });
  }, [customers, selectedMonthKey]);

  const monthFilteredSpendings = useMemo(() => {
    if (selectedMonthKey === 'ALL') return spendings;
    return spendings.filter((s) => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      return key === selectedMonthKey;
    });
  }, [spendings, selectedMonthKey]);

  const monthFilteredKirkol = useMemo(() => {
    if (selectedMonthKey === 'ALL') return kirkol;
    return kirkol.filter((k) => {
      if (!k.created_at) return false;
      const d = new Date(k.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      return key === selectedMonthKey;
    });
  }, [kirkol, selectedMonthKey]);

  // Core Financial stats for the selected month
  const monthFinancials = useMemo(() => {
    const totalJobs = monthFilteredCustomers.length;
    const totalAmount = monthFilteredCustomers.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
    const receivedAmount = monthFilteredCustomers.reduce((sum, r) => sum + (Number(r.paid) || 0), 0);
    const pendingAmount = monthFilteredCustomers.reduce(
      (sum, r) => sum + Math.max((Number(r.total_amount) || 0) - (Number(r.paid) || 0), 0),
      0
    );

    const customerIncome = monthFilteredCustomers.reduce((sum, r) => sum + (Number(r.income) || 0), 0);
    const kirkolIncome = monthFilteredKirkol.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
    const totalIncome = customerIncome + kirkolIncome;

    const totalSpending = monthFilteredSpendings.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const remainingAmount = totalIncome - totalSpending;

    return {
      totalJobs,
      totalAmount,
      receivedAmount,
      pendingAmount,
      customerIncome,
      kirkolIncome,
      totalIncome,
      totalSpending,
      remainingAmount,
    };
  }, [monthFilteredCustomers, monthFilteredSpendings, monthFilteredKirkol]);

  // Customer dropdown filter options for selected month
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    monthFilteredCustomers.forEach((c) => map.set(c.customer_name, c.customer_name));
    return Array.from(map.keys()).sort();
  }, [monthFilteredCustomers]);

  const alUzerCount = useMemo(() => {
    return monthFilteredCustomers.filter(
      (row) =>
        row.customer_name.toLowerCase().includes('al uzer') ||
        row.work_type.toLowerCase().includes('al uzer') ||
        row.work_status === 'Al Uzer'
    ).length;
  }, [monthFilteredCustomers]);

  // Table-filtered customer records
  const filtered = useMemo(() => {
    return monthFilteredCustomers.filter((row) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Al Uzer') {
          const isAlUzer =
            row.customer_name.toLowerCase().includes('al uzer') ||
            row.work_type.toLowerCase().includes('al uzer') ||
            row.work_status === 'Al Uzer';
          if (!isAlUzer) return false;
        } else if (row.work_status !== statusFilter) {
          return false;
        }
      }
      if (workFilter !== 'ALL' && row.work_type !== workFilter) return false;
      if (customerFilter !== 'ALL' && row.customer_name !== customerFilter) return false;
      if (
        search &&
        !`${row.customer_name} ${row.mobile} ${row.work_type} ${row.work_status}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [monthFilteredCustomers, statusFilter, workFilter, customerFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: monthFilteredCustomers.length,
      Pending: 0,
      'In Progress': 0,
      'Al Uzer': alUzerCount,
      Delivered: 0,
      'Document Required': 0,
      Completed: 0,
    };
    monthFilteredCustomers.forEach((row) => {
      if (counts[row.work_status] !== undefined && row.work_status !== 'Al Uzer') {
        counts[row.work_status]++;
      }
    });
    return counts;
  }, [monthFilteredCustomers, alUzerCount]);

  // Pie Chart 1: Work Status Distribution
  const workStatusPieData = useMemo(() => {
    const total = monthFilteredCustomers.length;
    if (!total) return { items: [], gradient: '#e2e8f0', total: 0 };

    const statusCountsMap: Record<string, number> = {};
    monthFilteredCustomers.forEach((c) => {
      const st = c.work_status || 'Pending';
      statusCountsMap[st] = (statusCountsMap[st] || 0) + 1;
    });

    const statusPalette: Record<string, string> = {
      Pending: '#eab308',
      'In Progress': '#3b82f6',
      Completed: '#10b981',
      Delivered: '#167c57',
      'Payment Pending': '#f97316',
      'Document Required': '#8b5cf6',
      Rejected: '#ef4444',
      Cancelled: '#64748b',
    };

    const items = Object.entries(statusCountsMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => {
        const pct = Math.round((count / total) * 100);
        const color = statusPalette[name] || ['#06b6d4', '#ec4899', '#6366f1', '#14b8a6'][idx % 4];
        return { name, count, pct, color };
      });

    let currentPct = 0;
    const gradientParts = items.map((item) => {
      const start = currentPct;
      currentPct += (item.count / total) * 100;
      return `${item.color} ${start.toFixed(1)}% ${currentPct.toFixed(1)}%`;
    });

    return {
      items,
      gradient: `conic-gradient(${gradientParts.join(', ')})`,
      total,
    };
  }, [monthFilteredCustomers]);

  // Pie Chart 2: Category Spending Distribution
  const categoryPieData = useMemo(() => {
    const total = monthFinancials.totalSpending;
    if (!total || monthFilteredSpendings.length === 0) {
      return { items: [], gradient: '#e2e8f0', total: 0 };
    }

    const catMap: Record<string, number> = {};
    monthFilteredSpendings.forEach((s) => {
      const cat = s.category || 'Business';
      catMap[cat] = (catMap[cat] || 0) + (Number(s.amount) || 0);
    });

    const categoryColors = ['#e8753a', '#2563eb', '#10b981', '#9333ea', '#06b6d4', '#f59e0b'];

    const items = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], idx) => {
        const pct = Math.round((amount / total) * 100);
        const color = categoryColors[idx % categoryColors.length];
        return { name, amount, pct, color };
      });

    let currentPct = 0;
    const gradientParts = items.map((item) => {
      const start = currentPct;
      currentPct += (item.amount / total) * 100;
      return `${item.color} ${start.toFixed(1)}% ${currentPct.toFixed(1)}%`;
    });

    return {
      items,
      gradient: `conic-gradient(${gradientParts.join(', ')})`,
      total,
    };
  }, [monthFilteredSpendings, monthFinancials.totalSpending]);

  const statusButtons: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'ALL' },
    { key: 'Pending', label: 'PENDING' },
    { key: 'In Progress', label: 'IN PROGRESS' },
    { key: 'Al Uzer', label: 'AL UZER' },
    { key: 'Delivered', label: 'DELIVERED' },
    { key: 'Document Required', label: 'DOCUMENT REQUIRED' },
    { key: 'Completed', label: 'COMPLETED' },
  ];

  const openCreate = (): void => {
    if (onAddCustomer) {
      onAddCustomer();
    } else {
      setEditing(null);
      setShowForm(true);
    }
  };

  const openEdit = (row: CustomerRecord): void => {
    setEditing(row);
    setShowForm(true);
  };

  const handleSave = async (data: Partial<CustomerRecord>, editingId?: string): Promise<void> => {
    await onSaveCustomer(data, editingId);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleting) return;
    await onDeleteCustomer(deleting.id);
    setDeleting(null);
  };

  const selectedMonthLabel =
    selectedMonthKey === 'ALL'
      ? 'All Months (All Time Records)'
      : monthOptions.find((m) => m.key === selectedMonthKey)?.label || selectedMonthKey;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">AL UZER SERVICES & CRM</span>
          <h1>Job Management & Monthly Reports</h1>
          <p>Live accounting, monthly income reports, remaining balance, and job workflow.</p>
        </div>
        <div className="heading-actions">
          {onOpenSMSReminders && (
            <button
              className="button secondary"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
                borderColor: 'rgba(52, 211, 153, 0.4)',
                color: '#a7f3d0',
              }}
              onClick={onOpenSMSReminders}
              title="Open Automated 5-Day SMS Reminder Hub"
            >
              <Smartphone size={16} className="text-emerald-400" /> SMS Reminders
            </button>
          )}
          {onOpenAIAssistant && (
            <button
              className="button secondary"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                borderColor: 'rgba(129, 140, 248, 0.4)',
                color: '#c7d2fe',
              }}
              onClick={onOpenAIAssistant}
              title="Open AI Intelligence & Dual-Data Assistant"
            >
              <Sparkles size={16} className="animate-pulse text-indigo-400" /> AI Assistant
            </button>
          )}
          {onOpenMonthlyReport && (
            <button className="button secondary" onClick={onOpenMonthlyReport}>
              <FileDown size={16} /> Monthly PDF Report
            </button>
          )}
          <button className="button kirkol-btn" onClick={onAddKirkol}>
            <Wand size={16} /> Kirkol
          </button>
          <button className="button primary" onClick={openCreate}>
            <Plus size={16} /> Add customer
          </button>
        </div>
      </div>

      {/* Month-Wise Selector Bar */}
      <div
        className="month-filter-strip"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8e2',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#eaf6ef',
              color: '#167c57',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#88958e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Select Month Filter
            </div>
            <strong style={{ fontSize: '15px', color: '#16251e' }}>{selectedMonthLabel}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="filter-select"
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#16251e',
              background: '#f6f8f6',
              border: '1.5px solid #167c57',
              borderRadius: '8px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">📅 All Months (Full History)</option>
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                🗓️ {opt.label}
              </option>
            ))}
          </select>

          {selectedMonthKey !== 'ALL' && (
            <button
              className="button secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => setSelectedMonthKey('ALL')}
            >
              Reset to All
            </button>
          )}
        </div>
      </div>

      {/* Month-Wise Financial Metrics Cards */}
      <div
        className="month-financial-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div
          className="crm-summary-card"
          style={{ background: '#ffffff', border: '1px solid #e4e9e4', borderRadius: '12px', padding: '14px 16px' }}
        >
          <span className="crm-summary-label" style={{ color: '#78847d', fontSize: '12px', fontWeight: 600 }}>
            Total Jobs
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '20px', display: 'block', marginTop: '4px' }}>
            {monthFinancials.totalJobs}
          </strong>
          <span style={{ fontSize: '11px', color: '#8b9790' }}>in {selectedMonthKey === 'ALL' ? 'all months' : selectedMonthLabel}</span>
        </div>

        <div
          className="crm-summary-card"
          style={{ background: '#ffffff', border: '1px solid #e4e9e4', borderRadius: '12px', padding: '14px 16px' }}
        >
          <span className="crm-summary-label" style={{ color: '#78847d', fontSize: '12px', fontWeight: 600 }}>
            Total Amount
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '20px', display: 'block', marginTop: '4px' }}>
            {formatCurrency(monthFinancials.totalAmount)}
          </strong>
          <span style={{ fontSize: '11px', color: '#8b9790' }}>Gross customer billed</span>
        </div>

        <div
          className="crm-summary-card"
          style={{ background: '#ffffff', border: '1px solid #e4e9e4', borderRadius: '12px', padding: '14px 16px' }}
        >
          <span className="crm-summary-label" style={{ color: '#78847d', fontSize: '12px', fontWeight: 600 }}>
            Received Amount
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '20px', display: 'block', marginTop: '4px', color: '#167c57' }}>
            {formatCurrency(monthFinancials.receivedAmount)}
          </strong>
          <span style={{ fontSize: '11px', color: '#167c57' }}>Collected payment</span>
        </div>

        <div
          className="crm-summary-card"
          style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 16px' }}
        >
          <span className="crm-summary-label" style={{ color: '#c2410c', fontSize: '12px', fontWeight: 600 }}>
            Pending Amount
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '20px', display: 'block', marginTop: '4px', color: '#ea580c' }}>
            {formatCurrency(monthFinancials.pendingAmount)}
          </strong>
          <span style={{ fontSize: '11px', color: '#ea580c' }}>To collect</span>
        </div>

        <div
          className="crm-summary-card"
          style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}
        >
          <span className="crm-summary-label" style={{ color: '#15803d', fontSize: '12px', fontWeight: 600 }}>
            Total Income
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '20px', display: 'block', marginTop: '4px', color: '#15803d' }}>
            {formatCurrency(monthFinancials.totalIncome)}
          </strong>
          <span style={{ fontSize: '11px', color: '#15803d' }}>Customer Profit + Kirkol</span>
        </div>

        <div
          className="crm-summary-card"
          style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px' }}
        >
          <span className="crm-summary-label" style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>
            Total Spending
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '20px', display: 'block', marginTop: '4px', color: '#dc2626' }}>
            {formatCurrency(monthFinancials.totalSpending)}
          </strong>
          <span style={{ fontSize: '11px', color: '#b91c1c' }}>Direct business expenses</span>
        </div>

        <div
          className="crm-summary-card"
          style={{
            background: 'linear-gradient(135deg, #eaf6ef, #d4f0df)',
            border: '2px solid #84cc16',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 4px 12px rgba(22, 124, 87, 0.1)',
          }}
        >
          <span className="crm-summary-label" style={{ color: '#0d6648', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
            ★ Remaining Amount
          </span>
          <strong className="crm-summary-value" style={{ fontSize: '22px', display: 'block', marginTop: '4px', color: '#0d6648', fontWeight: 900 }}>
            {formatCurrency(monthFinancials.remainingAmount)}
          </strong>
          <span style={{ fontSize: '11px', color: '#0d6648', fontWeight: 700 }}>Total Income − Spending</span>
        </div>
      </div>

      {/* Pie Charts Section (Category & Work Status) */}
      <div
        className="pie-charts-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Pie Chart 1: Work Status Distribution */}
        <section className="panel" style={{ padding: '18px 20px', borderRadius: '12px' }}>
          <div className="panel-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <PieChart size={18} color="#167c57" /> Work Status Report
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#78847d' }}>
                Breakdown of active vs completed jobs ({selectedMonthLabel})
              </p>
            </div>
          </div>
          <div className="donut-wrap" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div
              className="donut"
              style={{
                background: workStatusPieData.gradient,
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                }}
              >
                <strong style={{ fontSize: '18px', color: '#16251e' }}>{workStatusPieData.total}</strong>
                <span style={{ fontSize: '9.5px', color: '#78847d', fontWeight: 600 }}>Total Jobs</span>
              </div>
            </div>
            <div className="donut-list" style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {workStatusPieData.items.length > 0 ? (
                workStatusPieData.items.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '3px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: item.color,
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: '#334139', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#16251e', marginRight: '6px' }}>{item.count}</span>
                      <span style={{ fontSize: '11px', color: '#78847d' }}>({item.pct}%)</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '12px' }}>No jobs found for this month.</div>
              )}
            </div>
          </div>
        </section>

        {/* Pie Chart 2: Category Spending Distribution */}
        <section className="panel" style={{ padding: '18px 20px', borderRadius: '12px' }}>
          <div className="panel-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Wallet size={18} color="#e8753a" /> Spending by Category Report
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#78847d' }}>
                Expense allocation by business categories ({selectedMonthLabel})
              </p>
            </div>
          </div>
          <div className="donut-wrap" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div
              className="donut"
              style={{
                background: categoryPieData.gradient,
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                }}
              >
                <strong style={{ fontSize: '14px', color: '#16251e' }}>{formatCurrency(categoryPieData.total)}</strong>
                <span style={{ fontSize: '9px', color: '#78847d', fontWeight: 600 }}>Total Spent</span>
              </div>
            </div>
            <div className="donut-list" style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {categoryPieData.items.length > 0 ? (
                categoryPieData.items.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '3px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: item.color,
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: '#334139', fontWeight: 500 }}>{item.name}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#16251e', marginRight: '6px' }}>
                        {formatCurrency(item.amount)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#78847d' }}>({item.pct}%)</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '12px' }}>No direct expenses logged for this month.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Status Bar */}
      <div className="crm-status-bar">
        {statusButtons.map((btn) => (
          <button
            key={btn.key}
            className={`crm-status-btn ${statusFilter === btn.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(btn.key)}
          >
            {btn.label}
            <span className="crm-status-count">{statusCounts[btn.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Customer Jobs Table for Selected Month */}
      <section className="panel table-panel crm-table-panel">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={15} />
            <input
              placeholder={`Search in ${selectedMonthLabel}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="filter-group">
            <Filter size={14} className="filter-icon" />
            <select
              className="filter-select"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="ALL">All Customers ({uniqueCustomers.length})</option>
              {uniqueCustomers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select className="filter-select" value={workFilter} onChange={(e) => setWorkFilter(e.target.value)}>
              <option value="ALL">All Work Types</option>
              {workTypes.map((wt) => (
                <option key={wt.id} value={wt.name}>
                  {wt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Work Type</th>
                <th>Status</th>
                <th>Total Amount</th>
                <th>Received</th>
                <th>Balance</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const balance = row.total_amount - row.paid;
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="table-avatar">{row.customer_name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <strong>{row.customer_name}</strong>
                          <span>{row.mobile || 'No mobile'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="work-pill">{row.work_type}</span>
                    </td>
                    <td>
                      <span className={`crm-job-status ${row.work_status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {row.work_status}
                      </span>
                    </td>
                    <td>
                      <strong>{formatCurrency(row.total_amount)}</strong>
                    </td>
                    <td>{formatCurrency(row.paid)}</td>
                    <td className={balance > 0 ? 'warning-text' : 'success-text'}>
                      <strong>{formatCurrency(balance)}</strong>
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <div className="crm-row-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          className="crm-action-btn"
                          onClick={() => printThermalBill(row)}
                          title="Print Thermal Bill (80mm/58mm)"
                          style={{ color: '#167c57', borderColor: '#b2dfcb', background: '#f0f9f4' }}
                        >
                          <Printer size={13} />
                        </button>
                        <button className="crm-action-btn" onClick={() => openEdit(row)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button
                          className="crm-action-btn danger"
                          onClick={() => setDeleting(row)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty-state">
              <p>No customer jobs match your filters for {selectedMonthLabel}.</p>
              <button className="button primary" style={{ marginTop: '8px' }} onClick={openCreate}>
                <Plus size={15} /> Add job for {selectedMonthLabel}
              </button>
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <CRMJobModal
          workTypes={workTypes}
          workStatuses={workStatuses}
          customers={customers}
          editing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSave}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete job?"
          message={`"${deleting.customer_name}"'s job will be permanently removed and all stats recalculated.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}

function CRMJobModal({
  workTypes,
  workStatuses,
  customers = [],
  editing,
  onClose,
  onSubmit,
}: {
  workTypes: WorkType[];
  workStatuses: WorkStatus[];
  customers?: CustomerRecord[];
  editing: CustomerRecord | null;
  onClose: () => void;
  onSubmit: (data: Partial<CustomerRecord>, editingId?: string) => Promise<void>;
}) {
  const [customerName, setCustomerName] = useState(editing?.customer_name ?? '');
  const [selected, setSelected] = useState(editing?.work_type ?? '');
  const [mobile, setMobile] = useState(editing?.mobile ?? '');
  const [total, setTotal] = useState(String(editing?.total_amount ?? ''));
  const [received, setReceived] = useState(String(editing?.paid ?? ''));
  const [date, setDate] = useState(editing ? editing.created_at.slice(0, 10) : todayISO());
  const [status, setStatus] = useState(editing?.work_status ?? workStatuses[0]?.name ?? 'Pending');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expense = workTypes.find((row) => row.name === selected)?.expense ?? 0;
  const totalValue = Number(total) || 0;
  const receivedValue = Number(received) || 0;
  const balance = totalValue - receivedValue;

  const handleNameSelect = (name: string, matchingMobile?: string) => {
    setCustomerName(name);
    if (matchingMobile && !mobile) {
      setMobile(matchingMobile);
    }
  };

  const validateAndBuildData = (): Partial<CustomerRecord> | null => {
    const name = customerName.trim();
    const mobileValue = mobile.replace(/\D/g, '').slice(0, 10);
    const totalAmount = Number(total) || 0;
    const receivedAmount = Number(received) || 0;
    const match = workTypes.find((row) => row.name === selected);

    if (!match || !selected || !name || totalAmount <= 0 || receivedAmount < 0 || receivedAmount > totalAmount) {
      return null;
    }

    return {
      customer_name: name,
      mobile: mobileValue,
      work_type: match.name,
      total_amount: totalAmount,
      charges: editing?.charges ?? 0,
      paid: receivedAmount,
      expense: match.expense,
      income: totalAmount - match.expense,
      payment_status: getStatus(receivedAmount, totalAmount),
      work_status: status,
      created_at: new Date(date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(),
    };
  };

  const handleSaveAndClose = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndNext = async () => {
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      const savedName = data.customer_name;
      setCustomerName('');
      setMobile('');
      setSelected('');
      setTotal('');
      setReceived('');
      setStatus(workStatuses[0]?.name ?? 'Pending');
      setSaveSuccessMsg(`✓ Saved ${savedName}! Ready for next customer.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    const data = validateAndBuildData();
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data, editing?.id);
      printThermalBill(data);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSaveAndClose}>
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">{editing ? 'EDIT JOB' : 'CREATE JOB'}</span>
            <h2>{editing ? 'Edit job details' : 'Create a new job'}</h2>
            <p>Enter customer details, work type, and payment information.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {saveSuccessMsg && (
          <div
            style={{
              background: '#e6f5ee',
              border: '1px solid #a3dfc2',
              color: '#0d6648',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}
          >
            <Check size={16} /> {saveSuccessMsg}
          </div>
        )}

        <div className="form-grid">
          <label>
            Customer name
            <CustomerNameField
              value={customerName}
              onChange={handleNameSelect}
              customers={customers}
              placeholder="Search or enter customer name"
              autoFocus
              required
            />
          </label>
          <label>
            Mobile number
            <input
              name="mobile"
              type="tel"
              inputMode="numeric"
              value={mobile}
              maxLength={10}
              placeholder="10 digit mobile number"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setMobile(digits);
              }}
            />
          </label>
          <label className="span-two">
            Work type
            <WorkTypeField workTypes={workTypes} selected={selected} onSelect={setSelected} />
            <input type="hidden" name="workType" value={selected} />
          </label>
          <label>
            Work status
            <select name="workStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
              {workStatuses.map((ws) => (
                <option key={ws.id} value={ws.name}>
                  {ws.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            Total amount
            <input
              name="totalAmount"
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="₹ 0"
              required
            />
          </label>
          <label>
            Received amount
            <input
              name="received"
              type="number"
              min="0"
              max={totalValue || undefined}
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              placeholder="₹ 0"
              required
            />
          </label>
        </div>
        <div className="calculation-card">
          <div>
            <span>Expense</span>
            <strong>{formatCurrency(expense)}</strong>
          </div>
          <div>
            <span>Income</span>
            <strong className="success-text">{formatCurrency(totalValue - expense)}</strong>
          </div>
          <div>
            <span>Balance amount</span>
            <strong className="warning-text">{formatCurrency(Math.max(balance, 0))}</strong>
          </div>
          <div>
            <span>Payment status</span>
            <strong className={`status ${getStatus(receivedValue, totalValue).toLowerCase()}`}>
              {getStatus(receivedValue, totalValue)}
            </strong>
          </div>
        </div>
        <div className="lookup-note">
          <Check size={15} /> Balance = Total Amount - Received Amount. Calculated automatically.
        </div>
        <div className="modal-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>

          <button
            type="button"
            className="button secondary"
            style={{
              borderColor: '#b2c7bd',
              background: '#f1f7f4',
              color: '#135c3f',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleSaveAndPrint}
            disabled={isSubmitting || !customerName.trim() || !selected || totalValue <= 0}
            title="Save job and print thermal bill receipt"
          >
            <Printer size={15} /> Save & Print
          </button>

          {!editing && (
            <button
              type="button"
              className="button secondary"
              style={{
                borderColor: '#167c57',
                background: '#eaf6ef',
                color: '#126e4e',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={handleSaveAndNext}
              disabled={isSubmitting || !customerName.trim() || !selected || totalValue <= 0}
              title="Save this job and immediately start next job"
            >
              <ArrowRight size={15} /> Save & Next
            </button>
          )}

          <button
            className="button primary"
            type="submit"
            disabled={isSubmitting || !customerName.trim() || !selected || totalValue <= 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} /> {editing ? 'Update job' : 'Create job'}
          </button>
        </div>
      </form>
    </div>
  );
}
