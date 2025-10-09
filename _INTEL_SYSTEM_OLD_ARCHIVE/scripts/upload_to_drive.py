#!/usr/bin/env python3
"""Upload Intel Articles ZIP to Google Drive and share"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Service Account
SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'sa-key-backend.json'
DELEGATED_USER = 'zero@balizero.com'

# Create credentials
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)
delegated_credentials = credentials.with_subject(DELEGATED_USER)
service = build('drive', 'v3', credentials=delegated_credentials)

print("📤 UPLOADING INTEL ARTICLES TO GOOGLE DRIVE\n")

# Upload ZIP file
file_metadata = {
    'name': 'INTEL_ARTICLES_20251009.zip',
    'mimeType': 'application/zip'
}

media = MediaFileUpload(
    'INTEL_ARTICLES_20251009.zip',
    mimetype='application/zip',
    resumable=True
)

try:
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink, webContentLink'
    ).execute()

    file_id = file.get('id')
    print(f"✅ File uploaded successfully!")
    print(f"File ID: {file_id}")
    print(f"View Link: {file.get('webViewLink')}")
    print(f"Download Link: {file.get('webContentLink')}")

    # Make file accessible to anyone with link
    permission = {
        'type': 'anyone',
        'role': 'reader'
    }

    service.permissions().create(
        fileId=file_id,
        body=permission
    ).execute()

    print(f"\n✅ File shared publicly (anyone with link can view)")
    print(f"\n📧 SHARE THIS LINK WITH THE TEAM:")
    print(f"🔗 {file.get('webViewLink')}")

except Exception as e:
    print(f"❌ Upload failed: {e}")
