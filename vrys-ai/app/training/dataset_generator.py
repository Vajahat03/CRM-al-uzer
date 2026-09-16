"""
VRYS AI — Expanded Multilingual Intent & Entity Fine-Tuning Pipeline (Step 3.5)
Generates rich conversational datasets across English, Hindi, and Hinglish with colloquialisms,
typos, and complex grammatical structures for local model fine-tuning.
"""
from typing import Dict, Any, List, Tuple
import json
import random
import os

class ExpandedCRMDatasetPipeline:
    def __init__(self):
        # 1. Names
        self.names = [
            "Ahmed", "Rahul", "Faisal", "Priya", "Vikram", "Sneha", "Amit",
            "Ananya", "Rohan", "Suresh", "Fatima", "Deepak", "Zaid", "Kavita",
            "Imran", "Manish", "Pooja", "Harsh", "Sameer", "Rajesh"
        ]

        # 2. Documents & Services
        self.doc_types = [
            "passport", "visa", "rc book", "driving license", "aadhaar card",
            "pan card", "gst certificate", "trade license", "gumasta license"
        ]

        # 3. Monetary Amounts
        self.amounts = [1500, 3500, 5000, 7500, 12000, 15000, 20000, 25000, 35000, 50000, 75000, 120000]

        # 4. Temporal References
        self.time_refs = ["today", "tomorrow", "kal", "aaj", "next week", "agle hafte", "monday", "somvaar", "this weekend", "kal shaam"]

        # 5. Expanded 10+ Intent Matrix with Colloquial & Informal Templates
        self.templates = {
            "DOCUMENT_EXPIRATION": [
                ("{name} ka {doc} kab expire ho raha hai?", ["customer_name", "document_type"]),
                ("Bhai dekhna zara, {name} ka {doc} kab khatam ho raha hai.", ["customer_name", "document_type"]),
                ("Check when {name}'s {doc} is expiring", ["customer_name", "document_type"]),
                ("Kiska {doc} agle 30 din me expire hoga?", ["document_type"]),
                ("Show me documents expiring soon for {name}", ["customer_name"]),
                ("{name} ke {doc} ki renewal date kya hai?", ["customer_name", "document_type"]),
                ("{name} ka {doc} renew karwana hai, validity check karo.", ["customer_name", "document_type"]),
                ("List all customer passports and visas expiring within 30 days", [])
            ],
            "PAYMENT_COMMITMENT": [
                ("{name} ka ₹{amount} payment {date} aayega", ["customer_name", "amount", "date"]),
                ("I will pay ₹{amount} {date} via UPI", ["amount", "date"]),
                ("{name} promised to transfer ₹{amount} on {date}", ["customer_name", "amount", "date"]),
                ("{name} ne bola ₹{amount} {date} tak transfer karega", ["customer_name", "amount", "date"]),
                ("Settling the remaining ₹{amount} balance {date}", ["amount", "date"]),
                ("{date} tak {amount} account me aa jayenge {name} ke", ["customer_name", "amount", "date"]),
                ("Bhai {date} ko ₹{amount} GPay kar dunga", ["amount", "date"])
            ],
            "FINANCIAL_STATEMENT": [
                ("Mera profit kitna hua iss month?", ["period"]),
                ("Show me the total net profit and margin for this month", ["period"]),
                ("Iss hafte total kitna kamaya business me?", ["period"]),
                ("What is our total revenue including Kirkol sales?", []),
                ("Aaj counter pe total kitna cash jama hua?", ["channel"]),
                ("Financial health aur expense statement dikhao", []),
                ("What was our net margin after deducting operational rent and work expenses?", []),
                ("Total business income aur net margin ka breakdown do", [])
            ],
            "CREATE_LEAD": [
                ("{name} ke liye ₹{amount} ka naya lead banado", ["customer_name", "amount"]),
                ("Create a new lead for {name} with budget of ₹{amount}", ["customer_name", "amount"]),
                ("{name} ka inquiry aaya hai ₹{amount} value ka", ["customer_name", "amount"]),
                ("Capture new sales prospect {name} expecting ₹{amount}", ["customer_name", "amount"]),
                ("{name} ka {doc} renew karwana hai, naya order daal do ₹{amount} ka.", ["customer_name", "document_type", "amount"]),
                ("Register fresh sales lead for {name} from WhatsApp", ["customer_name"])
            ],
            "OVERDUE_INVOICES": [
                ("Kiska payment baaki hai last 30 days se?", ["period_days"]),
                ("Which customers have overdue invoices?", []),
                ("Unpaid bills aur overdue accounts dikhao", []),
                ("{name} ko bolo baaki ₹{amount} jaldi bhej de.", ["customer_name", "amount"]),
                ("Agar koi invoice 45 din se zyada pending hai to list nikalo.", ["period_days"]),
                ("Show all unpaid client invoices needing WhatsApp chasers", []),
                ("Kaunse clients ne abhi tak invoice pay nahi kiya?", [])
            ],
            "JOB_STATUS_INQUIRY": [
                ("{name} ka {doc} job status kya hai?", ["customer_name", "document_type"]),
                ("Kaam kahan tak pahucha {name} ke {doc} ka?", ["customer_name", "document_type"]),
                ("What is the current stage of {name}'s application?", ["customer_name"]),
                ("{name} ka order Al Uzer me pending hai kya?", ["customer_name"]),
                ("{name} ne pucha {doc} ready ho gaya kya dispatch ke liye.", ["customer_name", "document_type"]),
                ("Check if {name}'s job card is ready for delivery", ["customer_name"]),
                ("Check which client files are stuck in Al Uzer approval.", [])
            ],
            "TASK_SCHEDULING": [
                ("{name} ke liye ek follow-up task schedule karo {date} ko.", ["customer_name", "date"]),
                ("Create an urgent delivery task for operator today", ["date"]),
                ("{date} ko subah {name} ko call karne ka reminder set karo.", ["customer_name", "date"])
            ],
            "CUSTOMER_360_QUERY": [
                ("{name} ka complete history aur purchase profile dikhao.", ["customer_name"]),
                ("What is the lifetime value and transaction history of {name}?", ["customer_name"]),
                ("{name} ka churn risk aur next best action kya hai?", ["customer_name"])
            ]
        }

    def generate_sample(self, intent: str, template: str, entity_keys: List[str]) -> Dict[str, Any]:
        name = random.choice(self.names)
        doc = random.choice(self.doc_types)
        amount = random.choice(self.amounts)
        date = random.choice(self.time_refs)

        text = template.format(name=name, doc=doc, amount=amount, date=date)

        entities: Dict[str, Any] = {}
        if "customer_name" in entity_keys:
            entities["customer_name"] = name
        if "document_type" in entity_keys:
            entities["document_type"] = doc
        if "amount" in entity_keys:
            entities["amount"] = amount
        if "date" in entity_keys:
            entities["date"] = date
        if "period" in entity_keys:
            entities["period"] = "this_month"
        if "period_days" in entity_keys:
            entities["period_days"] = 30
        if "channel" in entity_keys:
            entities["channel"] = "kirkol_pos"

        # Determine language classification
        is_hinglish = any(h in text.lower() for h in ["ka", "ke", "ki", "kab", "kiska", "banado", "aayega", "kamaya", "baaki", "khatam", "kahan", "pahucha", "bhai", "zara", "aaj", "kal", "hafta"])
        
        return {
            "text": text,
            "intent": intent,
            "entities": entities,
            "language": "Hinglish" if is_hinglish else "English"
        }

    def build_dataset(self, samples_per_template: int = 35) -> Dict[str, List[Dict[str, Any]]]:
        all_samples: List[Dict[str, Any]] = []
        seen_texts = set()

        for intent, tmpl_list in self.templates.items():
            for tmpl, entity_keys in tmpl_list:
                for _ in range(samples_per_template):
                    sample = self.generate_sample(intent, tmpl, entity_keys)
                    if sample["text"] not in seen_texts:
                        seen_texts.add(sample["text"])
                        all_samples.append(sample)

        random.seed(42)
        random.shuffle(all_samples)

        n = len(all_samples)
        train_idx = int(0.70 * n)
        val_idx = int(0.85 * n)

        return {
            "train": all_samples[:train_idx],
            "validation": all_samples[train_idx:val_idx],
            "test": all_samples[val_idx:]
        }

    def export_to_disk(self, output_dir: str = "vrys-ai/data"):
        os.makedirs(output_dir, exist_ok=True)
        dataset = self.build_dataset(samples_per_template=35)

        for split, items in dataset.items():
            filepath = os.path.join(output_dir, f"crm_{split}.jsonl")
            with open(filepath, "w", encoding="utf-8") as f:
                for item in items:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")

        summary = {
            "total_unique_samples": sum(len(v) for v in dataset.values()),
            "splits": {k: len(v) for k, v in dataset.items()},
            "intents_covered": list(self.templates.keys())
        }
        with open(os.path.join(output_dir, "dataset_metadata.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        return summary

dataset_pipeline = ExpandedCRMDatasetPipeline()

if __name__ == "__main__":
    summary = dataset_pipeline.export_to_disk()
    print("[SUCCESS] Expanded Multilingual CRM Dataset Generated Successfully!")
    print(json.dumps(summary, indent=2))
