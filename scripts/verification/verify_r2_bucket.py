#!/usr/bin/env python3
"""
Verifica Cloudflare R2 Bucket - ChromaDB
"""
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

# Credenziali Cloudflare R2
R2_ACCESS_KEY_ID = "d278bc5572014f4738192c9cb0cac1b9"
R2_SECRET_ACCESS_KEY = "82990a4591b1607ba7e45bf8fb65a8f12003849b873797d2555d19e1f46ee0da"
R2_ENDPOINT_URL = "https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com"
BUCKET_NAME = "nuzantaradb"
PREFIX = "chroma_db/"

print("🔍 Verifica Cloudflare R2 Bucket")
print("=" * 60)

try:
    # Crea client S3-compatible
    s3_client = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name='auto',
        config=Config(signature_version='s3v4')
    )
    
    print(f"✅ Client R2 connesso")
    print(f"📦 Bucket: {BUCKET_NAME}")
    print(f"📂 Prefix: {PREFIX}")
    print()
    
    # Lista bucket (verifica accesso)
    print("📋 Lista bucket disponibili...")
    buckets = s3_client.list_buckets()
    print(f"✅ Trovati {len(buckets['Buckets'])} bucket:")
    for bucket in buckets['Buckets']:
        print(f"   - {bucket['Name']}")
    print()
    
    # Verifica bucket specifico esiste
    if BUCKET_NAME not in [b['Name'] for b in buckets['Buckets']]:
        print(f"❌ ERRORE: Bucket '{BUCKET_NAME}' non trovato!")
        exit(1)
    
    # Lista file in chroma_db/
    print(f"📁 Contenuto di {BUCKET_NAME}/{PREFIX}...")
    paginator = s3_client.get_paginator('list_objects_v2')
    
    file_count = 0
    total_size = 0
    files = []
    
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=PREFIX):
        if 'Contents' not in page:
            print(f"⚠️  Cartella '{PREFIX}' è vuota!")
            break
            
        for obj in page['Contents']:
            key = obj['Key']
            size = obj['Size']
            
            # Skip directories
            if key.endswith('/'):
                continue
                
            file_count += 1
            total_size += size
            files.append({
                'key': key,
                'size': size,
                'size_mb': size / 1024 / 1024
            })
    
    print(f"✅ Trovati {file_count} file")
    print(f"📊 Dimensione totale: {total_size / 1024 / 1024:.1f} MB")
    print()
    
    # Mostra primi 10 file
    if files:
        print("📝 Primi 10 file:")
        for f in files[:10]:
            print(f"   {f['key']} ({f['size_mb']:.2f} MB)")
        
        if len(files) > 10:
            print(f"   ... e altri {len(files) - 10} file")
    
    print()
    
    # Cerca chroma.sqlite3 (file critico)
    chroma_sqlite = [f for f in files if 'chroma.sqlite3' in f['key']]
    if chroma_sqlite:
        print(f"✅ chroma.sqlite3 trovato: {chroma_sqlite[0]['size_mb']:.1f} MB")
    else:
        print(f"❌ chroma.sqlite3 NON trovato (ChromaDB potrebbe essere vuoto)")
    
    print()
    print("=" * 60)
    print("✅ VERIFICA COMPLETATA")
    
    # Summary
    if file_count > 0 and chroma_sqlite:
        print("🎯 STATO: ✅ Bucket R2 OK e ChromaDB presente")
        print(f"📦 {file_count} file, {total_size / 1024 / 1024:.1f} MB totali")
    elif file_count > 0:
        print("⚠️  STATO: Bucket ha file ma manca chroma.sqlite3")
    else:
        print("❌ STATO: Bucket vuoto - ChromaDB deve essere caricato")
    
except ClientError as e:
    error_code = e.response['Error']['Code']
    error_msg = e.response['Error']['Message']
    print(f"❌ ERRORE R2: {error_code}")
    print(f"   Messaggio: {error_msg}")
    print()
    
    if error_code == 'NoSuchBucket':
        print("💡 Soluzione: Crea il bucket 'nuzantaradb' su Cloudflare R2")
    elif error_code == 'InvalidAccessKeyId':
        print("💡 Soluzione: Verifica le credenziali Access Key ID")
    elif error_code == 'SignatureDoesNotMatch':
        print("💡 Soluzione: Verifica Secret Access Key")
    
except Exception as e:
    print(f"❌ ERRORE: {e}")

print()
