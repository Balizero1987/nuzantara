#!/usr/bin/env python3
"""
Upload blog article to ZANTARA + Google Cloud Storage
"""

import json
import sys
import os
import requests
from datetime import datetime
from google.cloud import storage

# Configuration
ZANTARA_API_URL = "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app"
ZANTARA_API_KEY = os.getenv("ZANTARA_API_KEY", "zantara-internal-dev-key-2025")
GCS_BUCKET = "nuzantara-blog"
GCS_IMAGES_PREFIX = "images/"


def upload_image_to_gcs(image_path):
    """Upload image to Google Cloud Storage and return public URL"""
    try:
        client = storage.Client()
        bucket = client.bucket(GCS_BUCKET)

        # Generate blob name
        filename = os.path.basename(image_path)
        blob_name = f"{GCS_IMAGES_PREFIX}{filename}"

        # Upload
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(image_path)

        # Make public
        blob.make_public()

        # Return public URL
        return blob.public_url

    except Exception as e:
        print(f"❌ GCS upload failed: {e}")
        return None


def publish_to_zantara(article_data):
    """Publish article to ZANTARA API"""
    try:
        response = requests.post(
            f"{ZANTARA_API_URL}/call",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ZANTARA_API_KEY}"
            },
            json={
                "handler": "intel.blog.publish",
                "params": article_data
            },
            timeout=30
        )

        response.raise_for_status()
        return response.json()

    except Exception as e:
        print(f"❌ ZANTARA publish failed: {e}")
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 upload_blog_article.py <article_json_file> [image_file]")
        print("Example: python3 upload_blog_article.py immigration_blog_20250110.json immigration_blog_20250110.jpg")
        sys.exit(1)

    article_json_path = sys.argv[1]
    image_path = sys.argv[2] if len(sys.argv) > 2 else None

    # If relative paths, look in data/blog/
    if not os.path.isabs(article_json_path):
        article_json_path = os.path.join("../data/blog", article_json_path)
    if image_path and not os.path.isabs(image_path):
        image_path = os.path.join("../data/blog", image_path)

    print("=" * 70)
    print("📤 Uploading Blog Article to ZANTARA")
    print("=" * 70)
    print()

    # Load article JSON
    print(f"📄 Loading article: {article_json_path}")
    try:
        with open(article_json_path, 'r', encoding='utf-8') as f:
            article_data = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load JSON: {e}")
        sys.exit(1)

    # Upload image if provided
    if image_path and os.path.exists(image_path):
        print(f"🖼️  Uploading image: {image_path}")
        image_url = upload_image_to_gcs(image_path)

        if image_url:
            print(f"✅ Image uploaded: {image_url}")
            article_data['image_url'] = image_url
        else:
            print("⚠️  Image upload failed, continuing without image")
    else:
        print("ℹ️  No image provided")

    # Publish to ZANTARA
    print(f"📡 Publishing to ZANTARA...")
    result = publish_to_zantara(article_data)

    if result and result.get('success'):
        print(f"✅ Article published successfully!")
        print(f"   ID: {article_data.get('id')}")
        print(f"   Category: {article_data.get('category')}")
        print(f"   Title: {article_data.get('title')}")
    else:
        print(f"❌ Publish failed")

    print()
    print("=" * 70)
    print("🎉 Upload complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
