# ZANTARA Bridge v1.0

ChatGPT Atlas ⇄ Local AI Executor Bridge System

## Quick Start

1. **Start the bridge server:**
   ```bash
   python bridge_server.py
   ```

2. **Start the watcher (in another terminal):**
   ```bash
   python bridge_watcher.py
   ```

3. **Submit a task:**
   ```bash
   ./bridge_client.sh "Your task here" "context" "priority"
   ```

## Components

- `bridge_server.py` - FastAPI server that receives tasks
- `bridge_watcher.py` - Auto-processor that watches inbox and executes tasks
- `bridge_client.sh` - CLI tool to submit tasks
- `config/bridge_config.yaml` - Configuration file

## Directory Structure

```
.zantara/bridge/
├── inbox/          - New tasks land here
├── executed/       - Completed tasks moved here
├── logs/           - Server and watcher logs
├── config/         - Configuration files
├── bridge_server.py
├── bridge_watcher.py
└── bridge_client.sh
```

## Configuration

Edit `config/bridge_config.yaml` to customize:
- Processor type (claude, manual)
- Auto-processing behavior
- Logging settings
- Context-specific configurations

## Endpoints

- `POST /commit` - Submit a new task
- `GET /status` - Check inbox/executed status
- `POST /mark_done` - Mark task as completed
- `GET /health` - Health check
- `GET /logs` - Retrieve logs

## Examples

Submit a high-priority task:
```bash
./bridge_client.sh "Implement auth module" "nuzantara" "high"
```

Check status:
```bash
curl http://127.0.0.1:5050/status | jq
```

View logs:
```bash
curl http://127.0.0.1:5050/logs | jq
```
