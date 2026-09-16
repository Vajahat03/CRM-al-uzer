"""
Al Uzer Fine-Tuning Pipeline
Trains a Transformer model with LoRA adapters on the Al Uzer dataset.
"""

import os
import yaml
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq
)
from peft import LoraConfig, get_peft_model, TaskType

def load_config(config_path: str = "training/configs/lora_config.yaml"):
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def format_chat_prompt(messages, tokenizer):
    if hasattr(tokenizer, "apply_chat_template"):
        return tokenizer.apply_chat_template(messages, tokenize=False)
    # Fallback chat format
    text = ""
    for m in messages:
        text += f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n"
    return text

def preprocess_dataset(dataset, tokenizer, max_seq_length):
    def tokenize_fn(examples):
        inputs = [format_chat_prompt(msgs, tokenizer) for msgs in examples["messages"]]
        model_inputs = tokenizer(inputs, max_length=max_seq_length, truncation=True, padding=False)
        model_inputs["labels"] = model_inputs["input_ids"].copy()
        return model_inputs

    return dataset.map(tokenize_fn, batched=True, remove_columns=dataset.column_names)

def main():
    config = load_config()
    print("Loaded training configuration:", config)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Executing on device: {device.upper()}")

    base_model_name = config.get("base_model", "Qwen/Qwen2.5-0.5B-Instruct")
    output_dir = config.get("output_dir", "models/aluzer-model")
    lora_cfg = config.get("lora", {})
    train_cfg = config.get("training", {})

    print(f"Loading tokenizer & model: {base_model_name}")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None,
        trust_remote_code=True
    )

    # Configure PEFT / LoRA
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=lora_cfg.get("r", 16),
        lora_alpha=lora_cfg.get("lora_alpha", 32),
        lora_dropout=lora_cfg.get("lora_dropout", 0.05),
        target_modules=lora_cfg.get("target_modules", ["q_proj", "v_proj"])
    )

    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # Load data
    data_files = {
        "train": "training/data/train.jsonl",
        "validation": "training/data/validation.jsonl"
    }
    raw_datasets = load_dataset("json", data_files=data_files)
    tokenized_train = preprocess_dataset(raw_datasets["train"], tokenizer, train_cfg.get("max_seq_length", 1024))
    tokenized_val = preprocess_dataset(raw_datasets["validation"], tokenizer, train_cfg.get("max_seq_length", 1024))

    training_args = TrainingArguments(
        output_dir=output_dir,
        learning_rate=float(train_cfg.get("learning_rate", 2e-4)),
        num_train_epochs=train_cfg.get("num_epochs", 3),
        per_device_train_batch_size=train_cfg.get("per_device_train_batch_size", 4),
        per_device_eval_batch_size=train_cfg.get("per_device_eval_batch_size", 4),
        gradient_accumulation_steps=train_cfg.get("gradient_accumulation_steps", 4),
        logging_steps=train_cfg.get("logging_steps", 10),
        save_strategy=train_cfg.get("save_strategy", "epoch"),
        eval_strategy=train_cfg.get("evaluation_strategy", "epoch"),
        fp16=(device == "cuda" and train_cfg.get("fp16", False)),
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_val,
        tokenizer=tokenizer,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8)
    )

    print("Starting LoRA fine-tuning...")
    trainer.train()

    print(f"Saving fine-tuned Al Uzer LoRA adapter to {output_dir}")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print("Fine-tuning completed successfully.")

if __name__ == "__main__":
    main()
