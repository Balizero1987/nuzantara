import requests
import os
import sys

# Add backend to path to import settings
sys.path.append(os.path.join(os.getcwd(), "apps/backend-rag/backend"))
from app.core.config import settings


def check_file(url):
    headers = {"Authorization": f"Bearer {settings.hf_api_key}"}
    try:
        response = requests.head(url, headers=headers, allow_redirects=True)
        print(f"Checking {url}...")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            size = int(response.headers.get("Content-Length", 0))
            print(f"Size: {size} bytes ({size / 1024 / 1024:.2f} MB)")
            if size < 2000:
                print(
                    "⚠️ WARNING: File is very small. Likely a Git LFS pointer (Upload failed)."
                )
            else:
                print("✅ File size looks reasonable (not a pointer).")
        else:
            print(f"Error: {response.headers.get('x-error-message', 'Unknown error')}")
    except Exception as e:
        print(f"Exception: {e}")


if __name__ == "__main__":
    print(f"Using Token: {settings.hf_api_key[:5]}...")
    check_file(
        "https://huggingface.co/zeroai87/jaksel-ai/resolve/main/pytorch_model.bin"
    )
    check_file(
        "https://huggingface.co/zeroai87/jaksel-ai/resolve/main/model.safetensors"
    )
    check_file("https://huggingface.co/zeroai87/jaksel-ai/resolve/main/config.json")
