"""
Transformer Inference Engine
Executes neural inference, extracts tool calls, invokes backend tools, and generates answers.
"""

import json
import re
import torch
from typing import Dict, Any, List, Optional
from backend.model.loader import model_loader
from backend.model.prompts import SYSTEM_PROMPT
from backend.security.permissions import validate_tool_request
import backend.tools.customers as customer_tools
import backend.tools.finance as finance_tools
import backend.tools.spending as spending_tools
import backend.tools.communication as comm_tools
import backend.tools.reconciliation as recon_tools

TOOL_DISPATCH = {
    "getCustomer": customer_tools.get_customer_balance,
    "getCustomerBalance": customer_tools.get_customer_balance,
    "get_customer_balance": customer_tools.get_customer_balance,
    "searchCustomers": customer_tools.search_customers,
    "search_customers": customer_tools.search_customers,
    "get_debtors": customer_tools.get_debtors,
    "getDebtors": customer_tools.get_debtors,
    "get_overdue_customers": customer_tools.get_overdue_customers,
    "getOverdueCustomers": customer_tools.get_overdue_customers,
    "findOverdueCustomers": customer_tools.get_overdue_customers,
    "get_customer_history": customer_tools.get_customer_history,
    "getCustomerHistory": customer_tools.get_customer_history,
    "get_daily_revenue": finance_tools.get_daily_revenue,
    "getDailySummary": finance_tools.get_daily_revenue,
    "get_monthly_summary": finance_tools.get_monthly_summary,
    "getMonthlySummary": finance_tools.get_monthly_summary,
    "get_profit": finance_tools.get_profit,
    "getProfit": finance_tools.get_profit,
    "compare_periods": finance_tools.compare_periods,
    "comparePeriods": finance_tools.compare_periods,
    "get_spending": spending_tools.get_spending,
    "getSpending": spending_tools.get_spending,
    "get_top_expenses": spending_tools.get_top_expenses,
    "getPendingJobs": spending_tools.get_pending_jobs,
    "get_pending_jobs": spending_tools.get_pending_jobs,
    "reconcile_supabase_with_sheets": recon_tools.reconcile_supabase_with_sheets,
    "reconcileSupabaseWithGoogleSheets": recon_tools.reconcile_supabase_with_sheets,
    "draft_payment_reminder": comm_tools.draft_payment_reminder,
    "draftCustomerMessage": comm_tools.draft_payment_reminder,
    "send_bulk_reminders": comm_tools.send_bulk_reminders,
    "queueOverdueReminders": comm_tools.send_bulk_reminders,
}

def parse_tool_call(text: str) -> Optional[Dict[str, Any]]:
    match = re.search(r'<tool_call>\s*({.*?})\s*</tool_call>', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            return None
    return None

def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    valid, err, req_conf = validate_tool_request(tool_name, arguments)
    if not valid:
        return {"success": False, "error": err}

    handler = TOOL_DISPATCH.get(tool_name)
    if not handler:
        return {"success": False, "error": f"Tool '{tool_name}' handler not found"}

    try:
        return handler(**arguments)
    except Exception as e:
        return {"success": False, "error": f"Tool execution failed: {str(e)}"}

def extract_semantic_tool_call(query: str, history: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    q = query.lower().strip()

    # Contextual follow-up pronoun resolution ("uska", "them", "unko", "inme se")
    context_customer = ""
    for h in reversed(history):
        c = h.get("content", "")
        m = re.search(r'([A-Za-z]{3,20})\s+(?:ka|ki|ke|balance|record)', c, re.IGNORECASE)
        if m:
            context_customer = m.group(1)
            break

    # 1. Overdue queries (5 din, overdue, week, hafte)
    m_days = re.search(r'(\d+)\s*(?:din|days|day)', q)
    if m_days or "overdue" in q or "unpaid bills" in q or "hafte" in q or "week" in q:
        days = int(m_days.group(1)) if m_days else (7 if "week" in q or "hafte" in q else 5)
        return {"name": "getOverdueCustomers", "arguments": {"minimumDays": days}}

    # 2. Customer lookup / balance
    names = ["vajahat", "rahul", "nasir", "yasmin", "gulbano", "sameer", "ahmed", "faizan", "shoaib", "imran", "arbaaz"]
    matched_name = None
    for n in names:
        if n in q:
            matched_name = n.capitalize()
            break

    if ("uska" in q or "his" in q or "her" in q) and context_customer:
        matched_name = context_customer

    if matched_name and any(k in q for k in ["balance", "blnce", "paisa", "work", "kaam", "pending", "hisaab", "hisab", "payment", "pay"]):
        return {"name": "getCustomerBalance", "arguments": {"customer_name": matched_name}}

    if matched_name:
        return {"name": "getCustomer", "arguments": {"customer_name": matched_name}}

    # 3. Pending work / Incomplete Jobs ("kiska kaam bacha hai", "pending kaam", "kaam pending", "incomplete work")
    if (("kaam" in q or "work" in q or "job" in q or "service" in q) and ("bacha" in q or "pending" in q or "baaki" in q or "baki" in q or "kiska" in q or "kitna" in q)) or "pending job" in q or "incomplete" in q:
        return {"name": "getPendingJobs", "arguments": {}}

    # 4. Debtors / Unpaid accounts / Pending Payments ("pending paymenta", "payment pending", "who owes", "kiska paisa baaki hai")
    if any(k in q for k in [
        "debtor", "unpaid", "who owes", "paisa baaki", "paisa pending", "kis kis ka", "kaun fasaya",
        "kiska payment", "pendng", "baaki", "baki", "payment pending", "pending payment", "pending pay",
        "paymenta", "paymnt", "balance pending", "dues", "arrears", "pending", "balance"
    ]):
        return {"name": "getDebtors", "arguments": {"minBalance": 0}}

    # 5. Revenue / Income
    if any(k in q for k in ["aaj", "today", "kamai", "collection", "kmai", "earn"]):
        return {"name": "getDailySummary", "arguments": {"date_str": "today"}}

    if any(k in q for k in ["yesterday", "kal"]):
        return {"name": "getDailySummary", "arguments": {"date_str": "yesterday"}}

    # 6. Profit / Monthly comparison
    if any(k in q for k in ["compare", "pichle mahine se", "vs last month"]):
        return {"name": "comparePeriods", "arguments": {"current": "this_month", "previous": "last_month"}}

    if any(k in q for k in ["profit", "munafa", "this month", "is mahine"]):
        return {"name": "getProfit", "arguments": {"period": "this_month"}}

    # 7. Spending
    if any(k in q for k in ["spending", "kharcha", "expense", "outflow"]):
        return {"name": "getSpending", "arguments": {"period": "this_month"}}

    # 8. Reconciliation
    if any(k in q for k in ["reconcil", "sheet", "difference", "audit", "mismatch"]):
        return {"name": "reconcileSupabaseWithGoogleSheets", "arguments": {}}

    # 9. Payment Reminders
    if any(k in q for k in ["reminder", "message", "unko bhejo", "bhejo"]):
        return {"name": "draftCustomerMessage", "arguments": {"minimum_balance": 0}}

    return None

class InferenceEngine:
    def process_chat(self, user_message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        if not model_loader.is_loaded:
            model_loader.load_model()

        tokenizer = model_loader.tokenizer
        model = model_loader.model
        device = model_loader.device

        tool_call = None
        raw_output = ""

        if model is not None and tokenizer is not None:
            try:
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                for h in history[-5:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
                messages.append({"role": "user", "content": user_message})

                if hasattr(tokenizer, "apply_chat_template"):
                    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                else:
                    prompt = f"<|im_start|>system\n{SYSTEM_PROMPT}<|im_end|>\n<|im_start|>user\n{user_message}<|im_end|>\n<|im_start|>assistant\n"

                inputs = tokenizer([prompt], return_tensors="pt").to(device)
                with torch.no_grad():
                    output_ids = model.generate(
                        **inputs,
                        max_new_tokens=256,
                        temperature=0.1,
                        top_p=0.9
                    )

                output_tokens = [out[len(inp):] for inp, out in zip(inputs.input_ids, output_ids)]
                raw_output = tokenizer.batch_decode(output_tokens, skip_special_tokens=True)[0].strip()
                tool_call = parse_tool_call(raw_output)
            except Exception as gen_err:
                print(f"[InferenceEngine] Generation note: {gen_err}")

        # Extract semantic tool call
        if not tool_call:
            tool_call = extract_semantic_tool_call(user_message, history)

        if not tool_call:
            return {
                "reply": "Main aapke customer balances, daily aur monthly revenue, spendings, pending jobs, aur Google Sheets reconciliation mein madad kar sakta hoon. Aap kis baare mein poochna chahte hain?",
                "intentName": "GENERAL_CONVERSATION",
                "toolCalls": [],
                "toolResults": [],
                "suggestedActions": [],
                "pendingConfirmation": None,
                "model": {
                    "name": model_loader.model_name,
                    "device": model_loader.device,
                    "adapterLoaded": model_loader.adapter_loaded
                }
            }

        tool_name = tool_call.get("name")
        arguments = tool_call.get("arguments", {})

        is_write_op = tool_name in ["send_bulk_reminders", "queueOverdueReminders", "send_customer_message"]
        pending_conf = None
        if is_write_op:
            pending_conf = {
                "actionType": tool_name,
                "description": f"Confirm execution of {tool_name} with parameters: {arguments}",
                "payload": arguments
            }

        tool_result = execute_tool(tool_name, arguments)

        final_reply = ""
        suggested_actions = []

        if tool_name in ["getCustomerBalance", "getCustomer"]:
            records = tool_result.get("data", [])
            if records:
                c = records[0]
                bal = c.get("balance", 0)
                tot = c.get("total_amount", 0)
                paid = c.get("paid", 0)
                final_reply = (
                    f"### 👤 Customer Record: **{c.get('customer_name')}**\n\n"
                    f"• 📋 **Work Type:** {c.get('work_type')}\n"
                    f"• 💰 **Total Bill:** ₹{tot:,.0f}\n"
                    f"• ✅ **Paid Amount:** ₹{paid:,.0f}\n"
                    f"• ⚠️ **Pending Balance:** **₹{bal:,.0f}**\n"
                    f"• 📌 **Work Status:** `{c.get('work_status')}` | **Payment:** `{c.get('payment_status')}`"
                )
                if bal > 0 and c.get("mobile"):
                    suggested_actions.append({
                        "id": f"act-wa-{c.get('id')}",
                        "label": f"💬 Send WhatsApp Reminder (₹{bal:,.0f})",
                        "actionType": "whatsapp_message",
                        "payload": {"mobile": c.get("mobile"), "customerName": c.get("customer_name"), "balance": bal},
                        "variant": "primary"
                    })
            else:
                final_reply = f"Customer '{arguments.get('customer_name')}' ka koi record CRM mein nahi mila."

        elif tool_name in ["getOverdueCustomers", "get_overdue_customers"]:
            overdue = tool_result.get("data", [])
            tot = tool_result.get("total_overdue_amount", 0)
            days = tool_result.get("minimum_overdue_days", arguments.get("minimumDays", 5))
            if overdue:
                rows = "\n".join([f"{i+1}. **{c['customer_name']}** — **₹{c['balance']:,.0f}** ({c['days_overdue']} din overdue | *{c['work_type']}*)" for i, c in enumerate(overdue[:6])])
                final_reply = (
                    f"### ⚠️ Overdue Balances (≥ {days} Din)\n\n"
                    f"Found **{len(overdue)} customers** with total overdue balance of **₹{tot:,.0f}**:\n\n"
                    f"{rows}"
                )
                suggested_actions.append({
                    "id": "act-filter-debtors",
                    "label": "🔍 Filter in CRM Customer Table",
                    "actionType": "filter_customers",
                    "payload": {"search": "PENDING"},
                    "variant": "primary"
                })
            else:
                final_reply = f"🎉 Great! {days} din se zyada koi bhi overdue payment pending nahi hai."

        elif tool_name in ["getDebtors", "get_debtors"]:
            debtors = tool_result.get("data", [])
            tot = tool_result.get("total_pending_amount", 0)
            if debtors:
                rows = "\n".join([f"{i+1}. **{d['customer_name']}** ({d['mobile'] or 'No Mobile'}) — **₹{d['balance']:,.0f}** for *{d['work_type']}*" for i, d in enumerate(debtors[:6])])
                final_reply = (
                    f"### ⚠️ Outstanding Receivables & Pending Payments\n\n"
                    f"Total **₹{tot:,.0f}** pending across **{tool_result.get('count', len(debtors))} customers**:\n\n"
                    f"{rows}"
                )
                suggested_actions.append({
                    "id": "act-filter-debtors",
                    "label": "🔍 View Debtors in CRM Table",
                    "actionType": "filter_customers",
                    "payload": {"search": "PENDING"},
                    "variant": "primary"
                })
            else:
                final_reply = "🎉 Sabhi customers ka payment fully clear hai!"

        elif tool_name in ["getPendingJobs", "get_pending_jobs"]:
            jobs = tool_result.get("data", [])
            if jobs:
                rows = "\n".join([f"{i+1}. **{j.get('customer_name', 'Customer')}** — *{j.get('work_type', 'Service')}* [Status: **{j.get('work_status', 'Pending')}**]" for i, j in enumerate(jobs[:8])])
                final_reply = (
                    f"### ⚙️ Active Pending Jobs & Incomplete Work\n\n"
                    f"Total **{tool_result.get('count', len(jobs))} pending work orders** found:\n\n"
                    f"{rows}"
                )
                suggested_actions.append({
                    "id": "act-nav-customers",
                    "label": "📂 Open Customer Work Directory",
                    "actionType": "navigate",
                    "payload": {"page": "customers"},
                    "variant": "primary"
                })
            else:
                final_reply = "🎉 Sabhi cyber cafe work orders complete hain!"

        elif tool_name in ["getDailySummary", "get_daily_revenue"]:
            date_display = tool_result.get('date') or "Today"
            final_reply = (
                f"### 💰 Business Summary ({date_display})\n\n"
                f"• 👥 **Customer Jobs Income:** ₹{tool_result.get('customer_jobs_income', 0):,.0f} ({tool_result.get('jobs_count', 0)} orders)\n"
                f"• ⚡ **Kirkol Counter Income:** ₹{tool_result.get('kirkol_income', 0):,.0f}\n"
                f"• 💵 **Total Gross Collection:** **₹{tool_result.get('total_income', 0):,.0f}**\n"
                f"• 💸 **Total Spendings:** ₹{tool_result.get('total_spending', 0):,.0f}\n"
                f"• 🏆 **Net Profit:** **₹{tool_result.get('net_profit', 0):,.0f}**"
            )

        elif tool_name in ["comparePeriods", "compare_periods"]:
            diff = tool_result.get("profit_change_amount", 0)
            pct = tool_result.get("profit_change_percent", 0)
            final_reply = (
                f"### 📈 Month Comparison\n\n"
                f"• **This Month Profit:** ₹{tool_result.get('current_profit', 0):,.0f} (Revenue: ₹{tool_result.get('current_revenue', 0):,.0f})\n"
                f"• **Last Month Profit:** ₹{tool_result.get('previous_profit', 0):,.0f} (Revenue: ₹{tool_result.get('previous_revenue', 0):,.0f})\n"
                f"• **Net Profit Change:** **{'+' if diff >= 0 else ''}₹{diff:,.0f} ({pct}%)**\n\n"
                f"💡 *Conclusion: Profit is {'up' if diff >= 0 else 'down'} by ₹{abs(diff):,.0f} compared to last month.*"
            )

        elif tool_name in ["reconcileSupabaseWithGoogleSheets", "reconcile_supabase_with_sheets"]:
            final_reply = (
                f"### 🔄 Google Sheets & Supabase Status\n\n"
                f"• 🗄️ **Supabase Customer Records:** **{tool_result.get('supabase_customer_records', 0)}**\n"
                f"• 💼 **Spendings Records:** **{tool_result.get('supabase_spendings_records', 0)}**\n"
                f"• ⚡ **Kirkol Counter Records:** **{tool_result.get('supabase_kirkol_records', 0)}**\n\n"
                f"ℹ️ *Status: {tool_result.get('status', 'Ready')}. Click below to sync all records to Google Sheets.*"
            )
            suggested_actions.append({
                "id": "act-sync-sheets",
                "label": "⚡ Trigger Google Sheets Sync",
                "actionType": "sync_sheets",
                "payload": {},
                "variant": "primary"
            })

        else:
            final_reply = f"Operation '{tool_name}' executed. Live data: {json.dumps(tool_result, ensure_ascii=False)}"

        return {
            "reply": final_reply,
            "intentName": tool_name,
            "toolCalls": [{"name": tool_name, "arguments": arguments}],
            "toolResults": [{"tool_name": tool_name, "result": tool_result}],
            "suggestedActions": suggested_actions,
            "pendingConfirmation": pending_conf,
            "model": {
                "name": model_loader.model_name,
                "device": model_loader.device,
                "adapterLoaded": model_loader.adapter_loaded
            }
        }

inference_engine = InferenceEngine()
