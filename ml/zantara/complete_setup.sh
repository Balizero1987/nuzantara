#!/bin/bash
# ZANTARA Llama 3.1 - Complete Setup Script
# This script completes the entire setup process once you have the RunPod API key

set -e

echo "🚀 ZANTARA Llama 3.1 - Complete Setup"
echo "======================================"
echo ""

# Check if API key provided
if [ -z "$1" ]; then
    echo "❌ Error: RunPod API key required"
    echo ""
    echo "Usage: $0 YOUR_RUNPOD_API_KEY"
    echo ""
    echo "To get your API key:"
    echo "1. Go to: https://www.runpod.io/console/user/settings"
    echo "2. Login with: zero@balizero.com"
    echo "3. Click 'API Keys' section"
    echo "4. Copy your API key (or create new one)"
    echo "5. Run: $0 YOUR_API_KEY"
    exit 1
fi

RUNPOD_API_KEY="$1"
echo "✅ API Key received"
echo ""

# Step 1: Deploy GPU Pod for Merge
echo "📦 Step 1: Deploying GPU Pod for model merge..."
echo "⏳ This will take 2-3 minutes..."
echo ""

POD_RESPONSE=$(curl -s -X POST https://api.runpod.io/v2/pods \
    -H "Authorization: Bearer $RUNPOD_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "cloudType": "SECURE",
        "gpuTypeId": "NVIDIA RTX A6000",
        "name": "zantara-merge",
        "imageName": "runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel",
        "dockerArgs": "",
        "volumeInGb": 50,
        "containerDiskInGb": 50,
        "minVcpuCount": 8,
        "minMemoryInGb": 32
    }')

POD_ID=$(echo $POD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$POD_ID" ]; then
    echo "❌ Failed to create pod. Response:"
    echo "$POD_RESPONSE"
    exit 1
fi

echo "✅ Pod created: $POD_ID"
echo "⏳ Waiting for pod to start (2-3 minutes)..."

# Wait for pod to be ready
for i in {1..60}; do
    POD_STATUS=$(curl -s -X GET "https://api.runpod.io/v2/pods/$POD_ID" \
        -H "Authorization: Bearer $RUNPOD_API_KEY" | \
        python3 -c "import sys, json; print(json.load(sys.stdin).get('desiredStatus', ''))")

    if [ "$POD_STATUS" = "RUNNING" ]; then
        echo "✅ Pod is running!"
        break
    fi

    echo "   Status: $POD_STATUS (attempt $i/60)"
    sleep 5
done

# Step 2: Upload and run merge script
echo ""
echo "🔧 Step 2: Running model merge on GPU..."

# Get pod connection info
POD_INFO=$(curl -s -X GET "https://api.runpod.io/v2/pods/$POD_ID" \
    -H "Authorization: Bearer $RUNPOD_API_KEY")

SSH_HOST=$(echo $POD_INFO | python3 -c "import sys, json; print(json.load(sys.stdin).get('runtime', {}).get('ports', [{}])[0].get('ip', ''))")
SSH_PORT=$(echo $POD_INFO | python3 -c "import sys, json; print(json.load(sys.stdin).get('runtime', {}).get('ports', [{}])[0].get('publicPort', ''))")

if [ -z "$SSH_HOST" ] || [ -z "$SSH_PORT" ]; then
    echo "⚠️  Could not get SSH info. Pod may still be initializing."
    echo "Pod ID: $POD_ID"
    echo "Check status at: https://www.runpod.io/console/pods"
    exit 1
fi

echo "📡 SSH: $SSH_HOST:$SSH_PORT"

# Copy merge script
echo "📤 Uploading merge script..."
scp -P $SSH_PORT -o StrictHostKeyChecking=no \
    ml/zantara/runpod_merge.sh root@$SSH_HOST:/workspace/

# Run merge
echo "⚙️  Running merge (15-20 minutes)..."
ssh -p $SSH_PORT -o StrictHostKeyChecking=no root@$SSH_HOST \
    "cd /workspace && chmod +x runpod_merge.sh && ./runpod_merge.sh"

echo "✅ Model merged and uploaded to HuggingFace!"
echo ""

# Step 3: Create Serverless Endpoint
echo "🌐 Step 3: Creating RunPod Serverless endpoint..."

ENDPOINT_RESPONSE=$(curl -s -X POST https://api.runpod.io/v2/endpoints \
    -H "Authorization: Bearer $RUNPOD_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "zantara-llama-3.1",
        "gpuTypeId": "NVIDIA RTX A6000",
        "model": "zeroai87/zantara-llama-3.1-8b-merged",
        "workers": {
            "min": 0,
            "max": 2
        },
        "idleTimeout": 5
    }')

ENDPOINT_ID=$(echo $ENDPOINT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

if [ -z "$ENDPOINT_ID" ]; then
    echo "❌ Failed to create endpoint. Response:"
    echo "$ENDPOINT_RESPONSE"
else
    ENDPOINT_URL="https://api.runpod.ai/v2/$ENDPOINT_ID/run"
    echo "✅ Endpoint created: $ENDPOINT_URL"
fi

# Step 4: Terminate GPU Pod
echo ""
echo "🧹 Step 4: Terminating GPU pod..."
curl -s -X DELETE "https://api.runpod.io/v2/pods/$POD_ID" \
    -H "Authorization: Bearer $RUNPOD_API_KEY"
echo "✅ Pod terminated"

# Step 5: Update .env
echo ""
echo "📝 Step 5: Updating .env file..."

if [ -f .env ]; then
    # Remove old entries if they exist
    sed -i.bak '/RUNPOD_LLAMA_ENDPOINT/d' .env
    sed -i.bak '/RUNPOD_API_KEY/d' .env
fi

cat >> .env << EOFENV

# ZANTARA Llama 3.1 (RunPod Serverless)
RUNPOD_LLAMA_ENDPOINT=$ENDPOINT_URL
RUNPOD_API_KEY=$RUNPOD_API_KEY
EOFENV

echo "✅ .env updated"

# Done!
echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "Your ZANTARA Llama 3.1 model is now integrated into NUZANTARA!"
echo ""
echo "Endpoint: $ENDPOINT_URL"
echo "Model: zeroai87/zantara-llama-3.1-8b-merged"
echo ""
echo "Test it with:"
echo '  curl http://localhost:8080/ai/chat -d '"'"'{"message":"Bagaimana cara meningkatkan produktivitas tim?","provider":"zantara"}'"'"''
echo ""
echo "Or let auto-routing choose ZANTARA for Indonesian/business queries:"
echo '  curl http://localhost:8080/ai/chat -d '"'"'{"message":"Bagaimana cara meningkatkan produktivitas tim?"}'"'"''
echo ""
echo "💰 Estimated cost: ~$0.00045 per request (~$3-5/month)"
echo ""
