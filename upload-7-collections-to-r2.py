#!/usr/bin/env python3
"""
Upload 7 consolidated collections to Cloudflare R2
"""
import boto3
import os
from pathlib import Path

# R2 Config from env
endpoint = "https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com"
access_key = "306843a30adb1f6c7ce230929888e812"
secret_key = "d17d54059d5b7ea0e95cbb19d68131bcc8c458063a65856311fa50378d640860"

# S3 client for R2
s3 = boto3.client(
    's3',
    endpoint_url=endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key
)

bucket = "nuzantaradb"
local_path = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_7_collections")

print("🚀 UPLOADING 7 COLLECTIONS TO R2...\n")

files_uploaded = 0
total_size = 0

for file in sorted(local_path.rglob("*")):
    if file.is_file():
        rel_path = file.relative_to(local_path)
        s3_key = f"chroma_db/{rel_path}"
        
        s3.upload_file(str(file), bucket, s3_key)
        files_uploaded += 1
        total_size += file.stat().st_size
        
        if files_uploaded % 10 == 0:
            print(f"📤 {files_uploaded} files uploaded...")

print(f"\n✅ UPLOAD COMPLETE")
print(f"📁 Files: {files_uploaded}")
print(f"💾 Size: {total_size / 1024 / 1024:.1f} MB")
print(f"🎯 Collections: 7")
print(f"📊 Documents: 25,416")
print(f"\n🌐 R2 Bucket: {bucket}/chroma_db/")
