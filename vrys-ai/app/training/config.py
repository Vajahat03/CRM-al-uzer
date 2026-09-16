"""
VRYS AI — Training & Evaluation Configuration (Step 5.1)
Defines base open-weight model targets, LoRA hyperparameters, and evaluation thresholds.
"""
import os

class TrainingConfig:
    # 1. Base Model Selection
    # Default to high-efficiency Qwen2.5-1.5B / Llama-3.2-3B / Phi-3.5-mini for local developer machines
    BASE_MODEL_NAME = os.getenv("VRYS_BASE_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")
    FALLBACK_MODEL_NAME = "microsoft/Phi-3.5-mini-instruct"
    
    # 2. Paths
    DATA_DIR = "vrys-ai/data"
    OUTPUT_DIR = "vrys-ai/models/vrys_crm_lora_v1"
    EVALUATION_REPORT_DIR = "vrys-ai/reports"
    
    TRAIN_FILE = os.path.join(DATA_DIR, "crm_train.jsonl")
    VAL_FILE = os.path.join(DATA_DIR, "crm_validation.jsonl")
    TEST_FILE = os.path.join(DATA_DIR, "crm_test.jsonl")
    HOLDOUT_FILE = os.path.join(DATA_DIR, "human_holdout_test.jsonl")
    TOOL_FILE = os.path.join(DATA_DIR, "tool_calling_dataset.jsonl")

    # 3. LoRA Hyperparameters (Parameter-Efficient Fine-Tuning)
    LORA_R = 16
    LORA_ALPHA = 32
    LORA_DROPOUT = 0.05
    TARGET_MODULES = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]

    # 4. Training Optimization
    BATCH_SIZE = 4
    GRADIENT_ACCUMULATION_STEPS = 4
    LEARNING_RATE = 2e-4
    NUM_EPOCHS = 3
    MAX_SEQ_LENGTH = 512
    WARMUP_RATIO = 0.03
    FP16 = False # Set True on CUDA GPU

    # 5. Production Benchmark Targets
    TARGET_INTENT_ACCURACY = 0.95
    TARGET_ENTITY_F1 = 0.92
    TARGET_SCHEMA_VALIDITY = 1.00 # 100% Valid JSON required
    TARGET_INVALID_TOOL_RATE = 0.00 # 0% Unmapped tools allowed

training_config = TrainingConfig()
