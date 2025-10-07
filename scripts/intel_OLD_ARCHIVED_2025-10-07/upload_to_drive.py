#!/usr/bin/env python3
"""
Google Drive Upload Script
===========================

Uploads processed scraping results to Google Drive shared folder

Requirements:
    pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

Author: ZANTARA Team
Created: 2025-10-07
"""

import os
import json
from pathlib import Path
from datetime import datetime
import mimetypes

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
except ImportError:
    print("❌ Google API libraries not installed")
    print("Run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    exit(1)


class GoogleDriveUploader:
    """Upload files to Google Drive"""
    
    # Scopes for Drive API
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    # Your shared folder ID
    SHARED_FOLDER_ID = '1wphV3Xsvw2cGrtRi9kzx8dsrmX_wF6CX'
    
    def __init__(self, credentials_file: str = 'credentials.json'):
        self.credentials_file = credentials_file
        self.token_file = 'token.json'
        self.service = None
    
    def authenticate(self):
        """Authenticate with Google Drive"""
        
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, self.SCOPES)
        
        # If no valid credentials, authenticate
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Credentials file not found: {self.credentials_file}")
                    print("\nTo set up Google Drive access:")
                    print("1. Go to https://console.cloud.google.com/")
                    print("2. Create a new project or select existing")
                    print("3. Enable Google Drive API")
                    print("4. Create OAuth 2.0 credentials (Desktop app)")
                    print("5. Download credentials.json")
                    print("6. Place it in the project root")
                    return False
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save token for next time
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        self.service = build('drive', 'v3', credentials=creds)
        print("✅ Authenticated with Google Drive")
        return True
    
    def create_folder(self, name: str, parent_id: str = None) -> str:
        """
        Create folder in Drive
        
        Args:
            name: Folder name
            parent_id: Parent folder ID (uses SHARED_FOLDER_ID if None)
            
        Returns:
            Folder ID
        """
        
        if parent_id is None:
            parent_id = self.SHARED_FOLDER_ID
        
        # Check if folder exists
        query = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and '{parent_id}' in parents and trashed=false"
        results = self.service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name)'
        ).execute()
        
        files = results.get('files', [])
        
        if files:
            print(f"  📁 Folder exists: {name}")
            return files[0]['id']
        
        # Create new folder
        file_metadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }
        
        folder = self.service.files().create(
            body=file_metadata,
            fields='id'
        ).execute()
        
        print(f"  📁 Created folder: {name}")
        return folder['id']
    
    def upload_file(self, file_path: Path, parent_id: str):
        """
        Upload file to Drive
        
        Args:
            file_path: Local file path
            parent_id: Parent folder ID
        """
        
        # Get mime type
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type is None:
            mime_type = 'application/octet-stream'
        
        file_metadata = {
            'name': file_path.name,
            'parents': [parent_id]
        }
        
        media = MediaFileUpload(
            str(file_path),
            mimetype=mime_type,
            resumable=True
        )
        
        # Check if file exists
        query = f"name='{file_path.name}' and '{parent_id}' in parents and trashed=false"
        results = self.service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name)'
        ).execute()
        
        files = results.get('files', [])
        
        if files:
            # Update existing file
            file = self.service.files().update(
                fileId=files[0]['id'],
                media_body=media
            ).execute()
            print(f"    ✅ Updated: {file_path.name}")
        else:
            # Create new file
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            print(f"    ✅ Uploaded: {file_path.name}")
    
    def upload_scraping_results(self, base_dir: str = "THE SCRAPING"):
        """
        Upload all scraping results to Drive
        
        Args:
            base_dir: Base directory containing results
        """
        
        base_path = Path(base_dir)
        
        if not base_path.exists():
            print(f"❌ Directory not found: {base_path}")
            return
        
        print(f"\n📤 Uploading from: {base_path.absolute()}")
        
        # Create timestamp folder
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        timestamp_folder_id = self.create_folder(f"Scraping_{timestamp}")
        
        # Upload scraped files
        scraped_dir = base_path / "scraped"
        if scraped_dir.exists():
            scraped_folder_id = self.create_folder("scraped", timestamp_folder_id)
            
            for category_dir in sorted(scraped_dir.iterdir()):
                if category_dir.is_dir():
                    category_folder_id = self.create_folder(category_dir.name, scraped_folder_id)
                    
                    raw_dir = category_dir / "raw"
                    if raw_dir.exists():
                        raw_folder_id = self.create_folder("raw", category_folder_id)
                        
                        # Upload all files in raw
                        files = list(raw_dir.glob("*"))
                        print(f"\n  📂 {category_dir.name}: {len(files)} files")
                        
                        for file_path in files[:10]:  # Limit to 10 files per category for now
                            if file_path.is_file():
                                self.upload_file(file_path, raw_folder_id)
        
        # Upload processed files
        processed_dir = base_path / "processed"
        if processed_dir.exists():
            processed_folder_id = self.create_folder("processed", timestamp_folder_id)
            
            for category_dir in sorted(processed_dir.iterdir()):
                if category_dir.is_dir():
                    category_folder_id = self.create_folder(category_dir.name, processed_folder_id)
                    
                    # Upload RAG files
                    rag_dir = category_dir / "rag"
                    if rag_dir.exists():
                        rag_folder_id = self.create_folder("rag", category_folder_id)
                        
                        for file_path in rag_dir.glob("*.json"):
                            self.upload_file(file_path, rag_folder_id)
                    
                    # Upload articles
                    articles_dir = category_dir / "articles"
                    if articles_dir.exists():
                        articles_folder_id = self.create_folder("articles", category_folder_id)
                        
                        for file_path in articles_dir.glob("*.md"):
                            self.upload_file(file_path, articles_folder_id)
        
        print(f"\n✅ Upload complete!")
        print(f"📁 View at: https://drive.google.com/drive/folders/{self.SHARED_FOLDER_ID}")


def main():
    """Main entry point"""
    
    print("🚀 Google Drive Upload - ZANTARA Intel Scraping")
    print("=" * 60)
    
    uploader = GoogleDriveUploader()
    
    if not uploader.authenticate():
        return
    
    uploader.upload_scraping_results()


if __name__ == "__main__":
    main()
