#!/bin/bash

# Script per caricare file su Google Drive tramite ZANTARA

# Parametri
FILE_PATH="$1"
FILE_NAME="$2"
FOLDER_ID="${3:-1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr}"  # Default: AMBARADAM/ZERO

if [ -z "$FILE_PATH" ] || [ -z "$FILE_NAME" ]; then
    echo "Usage: ./upload-to-drive.sh <file_path> <file_name> [folder_id]"
    echo "Example: ./upload-to-drive.sh ~/Desktop/file.pdf file.pdf"
    exit 1
fi

# Detect MIME type
MIME_TYPE=$(file -b --mime-type "$FILE_PATH")

# Convert to base64
BASE64_CONTENT=$(base64 -i "$FILE_PATH" | tr -d '\n')

# Upload via orchestrator
echo "Uploading $FILE_NAME to Google Drive..."

curl -X POST "https://integrations-orchestrator-1064094238013.europe-west1.run.app/job" \
  -H "Content-Type: application/json" \
  -d "{
    \"integration\": \"drive.upload\",
    \"params\": {
      \"fileName\": \"$FILE_NAME\",
      \"mimeType\": \"$MIME_TYPE\",
      \"media\": {
        \"mimeType\": \"$MIME_TYPE\",
        \"body\": \"$BASE64_CONTENT\"
      },
      \"parents\": [\"$FOLDER_ID\"],
      \"supportsAllDrives\": true
    }
  }" | jq '.'

echo "Upload complete!"