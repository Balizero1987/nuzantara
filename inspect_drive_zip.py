import gdown
import zipfile
import os

url = "https://drive.google.com/uc?id=1Lx4y9TQ45uBUyvNzeHiHinxo_k_WOMmm"
output = "nuzantara_laws_temp.zip"

print("⬇️  Downloading zip from Drive...")
try:
    gdown.download(url, output, quiet=False)

    if not os.path.exists(output):
        print("❌ Download failed (file not found)")
        exit(1)

    print("📦 Inspecting zip content...")
    with zipfile.ZipFile(output, "r") as zip_ref:
        file_list = zip_ref.namelist()

        pdf_count = sum(1 for f in file_list if f.lower().endswith(".pdf"))
        print(f"✅ Found {len(file_list)} total files")
        print(f"📚 Found {pdf_count} PDF files")

        print("\n--- First 20 files ---")
        for f in file_list[:20]:
            print(f" - {f}")

        print("\n--- Sample of 'Penetapan' files (potential duplicates) ---")
        penetapan = [f for f in file_list if "Penetapan" in f][:5]
        for f in penetapan:
            print(f" - {f}")

    # Clean up
    os.remove(output)
    print("\n🧹 Cleaned up temp file")

except Exception as e:
    print(f"❌ Error: {e}")
