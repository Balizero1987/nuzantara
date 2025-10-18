#!/usr/bin/env python3

import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaInMemoryUpload

# Load service account key
with open('zantara-v2-key.json', 'r') as f:
    key = json.load(f)

# Create credentials with impersonation
credentials = service_account.Credentials.from_service_account_info(
    key,
    scopes=['https://www.googleapis.com/auth/drive']
)

# Impersonate Zero
delegated_credentials = credentials.with_subject('zero@balizero.com')

# Build Drive service
service = build('drive', 'v3', credentials=delegated_credentials)

# Create a test file in ZERO folder
folder_id = '1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr'

file_metadata = {
    'name': 'test-from-python.txt',
    'parents': [folder_id]
}

# File content
content = b'Test file created from Python with impersonation'
media = MediaInMemoryUpload(content, mimetype='text/plain')

try:
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id,name,webViewLink',
        supportsAllDrives=True
    ).execute()

    print(f"File created successfully!")
    print(f"  Name: {file['name']}")
    print(f"  ID: {file['id']}")
    print(f"  Link: {file.get('webViewLink', 'N/A')}")

except Exception as e:
    print(f"Error: {e}")