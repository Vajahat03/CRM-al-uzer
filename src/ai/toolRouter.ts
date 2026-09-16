import { AIDataContext } from '../aiAgentEngine';
import { AIToolResult, AIAgentAction } from './intentTypes';
import { CustomerRecord, formatCurrency, formatDate, MONTH_NAMES, calculateMonthTotals } from '../types';
import { getSheetsConfig } from '../googleSheetsSync';

export class CRMToolRouter {
  /**
   * Executes a requested tool by name with provided arguments against live CRM data.
   */
  /**
   * Semantically resolves natural language queries (English, Hindi, Hinglish, typos)
   * and executes the corresponding CRM tool against the live data context.
   */
  public processQuery(query: string, ctx: AIDataContext, history: any[] = []): AIToolResult {
    const q = query.toLowerCase().trim();

    // 1. Resolve customer name references from query or previous context ("uska", "his")
    let matchedCustomerName = '';
    
    // Check if query contains any known customer name from active CRM records
    for (const c of ctx.customers) {
      if (!c.customer_name) continue;
      const firstName = c.customer_name.split(/\s+/)[0].toLowerCase();
      if (firstName.length >= 3 && q.includes(firstName)) {
        matchedCustomerName = c.customer_name;
        break;
      }
    }

    // Resolve context pronoun
    if (!matchedCustomerName && (q.includes('uska') || q.includes('his') || q.includes('her') || q.includes('unka'))) {
      for (const h of [...history].reverse()) {
        const text = (h.content || '').toLowerCase();
        for (const c of ctx.customers) {
          const firstName = c.customer_name.split(/\s+/)[0].toLowerCase();
          if (firstName.length >= 3 && text.includes(firstName)) {
            matchedCustomerName = c.customer_name;
            break;
          }
        }
        if (matchedCustomerName) break;
      }
    }

    // Direct customer work/balance inquiry
    if (matchedCustomerName) {
      return this.handleCustomerLookup(matchedCustomerName, ctx);
    }

    // 2. Overdue inquiries (e.g. "5 din se jinka paisa atka hai", "overdue customers")
    const daysMatch = q.match(/(\d+)\s*(?:din|days|day)/);
    if (daysMatch || q.includes('overdue') || q.includes('unpaid bills') || q.includes('hafte') || q.includes('week')) {
      const days = daysMatch ? parseInt(daysMatch[1], 10) : (q.includes('hafte') || q.includes('week') ? 7 : 5);
      return this.handleGetOverdueCustomers(days, 0, ctx);
    }

    // 3. Debtors & Unpaid accounts ("who owes me money", "kiska paisa baaki hai")
    if (
      q.includes('debtor') ||
      q.includes('unpaid') ||
      q.includes('who owes') ||
      q.includes('paisa baaki') ||
      q.includes('paisa pending') ||
      q.includes('kis kis ka') ||
      q.includes('kaun fasaya') ||
      q.includes('kiska payment') ||
      q.includes('pendng') ||
      q.includes('baaki') ||
      q.includes('pending payment')
    ) {
      return this.handleGetDebtors(0, ctx);
    }

    // 4. Daily summary & today's collection ("aaj kitni kamai hui", "today revenue")
    if (q.includes('aaj') || q.includes('today') || q.includes('kamai') || q.includes('collection') || q.includes('kmai') || q.includes('earn')) {
      return this.handleDailySummary('today', ctx);
    }

    if (q.includes('yesterday') || q.includes('kal')) {
      return this.handleDailySummary('yesterday', ctx);
    }

    // 5. Month comparison ("compare this month with last month", "pichle mahine se")
    if (q.includes('compare') || q.includes('pichle mahine') || q.includes('vs last month')) {
      return this.handleComparePeriods(undefined, undefined, ctx);
    }

    // 6. Profit & Monthly totals ("profit", "munafa", "this month", "is mahine")
    if (q.includes('profit') || q.includes('munafa') || q.includes('this month') || q.includes('is mahine')) {
      return this.handleProfitSummary('this_month', ctx);
    }

    // 7. Spendings & Expenses ("kharcha", "spending", "expenses")
    if (q.includes('spending') || q.includes('kharcha') || q.includes('expense') || q.includes('outflow')) {
      return this.handleSpendingSummary(undefined, ctx);
    }

    // 8. Pending Jobs ("pending jobs", "incomplete work", "pending kaam")
    if (q.includes('job') || q.includes('kaam') || q.includes('pending work') || q.includes('cyber cafe')) {
      return this.handleGetPendingJobs(undefined, ctx);
    }

    // 9. Reconciliation & Google Sheets ("sheet", "reconcile", "difference", "audit")
    if (q.includes('sheet') || q.includes('reconcil') || q.includes('difference') || q.includes('audit') || q.includes('mismatch')) {
      return this.handleReconciliation(ctx);
    }

    // 10. General / Overview Fallback
    const debtors = ctx.customers.filter((c) => Math.max(0, (Number(c.total_amount) || 0) - (Number(c.paid) || 0)) > 0);
    const totalPending = ctx.totals?.pendingAmount || 0;

    return {
      success: true,
      toolName: 'overview',
      data: { customersCount: ctx.customers.length, totalPending },
      summaryText:
        `### 🤖 Al Uzer AI Intelligence Hub\n\n` +
        `Here is your live business overview:\n\n` +
        `• 👥 **Active Customer Orders:** **${ctx.customers.length} records**\n` +
        `• 💰 **Total Income Generated:** **${formatCurrency(ctx.totals?.totalIncome || 0)}**\n` +
        `• ⚠️ **Unpaid Client Receivables:** **${formatCurrency(totalPending)}** (${debtors.length} clients)\n` +
        `• 💸 **Total Spendings:** **${formatCurrency(ctx.totals?.totalSpending || 0)}**\n` +
        `• 🏆 **Net Cash In Hand:** **${formatCurrency(ctx.totals?.remainingAmount || 0)}**\n\n` +
        `**Try asking:**\n` +
        `• *"Show Vajahat's work"* or *"Vajahat pending payment"*\n` +
        `• *"Who owes me money?"*\n` +
        `• *"Aaj kitni kamai hui?"*\n` +
        `• *"5 din se jinka paisa atka hai unko dikhao"*`,
      suggestedActions: [
        {
          id: 'act-view-debtors',
          label: '⚠️ View All Unpaid Debtors',
          actionType: 'filter_customers',
          payload: { search: 'PENDING' },
          variant: 'primary',
        },
        {
          id: 'act-view-spending',
          label: '💸 Analyze Spendings',
          actionType: 'navigate',
          payload: { page: 'spending' },
          variant: 'secondary',
        },
      ],
    };
  }

  // --- CRM Handlers ---

  private handleCustomerLookup(customerName: string, ctx: AIDataContext): AIToolResult {
    if (!customerName) {
      return {
        success: false,
        toolName: 'getCustomer',
        summaryText: 'Please specify the customer name to look up.',
      };
    }

    const term = customerName.toLowerCase().trim();
    const matches = ctx.customers.filter((c) => {
      if (!c.customer_name) return false;
      const cName = c.customer_name.toLowerCase();
      if (cName.includes(term) || term.includes(cName)) return true;
      const parts = cName.split(/\s+/).filter((p) => p.length >= 3);
      return parts.some((p) => term.includes(p) || p.includes(term));
    });

    if (matches.length === 0) {
      return {
        success: false,
        toolName: 'getCustomer',
        summaryText: `No customer records found matching "${customerName}" in Supabase.`,
      };
    }

    const primary = matches[0];
    const totalBilled = matches.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
    const totalPaid = matches.reduce((sum, r) => sum + (Number(r.paid) || 0), 0);
    const totalPending = Math.max(0, totalBilled - totalPaid);

    const cleanMobile = primary.mobile ? primary.mobile.replace(/[^0-9]/g, '') : '';
    const phoneFormatted = cleanMobile ? `+91 ${cleanMobile}` : 'No Mobile Added';

    const historyLines = matches.map((r, i) => {
      const bal = Math.max(0, (Number(r.total_amount) || 0) - (Number(r.paid) || 0));
      const dateStr = r.created_at ? r.created_at.slice(0, 10) : 'Recent';
      return `${i + 1}. **${r.work_type}** (${dateStr}) — Billed: **${formatCurrency(r.total_amount)}** | Paid: ${formatCurrency(r.paid)} | Pending: **${formatCurrency(bal)}** [Status: **${r.work_status}**]`;
    }).join('\n');

    let draftMsg = '';
    if (totalPending > 0) {
      draftMsg = `Dear ${primary.customer_name}, your pending balance at Al Uzer Common Services is ${formatCurrency(totalPending)} for ${matches.map((r) => r.work_type).join(', ')}. Please clear your payment at your earliest convenience. Thank you.`;
    } else {
      draftMsg = `Dear ${primary.customer_name}, your work (${matches.map((r) => r.work_type).join(', ')}) at Al Uzer Common Services is completed. Thank you!`;
    }

    const phoneWithCode = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const whatsappUrl = cleanMobile ? `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(draftMsg)}` : '';

    const actions: AIAgentAction[] = [];
    if (cleanMobile) {
      actions.push({
        id: `act-wa-${primary.id}`,
        label: totalPending > 0 ? `💬 Send WhatsApp Payment Reminder (${formatCurrency(totalPending)})` : `💬 Send WhatsApp Completion Note`,
        actionType: 'whatsapp_message',
        payload: {
          mobile: cleanMobile,
          url: whatsappUrl,
          customerName: primary.customer_name,
          balance: totalPending,
          message: draftMsg,
        },
        variant: 'primary',
      });
    }

    actions.push({
      id: `act-filter-${primary.id}`,
      label: `📂 Filter ${primary.customer_name} in Table`,
      actionType: 'filter_customers',
      payload: { search: primary.customer_name },
      variant: 'secondary',
    });

    const summary =
      `### 👤 Customer Profile: ${primary.customer_name}\n\n` +
      `• 📱 **Mobile Number:** \`${phoneFormatted}\`\n` +
      `• 📁 **Total Work Orders:** **${matches.length} jobs**\n` +
      `• 💵 **Total Amount Billed:** **${formatCurrency(totalBilled)}**\n` +
      `• ✅ **Total Amount Paid:** **${formatCurrency(totalPaid)}**\n` +
      `• ⚠️ **Outstanding Pending Balance:** **${formatCurrency(totalPending)}**\n` +
      `• 🔄 **Current Work Status:** **${primary.work_status}** (${primary.work_type})\n\n` +
      `**Service & Transaction Breakdown:**\n${historyLines}`;

    return {
      success: true,
      toolName: 'getCustomer',
      data: { customer: primary, records: matches, totalBilled, totalPaid, totalPending },
      summaryText: summary,
      suggestedActions: actions,
    };
  }

  private handleSearchCustomers(query: string, ctx: AIDataContext): AIToolResult {
    const term = query.toLowerCase().trim();
    const matches = ctx.customers.filter((c) => {
      const text = `${c.customer_name} ${c.mobile} ${c.work_type} ${c.work_status}`.toLowerCase();
      return text.includes(term);
    });

    if (matches.length === 0) {
      return {
        success: true,
        toolName: 'searchCustomers',
        data: [],
        summaryText: `No customers found matching search query "${query}".`,
      };
    }

    const list = matches.slice(0, 6).map((c, i) => {
      const bal = Math.max(0, (Number(c.total_amount) || 0) - (Number(c.paid) || 0));
      return `${i + 1}. **${c.customer_name}** (${c.mobile || 'No Mobile'}) — ${c.work_type} | Total: ${formatCurrency(c.total_amount)} | Pending: **${formatCurrency(bal)}** [${c.work_status}]`;
    }).join('\n');

    return {
      success: true,
      toolName: 'searchCustomers',
      data: matches,
      summaryText: `### 🔍 Search Results for: "${query}"\n\nFound **${matches.length} customer records**:\n\n${list}`,
      suggestedActions: [
        {
          id: 'act-filter-search',
          label: `Filter "${query}" in CRM Table`,
          actionType: 'filter_customers',
          payload: { search: query },
          variant: 'primary',
        },
      ],
    };
  }

  private handleGetDebtors(minBalance: number, ctx: AIDataContext): AIToolResult {
    const debtors = ctx.customers
      .filter((c) => {
        const bal = Math.max(0, (Number(c.total_amount) || 0) - (Number(c.paid) || 0));
        return bal > minBalance;
      })
      .sort((a, b) => ((Number(b.total_amount) || 0) - (Number(b.paid) || 0)) - ((Number(a.total_amount) || 0) - (Number(a.paid) || 0)));

    const totalDebtorAmount = debtors.reduce(
      (sum, c) => sum + Math.max(0, (Number(c.total_amount) || 0) - (Number(c.paid) || 0)),
      0
    );

    const list = debtors.slice(0, 6).map((d, i) => {
      const bal = Math.max(0, (Number(d.total_amount) || 0) - (Number(d.paid) || 0));
      return `${i + 1}. **${d.customer_name}** (${d.mobile ? `+91 ${d.mobile}` : 'No Mobile'}) — **${formatCurrency(bal)}** pending for *${d.work_type}* [${d.work_status}]`;
    }).join('\n');

    const actions: AIAgentAction[] = [];
    if (debtors[0] && debtors[0].mobile) {
      const topBal = Math.max(0, (Number(debtors[0].total_amount) || 0) - (Number(debtors[0].paid) || 0));
      actions.push({
        id: `act-wa-${debtors[0].id}`,
        label: `💬 WhatsApp ${debtors[0].customer_name} (${formatCurrency(topBal)})`,
        actionType: 'whatsapp_message',
        payload: {
          mobile: debtors[0].mobile,
          customerName: debtors[0].customer_name,
          balance: topBal,
          workType: debtors[0].work_type,
        },
        variant: 'primary',
      });
    }

    actions.push({
      id: 'act-filter-debtors',
      label: 'Filter Unpaid Debtors in CRM Table',
      actionType: 'filter_customers',
      payload: { search: 'PENDING' },
      variant: 'secondary',
    });

    const summary =
      `### ⚠️ Outstanding Balances & Debtors\n\n` +
      `• **Total Uncollected Receivables:** **${formatCurrency(totalDebtorAmount)}** across **${debtors.length} clients**\n` +
      `• **Average Pending Amount:** ${debtors.length > 0 ? formatCurrency(totalDebtorAmount / debtors.length) : '₹0'}\n\n` +
      `**Top Outstanding Accounts:**\n${list || '🎉 All customer accounts are fully paid!'}`;

    return {
      success: true,
      toolName: 'getDebtors',
      data: { debtors, totalDebtorAmount, count: debtors.length },
      summaryText: summary,
      suggestedActions: actions,
    };
  }

  private handleGetOverdueCustomers(minimumDays: number, minBalance: number, ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const overdueDebtors = ctx.customers.filter((c) => {
      const balance = Math.max((Number(c.total_amount) || 0) - (Number(c.paid) || 0), 0);
      if (balance <= minBalance) return false;
      // Prioritize explicit payment overdue fields: outstanding_since -> due_date -> created_at (documented fallback)
      const overdueField = (c as any).outstanding_since || (c as any).due_date || c.created_at;
      const overdueDate = overdueField ? new Date(overdueField) : now;
      const daysOverdue = Math.floor((now.getTime() - overdueDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue >= minimumDays;
    });

    const totalOverdueSum = overdueDebtors.reduce(
      (sum, c) => sum + Math.max((Number(c.total_amount) || 0) - (Number(c.paid) || 0), 0),
      0
    );

    const rows = overdueDebtors.slice(0, 6).map((d, i) => {
      const bal = (Number(d.total_amount) || 0) - (Number(d.paid) || 0);
      const overdueField = (d as any).outstanding_since || (d as any).due_date || d.created_at;
      const overdueDate = overdueField ? new Date(overdueField) : now;
      const daysOverdue = Math.floor((now.getTime() - overdueDate.getTime()) / (1000 * 60 * 60 * 24));
      return `${i + 1}. **${d.customer_name}** (${d.mobile ? `+91 ${d.mobile}` : 'No Mobile'}) — **${formatCurrency(bal)}** pending (${daysOverdue} days overdue | *${d.work_type}*)`;
    }).join('\n');

    const summary =
      `### 📱 Overdue Debtors (Pending $\\ge$ ${minimumDays} Days)\n\n` +
      `• **Eligible Debtors Found:** **${overdueDebtors.length} clients**\n` +
      `• **Total Uncollected Receivables:** **${formatCurrency(totalOverdueSum)}**\n\n` +
      `**Accounts Overdue by $\\ge$ ${minimumDays} Days:**\n${rows || `🎉 No accounts are pending past ${minimumDays} days.`}`;

    return {
      success: true,
      toolName: 'getOverdueCustomers',
      data: { overdueDebtors, totalOverdueSum, count: overdueDebtors.length, minimumDays },
      summaryText: summary,
      suggestedActions: [
        {
          id: 'act-queue-overdue-sms',
          label: `⚡ Auto-Queue ${overdueDebtors.length} Reminders`,
          actionType: 'queue_all_sms',
          payload: { thresholdDays: minimumDays, count: overdueDebtors.length },
          variant: 'primary',
          requiresConfirmation: true,
        },
        {
          id: 'act-filter-debtors',
          label: 'Filter in Customer Table',
          actionType: 'filter_customers',
          payload: { search: 'PENDING' },
          variant: 'secondary',
        },
      ],
    };
  }

  private handleGetPendingJobs(statusFilter: string | undefined, ctx: AIDataContext): AIToolResult {
    const pending = ctx.customers.filter((c) => {
      const isDone = ['Completed', 'Delivered', 'Cancelled', 'Rejected'].includes(c.work_status);
      if (statusFilter) return c.work_status.toLowerCase() === statusFilter.toLowerCase();
      return !isDone;
    });

    const statusCounts = new Map<string, number>();
    pending.forEach((c) => {
      statusCounts.set(c.work_status, (statusCounts.get(c.work_status) || 0) + 1);
    });

    const breakdown = Array.from(statusCounts.entries())
      .map(([st, cnt]) => `• **${st}**: ${cnt} jobs`)
      .join('\n');

    return {
      success: true,
      toolName: 'getPendingJobs',
      data: { pendingJobs: pending, count: pending.length, breakdown: statusCounts },
      summaryText:
        `### ⚙️ Operational Workload & Incomplete Jobs\n\n` +
        `• **Active Incomplete Jobs:** **${pending.length} records**\n` +
        `• **Total Registered Jobs:** ${ctx.customers.length}\n\n` +
        `**Workload Distribution:**\n${breakdown || 'All jobs are marked completed!'}`,
      suggestedActions: [
        {
          id: 'act-nav-cust',
          label: 'Open Customer Work Directory',
          actionType: 'navigate',
          payload: { page: 'customers' },
          variant: 'primary',
        },
      ],
    };
  }

  private handleWorkTypePerformance(workTypeName: string | undefined, ctx: AIDataContext): AIToolResult {
    if (workTypeName) {
      const term = workTypeName.toLowerCase().trim();
      const matchedWT = ctx.workTypes.find((wt) => wt.name.toLowerCase().includes(term));
      const records = ctx.customers.filter((c) => c.work_type && c.work_type.toLowerCase().includes(term));

      const totalBilled = records.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
      const totalProfit = records.reduce((sum, r) => sum + (Number(r.income) || 0), 0);
      const expense = matchedWT?.expense ?? 0;

      return {
        success: true,
        toolName: 'getWorkTypePerformance',
        data: { workType: matchedWT, records, totalBilled, totalProfit },
        summaryText:
          `### 🛠️ Service Performance: ${matchedWT?.name || workTypeName}\n\n` +
          `• 📋 **Base Production Expense:** **${formatCurrency(expense)}** per job\n` +
          `• 📁 **Total Orders Processed:** **${records.length} customers**\n` +
          `• 💰 **Total Revenue Generated:** **${formatCurrency(totalBilled)}**\n` +
          `• 🏆 **Net Profit Earned:** **${formatCurrency(totalProfit)}**`,
        suggestedActions: [
          {
            id: 'act-filter-wt',
            label: `Filter ${matchedWT?.name || workTypeName} in CRM`,
            actionType: 'filter_customers',
            payload: { search: matchedWT?.name || workTypeName },
            variant: 'primary',
          },
        ],
      };
    }

    // All work types performance
    const map = new Map<string, { count: number; totalRevenue: number; profit: number }>();
    ctx.customers.forEach((c) => {
      const wt = c.work_type || 'General Service';
      const cur = map.get(wt) || { count: 0, totalRevenue: 0, profit: 0 };
      cur.count += 1;
      cur.totalRevenue += Number(c.total_amount) || 0;
      cur.profit += Number(c.income) || 0;
      map.set(wt, cur);
    });

    const sorted = Array.from(map.entries()).sort((a, b) => b[1].profit - a[1].profit);
    const list = sorted.slice(0, 6).map(([name, data], i) =>
      `${i + 1}. **${name}** — **${formatCurrency(data.profit)}** profit (${data.count} orders | Billed: ${formatCurrency(data.totalRevenue)})`
    ).join('\n');

    return {
      success: true,
      toolName: 'getWorkTypePerformance',
      data: sorted,
      summaryText:
        `### 🏆 Top Performing Services & Work Types\n\n` +
        `• **Total Available Services:** ${ctx.workTypes.length}\n` +
        `• **Total Processed Orders:** ${ctx.customers.length}\n\n` +
        `**Most Profitable Services:**\n${list || 'No orders recorded yet.'}`,
      suggestedActions: [
        {
          id: 'act-nav-wt',
          label: 'Manage Work Types & Rates',
          actionType: 'navigate',
          payload: { page: 'work-types' },
          variant: 'primary',
        },
      ],
    };
  }

  // --- Financial & BI Handlers ---

  private handleDailySummary(dateInput: string | undefined, ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let targetDate = formatLocalDate(now);
    if (dateInput === 'yesterday' || dateInput === 'kal') {
      targetDate = formatLocalDate(new Date(now.getTime() - 86400000));
    } else if (dateInput && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDate = dateInput;
    }

    const matchedCust = ctx.customers.filter((c) => c.created_at && c.created_at.startsWith(targetDate));
    const matchedKirkol = ctx.kirkol.filter((k) => k.created_at && k.created_at.startsWith(targetDate));
    const matchedSpend = ctx.spendings.filter((s) => s.created_at && s.created_at.startsWith(targetDate));

    const custIncome = matchedCust.reduce((sum, c) => sum + (Number(c.income) || 0), 0);
    const kirkolIncome = matchedKirkol.reduce((sum, k) => sum + (Number(k.price) || 0), 0);
    const daySpending = matchedSpend.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const netDayProfit = (custIncome + kirkolIncome) - daySpending;

    const custList = matchedCust.map((c, i) => `${i + 1}. **${c.customer_name}** — ${c.work_type} (${formatCurrency(c.total_amount)})`).join('\n');
    const kirkolList = matchedKirkol.slice(0, 5).map((k) => `• ${k.work} (${formatCurrency(k.price)})`).join('\n');

    return {
      success: true,
      toolName: 'getDailySummary',
      data: { targetDate, custIncome, kirkolIncome, daySpending, netDayProfit, matchedCust, matchedKirkol },
      summaryText:
        `### 📅 Daily Business Summary: ${targetDate}\n\n` +
        `• 👥 **Customer Jobs Added:** **${matchedCust.length} jobs** (${formatCurrency(custIncome)} profit)\n` +
        `• ⚡ **Kirkol Counter Sales:** **${matchedKirkol.length} items** (${formatCurrency(kirkolIncome)})\n` +
        `• 💼 **Direct Spendings:** **${formatCurrency(daySpending)}**\n` +
        `• 💰 **Net Day Margin:** **${formatCurrency(netDayProfit)}**\n\n` +
        (matchedCust.length > 0 ? `**Customer Jobs Today:**\n${custList}\n\n` : '') +
        (matchedKirkol.length > 0 ? `**Kirkol Counter Items:**\n${kirkolList}` : ''),
      suggestedActions: [
        {
          id: 'act-view-inc',
          label: 'View Income Dashboard',
          actionType: 'navigate',
          payload: { page: 'income' },
          variant: 'primary',
        },
      ],
    };
  }

  private handleMonthlySummary(monthIndex: number | undefined, yearInput: number | undefined, ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const month = typeof monthIndex === 'number' ? monthIndex : now.getMonth();
    const year = typeof yearInput === 'number' ? yearInput : now.getFullYear();

    const monthTotals = calculateMonthTotals(ctx.customers, ctx.spendings, ctx.kirkol, year, month);
    const monthName = MONTH_NAMES[month];

    return {
      success: true,
      toolName: 'getMonthlySummary',
      data: { month, year, monthName, monthTotals },
      summaryText:
        `### 📊 ${monthName} ${year} Financial Performance\n\n` +
        `• **Gross Billed Amount:** **${formatCurrency(monthTotals.totalAmount)}**\n` +
        `• **Cash Collected:** **${formatCurrency(monthTotals.collectedAmount)}**\n` +
        `• **Pending Uncollected Receivables:** **${formatCurrency(monthTotals.pendingAmount)}**\n` +
        `• **Net Income Earned (Jobs + Kirkol):** **${formatCurrency(monthTotals.totalIncome)}**\n` +
        `• **Direct Business Spendings:** **${formatCurrency(monthTotals.totalSpending)}**\n` +
        `• 💰 **Net Remaining Profit:** **${formatCurrency(monthTotals.remainingAmount)}**\n\n` +
        `**Collection Efficiency:** ${monthTotals.totalAmount > 0 ? ((monthTotals.collectedAmount / monthTotals.totalAmount) * 100).toFixed(1) : 100}%`,
      suggestedActions: [
        {
          id: 'act-export-pdf',
          label: 'Generate Monthly PDF Report',
          actionType: 'export_report',
          payload: {},
          variant: 'primary',
        },
      ],
    };
  }

  private handleProfitSummary(period: string | undefined, ctx: AIDataContext): AIToolResult {
    const { totals } = ctx;
    const kirkolShare = totals.totalIncome > 0 ? ((totals.kirkolIncome / totals.totalIncome) * 100).toFixed(1) : '0';
    const custShare = totals.totalIncome > 0 ? ((totals.customerIncome / totals.totalIncome) * 100).toFixed(1) : '0';

    return {
      success: true,
      toolName: 'getProfit',
      data: totals,
      summaryText:
        `### 💰 Net Profit & Cash Flow Summary\n\n` +
        `• 📁 **Customer Jobs Profit:** **${formatCurrency(totals.customerIncome)}** (${custShare}% of income)\n` +
        `• ⚡ **Kirkol Counter Revenue:** **${formatCurrency(totals.kirkolIncome)}** (${kirkolShare}% of income)\n` +
        `• 🏆 **Total Net Income:** **${formatCurrency(totals.totalIncome)}**\n` +
        `• 💼 **Direct Business Spending:** **${formatCurrency(totals.totalSpending)}**\n` +
        `• 🏆 **Net Cash Remaining:** **${formatCurrency(totals.remainingAmount)}**\n\n` +
        `**Formula:** \`Net Remaining = (Customer Profit + Kirkol Revenue) - Total Spending\`\n` +
        `\`${formatCurrency(totals.remainingAmount)} = (${formatCurrency(totals.customerIncome)} + ${formatCurrency(totals.kirkolIncome)}) - ${formatCurrency(totals.totalSpending)}\``,
      suggestedActions: [
        {
          id: 'act-nav-income',
          label: 'View Detailed Financial Charts',
          actionType: 'navigate',
          payload: { page: 'income' },
          variant: 'primary',
        },
      ],
    };
  }

  private handleSpendingSummary(categoryFilter: string | undefined, ctx: AIDataContext): AIToolResult {
    const spendingByCategory = new Map<string, number>();
    ctx.spendings.forEach((s) => {
      const cat = s.category || 'General';
      if (categoryFilter && !cat.toLowerCase().includes(categoryFilter.toLowerCase())) return;
      spendingByCategory.set(cat, (spendingByCategory.get(cat) || 0) + (Number(s.amount) || 0));
    });

    const sortedCats = Array.from(spendingByCategory.entries()).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0] || ['None', 0];

    const breakdownText = sortedCats
      .map(([cat, amt], i) => `${i + 1}. **${cat}**: ${formatCurrency(amt)} (${ctx.totals.totalSpending > 0 ? ((amt / ctx.totals.totalSpending) * 100).toFixed(1) : 0}%)`)
      .join('\n');

    return {
      success: true,
      toolName: 'getSpending',
      data: { spendings: ctx.spendings, spendingByCategory, total: ctx.totals.totalSpending },
      summaryText:
        `### 💸 Business Spendings Breakdown\n\n` +
        `• **Total Direct Spendings:** **${formatCurrency(ctx.totals.totalSpending)}** across **${ctx.spendings.length} items**\n` +
        `• **Work Production Expenses:** **${formatCurrency(ctx.totals.workExpense)}**\n` +
        `• **Combined Total Outflow:** **${formatCurrency(ctx.totals.totalExpense)}**\n` +
        `• **Top Spending Category:** **${topCat[0]}** (${formatCurrency(topCat[1])})\n\n` +
        `**Category Distribution:**\n${breakdownText || 'No direct spendings recorded yet.'}`,
      suggestedActions: [
        {
          id: 'act-view-spending',
          label: 'Manage Spending & Expenses',
          actionType: 'navigate',
          payload: { page: 'spending' },
          variant: 'primary',
        },
      ],
    };
  }

  private handleComparePeriods(currentMonthIdx: number | undefined, compMonthIdx: number | undefined, ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const curMonth = typeof currentMonthIdx === 'number' ? currentMonthIdx : now.getMonth();
    const prevMonth = typeof compMonthIdx === 'number' ? compMonthIdx : (curMonth === 0 ? 11 : curMonth - 1);
    const year = now.getFullYear();

    const cur = calculateMonthTotals(ctx.customers, ctx.spendings, ctx.kirkol, year, curMonth);
    const prev = calculateMonthTotals(ctx.customers, ctx.spendings, ctx.kirkol, curMonth === 0 ? year - 1 : year, prevMonth);

    const profitDiff = cur.remainingAmount - prev.remainingAmount;
    const profitPct = prev.remainingAmount !== 0 ? ((profitDiff / Math.abs(prev.remainingAmount)) * 100).toFixed(1) : '0';

    return {
      success: true,
      toolName: 'comparePeriods',
      data: { cur, prev, profitDiff, profitPct },
      summaryText:
        `### 📈 Financial Comparison: ${MONTH_NAMES[curMonth]} vs ${MONTH_NAMES[prevMonth]}\n\n` +
        `| Metric | ${MONTH_NAMES[curMonth]} ${year} | ${MONTH_NAMES[prevMonth]} | Change |\n` +
        `|---|---|---|---|\n` +
        `| 💵 **Gross Billed** | ${formatCurrency(cur.totalAmount)} | ${formatCurrency(prev.totalAmount)} | ${cur.totalAmount >= prev.totalAmount ? '+' : ''}${formatCurrency(cur.totalAmount - prev.totalAmount)} |\n` +
        `| ✅ **Cash Collected** | ${formatCurrency(cur.collectedAmount)} | ${formatCurrency(prev.collectedAmount)} | ${cur.collectedAmount >= prev.collectedAmount ? '+' : ''}${formatCurrency(cur.collectedAmount - prev.collectedAmount)} |\n` +
        `| 💼 **Spendings** | ${formatCurrency(cur.totalSpending)} | ${formatCurrency(prev.totalSpending)} | ${cur.totalSpending >= prev.totalSpending ? '+' : ''}${formatCurrency(cur.totalSpending - prev.totalSpending)} |\n` +
        `| 💰 **Net Remaining Profit** | **${formatCurrency(cur.remainingAmount)}** | **${formatCurrency(prev.remainingAmount)}** | **${profitDiff >= 0 ? '+' : ''}${formatCurrency(profitDiff)} (${profitPct}%)** |\n\n` +
        `💡 *Conclusion: Net cash profit is **${profitDiff >= 0 ? 'up' : 'down'} by ${formatCurrency(Math.abs(profitDiff))}** compared to ${MONTH_NAMES[prevMonth]}.*`,
      suggestedActions: [
        {
          id: 'act-view-report',
          label: 'Generate Monthly PDF Report',
          actionType: 'export_report',
          payload: {},
          variant: 'primary',
        },
      ],
    };
  }

  // --- Communication Handlers ---

  private handleDraftCustomerMessage(customerName: string | undefined, messageType: string | undefined, ctx: AIDataContext): AIToolResult {
    const lookup = this.handleCustomerLookup(customerName || '', ctx);
    return lookup;
  }

  private handleQueueOverdueReminders(minimumDays: number, ctx: AIDataContext): AIToolResult {
    return this.handleGetOverdueCustomers(minimumDays, 0, ctx);
  }

  // --- Reconciliation & Workspace Handlers ---

  private handleReconciliation(ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const sheetsConfig = getSheetsConfig();
    const hasWebhook = Boolean(sheetsConfig?.webhookUrl && sheetsConfig.webhookUrl.startsWith('https://script.google.com/'));
    const lastSync = sheetsConfig?.lastSync || 'Never';

    return {
      success: true,
      toolName: 'reconcileSupabaseWithGoogleSheets',
      data: { supabaseConnected: ctx.supabaseConnected, hasWebhook, lastSync },
      summaryText:
        `### 🔄 Supabase & Google Sheets Dual-Data Audit\n\n` +
        `| Data Store | Status | Records Cached | Description |\n` +
        `|---|---|---|---|\n` +
        `| 🗄️ **Supabase Database** | ${ctx.supabaseConnected ? '🟢 Connected & Live' : '🟡 Local Fallback'} | ${ctx.customers.length + ctx.spendings.length + ctx.kirkol.length} items | Realtime relational storage |\n` +
        `| 📊 **Google Sheet** | ${hasWebhook ? '🟢 Linked via Webhook' : '🔴 Unconfigured'} | Full Monthly Sheets | Cloud spreadsheet backup & reports |\n\n` +
        `**Reconciliation Telemetry:**\n` +
        `• **Customer Records:** **${ctx.customers.length}** records\n` +
        `• **Direct Spendings:** **${ctx.spendings.length}** records (${formatCurrency(ctx.totals.totalSpending)})\n` +
        `• **Kirkol Counter Sales:** **${ctx.kirkol.length}** records (${formatCurrency(ctx.totals.kirkolIncome)})\n` +
        `• **Active Sheet Tab:** \`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}\`\n` +
        `• **Last Google Sheet Webhook Sync:** **${lastSync}**\n\n` +
        `ℹ️ *Google Sheets connection status checked. Supabase records are ready for synchronization. Use the button below to perform a live sheet update.*`,
      suggestedActions: [
        {
          id: 'act-sync-now',
          label: 'Trigger Full Google Sheets Sync',
          actionType: 'sync_sheets',
          payload: {},
          variant: 'primary',
        },
        {
          id: 'act-nav-sheets',
          label: 'Open Google Sheets Manager',
          actionType: 'navigate',
          payload: { page: 'sheets' },
          variant: 'secondary',
        },
      ],
    };
  }

  private handleCreateMonthSheet(monthIndex: number | undefined, yearInput: number | undefined, ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const month = typeof monthIndex === 'number' ? monthIndex : now.getMonth();
    const year = typeof yearInput === 'number' ? yearInput : now.getFullYear();
    const monthName = MONTH_NAMES[month];

    return {
      success: true,
      toolName: 'createMonthSheet',
      data: { month, year, monthName },
      summaryText:
        `### 📑 Sheet Automation: ${monthName} ${year}\n\n` +
        `I have prepared the automated synchronization for **${monthName} ${year}**.\n\n` +
        `• **Target Tab:** \`${monthName} ${year}\`\n` +
        `• **Action:** Creates the single-page 3-section layout (Customer Work + Spendings + Kirkol) with live formula calculations\n` +
        `• **Supabase Sync:** Customer and payment records entered for ${monthName} will sync here automatically.`,
      suggestedActions: [
        {
          id: 'act-sync-month',
          label: `⚡ Sync / Create ${monthName} Sheet in Google Sheets`,
          actionType: 'sync_sheets',
          payload: { month, year },
          variant: 'primary',
        },
      ],
    };
  }

  private handleCreateYearWorkspace(yearInput: number | undefined, ctx: AIDataContext): AIToolResult {
    const now = new Date();
    const year = typeof yearInput === 'number' ? yearInput : now.getFullYear() + 1;

    return {
      success: true,
      toolName: 'createYearWorkspace',
      data: { year },
      summaryText:
        `### 🗓️ New Year Workspace Automation: ${year}\n\n` +
        `I can automatically set up a brand-new **Google Spreadsheet Workspace** for **${year}** with all 12 pre-formatted monthly tabs.\n\n` +
        `• 📁 **New Spreadsheet:** \`Al Uzer CRM - ${year} Workspace\`\n` +
        `• 📑 **12 Pre-Configured Tabs:** January ${year} to December ${year}\n` +
        `• 📐 **Structured Tables:** Customer Work, Business Spendings, and Kirkol Counter Sales on each sheet\n` +
        `• 🧮 **Live Formulas:** Automated revenue sum and net profit balance calculations on top`,
      suggestedActions: [
        {
          id: 'act-nav-sheets-workspace',
          label: `🚀 Create ${year} Google Sheet Workspace`,
          actionType: 'navigate',
          payload: { page: 'sheets' },
          variant: 'primary',
        },
      ],
    };
  }
}

export const crmToolRouter = new CRMToolRouter();
