#!/bin/bash

# Start Ollama in the background
echo "🚀 Starting Ollama service..."

ollama serve &

# Loop and wait until the local API is reachable
echo "⏳ Waiting for Ollama API to become available..."

until curl -s http://localhost:11434/api/tags > /dev/null; do
    sleep 2
done

echo "✅ Ollama is up and running!"

# Check if the specific model exists
if ! ollama list | grep -q "nuzantara-jaksel"; then
    echo "⚠️ Model 'nuzantara-jaksel' not found. Initialization starting..."
    
    # Create the Modelfile dynamically
    echo "📝 Generating Modelfile..."
    cat <<EOF > Modelfile
FROM /data/nuzantara-jaksel.gguf
PARAMETER temperature 0.8
SYSTEM "You are a Visa Consultant in South Jakarta. You speak in a mix of Indonesian and English (Jaksel style). You are helpful, trendy, and knowledgeable about visas and regulations."
EOF

    # Create the custom model
    echo "🔨 Creating model 'nuzantara-jaksel' from GGUF..."
    ollama create nuzantara-jaksel -f Modelfile
    
    echo "✨ Model created successfully!"
else
    echo "👌 Model 'nuzantara-jaksel' already exists. Skipping creation."
fi

# Keep the script running to keep the container alive
echo "🟢 Service ready. Keeping container alive..."

wait

