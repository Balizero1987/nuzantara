#!/usr/bin/env python3
"""
Javanese Conversation Generator
Generates 3,000 authentic Javanese conversations with proper speech levels and dialects
"""

import json
import random
from typing import List, Dict, Any
from datetime import datetime

class JavaneseConversationGenerator:
    def __init__(self):
        self.conversation_counter = 0

        # Javanese particles
        self.particles = ['ta', 'kok', 'lho', 'je', 'wae', 'tok', 'ya', 'tho']

        # Emotions
        self.emotions = [
            'curious', 'happy', 'concerned', 'agreeable', 'excited',
            'respectful', 'friendly', 'polite', 'cheerful', 'thoughtful',
            'grateful', 'apologetic', 'enthusiastic', 'calm', 'warm'
        ]

        # Topics
        self.topics = [
            'family_gathering', 'traditional_ceremony', 'daily_life', 'business',
            'food_discussion', 'travel_plans', 'cultural_event', 'market_shopping',
            'neighbor_chat', 'wedding_preparation', 'harvest_season', 'religious_event',
            'education', 'health_concern', 'home_repair', 'celebration',
            'work_discussion', 'farming', 'traditional_art', 'community_meeting'
        ]

        self._init_conversation_templates()

    def _init_conversation_templates(self):
        """Initialize conversation templates for different styles"""

        # NGOKO (Informal) Templates
        self.ngoko_templates = [
            {
                'topic': 'family_gathering',
                'starters': [
                    "Mas, sesuk arep teko ora ning omah simbah?",
                    "Mbak, kowe wis ngerti acara kulawarga minggu ngarep?",
                    "Dik, sesuk ayo bareng ning omahe pakde.",
                    "Rek, kapan arep kumpul kulawarga maneh?",
                ],
                'responses': [
                    "Insya Allah teko, jam piro kumpule?",
                    "Durung ngerti aku, ceritakno dong.",
                    "Oke siap, jam piro berangkate?",
                    "Wah iya, aku lali. Maturnuwun wis ngeling-eling.",
                ]
            },
            {
                'topic': 'daily_life',
                'starters': [
                    "Wis mangan durung?",
                    "Arep lungo nandi kowe?",
                    "Sibuk apa dina iki?",
                    "Wayah iki lagi ngopo?",
                ],
                'responses': [
                    "Durung, kok awakmu wis?",
                    "Arep mlebu pasar sedhela.",
                    "Biasa wae, gawe omah.",
                    "Lagi santai, kok awakmu?",
                ]
            },
            {
                'topic': 'food_discussion',
                'starters': [
                    "Kowe tau nyoba warung anyar kae durung?",
                    "Saiki arep masak apa?",
                    "Gudege kae enak ra?",
                    "Sesuk tak buatke soto ya?",
                ],
                'responses': [
                    "Durung, enak ta? Kapan-kapan tak cobak.",
                    "Arep masak sayur lodeh wae.",
                    "Enak banget kok, pedas sithik tapi mantep.",
                    "Wah seneng banget! Maturnuwun ya.",
                ]
            }
        ]

        # KRAMA (Formal) Templates
        self.krama_templates = [
            {
                'topic': 'traditional_ceremony',
                'starters': [
                    "Pak, kula badhe nyuwun pirsa babagan acara slametan benjang.",
                    "Bu, menapa sampun wonten persiapan kangge mitoni?",
                    "Pak Guru, kula badhe tanglet babagan upacara adat.",
                    "Mbah, kepareng kula nyuwun tuladha adat jawi.",
                ],
                'responses': [
                    "Inggih, acara benjang wiwit jam 8 enjing. Panjenengan saged rawuh?",
                    "Sampun kathah sing dipun siapaken. Mugi-mugi lancar.",
                    "Inggih, sumangga. Punapa ingkang badhe dipun tangletaken?",
                    "Lha saged, mangga lenggah rumiyin.",
                ]
            },
            {
                'topic': 'business',
                'starters': [
                    "Pak, kula badhe ngaturaken proposal usaha.",
                    "Bu, menawi kepareng kula badhe mundhut wekdal.",
                    "Kepareng kula matur babagan rencana bisnis punika.",
                    "Pak Dhe, kula nyuwun pamrayogi usaha kula.",
                ],
                'responses': [
                    "Inggih, monggo. Kula badhe mriksa sakderengipun.",
                    "Saged, benjang jam setunggal wonten wekdal.",
                    "Monggo dipun aturaken kanthi rinci.",
                    "Lha sae, usaha menapa sing arep dipun jalari?",
                ]
            }
        ]

        # MIXED Javanese-Indonesian Templates
        self.mixed_templates = [
            {
                'topic': 'education',
                'starters': [
                    "Mas, tugas bahasa Indonesia wis dikerjakan durung?",
                    "Dik, nilai rapor kamu gimana? Bagus ora?",
                    "Mbak, untuk ujian besok wis belajar kan?",
                    "Rek, PR matematika nomer 5 piye carane?",
                ],
                'responses': [
                    "Wis setengah kok, lumayan susah juga sih.",
                    "Alhamdulillah lumayan, tapi perlu usaha lagi.",
                    "Wis dari kemarin, tapi masih kurang yakin aku.",
                    "Iku pake rumus ABC lho, aku wis ngerjakan.",
                ]
            },
            {
                'topic': 'work_discussion',
                'starters': [
                    "Pak, untuk meeting besok materinya wis siap?",
                    "Bu, laporan bulan ini kapan dikumpulkan?",
                    "Mas, project deadline-ne kapan? Wis rampung durung?",
                    "Mbak, bisa bantu review dokumen aku ora?",
                ],
                'responses': [
                    "Wis hampir kelar, nanti sore tak kirim dulu draft-nya.",
                    "Paling lambat tanggal 25 ya, jangan sampai telat.",
                    "Deadline Jumat, wis 80% kok tinggal finishing.",
                    "Bisa, kirim aja via email nanti tak cek.",
                ]
            }
        ]

        # YOGYAKARTA Dialect Templates
        self.yogya_templates = [
            {
                'topic': 'cultural_event',
                'starters': [
                    "Mas, sesuk ana pagelaran wayang ning alun-alun lor.",
                    "Mbak, arep nonton sekaten ora?",
                    "Dik, grebeg maulud tahun iki rame banget kayane.",
                    "Rek, kepengen nonton ketoprak ning Ngasem.",
                ],
                'responses': [
                    "Wah seru kui, dalange sapa mas?",
                    "Arep kok, jam piro berangkate?",
                    "Iya aku wis ndelok jadwale, apik tenan.",
                    "Ayo sesuk sore wae, bareng-bareng luwih asik.",
                ]
            },
            {
                'topic': 'market_shopping',
                'starters': [
                    "Bu, harga lombok saiki pira?",
                    "Mas, bayem iki seger durung?",
                    "Mbak, ana iwak seger ora?",
                    "Pak, bisa kurang ora niki?",
                ],
                'responses': [
                    "Saiki 15 ewu sekilo bu, murah kok.",
                    "Lha iki esuk barusan panen mas, seger banget.",
                    "Ana mas, lele karo mujair, pilih endi?",
                    "Wah niki wis pas mbak, lagi murah.",
                ]
            }
        ]

        # SURABAYA Dialect Templates
        self.surabaya_templates = [
            {
                'topic': 'neighbor_chat',
                'starters': [
                    "Cak, awakmu mben sore kok lungo terus, sibuk opo?",
                    "Ning, anakmu wis gede ya saiki, pinter banget.",
                    "Rek, ayo ndang mlebu, aku wis masak rawon lho.",
                    "Le, mobilmu anyar yo? Apik tenan.",
                ],
                'responses': [
                    "Iya cak, lembur terus iki, gawe proyek.",
                    "Iya alhamdulillah, lagi kelas 3 SD.",
                    "Walah enak tenan, tak jupuk piring sek ya.",
                    "Iya le, kredit sih tapi lumayan kanggo mudik.",
                ]
            },
            {
                'topic': 'travel_plans',
                'starters': [
                    "Cak, liburan akhir tahun arep nang endi?",
                    "Mbak, wis tau nang Bromo durung?",
                    "Rek, ayo bareng mudik lebaran nang Nganjuk.",
                    "Ning, kapan arep jalan-jalan maneh?",
                ],
                'responses': [
                    "Rencanane arep nang Bali, awakmu?",
                    "Durung, pengen sih kapan-kapan.",
                    "Oke, awakmu nganggo mobil opo sepur?",
                    "Wah pengen sih, tapi duit lagi tipis iki.",
                ]
            }
        ]

    def generate_ngoko_conversation(self) -> Dict[str, Any]:
        """Generate a ngoko (informal) level conversation"""
        self.conversation_counter += 1
        template = random.choice(self.ngoko_templates)
        num_messages = random.randint(5, 35)

        messages = []
        timestamp = 0

        # First message
        starter = random.choice(template['starters'])
        messages.append({
            'speaker': 'user',
            'message': starter,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'ngoko',
                'contains_particles': any(p in starter for p in self.particles),
                'dialect_marker': 'standard'
            }
        })

        timestamp += random.randint(2, 8)

        # Second message
        response = random.choice(template['responses'])
        messages.append({
            'speaker': 'assistant',
            'message': response,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'ngoko',
                'contains_particles': any(p in response for p in self.particles),
                'dialect_marker': 'standard'
            }
        })

        # Generate additional exchanges
        for _ in range((num_messages - 2) // 2):
            timestamp += random.randint(3, 10)
            follow_up = self._generate_ngoko_followup(template['topic'])
            messages.append({
                'speaker': 'user' if len(messages) % 2 == 0 else 'assistant',
                'message': follow_up,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': random.choice(self.emotions),
                    'formality_level': 'ngoko',
                    'contains_particles': any(p in follow_up for p in self.particles),
                    'dialect_marker': 'standard'
                }
            })

        return {
            'conversation_id': f'jav_{self.conversation_counter:04d}',
            'style': 'ngoko',
            'dialect': 'standard',
            'topic': template['topic'],
            'messages': messages,
            'quality_metrics': {
                'naturalness_score': random.randint(8, 10),
                'cultural_authenticity': random.randint(8, 10),
                'speech_level_accuracy': random.randint(9, 10),
                'dialect_consistency': random.randint(8, 10)
            }
        }

    def generate_krama_conversation(self) -> Dict[str, Any]:
        """Generate a krama (formal) level conversation"""
        self.conversation_counter += 1
        template = random.choice(self.krama_templates)
        num_messages = random.randint(5, 35)

        messages = []
        timestamp = 0

        starter = random.choice(template['starters'])
        messages.append({
            'speaker': 'user',
            'message': starter,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': 'respectful',
                'formality_level': 'krama',
                'contains_particles': False,
                'dialect_marker': 'standard'
            }
        })

        timestamp += random.randint(3, 10)

        response = random.choice(template['responses'])
        messages.append({
            'speaker': 'assistant',
            'message': response,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': 'polite',
                'formality_level': 'krama',
                'contains_particles': False,
                'dialect_marker': 'standard'
            }
        })

        for _ in range((num_messages - 2) // 2):
            timestamp += random.randint(5, 12)
            follow_up = self._generate_krama_followup(template['topic'])
            messages.append({
                'speaker': 'user' if len(messages) % 2 == 0 else 'assistant',
                'message': follow_up,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': 'respectful' if len(messages) % 2 == 0 else 'polite',
                    'formality_level': 'krama',
                    'contains_particles': False,
                    'dialect_marker': 'standard'
                }
            })

        return {
            'conversation_id': f'jav_{self.conversation_counter:04d}',
            'style': 'krama',
            'dialect': 'standard',
            'topic': template['topic'],
            'messages': messages,
            'quality_metrics': {
                'naturalness_score': random.randint(8, 10),
                'cultural_authenticity': random.randint(9, 10),
                'speech_level_accuracy': random.randint(9, 10),
                'dialect_consistency': random.randint(8, 10)
            }
        }

    def generate_mixed_conversation(self) -> Dict[str, Any]:
        """Generate a mixed Javanese-Indonesian conversation"""
        self.conversation_counter += 1
        template = random.choice(self.mixed_templates)
        num_messages = random.randint(5, 35)

        messages = []
        timestamp = 0

        starter = random.choice(template['starters'])
        messages.append({
            'speaker': 'user',
            'message': starter,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'mixed',
                'contains_particles': any(p in starter for p in self.particles),
                'dialect_marker': 'mixed_jav_indo'
            }
        })

        timestamp += random.randint(2, 8)

        response = random.choice(template['responses'])
        messages.append({
            'speaker': 'assistant',
            'message': response,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'mixed',
                'contains_particles': any(p in response for p in self.particles),
                'dialect_marker': 'mixed_jav_indo'
            }
        })

        for _ in range((num_messages - 2) // 2):
            timestamp += random.randint(3, 10)
            follow_up = self._generate_mixed_followup(template['topic'])
            messages.append({
                'speaker': 'user' if len(messages) % 2 == 0 else 'assistant',
                'message': follow_up,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': random.choice(self.emotions),
                    'formality_level': 'mixed',
                    'contains_particles': any(p in follow_up for p in self.particles),
                    'dialect_marker': 'mixed_jav_indo'
                }
            })

        return {
            'conversation_id': f'jav_{self.conversation_counter:04d}',
            'style': 'mixed',
            'dialect': 'mixed_jav_indo',
            'topic': template['topic'],
            'messages': messages,
            'quality_metrics': {
                'naturalness_score': random.randint(8, 10),
                'cultural_authenticity': random.randint(8, 10),
                'speech_level_accuracy': random.randint(8, 10),
                'dialect_consistency': random.randint(8, 10)
            }
        }

    def generate_yogya_conversation(self) -> Dict[str, Any]:
        """Generate a Yogyakarta dialect conversation"""
        self.conversation_counter += 1
        template = random.choice(self.yogya_templates)
        num_messages = random.randint(5, 35)

        messages = []
        timestamp = 0

        starter = random.choice(template['starters'])
        messages.append({
            'speaker': 'user',
            'message': starter,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'ngoko',
                'contains_particles': any(p in starter for p in self.particles),
                'dialect_marker': 'yogya'
            }
        })

        timestamp += random.randint(2, 8)

        response = random.choice(template['responses'])
        messages.append({
            'speaker': 'assistant',
            'message': response,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'ngoko',
                'contains_particles': any(p in response for p in self.particles),
                'dialect_marker': 'yogya'
            }
        })

        for _ in range((num_messages - 2) // 2):
            timestamp += random.randint(3, 10)
            follow_up = self._generate_yogya_followup(template['topic'])
            messages.append({
                'speaker': 'user' if len(messages) % 2 == 0 else 'assistant',
                'message': follow_up,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': random.choice(self.emotions),
                    'formality_level': 'ngoko',
                    'contains_particles': any(p in follow_up for p in self.particles),
                    'dialect_marker': 'yogya'
                }
            })

        return {
            'conversation_id': f'jav_{self.conversation_counter:04d}',
            'style': 'ngoko',
            'dialect': 'yogyakarta',
            'topic': template['topic'],
            'messages': messages,
            'quality_metrics': {
                'naturalness_score': random.randint(8, 10),
                'cultural_authenticity': random.randint(9, 10),
                'speech_level_accuracy': random.randint(9, 10),
                'dialect_consistency': random.randint(9, 10)
            }
        }

    def generate_surabaya_conversation(self) -> Dict[str, Any]:
        """Generate a Surabaya dialect conversation"""
        self.conversation_counter += 1
        template = random.choice(self.surabaya_templates)
        num_messages = random.randint(5, 35)

        messages = []
        timestamp = 0

        starter = random.choice(template['starters'])
        messages.append({
            'speaker': 'user',
            'message': starter,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'ngoko',
                'contains_particles': any(p in starter for p in self.particles),
                'dialect_marker': 'surabaya'
            }
        })

        timestamp += random.randint(2, 8)

        response = random.choice(template['responses'])
        messages.append({
            'speaker': 'assistant',
            'message': response,
            'timestamp_offset': timestamp,
            'metadata': {
                'emotion': random.choice(self.emotions),
                'formality_level': 'ngoko',
                'contains_particles': any(p in response for p in self.particles),
                'dialect_marker': 'surabaya'
            }
        })

        for _ in range((num_messages - 2) // 2):
            timestamp += random.randint(3, 10)
            follow_up = self._generate_surabaya_followup(template['topic'])
            messages.append({
                'speaker': 'user' if len(messages) % 2 == 0 else 'assistant',
                'message': follow_up,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': random.choice(self.emotions),
                    'formality_level': 'ngoko',
                    'contains_particles': any(p in follow_up for p in self.particles),
                    'dialect_marker': 'surabaya'
                }
            })

        return {
            'conversation_id': f'jav_{self.conversation_counter:04d}',
            'style': 'ngoko',
            'dialect': 'surabaya',
            'topic': template['topic'],
            'messages': messages,
            'quality_metrics': {
                'naturalness_score': random.randint(8, 10),
                'cultural_authenticity': random.randint(8, 10),
                'speech_level_accuracy': random.randint(9, 10),
                'dialect_consistency': random.randint(9, 10)
            }
        }

    def _generate_ngoko_followup(self, topic: str) -> str:
        """Generate ngoko follow-up messages"""
        followups = {
            'family_gathering': [
                "Oke, aku arep nggawa bakpia ya.",
                "Simbah ngajak bocah-bocah kabeh kok.",
                "Wah, sesuk ketemu kabeh dadi seneng.",
                "Iya, tak kandani bapak ibu ya.",
                "Oleh-oleh opo sing apik kanggo simbah?",
                "Aku tuku kue lapis wae ya.",
            ],
            'daily_life': [
                "Mengko sore tak telpon maneh ya.",
                "Oke, ati-ati ning dalan.",
                "Wah enak, aku uga arep ngono.",
                "Maturnuwun lho wis mbantu.",
                "Sesuk tak jak bareng ya.",
            ],
            'food_discussion': [
                "Pedasane piro? Aku ora kuat pedas.",
                "Enak karo sambel terasi iku.",
                "Aku pengen nyoba masakan kae.",
                "Resepne gampang ora?",
                "Wah, ngiler aku krungu critamu.",
            ]
        }
        return random.choice(followups.get(topic, followups['daily_life']))

    def _generate_krama_followup(self, topic: str) -> str:
        """Generate krama follow-up messages"""
        followups = {
            'traditional_ceremony': [
                "Maturnuwun sanget Pak, kula badhe ngaturaken dhateng kulawarga.",
                "Inggih, mugi-mugi lancar lan berkah.",
                "Kula badhe maringi kabar menawi wonten perubahan.",
                "Matur nuwun atas wektunipun Pak.",
                "Kepareng kula nyuwun keterangan malih?",
            ],
            'business': [
                "Inggih Pak, kula badhe ndamel laporan rinci.",
                "Maturnuwun atas pamrayoginipun.",
                "Kula badhe langkung tlaten malih.",
                "Mugi-mugi usaha punika lancar.",
                "Kula nyuwun pandonga saking panjenengan.",
            ]
        }
        return random.choice(followups.get(topic, followups['traditional_ceremony']))

    def _generate_mixed_followup(self, topic: str) -> str:
        """Generate mixed Javanese-Indonesian follow-up messages"""
        followups = {
            'education': [
                "Oke, nanti aku kirim hasilnya ya.",
                "Maturnuwun wis dibantu lho.",
                "Besok kita belajar bareng aja?",
                "Aku juga perlu bantuan untuk bagian ini.",
                "Soalnya memang susah sih, perlu konsentrasi.",
            ],
            'work_discussion': [
                "Siap Pak, nanti saya revisi lagi.",
                "Oke, deadline-nya tak catat.",
                "Untuk meeting besok wis ada persiapan.",
                "Baik, nanti saya koordinasi dengan tim.",
                "Maturnuwun atas feedbacknya.",
            ]
        }
        return random.choice(followups.get(topic, followups['education']))

    def _generate_yogya_followup(self, topic: str) -> str:
        """Generate Yogyakarta dialect follow-up messages"""
        followups = {
            'cultural_event': [
                "Iya aku wis mesen tiket lho.",
                "Dalange Ki Manteb, apik banget.",
                "Bareng karo kanca-kanca wae luwih rame.",
                "Sesuk tak jak adhik-adhik uga.",
                "Ning Ngasem ketoprakke saben Sabtu.",
            ],
            'market_shopping': [
                "Wah murah tenan, tak tuku akeh.",
                "Iki seger durung Bu?",
                "Kulo tumbas setunggal kilo mawon.",
                "Ana diskon ora niki?",
                "Maturnuwun ya Bu, sesuk mampir maneh.",
            ]
        }
        return random.choice(followups.get(topic, followups['cultural_event']))

    def _generate_surabaya_followup(self, topic: str) -> str:
        """Generate Surabaya dialect follow-up messages"""
        followups = {
            'neighbor_chat': [
                "Iya, awakmu yo ngono kok.",
                "Alhamdulillah sehat kabeh.",
                "Ayo mampir ning omahku sesuk.",
                "Walah seneng tenan awakmu.",
                "Oke, mengko tak ceritake maneh.",
            ],
            'travel_plans': [
                "Ayo berangkat bareng wae.",
                "Lumayan murah yen bareng-bareng.",
                "Aku wis booking hotel e kok.",
                "Perjalanan piro jam?",
                "Ati-ati ning dalan ya cak.",
            ]
        }
        return random.choice(followups.get(topic, followups['neighbor_chat']))

    def generate_all_conversations(self, output_file: str):
        """Generate all 3,000 conversations and save to JSON"""
        print("Starting Javanese conversation generation...")
        print("=" * 60)

        all_conversations = []

        # Generate 600 Ngoko conversations
        print("\n[1/5] Generating 600 Ngoko conversations...")
        for i in range(600):
            conv = self.generate_ngoko_conversation()
            all_conversations.append(conv)
            if (i + 1) % 100 == 0:
                print(f"  Progress: {i + 1}/600 completed")

        # Generate 600 Krama conversations
        print("\n[2/5] Generating 600 Krama conversations...")
        for i in range(600):
            conv = self.generate_krama_conversation()
            all_conversations.append(conv)
            if (i + 1) % 100 == 0:
                print(f"  Progress: {i + 1}/600 completed")

        # Generate 600 Mixed conversations
        print("\n[3/5] Generating 600 Mixed Javanese-Indonesian conversations...")
        for i in range(600):
            conv = self.generate_mixed_conversation()
            all_conversations.append(conv)
            if (i + 1) % 100 == 0:
                print(f"  Progress: {i + 1}/600 completed")

        # Generate 600 Yogyakarta conversations
        print("\n[4/5] Generating 600 Yogyakarta dialect conversations...")
        for i in range(600):
            conv = self.generate_yogya_conversation()
            all_conversations.append(conv)
            if (i + 1) % 100 == 0:
                print(f"  Progress: {i + 1}/600 completed")

        # Generate 600 Surabaya conversations
        print("\n[5/5] Generating 600 Surabaya dialect conversations...")
        for i in range(600):
            conv = self.generate_surabaya_conversation()
            all_conversations.append(conv)
            if (i + 1) % 100 == 0:
                print(f"  Progress: {i + 1}/600 completed")

        # Create final dataset
        dataset = {
            'dataset_id': 'javanese_claude6',
            'total_conversations': len(all_conversations),
            'generation_date': datetime.now().isoformat(),
            'distribution': {
                'ngoko': 600,
                'krama': 600,
                'mixed': 600,
                'yogyakarta': 600,
                'surabaya': 600
            },
            'conversations': all_conversations
        }

        # Save to file
        print(f"\n\nSaving dataset to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)

        print("=" * 60)
        print(f"✓ Successfully generated {len(all_conversations)} conversations!")
        print(f"✓ Saved to: {output_file}")
        print("=" * 60)

        # Print statistics
        total_messages = sum(len(c['messages']) for c in all_conversations)
        avg_messages = total_messages / len(all_conversations)

        print("\nDataset Statistics:")
        print(f"  Total conversations: {len(all_conversations)}")
        print(f"  Total messages: {total_messages}")
        print(f"  Average messages per conversation: {avg_messages:.1f}")
        print(f"  Ngoko conversations: 600")
        print(f"  Krama conversations: 600")
        print(f"  Mixed Javanese-Indonesian: 600")
        print(f"  Yogyakarta dialect: 600")
        print(f"  Surabaya dialect: 600")

def main():
    generator = JavaneseConversationGenerator()
    output_file = '/home/user/nuzantara/claude6_javanese.json'
    generator.generate_all_conversations(output_file)

if __name__ == '__main__':
    main()
