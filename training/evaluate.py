"""
Al Uzer Model Evaluation Benchmark
Tests semantic understanding, tool selection, argument accuracy, and multi-turn resolution.
"""

import json
import re
from typing import Dict, Any, List

def parse_tool_call(response: str) -> Dict[str, Any] | None:
    match = re.search(r'<tool_call>\s*({.*?})\s*</tool_call>', response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            return None
    return None

def run_evaluation_suite(predict_fn) -> Dict[str, Any]:
    test_cases = [
        # 1. English
        {
            "query": "Who owes me money?",
            "expected_tool": "get_debtors",
            "expected_args": {},
            "category": "English"
        },
        {
            "query": "What is my net profit this month?",
            "expected_tool": "get_profit",
            "expected_args": {"period": "this_month"},
            "category": "English"
        },
        # 2. Hindi
        {
            "query": "किन ग्राहकों का पैसा बाकी है?",
            "expected_tool": "get_debtors",
            "expected_args": {},
            "category": "Hindi"
        },
        {
            "query": "आज कितनी कमाई हुई?",
            "expected_tool": "get_daily_revenue",
            "expected_args": {},
            "category": "Hindi"
        },
        # 3. Hinglish
        {
            "query": "Bhai 5 din se jinka paisa atka hua hai unko dikha",
            "expected_tool": "get_overdue_customers",
            "expected_args": {"minimum_overdue_days": 5},
            "category": "Hinglish"
        },
        {
            "query": "Vajahat ka balance kitna hai?",
            "expected_tool": "get_customer_balance",
            "expected_args": {"customer_name": "Vajahat"},
            "category": "Hinglish"
        },
        {
            "query": "Aaj kitni kamai hui?",
            "expected_tool": "get_daily_revenue",
            "expected_args": {},
            "category": "Hinglish"
        },
        # 4. Informal & Typos
        {
            "query": "kon kon ka paisa pendng h",
            "expected_tool": "get_debtors",
            "expected_args": {},
            "category": "Typos"
        },
        {
            "query": "aaj kitni kmai hui",
            "expected_tool": "get_daily_revenue",
            "expected_args": {},
            "category": "Typos"
        },
        {
            "query": "Rahul ka blnce",
            "expected_tool": "get_customer_balance",
            "expected_args": {"customer_name": "Rahul"},
            "category": "Typos"
        },
        # 5. Unseen phrasings (Semantic generalization)
        {
            "query": "Which customers are sitting on unpaid bills for nearly a week?",
            "expected_tool": "get_overdue_customers",
            "expected_args": {"minimum_overdue_days": 7},
            "category": "Unseen Generalization"
        },
        {
            "query": "Kaunse clients ka payment lagbhag ek hafte se clear nahi hua?",
            "expected_tool": "get_overdue_customers",
            "expected_args": {"minimum_overdue_days": 7},
            "category": "Unseen Generalization"
        }
    ]

    results = []
    category_scores = {}

    for tc in test_cases:
        prediction = predict_fn(tc["query"])
        parsed = parse_tool_call(prediction) if isinstance(prediction, str) else prediction
        
        tool_match = False
        args_match = False

        if parsed:
            tool_name = parsed.get("name") or parsed.get("tool")
            tool_match = (tool_name == tc["expected_tool"])
            actual_args = parsed.get("arguments", {})
            # Check expected args subset
            args_match = all(actual_args.get(k) == v for k, v in tc["expected_args"].items())

        passed = tool_match and args_match
        cat = tc["category"]
        if cat not in category_scores:
            category_scores[cat] = {"passed": 0, "total": 0}
        category_scores[cat]["total"] += 1
        if passed:
            category_scores[cat]["passed"] += 1

        results.append({
            "query": tc["query"],
            "expected_tool": tc["expected_tool"],
            "predicted_tool": parsed.get("name") if parsed else "NONE",
            "passed": passed,
            "category": cat
        })

    total_passed = sum(1 for r in results if r["passed"])
    accuracy = (total_passed / len(results)) * 100

    report = {
        "total_tests": len(results),
        "passed": total_passed,
        "overall_accuracy_percent": round(accuracy, 2),
        "category_breakdown": category_scores,
        "details": results
    }
    return report

if __name__ == "__main__":
    # Test with semantic parser simulation
    def dummy_predict(q: str):
        q_lower = q.lower()
        if "balance" in q_lower or "blnce" in q_lower:
            name = "Vajahat" if "vajahat" in q_lower else "Rahul"
            return f'<tool_call>{{"name": "get_customer_balance", "arguments": {{"customer_name": "{name}"}}}}</tool_call>'
        if "overdue" in q_lower or "5 din" in q_lower or "unpaid bills" in q_lower or "hafte" in q_lower:
            days = 7 if "week" in q_lower or "hafte" in q_lower else 5
            return f'<tool_call>{{"name": "get_overdue_customers", "arguments": {{"minimum_overdue_days": {days}}}}} </tool_call>'
        if "kamai" in q_lower or "earn" in q_lower or "kmai" in q_lower or "कमाई" in q:
            return '<tool_call>{"name": "get_daily_revenue", "arguments": {}}</tool_call>'
        if "profit" in q_lower:
            return '<tool_call>{"name": "get_profit", "arguments": {"period": "this_month"}}</tool_call>'
        if "पैसा बाकी" in q or "ग्राहक" in q:
            return '<tool_call>{"name": "get_debtors", "arguments": {}}</tool_call>'
        return '<tool_call>{"name": "get_debtors", "arguments": {}}</tool_call>'

    report = run_evaluation_suite(dummy_predict)
    print("=== Al Uzer AI Evaluation Suite Report ===")
    print(f"Overall Accuracy: {report['overall_accuracy_percent']}% ({report['passed']}/{report['total_tests']})")
    for cat, scores in report["category_breakdown"].items():
        print(f" - {cat}: {scores['passed']}/{scores['total']} ({(scores['passed']/scores['total'])*100:.1f}%)")
