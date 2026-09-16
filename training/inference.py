"""
Al Uzer CLI Inference Utility
Test trained Transformer model directly from terminal.
"""

import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

SYSTEM_PROMPT = (
    "You are the Al Uzer CRM Master Intelligence AI. "
    "Predict appropriate CRM tool calls in the format:\n"
    "<tool_call>\n{\"name\": \"<tool_name>\", \"arguments\": {<args>}}\n</tool_call>\n"
)

def run_cli_inference(model_path="models/aluzer-model", base_model_name="Qwen/Qwen2.5-0.5B-Instruct"):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading Al Uzer AI Model on {device.upper()}...")

    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None,
        trust_remote_code=True
    )

    try:
        model = PeftModel.from_pretrained(base_model, model_path)
        print("Successfully loaded fine-tuned LoRA adapter.")
    except Exception as e:
        print(f"Note: Running base model ({e})")
        model = base_model

    model.eval()
    print("\n=== Al Uzer AI Inference CLI Ready ===")
    print("Type your message (or 'exit' to quit):\n")

    while True:
        try:
            query = input("You > ").strip()
            if query.lower() in ["exit", "quit", "q"]:
                break
            if not query:
                continue

            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": query}
            ]

            prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            inputs = tokenizer([prompt], return_tensors="pt").to(device)

            with torch.no_grad():
                generated_ids = model.generate(
                    **inputs,
                    max_new_tokens=256,
                    temperature=0.1,
                    top_p=0.9
                )
            generated_ids = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
            print(f"\nAl Uzer AI >\n{response}\n")
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    run_cli_inference()
