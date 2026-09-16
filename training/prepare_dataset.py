"""
Al Uzer Dataset Preparation Pipeline
Generates high-quality diverse training, validation, and test datasets in JSONL format.
Supports English, Hindi, Hinglish, informal phrases, typos, multi-turn conversations,
and tool calls in format: <tool_call>{"name": "...", "arguments": {...}}</tool_call>.
"""

import json
import os
import random
from typing import List, Dict, Any

random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

SYSTEM_PROMPT = (
    "You are the Al Uzer CRM Master Intelligence AI. "
    "Understand user requests in English, Hindi, Hinglish, and informal language with typos. "
    "Predict appropriate CRM tool calls in the format:\n"
    "<tool_call>\n{\"name\": \"<tool_name>\", \"arguments\": {<args>}}\n</tool_call>\n"
    "Never invent financial figures, customer records, or transaction histories. "
    "Always rely strictly on verified CRM tool execution results."
)

def create_example(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    formatted = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    return {"messages": formatted}

def generate_base_examples() -> List[Dict[str, Any]]:
    examples = []

    # 1. GET_CUSTOMER_BALANCE
    names = ["Vajahat", "Rahul", "Nasir", "Yasmin", "Gulbano", "Sameer", "Ahmed", "Faizan", "Shoaib", "Rohan", "Imran", "Arbaaz"]
    for name in names:
        examples.append(create_example([
            {"role": "user", "content": f"{name} ka balance bata"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"{name} ka kitna paisa pending hai?"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"How much balance is pending for {name}?"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"{name} blnce check krna"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"{name} ne kitna paisa diya aur kitna baaki hai?"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))

    # 2. GET_OVERDUE_CUSTOMERS
    days_list = [3, 5, 7, 10, 15, 30]
    for d in days_list:
        examples.append(create_example([
            {"role": "user", "content": f"Bhai {d} din se jinka paisa atka hua hai unko dikha"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {d}}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"Show customers overdue for more than {d} days"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {d}}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"{d} din se kis kis ka pament pending h"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {d}}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"जिन ग्राहकों का {d} दिनों से अधिक समय से भुगतान बाकी है, उन्हें दिखाएं"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {d}}}}}\n</tool_call>'}
        ]))

    # 3. GET_DEBTORS / UNPAID CUSTOMERS
    debtor_queries = [
        "Who owes me money?",
        "Show unpaid customers",
        "Kiska paisa baaki hai?",
        "Kis kis se payment lena hai?",
        "Kaun payment nahi kar raha?",
        "kaun fasaya hua hai paisa leke",
        "किन ग्राहकों का पैसा बाकी है?",
        "kon kon ka paisa pendng h",
        "Show debtors list",
        "Pending receivables list dikhao",
        "Unpaid balances kiske hain"
    ]
    for q in debtor_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": '<tool_call>\n{"name": "get_debtors", "arguments": {}}\n</tool_call>'}
        ]))

    # 4. SEARCH_CUSTOMERS & GET_CUSTOMER_HISTORY
    for name in names:
        examples.append(create_example([
            {"role": "user", "content": f"Show {name}'s work history"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_history", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"{name} ka pichla kaam aur documents dikha"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_history", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
        ]))
        examples.append(create_example([
            {"role": "user", "content": f"Search customer {name}"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "search_customers", "arguments": {{"query": "{name}"}}}}\n</tool_call>'}
        ]))

    # 5. GET_DAILY_REVENUE
    daily_queries = [
        "Aaj kitni kamai hui?",
        "How much did I earn today?",
        "Today's revenue summary",
        "aaj ka total collection kitna hai?",
        "aaj kitni kmai hui",
        "आज कितनी कमाई हुई?",
        "Aaj ka business kaisa raha?",
        "Show today's income and collection"
    ]
    for q in daily_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": '<tool_call>\n{"name": "get_daily_revenue", "arguments": {}}\n</tool_call>'}
        ]))

    # 6. GET_MONTHLY_SUMMARY & PROFIT
    monthly_queries = [
        ("This month's profit summary", "get_monthly_summary", {}),
        ("Is mahine kitna munafa hua?", "get_profit", {"period": "this_month"}),
        ("Pichle mahine kitna kamaya?", "get_monthly_summary", {"period": "last_month"}),
        ("What is my net profit this month?", "get_profit", {"period": "this_month"}),
        ("Compare this month with last month", "compare_periods", {"current": "this_month", "previous": "last_month"}),
        ("Is mahine ka profit pichle mahine se better hai kya?", "compare_periods", {"current": "this_month", "previous": "last_month"}),
        ("Compare current month revenue vs last month", "compare_periods", {"current": "this_month", "previous": "last_month", "metric": "revenue"}),
    ]
    for q, tool, args in monthly_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "{tool}", "arguments": {json.dumps(args)}}}\n</tool_call>'}
        ]))

    # 7. GET_SPENDING & TOP EXPENSES
    spending_queries = [
        ("What are my biggest expenses?", "get_top_expenses", {}),
        ("Sabse zyada kharcha kahan ho raha hai?", "get_top_expenses", {}),
        ("Kal ka kharcha kitna tha?", "get_spending", {"period": "yesterday"}),
        ("Show spending this month", "get_spending", {"period": "this_month"}),
        ("Is mahine ka kharcha dikhao", "get_spending", {"period": "this_month"}),
        ("Electricity aur rent ka kharcha kitna hai?", "get_spending", {"category": "utility"})
    ]
    for q, tool, args in spending_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "{tool}", "arguments": {json.dumps(args)}}}\n</tool_call>'}
        ]))

    # 8. PENDING JOBS & WORK TYPES
    job_queries = [
        ("Show all pending jobs", "get_pending_jobs", {}),
        ("Kitne kaam pending hain cyber cafe ke?", "get_pending_jobs", {}),
        ("Which service made the most money?", "get_monthly_summary", {"group_by": "work_type"}),
        ("Sabse zyada income kis service se hui?", "get_monthly_summary", {"group_by": "work_type"})
    ]
    for q, tool, args in job_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "{tool}", "arguments": {json.dumps(args)}}}\n</tool_call>'}
        ]))

    # 9. RECONCILIATION & GOOGLE SHEETS
    recon_queries = [
        "Check Google Sheets against Supabase",
        "Check karo Google Sheet aur Supabase mein koi difference hai kya",
        "Find any data mismatch between sheets and database",
        "Reconcile customer records with Google Sheets",
        "Google Sheets audit report dikhao"
    ]
    for q in recon_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": '<tool_call>\n{"name": "reconcile_supabase_with_sheets", "arguments": {}}\n</tool_call>'}
        ]))

    # 10. MULTI-TURN CONVERSATIONS (Context and Pronoun resolution)
    examples.append(create_example([
        {"role": "user", "content": "Who owes me money?"},
        {"role": "assistant", "content": '<tool_call>\n{"name": "get_debtors", "arguments": {}}\n</tool_call>'},
        {"role": "user", "content": "Only show those above 2000"},
        {"role": "assistant", "content": '<tool_call>\n{"name": "get_debtors", "arguments": {"minimum_balance": 2000}}\n</tool_call>'},
        {"role": "user", "content": "Now only those pending for more than 5 days"},
        {"role": "assistant", "content": '<tool_call>\n{"name": "get_overdue_customers", "arguments": {"minimum_overdue_days": 5, "minimum_balance": 2000}}\n</tool_call>'},
        {"role": "user", "content": "Send them reminders"},
        {"role": "assistant", "content": "I found the matching customers with pending balances. Would you like me to prepare and send payment reminder messages to these customers? Please confirm to proceed."}
    ]))

    examples.append(create_example([
        {"role": "user", "content": "Bhai kis kis ka paisa atka hua hai?"},
        {"role": "assistant", "content": '<tool_call>\n{"name": "get_debtors", "arguments": {}}\n</tool_call>'},
        {"role": "user", "content": "Inme se 1000 se upar wale dikha"},
        {"role": "assistant", "content": '<tool_call>\n{"name": "get_debtors", "arguments": {"minimum_balance": 1000}}\n</tool_call>'},
        {"role": "user", "content": "Unko WhatsApp reminder draft karo"},
        {"role": "assistant", "content": '<tool_call>\n{"name": "draft_payment_reminder", "arguments": {"minimum_balance": 1000}}\n</tool_call>'}
    ]))

    # 11. GENERAL & GREETING
    general_queries = [
        ("Hello, help me manage my CRM", "Hello! I am your Al Uzer Master AI Agent. I can help you check customer balances, track revenue, analyze expenses, monitor pending jobs, and draft payment reminders. What would you like to check?"),
        ("Namaste, aap kya kya kar sakte ho?", "Namaste! Main Al Uzer CRM ka AI Assistant hoon. Main customer balances, daily aur monthly kamai, kharche, pending jobs, aur WhatsApp reminders manage karne mein aapki madad kar sakta hoon."),
        ("Thank you so much", "You are very welcome! Let me know whenever you need any business analysis or customer assistance.")
    ]
    for q, ans in general_queries:
        examples.append(create_example([
            {"role": "user", "content": q},
            {"role": "assistant", "content": ans}
        ]))

    return examples

def generate_augmented_dataset() -> List[Dict[str, Any]]:
    base = generate_base_examples()
    all_examples = list(base)
    
    # Generate combinatorial variations for queries
    prefixes = ["", "Bhai ", "Please ", "Sir ", "Zara ", "Hey ", "AI ", "Al Uzer ", "Bhaiya "]
    suffixes = ["", " batao", " please", " jaldi", " dikhao", " check karo", " chahiye", " inform karo"]
    
    extra_names = [
        "Faheem", "Zubair", "Mohsin", "Shadab", "Tariq", "Salim", "Mustafa", "Rashid", "Riyaz",
        "Aftab", "Sameera", "Farhana", "Kavita", "Suresh", "Vikram", "Anil", "Deepak", "Manoj",
        "Sanjay", "Pooja", "Sunil", "Rajesh", "Priya", "Amit", "Sumit", "Neha", "Kiran"
    ]
    
    # Expand customer balance queries
    for name in extra_names:
        for prefix in ["", "Bhai ", "Zara ", "Please "]:
            for suffix in ["", " batao", " check karo", " dikhao"]:
                all_examples.append(create_example([
                    {"role": "user", "content": f"{prefix}{name} ka balance{suffix}"},
                    {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
                ]))
                all_examples.append(create_example([
                    {"role": "user", "content": f"{prefix}{name} ka kitna paisa pending hai{suffix}"},
                    {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
                ]))
                all_examples.append(create_example([
                    {"role": "user", "content": f"{prefix}how much balance does {name} owe{suffix}"},
                    {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}\n</tool_call>'}
                ]))

    # Expand overdue variations
    for days in range(1, 31):
        for p in ["", "Bhai ", "Zara "]:
            for s in ["", " unko dikhao", " list do", " check karo"]:
                all_examples.append(create_example([
                    {"role": "user", "content": f"{p}{days} din se jinka payment atka hai{s}"},
                    {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {days}}}}}\n</tool_call>'}
                ]))
                all_examples.append(create_example([
                    {"role": "user", "content": f"{p}customers overdue for more than {days} days{s}"},
                    {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {days}}}}}\n</tool_call>'}
                ]))

    # Expand revenue and financial queries
    dates = ["aaj", "kal", "parso", "this week", "last week", "this month", "last month", "is mahine", "pichle mahine"]
    for d in dates:
        all_examples.append(create_example([
            {"role": "user", "content": f"{d} ki kamai kitni hui?"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_daily_revenue" if "aaj" in d or "kal" in d else "get_monthly_summary", "arguments": {{"period": "{d}"}}}}\n</tool_call>'}
        ]))
        all_examples.append(create_example([
            {"role": "user", "content": f"{d} ka total collection batao"},
            {"role": "assistant", "content": f'<tool_call>\n{{"name": "get_daily_revenue" if "aaj" in d or "kal" in d else "get_monthly_summary", "arguments": {{"period": "{d}"}}}}\n</tool_call>'}
        ]))

    # Shuffle
    random.shuffle(all_examples)
    return all_examples

def main():
    examples = generate_augmented_dataset()
    print(f"Total unique curated examples generated: {len(examples)}")

    # Split: 80% Train, 10% Validation, 10% Test
    n = len(examples)
    n_train = int(n * 0.8)
    n_val = int(n * 0.1)

    train_data = examples[:n_train]
    val_data = examples[n_train:n_train + n_val]
    test_data = examples[n_train + n_val:]

    def save_jsonl(filename: str, dataset: List[Dict[str, Any]]):
        path = os.path.join(DATA_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            for item in dataset:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"Saved {len(dataset)} items to {path}")

    save_jsonl("train.jsonl", train_data)
    save_jsonl("validation.jsonl", val_data)
    save_jsonl("test.jsonl", test_data)

if __name__ == "__main__":
    main()
