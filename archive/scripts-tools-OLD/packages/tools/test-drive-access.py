#!/usr/bin/env python3

import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

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

# List files in ZERO folder
folder_id = '1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr'

try:
    results = service.files().list(
        q=f"'{folder_id}' in parents",
        pageSize=10,
        fields="files(id, name, mimeType, webViewLink)",
        supportsAllDrives=True
    ).execute()

    files = results.get('files', [])

    if not files:
        print('No files found in ZERO folder.')
    else:
        print(f'Files in ZERO folder:')
        for file in files:
            print(f"  - {file['name']} ({file['mimeType']}) - ID: {file['id']}")
            if 'webViewLink' in file:
                print(f"    Link: {file['webViewLink']}")

except Exception as e:
    print(f"Error: {e}")