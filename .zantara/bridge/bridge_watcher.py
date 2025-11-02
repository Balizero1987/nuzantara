#!/usr/bin/env python3
"""
=============================================================================
ZANTARA BRIDGE WATCHER v1.0 - Auto-processor for incoming tasks
=============================================================================
Author: Bali Zero / Antonello Siano
Purpose: Watches the inbox directory and automatically processes new tasks
         by triggering Claude Code CLI or other local AI agents

Features:
  - File system watcher for inbox directory
  - Automatic task parsing from YAML
  - Claude Code CLI integration
  - Configurable processing strategies
  - Auto-move to executed after processing
=============================================================================
"""

import time
import subprocess
import yaml
import logging
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import requests

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_DIR = Path(__file__).parent
INBOX_DIR = BASE_DIR / "inbox"
EXECUTED_DIR = BASE_DIR / "executed"
LOGS_DIR = BASE_DIR / "logs"
CONFIG_FILE = BASE_DIR / "config" / "bridge_config.yaml"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / f"watcher_{datetime.utcnow().date()}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ZantaraWatcher")

# =============================================================================
# CONFIGURATION LOADER
# =============================================================================

def load_config():
    """Load configuration from YAML file"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r') as f:
            return yaml.safe_load(f)
    return {
        "watcher": {
            "enabled": True,
            "auto_process": True,
            "processor": "claude"
        },
        "processors": {
            "claude": {
                "command": "claude",
                "enabled": True
            },
            "manual": {
                "enabled": True
            }
        },
        "bridge_server": {
            "url": "http://127.0.0.1:5050"
        }
    }

config = load_config()

# =============================================================================
# TASK PROCESSOR
# =============================================================================

class TaskProcessor:
    """Process tasks using different strategies"""

    def __init__(self, config):
        self.config = config
        self.bridge_url = config.get("bridge_server", {}).get("url", "http://127.0.0.1:5050")

    def process_task(self, file_path: Path):
        """Process a task file"""
        try:
            logger.info(f"Processing task: {file_path.name}")

            # Read task data
            with open(file_path, 'r') as f:
                task_data = yaml.safe_load(f)

            task_id = task_data.get("task_id", "unknown")
            task = task_data.get("task", "")
            context = task_data.get("context", "general")
            priority = task_data.get("priority", "medium")

            logger.info(f"Task ID: {task_id}")
            logger.info(f"Context: {context}")
            logger.info(f"Priority: {priority}")
            logger.info(f"Task: {task[:100]}...")

            # Choose processor
            processor_type = self.config.get("watcher", {}).get("processor", "claude")

            if processor_type == "claude":
                self._process_with_claude(task, context, task_id)
            elif processor_type == "manual":
                self._process_manual(task, context, task_id)
            else:
                logger.warning(f"Unknown processor: {processor_type}")
                return False

            # Mark as done
            self._mark_done(file_path.name)

            return True

        except Exception as e:
            logger.error(f"Error processing task {file_path.name}: {str(e)}")
            return False

    def _process_with_claude(self, task: str, context: str, task_id: str):
        """Process task using Claude Code CLI in a new iTerm2 window"""
        try:
            logger.info(f"Processing with Claude Code CLI...")

            # Create a formatted prompt
            prompt = f"""Task from ChatGPT Atlas Bridge:

Context: {context}
Task ID: {task_id}

Task Description:
{task}

Please analyze this task and execute it if appropriate. If you need clarification, explain what additional information is needed."""

            # Create a temporary script to run in iTerm2
            script_file = LOGS_DIR / f"claude_task_{task_id}.sh"
            with open(script_file, 'w') as f:
                f.write(f"""#!/bin/bash
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║  ZANTARA BRIDGE - Claude Code CLI Execution                                ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Task ID:   {task_id}"
echo "Context:   {context}"
echo "Priority:  (from ChatGPT Atlas)"
echo ""
echo "Task Description:"
echo "{task}"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Starting Claude Code CLI..."
echo ""

cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Execute Claude
claude "{prompt.replace('"', '\\"')}"

EXITCODE=$?

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
if [ $EXITCODE -eq 0 ]; then
    echo "✓ Task completed successfully!"
else
    echo "✗ Task failed with exit code $EXITCODE"
fi
echo ""
echo "Press any key to close this window..."
read -n 1
""")

            # Make script executable
            script_file.chmod(0o755)

            # Open new iTerm2 window with the script
            applescript = f'''
            tell application "iTerm"
                activate
                create window with default profile
                tell current session of current window
                    write text "bash {script_file}"
                end tell
            end tell
            '''

            subprocess.run(
                ["osascript", "-e", applescript],
                capture_output=True,
                text=True
            )

            logger.info(f"Claude execution started in new iTerm2 window for task {task_id}")
            logger.info(f"Script location: {script_file}")

        except FileNotFoundError:
            logger.error("Claude CLI not found. Please ensure 'claude' command is available.")
            logger.info("Falling back to manual processing...")
            self._process_manual(task, context, task_id)
        except Exception as e:
            logger.error(f"Error executing Claude: {str(e)}")

    def _process_manual(self, task: str, context: str, task_id: str):
        """Process task manually (just log it for user to handle)"""
        logger.info(f"Manual processing mode - Task logged for manual review")
        logger.info(f"Task ID: {task_id}")
        logger.info(f"Context: {context}")
        logger.info(f"Task: {task}")

        # Create a manual task file for easy review
        manual_file = LOGS_DIR / f"manual_task_{task_id}.txt"
        with open(manual_file, 'w') as f:
            f.write(f"Task ID: {task_id}\n")
            f.write(f"Context: {context}\n")
            f.write(f"Timestamp: {datetime.utcnow().isoformat()}\n")
            f.write(f"\nTask:\n{task}\n")
            f.write(f"\n{'='*70}\n")
            f.write(f"To execute: claude \"{task}\"\n")

        logger.info(f"Manual task file created: {manual_file}")

    def _mark_done(self, filename: str):
        """Mark task as done via bridge server"""
        try:
            response = requests.post(
                f"{self.bridge_url}/mark_done",
                json={"filename": filename},
                timeout=5
            )
            if response.status_code == 200:
                logger.info(f"Task marked as done: {filename}")
            else:
                logger.warning(f"Failed to mark task done: {response.text}")
        except Exception as e:
            logger.error(f"Error marking task done: {str(e)}")
            # Fallback: move file manually
            try:
                src = INBOX_DIR / filename
                dst = EXECUTED_DIR / filename
                if src.exists():
                    src.rename(dst)
                    logger.info(f"Task moved manually to executed: {filename}")
            except Exception as move_error:
                logger.error(f"Failed to move file manually: {str(move_error)}")

# =============================================================================
# FILE SYSTEM WATCHER
# =============================================================================

class InboxWatcher(FileSystemEventHandler):
    """Watch inbox directory for new YAML files"""

    def __init__(self, processor: TaskProcessor):
        self.processor = processor
        self.processing = set()  # Track files being processed

    def on_created(self, event):
        """Handle new file creation"""
        if event.is_directory:
            return

        file_path = Path(event.src_path)

        # Only process YAML files
        if file_path.suffix not in ['.yaml', '.yml']:
            return

        # Avoid processing the same file twice
        if file_path.name in self.processing:
            return

        # Small delay to ensure file is fully written
        time.sleep(0.5)

        # Mark as processing
        self.processing.add(file_path.name)

        try:
            logger.info(f"New task detected: {file_path.name}")
            self.processor.process_task(file_path)
        finally:
            # Remove from processing set
            self.processing.discard(file_path.name)

    def on_modified(self, event):
        """Handle file modifications (in case file is written in chunks)"""
        # We mainly rely on on_created, but this ensures we catch edge cases
        pass

# =============================================================================
# MAIN
# =============================================================================

def main():
    """Main watcher loop"""
    logger.info("=" * 70)
    logger.info("ZANTARA Bridge Watcher v1.0 - Starting")
    logger.info(f"Watching directory: {INBOX_DIR}")
    logger.info(f"Configuration: {CONFIG_FILE}")
    logger.info("=" * 70)

    # Check if watcher is enabled
    if not config.get("watcher", {}).get("enabled", True):
        logger.warning("Watcher is disabled in configuration. Exiting.")
        return

    # Create processor
    processor = TaskProcessor(config)

    # Process any existing files in inbox
    logger.info("Checking for existing tasks in inbox...")
    existing_files = sorted(INBOX_DIR.glob("*.yaml"))
    if existing_files:
        logger.info(f"Found {len(existing_files)} existing task(s)")
        for file_path in existing_files:
            processor.process_task(file_path)
    else:
        logger.info("No existing tasks found")

    # Setup file system watcher
    event_handler = InboxWatcher(processor)
    observer = Observer()
    observer.schedule(event_handler, str(INBOX_DIR), recursive=False)

    # Start watching
    observer.start()
    logger.info("Watcher started. Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping watcher...")
        observer.stop()

    observer.join()
    logger.info("Watcher stopped.")

if __name__ == "__main__":
    main()
