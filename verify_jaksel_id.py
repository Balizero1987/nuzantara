import asyncio
import aiohttp
import json
import time

API_URL = "https://nuzantara-rag.fly.dev/bali-zero/chat-stream"
API_KEY = "zantara-secret-2024"
USER_EMAIL = "anton@balizero.com"

# Indonesian questions (Jaksel style compatible)
QUESTIONS = [
    "Apa syarat visa investor KITAS?",
    "Berapa modal minimum buat bikin PT PMA di Bali?",
    "Bedanya Hak Milik sama Hak Pakai apa sih?",
    "Bule boleh punya tanah freehold gak di Indo?",
    "Pajak buat bisnis kecil berapa ya?",
    "Gimana cara ngurus payroll karyawan lokal?",
    "Aturan buat digital nomad di Bali gimana?",
    "Perlu lisensi gak buat buka resto di Canggu?",
    "Gimana cara kerja sistem OSS buat daftar bisnis?",
    "BPJS buat karyawan itu wajib gak?",
    "Bisa pake virtual office gak buat PT PMA?",
    "Sektor apa aja yang gak boleh buat asing?",
    "Berapa lama sih bikin PT PMA?",
    "Biaya hidup di Bali buat expat berapa kira-kira?",
    "Jelasin dong risiko pake nominee structure.",
    "Visa pensiun di Bali opsinya apa aja?",
    "Cara lapor pajak buat orang asing gimana?",
    "Golden Visa itu apa sih?",
    "Bisa beli motor atas nama PT gak?",
    "Aturan zonasi (ITR) di Bali gimana?",
    "Cara legal sewain villa di Airbnb gimana?",
    "Proses PBG (IMB) itu gimana?",
    "Aturan THR buat karyawan gimana?",
    "Aturan bea cukai buat impor alat gimana?",
    "Cara tutup PT PMA gimana?",
    "Second Home Visa itu apa?",
    "Bisa buka rekening bank tanpa KITAS gak?",
    "Aturan lingkungan buat beach club gimana?",
    "Cara lindungi HAKI di Indo gimana?",
    "UMK di Badung berapa sekarang?",
]


async def ask_question(session, question, index):
    print(f"⏳ [{index+1}/30] Asking: {question}")
    start_time = time.time()
    params = {"query": question, "user_email": USER_EMAIL}
    headers = {"X-API-Key": API_KEY}
    full_response = ""
    try:
        async with session.get(API_URL, params=params, headers=headers) as response:
            if response.status != 200:
                print(f"❌ Error {response.status}: {await response.text()}")
                return
            async for line in response.content:
                line = line.decode("utf-8").strip()
                if line.startswith("data: "):
                    data_str = line[6:]
                    try:
                        data = json.loads(data_str)
                        if data["type"] == "token":
                            full_response += data["data"]
                        elif data["type"] == "error":
                            print(f"❌ Backend Error: {data['data']}")
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        print(f"❌ Exception: {e}")
        return
    elapsed = time.time() - start_time
    print(f"✅ [{index+1}/30] Response ({elapsed:.2f}s):\n{full_response.strip()}\n")


async def main():
    print("🚀 Starting Business Verification (Indonesian Questions)")
    async with aiohttp.ClientSession() as session:
        chunk_size = 5
        for i in range(0, len(QUESTIONS), chunk_size):
            chunk = QUESTIONS[i : i + chunk_size]
            tasks = [ask_question(session, q, i + j) for j, q in enumerate(chunk)]
            await asyncio.gather(*tasks)
            print("zzz... cooling down for 2s ...")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())
