#!/usr/bin/env python3
"""Upload FULL ChromaDB to Cloudflare R2 (13 collections, 25,427 docs)"""
import boto3
import os
from pathlib import Path

# R2 Configuration
R2_ACCESS_KEY_ID = "306843a30adb1f6c7ce230929888e812"
R2_SECRET_ACCESS_KEY = "d17d54059d5b7ea0e95cbb19d68131bcc8c458063a65856311fa50378d640860"
R2_ENDPOINT_URL = "https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com"
BUCKET_NAME = "nuzantaradb"
SOURCE_DIR = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_FULL_deploy"
R2_PREFIX = "chroma_db/"

print("🚀 UPLOAD FULL CHROMADB TO R2")
print(f"   Source: {SOURCE_DIR}")
print(f"   Bucket: {BUCKET_NAME}/{R2_PREFIX}")
print(f"   Collections: 13")
print(f"   Documents: 25,427\n")

# Initialize S3 client for R2
s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

# Step 1: Delete all existing files in R2
print("🗑️  Step 1: Cleaning R2 bucket...")
try:
    response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=R2_PREFIX)
    if 'Contents' in response:
        delete_count = len(response['Contents'])
        print(f"   Found {delete_count} existing files")
        for obj in response['Contents']:
            s3_client.delete_object(Bucket=BUCKET_NAME, Key=obj['Key'])
            print(f"   Deleted: {obj['Key']}")
        print(f"✅ Deleted {delete_count} old files\n")
    else:
        print("   No existing files found\n")
except Exception as e:
    print(f"⚠️  Error cleaning R2: {e}\n")

# Step 2: Upload all files
print("📤 Step 2: Uploading files to R2...")
uploaded_count = 0
total_size = 0

for root, dirs, files in os.walk(SOURCE_DIR):
    for filename in files:
        # Skip .gz files
        if filename.endswith('.gz'):
            print(f"   ⏭️  Skipping: {filename}")
            continue
            
        local_path = os.path.join(root, filename)
        relative_path = os.path.relpath(local_path, SOURCE_DIR)
        r2_key = R2_PREFIX + relative_path
        
        # Get file size
        file_size = os.path.getsize(local_path)
        file_size_mb = file_size / 1024 / 1024
        total_size += file_size
        
        # Upload
        print(f"   Uploading: {relative_path} ({file_size_mb:.2f} MB)...", end=" ")
        try:
            s3_client.upload_file(local_path, BUCKET_NAME, r2_key)
            uploaded_count += 1
            print("✅")
        except Exception as e:
            print(f"❌ Error: {e}")

print(f"\n✅ UPLOAD COMPLETATO!")
print(f"   Files: {uploaded_count}")
print(f"   Size: {total_size / 1024 / 1024:.2f} MB")

# Step 3: Verify
print("\n📋 Verifying R2 contents...")
response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=R2_PREFIX)
if 'Contents' in response:
    print(f"   R2 has {len(response['Contents'])} files:")
    for obj in response['Contents']:
        size_mb = obj['Size'] / 1024 / 1024
        print(f"   • {obj['Key']} ({size_mb:.2f} MB)")
else:
    print("   ⚠️  No files found in R2!")

print(f"\n🎯 Ready for Fly.io deployment!")
print(f"   13 collections, 25,427 documents")
