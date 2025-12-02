FROM ollama/ollama:latest

# Install curl for healthchecks and debugging
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Expose the default Ollama port
EXPOSE 11434

# Copy and prepare the startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]

