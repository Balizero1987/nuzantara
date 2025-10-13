# RunPod Serverless Setup for ZANTARA Llama 3.1

## Step 1: Create Serverless Endpoint

1. Go to https://www.runpod.io/console/serverless
2. Click "New Endpoint"
3. Configure:
   - **Name**: zantara-llama-3.1
   - **Model**: Custom Template
   - **GPU**: RTX 4090 or A100
   - **Workers**: 0-2 (auto-scale)

## Step 2: Deploy Model

Create deployment with:
- Base model: `meta-llama/Llama-3.1-8B-Instruct`
- LoRA adapter: `zeroai87/zantara-llama-3.1-8b`
- Container: `runpod/pytorch:2.1.0-py3.10-cuda12.1.0-devel`

## Step 3: Handler Code

```python
# handler.py for RunPod
import runpod
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Load model on startup
BASE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
ADAPTER_MODEL = "zeroai87/zantara-llama-3.1-8b"

print("Loading base model...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16,
    device_map="auto"
)

print("Loading adapter...")
model = PeftModel.from_pretrained(base_model, ADAPTER_MODEL)
model.eval()

def handler(event):
    """RunPod handler function"""
    input_data = event["input"]
    prompt = input_data.get("prompt", "")
    max_tokens = input_data.get("max_new_tokens", 500)
    temperature = input_data.get("temperature", 0.7)
    
    # Format prompt
    messages = [
        {"role": "system", "content": "You are ZANTARA, an intelligent AI assistant."},
        {"role": "user", "content": prompt}
    ]
    
    formatted_prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    # Generate
    inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            do_sample=True
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract answer
    if "assistant" in response:
        answer = response.split("assistant")[-1].strip()
    else:
        answer = response
    
    return {"output": answer}

runpod.serverless.start({"handler": handler})
```

## Step 4: Docker Configuration

```dockerfile
# Dockerfile
FROM runpod/pytorch:2.1.0-py3.10-cuda12.1.0-devel

WORKDIR /app

RUN pip install transformers peft accelerate bitsandbytes runpod

COPY handler.py .

CMD ["python", "-u", "handler.py"]
```

## Step 5: Deploy

```bash
# Build and push
docker build -t your-dockerhub/zantara-llama:latest .
docker push your-dockerhub/zantara-llama:latest

# Configure endpoint to use this image
```

## Estimated Costs

- **Cold start**: 10-20 seconds (first request)
- **Warm inference**: 2-3 seconds
- **Cost per second**: $0.00015
- **Average request**: ~3 seconds = $0.00045
- **100 requests/day**: $0.045/day = $1.35/month
- **1000 requests/day**: $0.45/day = $13.50/month

## Alternative: Use RunPod's Pre-built Template

If RunPod has a vLLM template, use that instead (much easier):
1. Select "vLLM Template"
2. Set model: `zeroai87/zantara-llama-3.1-8b` (if merged)
3. Done!

Cost is the same.
