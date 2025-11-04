#!/usr/bin/env python3
"""
Upload ChromaDB backup to Cloudflare R2
Uses boto3 (S3-compatible API)
"""

import boto3
import os
from botocore.config import Config

# Cloudflare R2 Configuration (S3-compatible credentials)
ACCOUNT_ID = "4bc25630ef6e5aee1e4f6cb02bbdc086"
R2_ACCESS_KEY_ID = "306843a30adb1f6c7ce230929888e812"
R2_SECRET_ACCESS_KEY = "d17d54059d5b7ea0e95cbb19d68131bcc8c458063a65856311fa50378d640860"
BUCKET_NAME = "nuzantaradb"
FILE_NAME = "chromadb_backup_20241104.tar.gz"
LOCAL_FILE = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/chromadb_backup_20241104.tar.gz"

# R2 endpoint (custom domain)
ENDPOINT_URL = "https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com"

print("🚀 Uploading ChromaDB to Cloudflare R2...")
print(f"📦 File: {FILE_NAME}")
print(f"🪣 Bucket: {BUCKET_NAME}")
print(f"🔗 Endpoint: {ENDPOINT_URL}")

# Verifica file locale
if not os.path.exists(LOCAL_FILE):
    print(f"❌ File not found: {LOCAL_FILE}")
    exit(1)

file_size = os.path.getsize(LOCAL_FILE) / 1024 / 1024
print(f"📊 Size: {file_size:.2f} MB\n")

# Configura boto3 client
s3_client = boto3.client(
    service_name='s3',
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4'),
    region_name='auto'
)

# Upload con progress
try:
    print("⏳ Uploading...")
    
    # Upload file
    with open(LOCAL_FILE, 'rb') as file_data:
        s3_client.upload_fileobj(
            file_data,
            BUCKET_NAME,
            FILE_NAME,
            ExtraArgs={'ContentType': 'application/gzip'}
        )
    
    print("✅ Upload completato!")
    
    # Verifica upload
    print("\n🔍 Verificando upload...")
    response = s3_client.head_object(Bucket=BUCKET_NAME, Key=FILE_NAME)
    uploaded_size = response['ContentLength'] / 1024 / 1024
    print(f"✅ File verificato su R2: {uploaded_size:.2f} MB")
    
    # Lista tutti i backup
    print("\n📋 Backup disponibili su R2:")
    objects = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix='chromadb_backup_')
    if 'Contents' in objects:
        for obj in objects['Contents']:
            size_mb = obj['Size'] / 1024 / 1024
            print(f"   - {obj['Key']}: {size_mb:.2f} MB (Last Modified: {obj['LastModified']})")
    
    print("\n✅ UPLOAD COMPLETATO CON SUCCESSO!")
    print(f"🔗 URL: {ENDPOINT_URL}/{BUCKET_NAME}/{FILE_NAME}")
    
except Exception as e:
    print(f"❌ Errore durante upload: {e}")
    exit(1)
