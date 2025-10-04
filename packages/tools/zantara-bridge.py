#!/usr/bin/env python3
"""
ZANTARA Bridge Script - Fixes common API parameter issues
Author: Claude for Zero
Usage: python3 zantara-bridge.py
"""

import requests
import json
import sys
from typing import Dict, Any

# Configuration
API_URL = "https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app/call"
API_KEY = "zantara-internal-dev-key-2025"

class ZantaraBridge:
    def __init__(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        }

    def fix_parameters(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Fix common parameter issues in commands"""

        # Fix drive.upload: name -> fileName
        if command.get('key') == 'drive.upload':
            if 'params' in command and 'name' in command['params']:
                command['params']['fileName'] = command['params']['name']
                del command['params']['name']
                print(f"✅ Fixed: 'name' → 'fileName' for drive.upload")

        # Fix lead.save: ensure params wrapper
        elif command.get('key') == 'lead.save':
            if 'name' in command and 'params' not in command:
                command = {
                    'key': 'lead.save',
                    'params': {k: v for k, v in command.items() if k != 'key'}
                }
                print(f"✅ Fixed: wrapped parameters in 'params' for lead.save")

        # Fix quote.generate: ensure params wrapper
        elif command.get('key') == 'quote.generate':
            if 'service' in command and 'params' not in command:
                command = {
                    'key': 'quote.generate',
                    'params': {k: v for k, v in command.items() if k != 'key'}
                }
                print(f"✅ Fixed: wrapped parameters in 'params' for quote.generate")

        return command

    def send_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Send command to ZANTARA API after fixing parameters"""

        # Fix parameters
        fixed_command = self.fix_parameters(command)

        # Send request
        try:
            response = requests.post(
                API_URL,
                headers=self.headers,
                json=fixed_command,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'ok': False, 'error': str(e)}

    def interactive_mode(self):
        """Interactive mode for testing commands"""
        print("🚀 ZANTARA Bridge Interactive Mode")
        print("📝 Enter commands as JSON (or 'exit' to quit)")
        print("💡 Example: {\"key\": \"drive.upload\", \"params\": {\"name\": \"test.txt\", ...}}")
        print("-" * 50)

        while True:
            try:
                # Get input
                user_input = input("\n📥 Command: ").strip()

                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("👋 Goodbye!")
                    break

                # Parse JSON
                command = json.loads(user_input)

                # Send command
                print(f"\n📤 Sending to ZANTARA...")
                result = self.send_command(command)

                # Display result
                print(f"\n📨 Response:")
                print(json.dumps(result, indent=2))

            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON: {e}")
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

# Quick command shortcuts
def upload_to_drive(filename: str, content: str, folder_id: str = None):
    """Upload a file to Google Drive"""
    import base64

    bridge = ZantaraBridge()

    # Encode content to base64
    if not content.startswith('VG'):  # Not already base64
        content_b64 = base64.b64encode(content.encode()).decode()
    else:
        content_b64 = content

    command = {
        "key": "drive.upload",
        "params": {
            "name": filename,  # Will be auto-fixed to fileName
            "mimeType": "text/plain",
            "media": {
                "body": content_b64
            },
            "supportsAllDrives": True
        }
    }

    if folder_id:
        command["params"]["parents"] = [folder_id]

    return bridge.send_command(command)

def save_lead(name: str, email: str, service: str):
    """Save a lead to ZANTARA"""
    bridge = ZantaraBridge()

    command = {
        "key": "lead.save",
        "name": name,  # Will be auto-wrapped in params
        "email": email,
        "service": service,
        "details": f"Lead from {name} for {service}"
    }

    return bridge.send_command(command)

def list_files(folder_id: str = None, page_size: int = 10):
    """List files from Google Drive"""
    bridge = ZantaraBridge()

    command = {
        "key": "drive.list",
        "params": {
            "pageSize": page_size
        }
    }

    if folder_id:
        command["params"]["q"] = f"'{folder_id}' in parents"

    return bridge.send_command(command)

# Main execution
if __name__ == "__main__":
    bridge = ZantaraBridge()

    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            # Test mode
            print("🧪 Testing ZANTARA Bridge...")

            # Test health check
            result = bridge.send_command({"key": "contact.info", "params": {}})
            if result.get('ok'):
                print("✅ API connection working!")
            else:
                print(f"❌ API connection failed: {result}")

            # Test drive.upload fix
            print("\n📝 Testing drive.upload parameter fix...")
            test_command = {
                "key": "drive.upload",
                "params": {
                    "name": "test.txt",  # Wrong parameter
                    "mimeType": "text/plain",
                    "media": {"body": "VGVzdA=="}
                }
            }
            fixed = bridge.fix_parameters(test_command.copy())
            if 'fileName' in fixed['params'] and 'name' not in fixed['params']:
                print("✅ Parameter fix working!")
            else:
                print("❌ Parameter fix failed")

        elif sys.argv[1] == "upload" and len(sys.argv) >= 4:
            # Upload file: python3 zantara-bridge.py upload filename.txt "content" [folder_id]
            filename = sys.argv[2]
            content = sys.argv[3]
            folder_id = sys.argv[4] if len(sys.argv) > 4 else None

            print(f"📤 Uploading {filename}...")
            result = upload_to_drive(filename, content, folder_id)
            if result.get('ok'):
                print(f"✅ Uploaded: {result['data']['file']['webViewLink']}")
            else:
                print(f"❌ Upload failed: {result}")

        elif sys.argv[1] == "lead" and len(sys.argv) >= 5:
            # Save lead: python3 zantara-bridge.py lead "Name" "email" "service"
            name = sys.argv[2]
            email = sys.argv[3]
            service = sys.argv[4]

            print(f"💼 Saving lead for {name}...")
            result = save_lead(name, email, service)
            if result.get('ok'):
                print(f"✅ Lead saved: {result['data']['leadId']}")
            else:
                print(f"❌ Save failed: {result}")

        elif sys.argv[1] == "list":
            # List files: python3 zantara-bridge.py list [folder_id]
            folder_id = sys.argv[2] if len(sys.argv) > 2 else None

            print(f"📂 Listing files...")
            result = list_files(folder_id)
            if result.get('ok'):
                files = result['data']['files']
                for file in files:
                    print(f"  - {file['name']} ({file.get('size', 'folder')})")
            else:
                print(f"❌ List failed: {result}")

        else:
            # Show help
            print("""
🚀 ZANTARA Bridge - Usage:

Interactive mode:
  python3 zantara-bridge.py

Test connection:
  python3 zantara-bridge.py test

Upload file:
  python3 zantara-bridge.py upload "filename.txt" "content" [folder_id]

Save lead:
  python3 zantara-bridge.py lead "Name" "email@example.com" "visa"

List files:
  python3 zantara-bridge.py list [folder_id]

Examples:
  python3 zantara-bridge.py upload "test.txt" "Hello World"
  python3 zantara-bridge.py upload "amanda.txt" "Test" "1tKxMQXMqtvt5Vdi5C1KiFZKUK8-OQaHc"
  python3 zantara-bridge.py lead "Mario Rossi" "mario@test.com" "visa"
  python3 zantara-bridge.py list "1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr"
            """)
    else:
        # Interactive mode
        bridge.interactive_mode()