export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
}

export interface CRMToolDefinition {
  name: string;
  category: 'crm' | 'finance' | 'communication' | 'reconciliation' | 'general';
  description: string;
  parameters: Record<string, ToolParameterSchema>;
  isWriteAction?: boolean;
  requiresConfirmation?: boolean;
}

export const CRM_TOOL_DEFINITIONS: CRMToolDefinition[] = [
  // 1. CRM & Customer Operations Tools
  {
    name: 'getCustomer',
    category: 'crm',
    description: 'Retrieve detailed customer profile, contact information, work orders, and payment history by customer name or ID.',
    parameters: {
      customerName: { type: 'string', description: 'Name of customer to look up (e.g. "Vajahat", "Rahul", "Nasir")' },
    },
  },
  {
    name: 'searchCustomers',
    category: 'crm',
    description: 'Search customers across names, mobile numbers, work types, or work statuses.',
    parameters: {
      query: { type: 'string', description: 'Search term or keyword' },
    },
  },
  {
    name: 'getCustomerBalance',
    category: 'crm',
    description: 'Get exact outstanding unpaid balance and billing details for a specific customer.',
    parameters: {
      customerName: { type: 'string', description: 'Name of the customer' },
    },
  },
  {
    name: 'getDebtors',
    category: 'crm',
    description: 'Retrieve all customers with outstanding/unpaid balances, sorted by balance descending.',
    parameters: {
      minBalance: { type: 'number', description: 'Optional minimum balance threshold in ₹ (e.g. 1000)' },
    },
  },
  {
    name: 'getOverdueCustomers',
    category: 'crm',
    description: 'Find customers whose payments have been pending for more than a specified number of days (e.g. 5 days overdue).',
    parameters: {
      minimumDays: { type: 'number', description: 'Minimum number of days the payment has been overdue (default: 5)' },
      minBalance: { type: 'number', description: 'Optional minimum balance in ₹' },
    },
  },
  {
    name: 'getPendingJobs',
    category: 'crm',
    description: 'Get active in-progress customer jobs that are not yet marked as Completed or Delivered.',
    parameters: {
      status: { type: 'string', description: 'Optional status filter (e.g. "Document Required", "In Progress")' },
    },
  },
  {
    name: 'getWorkTypePerformance',
    category: 'crm',
    description: 'Audit service performance, job count, total revenue, and profitability for a specific service or all work types.',
    parameters: {
      workTypeName: { type: 'string', description: 'Optional name of service (e.g. "Passport", "PAN Card", "Election")' },
    },
  },

  // 2. Business Intelligence & Finance Tools
  {
    name: 'getDailySummary',
    category: 'finance',
    description: 'Calculate total revenue, customer jobs, Kirkol counter sales, spendings, and net profit for a specific date or today.',
    parameters: {
      date: { type: 'string', description: 'ISO date YYYY-MM-DD or "today" / "yesterday"' },
    },
  },
  {
    name: 'getMonthlySummary',
    category: 'finance',
    description: 'Calculate monthly gross billing, cash collected, pending uncollected amount, business spendings, and net profit margin.',
    parameters: {
      month: { type: 'number', description: 'Month index 0-11 (0=Jan, 8=Sept, 9=Oct)' },
      year: { type: 'number', description: 'Year (e.g. 2026)' },
    },
  },
  {
    name: 'getProfit',
    category: 'finance',
    description: 'Calculate net profit margin formula: (Customer Income + Kirkol Revenue) - Direct Spendings.',
    parameters: {
      period: { type: 'string', description: '"this_month", "last_month", "all_time", or "today"' },
    },
  },
  {
    name: 'getSpending',
    category: 'finance',
    description: 'Retrieve direct business expenses and category-wise spending breakdown.',
    parameters: {
      category: { type: 'string', description: 'Optional spending category (e.g. "Office supplies", "Utilities")' },
    },
  },
  {
    name: 'comparePeriods',
    category: 'finance',
    description: 'Compare financial performance (revenue, expenses, profit) between current month and previous month.',
    parameters: {
      currentMonth: { type: 'number', description: 'Current month index (0-11)' },
      comparisonMonth: { type: 'number', description: 'Comparison month index (0-11)' },
    },
  },

  // 3. Communication Tools
  {
    name: 'draftCustomerMessage',
    category: 'communication',
    description: 'Draft a personalized WhatsApp or SMS reminder message for a customer with grounded balance and service details.',
    parameters: {
      customerName: { type: 'string', description: 'Customer full or first name' },
      messageType: { type: 'string', description: '"payment_reminder", "work_completed", or "document_required"' },
    },
  },
  {
    name: 'queueOverdueReminders',
    category: 'communication',
    description: 'Prepare and queue reminder messages for all customers overdue by specified days.',
    parameters: {
      minimumDays: { type: 'number', description: 'Overdue days threshold (default: 5)' },
    },
    isWriteAction: true,
    requiresConfirmation: true,
  },

  // 4. Data Reconciliation & Workspace Tools
  {
    name: 'reconcileSupabaseWithGoogleSheets',
    category: 'reconciliation',
    description: 'Audit and compare record counts and synchronization health between Supabase relational database and Google Sheets.',
    parameters: {},
  },
  {
    name: 'createMonthSheet',
    category: 'reconciliation',
    description: 'Generate or sync a formatted 3-section single-page monthly sheet in Google Sheets.',
    parameters: {
      month: { type: 'number', description: 'Month index 0-11' },
      year: { type: 'number', description: 'Year (e.g. 2026)' },
    },
  },
  {
    name: 'createYearWorkspace',
    category: 'reconciliation',
    description: 'Create a brand-new Google Spreadsheet Workspace for a new year with all 12 pre-configured monthly tabs.',
    parameters: {
      year: { type: 'number', description: 'Target year (e.g. 2027)' },
    },
  },
];
