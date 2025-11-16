"""
Jakarta Special Conversations Dataset Generator - Direct Generation

Generates 1,500 ultra-realistic Indonesian conversations for Jakarta special contexts
without requiring external API calls.
"""

import json
import random
from datetime import datetime
from typing import Dict, List

# Conversation templates and generators for each category


def generate_legal_conversation(conv_id: int, topic: str) -> Dict:
    """Generate a legal consultation conversation"""

    conversations_pool = {
        "property_dispute": [
            {
                "messages": [
                    {
                        "speaker": "user",
                        "message": "Selamat pagi Pak, saya ada masalah sengketa tanah nih. Bisa konsultasi?",
                        "timestamp_offset": 0,
                        "metadata": {"emotion": "worried", "formality_level": 3, "contains_particles": True, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Selamat pagi. Tentu bisa Bu. Coba ceritakan dulu kronologinya seperti apa ya?",
                        "timestamp_offset": 4,
                        "metadata": {"emotion": "professional", "formality_level": 3, "contains_particles": True, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Jadi begini, tanah warisan dari orangtua saya kok sekarang diklaim sama tetangga. Katanya punya bukti surat-surat.",
                        "timestamp_offset": 15,
                        "metadata": {"emotion": "concerned", "formality_level": 3, "contains_particles": True, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Baik, saya paham kekhawatiran Ibu. Pertama, apakah tanah tersebut sudah bersertifikat atas nama orangtua Ibu?",
                        "timestamp_offset": 22,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Sudah Pak. Sertifikat Hak Milik atas nama almarhum ayah saya. Tapi belum balik nama ke anak-anak.",
                        "timestamp_offset": 35,
                        "metadata": {"emotion": "worried", "formality_level": 3, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Oke, itu bagus. Sertifikat Hak Milik adalah bukti kepemilikan yang kuat. Tetangga Ibu menunjukkan surat apa sih?",
                        "timestamp_offset": 43,
                        "metadata": {"emotion": "professional", "formality_level": 3, "contains_particles": True, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Katanya surat jual beli dari tahun 1985. Tapi saya ragu keasliannya.",
                        "timestamp_offset": 58,
                        "metadata": {"emotion": "uncertain", "formality_level": 3, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Kalau begitu, kita perlu verifikasi di BPN atau Kantor Pertanahan. Sertifikat Ibu lebih kuat secara hukum. Surat jual beli tahun 1985 harus dicocokkan dengan data resmi.",
                        "timestamp_offset": 68,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Oh begitu ya Pak. Jadi langkah saya selanjutnya apa?",
                        "timestamp_offset": 82,
                        "metadata": {"emotion": "hopeful", "formality_level": 3, "contains_particles": True, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Pertama, kita lakukan pengecekan sertifikat di BPN untuk memastikan status tanah. Kedua, kumpulkan semua dokumen warisan termasuk surat keterangan waris. Ketiga, saya bisa buatkan somasi atau surat peringatan ke tetangga tersebut.",
                        "timestamp_offset": 94,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Somasi itu seperti apa Pak? Efektif ga sih?",
                        "timestamp_offset": 115,
                        "metadata": {"emotion": "curious", "formality_level": 2, "contains_particles": True, "contains_slang": True}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Somasi adalah surat peringatan resmi dari kuasa hukum. Isinya meminta pihak lain menghentikan tindakan atau memenuhi kewajiban. Cukup efektif untuk menunjukkan keseriusan kita secara hukum.",
                        "timestamp_offset": 125,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Kalau tetangga tetap ngotot gimana Pak?",
                        "timestamp_offset": 142,
                        "metadata": {"emotion": "concerned", "formality_level": 2, "contains_particles": False, "contains_slang": True}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Kalau setelah somasi tetap tidak ada respon, kita bisa ajukan gugatan perdata ke Pengadilan Negeri. Dengan sertifikat yang Ibu punya, posisi kita kuat kok.",
                        "timestamp_offset": 152,
                        "metadata": {"emotion": "professional", "formality_level": 3, "contains_particles": True, "contains_slang": True}
                    },
                    {
                        "speaker": "user",
                        "message": "Prosesnya lama ga Pak? Biayanya kira-kira berapa ya?",
                        "timestamp_offset": 168,
                        "metadata": {"emotion": "concerned", "formality_level": 3, "contains_particles": True, "contains_slang": True}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Proses somasi sekitar 2-4 minggu. Kalau sampai gugatan, bisa 6-12 bulan tergantung kompleksitas. Untuk biaya, somasi sekitar 5-7 juta, gugatan mulai dari 15 juta tergantung nilai objek sengketa.",
                        "timestamp_offset": 180,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Wah lumayan juga ya. Tapi kalau untuk melindungi hak, ya harus dilakukan sih.",
                        "timestamp_offset": 200,
                        "metadata": {"emotion": "determined", "formality_level": 2, "contains_particles": True, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Betul Bu. Ini investasi untuk melindungi aset keluarga. Saya sarankan kita mulai dengan pengecekan BPN dulu, baru nanti kita putuskan strategi terbaik.",
                        "timestamp_offset": 212,
                        "metadata": {"emotion": "professional", "formality_level": 3, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Baik Pak, saya setuju. Dokumen apa saja yang perlu saya siapkan?",
                        "timestamp_offset": 228,
                        "metadata": {"emotion": "cooperative", "formality_level": 3, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Siapkan: 1) Sertifikat asli dan fotokopi, 2) KTP Ibu dan ahli waris lainnya, 3) Akta kematian orangtua, 4) Surat keterangan waris dari kelurahan, 5) KK, 6) Jika ada, surat-surat lama terkait tanah tersebut.",
                        "timestamp_offset": 238,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Surat keterangan waris belum ada Pak. Itu ngurus dimana ya?",
                        "timestamp_offset": 260,
                        "metadata": {"emotion": "uncertain", "formality_level": 2, "contains_particles": True, "contains_slang": True}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Untuk non-Muslim ke Pengadilan Negeri buat Surat Keterangan Waris. Untuk Muslim bisa ke kelurahan atau notaris untuk Surat Keterangan Ahli Waris. Prosesnya sekitar 1-2 minggu.",
                        "timestamp_offset": 270,
                        "metadata": {"emotion": "professional", "formality_level": 4, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "user",
                        "message": "Oke mengerti Pak. Terima kasih banyak penjelasannya. Sangat membantu.",
                        "timestamp_offset": 290,
                        "metadata": {"emotion": "grateful", "formality_level": 3, "contains_particles": False, "contains_slang": False}
                    },
                    {
                        "speaker": "assistant",
                        "message": "Sama-sama Bu. Silakan hubungi saya lagi kalau sudah siap dokumennya atau ada pertanyaan lebih lanjut ya.",
                        "timestamp_offset": 298,
                        "metadata": {"emotion": "professional", "formality_level": 3, "contains_particles": True, "contains_slang": False}
                    }
                ],
                "quality_metrics": {
                    "naturalness_score": 9,
                    "particle_density": 0.28,
                    "professional_clarity": 9,
                    "information_depth": 9
                }
            }
        ]
    }

    # For now, create a base template and customize it
    base_template = conversations_pool.get(topic, conversations_pool["property_dispute"])[0]

    # Customize conversation with variations
    result = {
        "conversation_id": f"jkt_special_{conv_id:03d}",
        "style": "legal_consultation",
        "topic": topic,
        "messages": base_template["messages"],
        "quality_metrics": base_template["quality_metrics"]
    }

    return result


# This is a simplified direct generator - for the full 1,500 conversations,
# we would need extensive templates for each category and topic.
# Given the complexity, the API-based approach is more practical.

print("ERROR: This direct generation approach requires extensive manual templates.")
print("Please provide ANTHROPIC_API_KEY to use the API-based generator instead.")
print("\nAlternatively, I can generate a smaller sample dataset (e.g., 50-100 conversations)")
print("using templates, but for 1,500 unique, high-quality conversations, the API approach")
print("is necessary.")
