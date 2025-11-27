import json
import random


class JakselDatasetGenerator:
    def __init__(self):
        # 1. Business Topics (The "Meat")
        self.topics = [
            "PT PMA registration",
            "KITAS application",
            "Tax reporting",
            "OSS RBA system",
            "Dividend repatriation",
            "Nominee agreements",
            "Virtual Office",
            "Capital requirement",
            "LKPM reporting",
        ]

        # 2. Jaksel Vocabulary Map (Formal ID -> Jaksel Slang)
        self.slang_map = {
            "saya": ["gue", "I"],
            "kamu": ["lo", "you"],
            "karena": ["soalnya", "coz", "because"],
            "tetapi": ["tapi", "but actually"],
            "mungkin": ["maybe", "kayaknya"],
            "sangat": ["literally", "damn", "super"],
            "penting": ["crucial", "important banget"],
            "tenggat waktu": ["deadline"],
            "pertemuan": ["meeting"],
            "biaya": ["cost", "budget"],
            "setuju": ["agree", "prefer"],
            "ide": ["insight", "idea"],
            "sibuk": ["hectic"],
            "santai": ["chill"],
            "bagus": ["cool", "mantap"],
            "sebenarnya": ["actually", "to be honest"],
            "pada dasarnya": ["basically", "which is"],
        }

        # 3. Templates for 80% Business Content
        self.business_templates = [
            {
                "formal": "Anda harus memperhatikan tenggat waktu pelaporan pajak.",
                "slang_structures": [
                    "Lo harus aware sama tax deadline-nya, which is crucial banget.",
                    "Basically, jangan sampe miss tax deadline ya guys.",
                    "Reminder aja, tax deadline itu super strict di sini.",
                ],
            },
            {
                "formal": "Modal disetor untuk PT PMA minimal 10 Miliar Rupiah.",
                "slang_structures": [
                    "For PT PMA, paid-up capital itu minimum 10 Bio IDR, literally segitu.",
                    "Capital requirement buat PT PMA itu 10 M, gak bisa kurang bro.",
                    "Kalau mau setup PT PMA, siapin budget 10 Miliar for capital.",
                ],
            },
            {
                "formal": "Sistem OSS RBA sangat memudahkan proses perizinan.",
                "slang_structures": [
                    "OSS RBA system itu game changer banget buat licensing.",
                    "Literally OSS RBA bikin process permit jadi seamless.",
                    "Pake OSS RBA, everything jadi lebih digital dan cepet.",
                ],
            },
            {
                "formal": "Kami menyarankan untuk menggunakan Virtual Office untuk efisiensi biaya.",
                "slang_structures": [
                    "I highly recommend Virtual Office sih buat cost efficiency.",
                    "Better pake VO (Virtual Office) aja biar budget lebih aman.",
                    "Buat efficiency, Virtual Office is the way to go sebenernya.",
                ],
            },
            {
                "formal": "Apakah Anda sudah memiliki NPWP perusahaan?",
                "slang_structures": [
                    "Lo udah ada corporate NPWP belum by the way?",
                    "NPWP perusahaan udah ready kan? Itu mandatory lho.",
                    "Make sure corporate NPWP udah di-setup ya.",
                ],
            },
        ]

        # 4. Templates for 20% Small Talk
        self.small_talk_templates = [
            {
                "formal": "Terima kasih atas bantuannya.",
                "slang_structures": [
                    "Thanks a lot bro, appreciate it.",
                    "Thank you so much, really helps.",
                    "Thanks ya, mantap banget insights-nya.",
                ],
            },
            {
                "formal": "Sampai jumpa di pertemuan selanjutnya.",
                "slang_structures": [
                    "See you next meeting guys.",
                    "Catch you later, stay healthy.",
                    "Ok sip, see you soon ya.",
                ],
            },
            {
                "formal": "Maaf saya terlambat membalas pesan Anda.",
                "slang_structures": [
                    "Sorry slow respon, lagi hectic banget tadi.",
                    "Sorry baru reply, tadi ada back-to-back meeting.",
                    "Maaf ya late reply, literally baru pegang hp.",
                ],
            },
            {
                "formal": "Bagaimana kabar Anda hari ini?",
                "slang_structures": [
                    "How are you doing bro? Aman?",
                    "Apa kabar? All good kan?",
                    "Gimana hari ini? Hopefully lancar jaya.",
                ],
            },
        ]

    def generate_entry(self, category="business"):
        if category == "business":
            template = random.choice(self.business_templates)
        else:
            template = random.choice(self.small_talk_templates)

        return {
            "input": template["formal"],
            "output": random.choice(template["slang_structures"]),
        }

    def generate_dataset(self, num_samples=1000, output_file="train_jaksel.jsonl"):
        print(f"🚀 Generating {num_samples} samples...")

        data = []

        # 80% Business, 20% Small Talk
        num_business = int(num_samples * 0.8)
        num_small = num_samples - num_business

        print(f"   - Business: {num_business}")
        print(f"   - Small Talk: {num_small}")

        # Generate Business
        for _ in range(num_business):
            # In a real scenario, we would vary the templates dynamically using the vocabulary
            # For this v1 generator, we sample from the robust templates
            data.append(self.generate_entry("business"))

        # Generate Small Talk
        for _ in range(num_small):
            data.append(self.generate_entry("small_talk"))

        # Shuffle to mix
        random.shuffle(data)

        # Write to file
        with open(output_file, "w", encoding="utf-8") as f:
            for entry in data:
                f.write(json.dumps(entry) + "\n")

        print(f"✅ Dataset saved to {output_file}")


if __name__ == "__main__":
    generator = JakselDatasetGenerator()
    generator.generate_dataset(num_samples=2000, output_file="train_jaksel_v1.jsonl")
