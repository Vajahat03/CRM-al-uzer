import { useMemo, useState } from 'react';
import { X, FileDown, Calendar, ArrowRight, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { CustomerRecord, Spending, Kirkol, MONTH_NAMES, calculateMonthTotals, formatCurrency, formatDate } from './types';
import { generateMonthlyPDFReport } from './pdfReport';

type Props = {
  customers: CustomerRecord[];
  spendings: Spending[];
  kirkol: Kirkol[];
  onClose: () => void;
};

export function MonthlyReportModal({ customers, spendings, kirkol, onClose }: Props) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth); // 0-11 or -1 for All Months
  const [downloading, setDownloading] = useState(false);

  // Available years from records
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    [...customers, ...spendings, ...kirkol].forEach((item) => {
      if (item.created_at) {
        const y = new Date(item.created_at).getFullYear();
        if (y && !isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [customers, spendings, kirkol, currentYear]);

  const monthReport = useMemo(() => {
    return calculateMonthTotals(customers, spendings, kirkol, selectedYear, selectedMonth);
  }, [customers, spendings, kirkol, selectedYear, selectedMonth]);

  const periodLabel = selectedMonth === -1
    ? `Full Year ${selectedYear}`
    : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      generateMonthlyPDFReport(
        monthReport.filteredCustomers,
        monthReport.filteredSpendings,
        monthReport.filteredKirkol,
        monthReport,
        {
          year: selectedYear,
          month: selectedMonth,
          periodLabel,
        }
      );
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal report-modal" style={{ width: 'min(780px, 95vw)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <span className="eyebrow accent">PDF REPORT GENERATOR</span>
            <h2>Monthly Performance & Customer Report</h2>
            <p>Generate and download an official PDF report with verified financial metrics and customer records.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Period Selectors */}
        <div className="report-filter-bar" style={{ display: 'flex', gap: '12px', background: '#f5f8f5', padding: '14px', borderRadius: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#18382b' }}>
            <Calendar size={16} className="text-green" /> Select Period:
          </div>

          <select
            className="filter-select"
            style={{ fontWeight: 600, minWidth: '140px' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option value={-1}>All Months ({selectedYear})</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            style={{ fontWeight: 600, minWidth: '100px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#68766e', fontWeight: 600 }}>
            {monthReport.jobsCount} jobs • {monthReport.spendingsCount} spendings
          </span>
        </div>

        {/* Verified Financial Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: '#fff', border: '1px solid #e4e9e4', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '10px', color: '#869088', display: 'block' }}>Total Jobs</span>
            <strong style={{ fontSize: '16px', color: '#183228', display: 'block', marginTop: '3px' }}>{monthReport.jobsCount}</strong>
            <small style={{ fontSize: '10px', color: '#68766e' }}>{formatCurrency(monthReport.totalAmount)} total</small>
          </div>

          <div style={{ background: '#e7f5ed', border: '1px solid #c2e5d3', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '10px', color: '#177351', display: 'block' }}>Collected</span>
            <strong style={{ fontSize: '16px', color: '#167c57', display: 'block', marginTop: '3px' }}>{formatCurrency(monthReport.collectedAmount)}</strong>
            <small style={{ fontSize: '10px', color: '#26865d' }}>Paid by customers</small>
          </div>

          <div style={{ background: '#fff0ea', border: '1px solid #ffdcd1', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '10px', color: '#b95135', display: 'block' }}>Pending</span>
            <strong style={{ fontSize: '16px', color: '#c46143', display: 'block', marginTop: '3px' }}>{formatCurrency(monthReport.pendingAmount)}</strong>
            <small style={{ fontSize: '10px', color: '#b95135' }}>Uncollected balance</small>
          </div>

          <div style={{ background: '#eaf6ef', border: '1px solid #cce8d7', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '10px', color: '#1b6b4d', display: 'block' }}>Total Income</span>
            <strong style={{ fontSize: '16px', color: '#167c57', display: 'block', marginTop: '3px' }}>{formatCurrency(monthReport.totalIncome)}</strong>
            <small style={{ fontSize: '10px', color: '#1b6b4d' }}>Job Profit + Kirkol</small>
          </div>

          <div style={{ background: '#fff3dd', border: '1px solid #fedfa6', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '10px', color: '#976118', display: 'block' }}>Total Spending</span>
            <strong style={{ fontSize: '16px', color: '#b27a29', display: 'block', marginTop: '3px' }}>{formatCurrency(monthReport.totalSpending)}</strong>
            <small style={{ fontSize: '10px', color: '#976118' }}>Business expenses</small>
          </div>
        </div>

        {/* Highlighted Net Remaining Amount Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #18382b 0%, #167c57 100%)',
          borderRadius: '10px',
          padding: '16px 20px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px'
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#d8f2e3', fontWeight: 700 }}>
              Calculated Remaining Amount (Income - Spending)
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginTop: '4px' }}>
              {formatCurrency(monthReport.remainingAmount)}
            </div>
            <div style={{ fontSize: '10px', color: '#c4ebd5', marginTop: '2px' }}>
              Formula: Total Income ({formatCurrency(monthReport.totalIncome)}) − Total Spending ({formatCurrency(monthReport.totalSpending)})
            </div>
          </div>
          <button
            className="button"
            style={{ background: '#fff', color: '#167c57', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            <FileDown size={17} /> {downloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>

        {/* Customer List Preview Table */}
        <div style={{ border: '1px solid #e4e9e4', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
          <div style={{ padding: '10px 14px', background: '#fafcfa', borderBottom: '1px solid #e4e9e4', fontSize: '11px', fontWeight: 700, color: '#3d4d42', display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer Jobs in {periodLabel}</span>
            <span>{monthReport.filteredCustomers.length} Records</span>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f8f5', textAlign: 'left', color: '#7c8780', fontSize: '9px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px' }}>Customer</th>
                  <th style={{ padding: '8px 12px' }}>Work Type</th>
                  <th style={{ padding: '8px 12px' }}>Total</th>
                  <th style={{ padding: '8px 12px' }}>Paid</th>
                  <th style={{ padding: '8px 12px' }}>Balance</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthReport.filteredCustomers.slice(0, 10).map((row) => {
                  const bal = (Number(row.total_amount) || 0) - (Number(row.paid) || 0);
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f0f2f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.customer_name}</td>
                      <td style={{ padding: '8px 12px', color: '#556' }}>{row.work_type}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{formatCurrency(row.total_amount)}</td>
                      <td style={{ padding: '8px 12px', color: '#167c57' }}>{formatCurrency(row.paid)}</td>
                      <td style={{ padding: '8px 12px', color: bal > 0 ? '#c46143' : '#167c57', fontWeight: 600 }}>{formatCurrency(bal)}</td>
                      <td style={{ padding: '8px 12px' }}><span className="work-pill">{row.work_status}</span></td>
                    </tr>
                  );
                })}
                {monthReport.filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9aa49e' }}>
                      No customer jobs recorded for {periodLabel}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {monthReport.filteredCustomers.length > 10 && (
            <div style={{ padding: '8px 12px', background: '#fafcfa', fontSize: '10px', color: '#7c8780', textAlign: 'center' }}>
              Showing top 10 of {monthReport.filteredCustomers.length} jobs. Full list included in downloaded PDF.
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#869088' }}>PDF includes Customer Details, Work Types, Spendings & Kirkol</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="button secondary" onClick={onClose}>Close</button>
            <button type="button" className="button primary" onClick={handleDownloadPDF} disabled={downloading}>
              <FileDown size={16} /> {downloading ? 'Generating...' : 'Download PDF Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
