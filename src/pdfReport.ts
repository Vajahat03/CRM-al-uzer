import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerRecord, Spending, Kirkol, TotalsSummary, formatCurrency, formatDate, MONTH_NAMES } from './types';

export type ReportOptions = {
  year?: number;
  month?: number; // 0-11 or -1 for all
  periodLabel?: string;
};

export function generateMonthlyPDFReport(
  customers: CustomerRecord[],
  spendings: Spending[],
  kirkol: Kirkol[],
  totals: TotalsSummary,
  options?: ReportOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const periodLabel = options?.periodLabel ?? (
    options?.month !== undefined && options.month >= 0 && options?.year
      ? `${MONTH_NAMES[options.month]} ${options.year}`
      : 'All Time'
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Header Banner
  doc.setFillColor(24, 56, 43); // #18382b
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(216, 242, 227);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('AL UZER COMMON SERVICES', 14, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTHLY BUSINESS & CUSTOMER REPORT', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 225, 210);
  doc.text(`Period: ${periodLabel}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 24);

  let currentY = 35;

  // Executive Summary Section
  doc.setTextColor(24, 48, 37);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial & Job Summary', 14, currentY);
  currentY += 4;

  const summaryHeaders = [
    ['Metric', 'Amount / Count', 'Metric', 'Amount / Count']
  ];

  const summaryBody = [
    ['Total Customer Jobs', `${totals.jobsCount}`, 'Sum of Total Amount', formatCurrency(totals.totalAmount)],
    ['Collected Amount', formatCurrency(totals.collectedAmount), 'Pending Amount', formatCurrency(totals.pendingAmount)],
    ['Total Income (Profit + Kirkol)', formatCurrency(totals.totalIncome), 'Total Spending', formatCurrency(totals.totalSpending)],
    [
      'Remaining Amount (Income - Spending)',
      formatCurrency(totals.remainingAmount),
      'Pending Work Jobs',
      `${totals.pendingWorkCount}`
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: summaryHeaders,
    body: summaryBody,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 124, 87], // #167c57
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [35, 45, 40],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: [245, 248, 245] },
      1: { fontStyle: 'bold', cellWidth: 38, textColor: [20, 100, 70] },
      2: { fontStyle: 'bold', cellWidth: 55, fillColor: [245, 248, 245] },
      3: { fontStyle: 'bold', cellWidth: 38, textColor: [20, 100, 70] },
    },
    styles: {
      cellPadding: 3,
    },
    didDrawCell: (data) => {
      // Highlight remaining amount row
      if (data.row.index === 3 && (data.column.index === 0 || data.column.index === 1)) {
        doc.setFillColor(216, 242, 227);
      }
    }
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Highlight Box for Remaining Amount
  doc.setFillColor(230, 245, 238);
  doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, 'F');
  doc.setDrawColor(185, 222, 202);
  doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 110, 78);
  doc.text(
    `NET REMAINING AMOUNT (Total Income - Total Spending): ${formatCurrency(totals.remainingAmount)}`,
    pageWidth / 2,
    currentY + 7.5,
    { align: 'center' }
  );

  currentY += 18;

  // Section 1: Customer Work & Transactions Table
  doc.setTextColor(24, 48, 37);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Customer Records & Services (${customers.length})`, 14, currentY);
  currentY += 4;

  const customerRows = customers.map((c, i) => {
    const balance = Math.max((Number(c.total_amount) || 0) - (Number(c.paid) || 0), 0);
    return [
      `${i + 1}`,
      formatDate(c.created_at),
      c.customer_name,
      c.mobile || '-',
      c.work_type,
      formatCurrency(c.total_amount),
      formatCurrency(c.paid),
      formatCurrency(balance),
      c.work_status,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Customer Name', 'Mobile', 'Work Type', 'Total', 'Paid', 'Balance', 'Status']],
    body: customerRows.length > 0 ? customerRows : [['-', '-', 'No customer records for this period', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [22, 124, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [45, 55, 50],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 19 },
      2: { fontStyle: 'bold', cellWidth: 36 },
      3: { cellWidth: 22 },
      4: { cellWidth: 32 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 16 },
      7: { halign: 'right', fontStyle: 'bold', textColor: [180, 80, 40], cellWidth: 16 },
      8: { cellWidth: 20 },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Check if we need a new page for spendings and kirkol
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // Section 2: Business Spendings
  doc.setTextColor(24, 48, 37);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Business Spendings (${spendings.length})`, 14, currentY);
  currentY += 4;

  const spendingRows = spendings.map((s, i) => [
    `${i + 1}`,
    formatDate(s.created_at),
    s.expense_name,
    s.category,
    formatCurrency(s.amount),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Expense Name', 'Category', 'Amount']],
    body: spendingRows.length > 0 ? spendingRows : [['-', '-', 'No spendings recorded for this period', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [199, 131, 41], // #c78329
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [45, 55, 50],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { fontStyle: 'bold', cellWidth: 65 },
      3: { cellWidth: 45 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (kirkol.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(24, 48, 37);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Kirkol (Minor Jobs) (${kirkol.length})`, 14, currentY);
    currentY += 4;

    const kirkolRows = kirkol.map((k, i) => [
      `${i + 1}`,
      formatDate(k.created_at),
      k.work,
      formatCurrency(k.price),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Date', 'Work Description', 'Price']],
      body: kirkolRows,
      theme: 'striped',
      headStyles: {
        fillColor: [232, 117, 58], // #e8753a
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [45, 55, 50],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { fontStyle: 'bold', cellWidth: 100 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
      },
    });
  }

  // Add Page Numbers & Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 150, 145);
    doc.text(
      `Al Uzer Common Services • Report Period: ${periodLabel} • Page ${p} of ${totalPages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Confidential & Proprietary`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
  }

  // Save the PDF
  const sanitizedPeriod = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Al_Uzer_Report_${sanitizedPeriod}.pdf`);
}
