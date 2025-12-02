# Nuzantara AI Engine

Deployment configuration for Ollama-based AI engine with Jaksel-tuned GGUF model.

## Prerequisites

- Fly.io CLI installed and authenticated
- GGUF model file: `nuzantara-jaksel.gguf`

## Deployment Steps

### 1. Create Persistent Volume

```bash
fly volumes create ai_data --region sin --size 10
```

### 2. Upload Model File

Upload the GGUF model to the persistent volume:

```bash
# Option 1: Using fly ssh console
fly ssh console -a nuzantara-ai-engine
# Then upload via scp or other method to /data/nuzantara-jaksel.gguf

# Option 2: Using fly sftp
fly ssh sftp shell -a nuzantara-ai-engine
# Navigate to /data and upload the file
```

### 3. Deploy Application

```bash
cd apps/ai-engine
fly deploy
```

### 4. Verify Deployment

```bash
# Check service status
fly status -a nuzantara-ai-engine

# Test API
curl https://nuzantara-ai-engine.fly.dev/api/tags

# Check logs
fly logs -a nuzantara-ai-engine
```

## Configuration

- **App Name**: `nuzantara-ai-engine`
- **Region**: Singapore (`sin`)
- **VM Size**: `performance-4x` (4 CPU, 8GB RAM)
- **Port**: 11434 (Ollama default)
- **Model**: `nuzantara-jaksel` (loaded from `/data/nuzantara-jaksel.gguf`)

## Model Configuration

The model is automatically created on first startup with:
- **Temperature**: 0.8
- **System Prompt**: Jaksel-style Visa Consultant personality

## Troubleshooting

### Model Not Found
If the model doesn't exist, check:
1. Model file is in `/data/nuzantara-jaksel.gguf`
2. Volume is properly mounted
3. Check logs: `fly logs -a nuzantara-ai-engine`

### Service Not Starting
Check:
1. Ollama API is accessible: `curl http://localhost:11434/api/tags`
2. Container logs for errors
3. Volume mount status

## API Usage

Once deployed, use the Ollama API:

```bash
# List models
curl https://nuzantara-ai-engine.fly.dev/api/tags

# Generate response
curl https://nuzantara-ai-engine.fly.dev/api/generate -d '{
  "model": "nuzantara-jaksel",
  "prompt": "Ciao, come stai?",
  "stream": false
}'
```
