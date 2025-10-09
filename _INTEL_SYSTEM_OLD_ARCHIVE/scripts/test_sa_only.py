#!/usr/bin/env python3
"""Test if service account works without delegation"""
from google.oauth2 import service_account
from googleapiclient.discovery import build

credentials = service_account.Credentials.from_service_account_file(
    'sa-key-updated.json',
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)

# Test with Cloud Resource Manager API (no delegation needed)
service = build('cloudresourcemanager', 'v1', credentials=credentials)

try:
    project = service.projects().get(projectId='involuted-box-469105-r0').execute()
    print(f"✅ Service account works!")
    print(f"Project: {project['name']}")
    print(f"Project Number: {project['projectNumber']}")
    print("\n❌ But Gmail delegation still failing - need to check Workspace Admin Console")
    print(f"\nClient ID to authorize: 102437745575570448134")
    print(f"Scopes needed: https://www.googleapis.com/auth/gmail.send")
    print(f"Domain: balizero.com")
except Exception as e:
    print(f"❌ Service account error: {e}")
