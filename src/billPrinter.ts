import { CustomerRecord, formatCurrency, formatDate } from './types';

export interface BillItem {
  service: string;
  amount: number;
}

export interface BillPrintOptions {
  billNo?: string;
  customerName?: string;
  mobile?: string;
  services?: BillItem[];
  totalAmount?: number;
  paymentMode?: 'CASH' | 'UPI' | 'OTHER' | string;
  date?: string;
}

export function generateBillNumber(id?: string): string {
  if (id && id.length >= 4) {
    const cleanId = id.replace(/\D/g, '');
    if (cleanId.length >= 4) {
      return `AU-${cleanId.slice(-5)}`;
    }
  }
  return `AU-${Date.now().toString().slice(-5)}`;
}

export function printThermalBill(
  customer: Partial<CustomerRecord>,
  options?: Partial<BillPrintOptions>
): void {
  const billNo = options?.billNo || generateBillNumber(customer.id);
  const dateStr = options?.date ? formatDate(options.date) : customer.created_at ? formatDate(customer.created_at) : formatDate(new Date().toISOString());
  const customerName = (options?.customerName || customer.customer_name || 'Walk-in Customer').toUpperCase();
  const mobile = options?.mobile || customer.mobile || '-';
  
  const services: BillItem[] = options?.services && options.services.length > 0
    ? options.services
    : [
        {
          service: customer.work_type || 'General Service',
          amount: Number(customer.total_amount || 0),
        },
      ];

  const totalAmount = options?.totalAmount !== undefined
    ? options.totalAmount
    : Number(customer.total_amount || 0);

  const paymentMode = (options?.paymentMode || customer.payment_mode || (customer.payment_status === 'PAID' ? 'Cash' : customer.payment_status === 'PARTIAL' ? 'Partial / Cash' : 'Pending')).toUpperCase();

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const itemsHtml = services
    .map(
      (item, idx) => `
      <tr>
        <td style="width: 26px; vertical-align: top;">${idx + 1}.</td>
        <td style="vertical-align: top; word-break: break-word;">${item.service}</td>
        <td style="text-align: right; vertical-align: top; white-space: nowrap; font-weight: 600;">₹${Number(item.amount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill - ${billNo}</title>
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      width: 72mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 6mm 3mm 10mm 3mm;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.35;
      font-weight: 600;
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: 700; }
    .heading-main {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .heading-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
    }
    .address {
      font-size: 9.5px;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .divider-double {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 900;
      letter-spacing: 1px;
      text-align: center;
      margin: 4px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-size: 10.5px;
    }
    .info-row {
      margin: 3px 0;
      font-size: 10.5px;
      display: flex;
    }
    .info-label {
      width: 65px;
      flex-shrink: 0;
    }
    .info-value {
      flex: 1;
      font-weight: 700;
      word-break: break-word;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 5px 0;
      font-size: 10.5px;
    }
    table.items-table th {
      border-bottom: 1px dashed #000;
      padding-bottom: 3px;
      text-align: left;
      font-weight: 700;
    }
    table.items-table td {
      padding: 3px 0;
    }
    .total-container {
      margin: 6px 0;
      text-align: right;
      font-size: 13px;
      font-weight: 900;
    }
    .services-list {
      font-size: 8.5px;
      line-height: 1.35;
      text-align: center;
      margin: 4px 0;
    }
    .footer-msg {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      margin: 6px 0;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="text-center heading-main">AL UZER COMMON SERVICES</div>
  <div class="text-center heading-sub">GOVERNMENT & ONLINE SERVICES</div>
  
  <div class="text-center address">
    Shop No. 2, Near Wadala Police Station,<br/>
    Wadala Gaon, Nashik - 422006<br/>
    Mob: 8421131392<br/>
    Email: aluzer78692@gmail.com
  </div>

  <div class="divider"></div>

  <div class="meta-row">
    <span>Bill No.: <strong>${billNo}</strong></span>
    <span>Date: <strong>${dateStr}</strong></span>
  </div>

  <div class="divider"></div>
  <div class="section-title">CUSTOMER DETAILS</div>
  <div class="divider"></div>

  <div class="info-row">
    <span class="info-label">Name   :</span>
    <span class="info-value">${customerName}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Mobile :</span>
    <span class="info-value">${mobile}</span>
  </div>

  <div class="divider"></div>
  <div class="section-title">SERVICE DETAILS</div>
  <div class="divider"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 26px;">Sr.</th>
        <th>Service</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="total-container">
    TOTAL: ₹${Number(totalAmount).toLocaleString('en-IN')}
  </div>

  <div class="divider"></div>

  <div class="info-row" style="margin: 4px 0;">
    <span style="width: 95px;">Payment Mode:</span>
    <span class="bold">${paymentMode}</span>
  </div>

  <div class="divider"></div>
  <div class="section-title">SERVICES AVAILABLE</div>
  <div class="divider"></div>

  <div class="services-list">
    CSC • AAPLE SARKAR • PASSPORT • AADHAAR.<br/>
    PAN • RTO • VOTER ID • PASSPORT.<br/>
    ONLINE FORM • DOCUMENT SERVICES & MORE
  </div>

  <div class="divider"></div>

  <div class="footer-msg">
    THANK YOU FOR VISITING!<br/>
    PLEASE VISIT AGAIN<br/><br/>
    AL UZER COMMON SERVICES
  </div>

  <div class="divider"></div>
</body>
</html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print trigger error:', e);
    } finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }
  }, 250);
}
