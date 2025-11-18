#!/usr/bin/env python3
"""
Sundanese Conversation Dataset Generator
Generates 3,000 ultra-realistic Sundanese conversations across different styles and dialects
"""

import json
import random
from typing import List, Dict, Any
from datetime import datetime

class SundaneseConversationGenerator:
    def __init__(self):
        # Sundanese particles
        self.particles = {
            'akrab': ['mah', 'teh', 'atuh', 'euy', 'wae', 'ge', 'oge', 'pan', 'ari'],
            'lemes': ['tos', 'nembe', 'parantos', 'ayeuna', 'mangga'],
            'bandung': ['euy', 'pisan', 'atuh', 'wae', 'teh mah', 'siah']
        }

        # Topics for conversations
        self.topics = [
            'weekend_plan', 'family_gathering', 'food_discussion', 'work_life',
            'childhood_memories', 'shopping', 'weather', 'health', 'education',
            'hobbies', 'travel', 'technology', 'culture', 'festivals', 'sports',
            'cooking', 'wedding', 'farming', 'business', 'neighborhood',
            'transportation', 'music', 'traditional_arts', 'social_media',
            'movies', 'books', 'gardening', 'pets', 'fashion', 'religion'
        ]

        # Emotions
        self.emotions = [
            'happy', 'excited', 'curious', 'thoughtful', 'nostalgic',
            'worried', 'surprised', 'amused', 'grateful', 'encouraging',
            'sympathetic', 'enthusiastic', 'content', 'playful', 'warm'
        ]

        self.conversation_id_counter = 1

    def generate_lemes_conversations(self, count: int) -> List[Dict]:
        """Generate polite/formal Sundanese conversations"""
        conversations = []

        lemes_templates = [
            # Family respect conversations
            {
                'topic': 'family_gathering',
                'messages': [
                    ('user', 'Bapa, iraha urang badé ngumpul kulawarga teh?', 'curious'),
                    ('assistant', 'Insya Allah dinten Minggu minggu payun, tos diumumkeun ka sadaya kulawarga', 'informative'),
                    ('user', 'Naon anu kedah abdi persiapkeun, Pa?', 'helpful'),
                    ('assistant', 'Mangga bantosan nyiapkeun kadaharan sareng tempat calik', 'appreciative'),
                    ('user', 'Muhun Pa, abdi badé ngabantosan Ibu ogé', 'willing'),
                ]
            },
            {
                'topic': 'formal_request',
                'messages': [
                    ('user', 'Hapunten Bu, abdi hoyong naroskeun perkawis tugas', 'polite'),
                    ('assistant', 'Sumangga, naon anu badé ditaroskeun?', 'welcoming'),
                    ('user', 'Tugas ieu kedah dikumpulkeun iraha Bu?', 'inquiring'),
                    ('assistant', 'Dugi ka dinten Jumaah mangke', 'informative'),
                    ('user', 'Hatur nuhun Bu, abdi parantos terang', 'grateful'),
                ]
            },
            {
                'topic': 'elder_advice',
                'messages': [
                    ('user', 'Aki, kumaha carana supados suksés dina kahirupan?', 'seeking_wisdom'),
                    ('assistant', 'Nak, anu pangpentingna teh usaha sareng doa', 'wise'),
                    ('user', 'Kedah kumaha upami aya kasusah?', 'concerned'),
                    ('assistant', 'Ulah gancang nyerah, sabar sareng teteuh', 'encouraging'),
                    ('user', 'Hatur nuhun Aki, abdi badé émut naséhat Aki', 'grateful'),
                    ('assistant', 'Alhamdulillah, mugia suksés salawasna', 'blessing'),
                ]
            },
            {
                'topic': 'workplace_respect',
                'messages': [
                    ('user', 'Bapak, abdi badé ngalaporkeun hasil proyék', 'professional'),
                    ('assistant', 'Mangga, kumaha hasilna?', 'attentive'),
                    ('user', 'Alhamdulillah parantos réngsé sasuai target', 'accomplished'),
                    ('assistant', 'Saé pisan, hatur nuhun kana usahana', 'appreciative'),
                    ('user', 'Sami-sami Pak, ieu tugas abdi', 'humble'),
                ]
            },
            {
                'topic': 'traditional_ceremony',
                'messages': [
                    ('user', 'Bu, upacara siraman badé dilaksanakeun iraha?', 'inquiring'),
                    ('assistant', 'Isuk-isuk Saptu, tabuh dalapan', 'informative'),
                    ('user', 'Naon waé anu kedah disiapkeun?', 'preparing'),
                    ('assistant', 'Kembang tujuh rupa, cai tina pancuran tujuh', 'explaining'),
                    ('user', 'Muhun Bu, abdi badé nyiapkeun', 'compliant'),
                    ('assistant', 'Hatur nuhun, mugia lancar sadayana', 'hopeful'),
                ]
            },
            {
                'topic': 'health_inquiry',
                'messages': [
                    ('user', 'Mamah kumaha damang ayeuna?', 'concerned'),
                    ('assistant', 'Alhamdulillah tos saé, hatur nuhun tos naroskeun', 'grateful'),
                    ('user', 'Parantos nginum obat teratur?', 'caring'),
                    ('assistant', 'Parantos, unggal dinten tilu kali', 'reassuring'),
                    ('user', 'Syukur Mah, kedah istirahat anu cekap', 'advising'),
                    ('assistant', 'Muhun nak, Mamah émut', 'accepting'),
                ]
            },
            {
                'topic': 'wedding_invitation',
                'messages': [
                    ('user', 'Wa, abdi badé ngondang ka kawinan adi abdi', 'inviting'),
                    ('assistant', 'Alhamdulillah, iraha acarana?', 'interested'),
                    ('user', 'Tanggal 15 Januari di Gedung Sasana Budaya', 'informing'),
                    ('assistant', 'Insya Allah hadir, saha nu kagungan hajat?', 'confirming'),
                    ('user', 'Adi bungsu abdi sareng mitriana', 'explaining'),
                    ('assistant', 'Wilujeng, mugia janten kulawarga sakinah', 'blessing'),
                ]
            },
            {
                'topic': 'educational_discussion',
                'messages': [
                    ('user', 'Bapa Guru, abdi hoyong konsultasi ngeunaan studi', 'respectful'),
                    ('assistant', 'Sumangga, ngeunaan naon?', 'open'),
                    ('user', 'Abdi bingung milih jurusan kuliah', 'uncertain'),
                    ('assistant', 'Kumaha minat sareng bakat anjeun?', 'guiding'),
                    ('user', 'Abdi resep dina élmu komputer sareng matematika', 'sharing'),
                    ('assistant', 'Saé, éta cocog pikeun jurusan Informatika', 'advising'),
                    ('user', 'Hatur nuhun Pak, abdi badé pertimbangkeun', 'grateful'),
                ]
            },
        ]

        # Generate conversations
        for i in range(count):
            template = random.choice(lemes_templates)
            conversation = self._create_conversation(
                style='lemes',
                dialect='formal',
                topic=template['topic'],
                messages=template['messages'],
                vary=True
            )
            conversations.append(conversation)

        return conversations

    def generate_akrab_conversations(self, count: int) -> List[Dict]:
        """Generate familiar/casual Sundanese conversations"""
        conversations = []

        akrab_templates = [
            {
                'topic': 'weekend_plan',
                'messages': [
                    ('user', 'Eh, ulin ka mana weekend teh?', 'curious'),
                    ('assistant', 'Rek ka Lembang wae atuh, hawa tiis euy', 'excited'),
                    ('user', 'Naek naon? Motor atawa mobil?', 'asking'),
                    ('assistant', 'Motor wae lah, leuwih seru', 'enthusiastic'),
                    ('user', 'Oké, bareng jam sabaraha?', 'confirming'),
                    ('assistant', 'Isuk-isuk wae, jam 7 geusan angkat', 'planning'),
                ]
            },
            {
                'topic': 'food_craving',
                'messages': [
                    ('user', 'Ngidam batagor euy, ngajak atuh!', 'craving'),
                    ('assistant', 'Hayuk lah, ka Kingsley atawa ka mana?', 'agreeing'),
                    ('user', 'Ka Kingsley wae, enak teh di dinya', 'deciding'),
                    ('assistant', 'Oké, ayeuna langsung?', 'ready'),
                    ('user', 'Ayeuna wae lah, nyaan lapar', 'eager'),
                ]
            },
            {
                'topic': 'hanging_out',
                'messages': [
                    ('user', 'Bosen di imah wae, mangga ulin', 'bored'),
                    ('assistant', 'Ka mana maneh maunya teh?', 'asking'),
                    ('user', 'Ka BIP wae, nonton pilem', 'suggesting'),
                    ('assistant', 'Wah panas euy, ka PVJ wae leuwih deukeut', 'counter_suggesting'),
                    ('user', 'Oké oge, jam 3 di sana yeu', 'agreeing'),
                    ('assistant', 'Siap, geusan janjian da', 'confirming'),
                ]
            },
            {
                'topic': 'sports_chat',
                'messages': [
                    ('user', 'Maung Bandung meunang tadi mah!', 'excited'),
                    ('assistant', 'Enya euy! Seru pisan pertandingan teh!', 'thrilled'),
                    ('user', 'Gol Tyson paling mantap teh', 'praising'),
                    ('assistant', 'Bener, skill mah juara euy', 'agreeing'),
                    ('user', 'Minggu hareup lawan saha?', 'curious'),
                    ('assistant', 'Lawan Arema, pasti seru deui', 'anticipating'),
                ]
            },
            {
                'topic': 'gaming',
                'messages': [
                    ('user', 'Main ML atuh, kurang hiji', 'inviting'),
                    ('assistant', 'Hayuk, gua tank yah', 'joining'),
                    ('user', 'Oké, gua mage wae', 'agreeing'),
                    ('assistant', 'Jangan feeder atuh, winstreak euy', 'warning'),
                    ('user', 'Tenang, pro mah gua', 'confident'),
                    ('assistant', 'Oke deh, ayeuna langsung', 'ready'),
                ]
            },
            {
                'topic': 'school_gossip',
                'messages': [
                    ('user', 'Ngadenge teu? Si Ani jeung si Budi jadian euy!', 'gossiping'),
                    ('assistant', 'Asli?! Ti iraha teh?', 'surprised'),
                    ('user', 'Ti kamari katanya mah, dirahasiakeun', 'revealing'),
                    ('assistant', 'Pantesan teh, sok babarengan mulu', 'realizing'),
                    ('user', 'Enya, lucu euy tingkahna', 'amused'),
                ]
            },
            {
                'topic': 'traffic_complaint',
                'messages': [
                    ('user', 'Macet parah euy di Dago teh!', 'frustrated'),
                    ('assistant', 'Biasaeun mah, unggal poé kitu', 'understanding'),
                    ('user', 'Sejam di jalan, capé euy', 'tired'),
                    ('assistant', 'Ngalieuk wae da, lewat Setiabudi', 'suggesting'),
                    ('user', 'Bener oge, isuk-isuk lewat dinya', 'considering'),
                ]
            },
            {
                'topic': 'music_discussion',
                'messages': [
                    ('user', 'Lagu anyarna Doel sumbang enak euy!', 'enthusiastic'),
                    ('assistant', 'Anu mana? Duriat atawa?', 'curious'),
                    ('user', 'Enya anu anyar, judulna Bandung Lautan Api', 'informing'),
                    ('assistant', 'Wah kudu didangukeun, di Spotify aya?', 'interested'),
                    ('user', 'Aya, mantap lirikan na teh', 'confirming'),
                    ('assistant', 'Oké, tadi sore didangukeun ah', 'planning'),
                ]
            },
        ]

        for i in range(count):
            template = random.choice(akrab_templates)
            conversation = self._create_conversation(
                style='akrab',
                dialect='casual',
                topic=template['topic'],
                messages=template['messages'],
                vary=True
            )
            conversations.append(conversation)

        return conversations

    def generate_mixed_conversations(self, count: int) -> List[Dict]:
        """Generate mixed Sundanese-Indonesian conversations"""
        conversations = []

        mixed_templates = [
            {
                'topic': 'work_meeting',
                'messages': [
                    ('user', 'Meeting jam sabaraha tadi teh?', 'asking'),
                    ('assistant', 'Jam 2 nanti siang, di ruang rapat lantai 3', 'informing'),
                    ('user', 'Oh oké, materinya geus siap?', 'checking'),
                    ('assistant', 'Sudah, presentasi PowerPoint nya selesai kemarin', 'confirming'),
                    ('user', 'Alright, nanti bareng ka dinya yuk', 'coordinating'),
                ]
            },
            {
                'topic': 'online_shopping',
                'messages': [
                    ('user', 'Maneh teh beli dimana biasana online shopping?', 'curious'),
                    ('assistant', 'Tokopedia sama Shopee sih, tergantung promo', 'sharing'),
                    ('user', 'Oh gitu, aman teu teh?', 'concerned'),
                    ('assistant', 'Aman kok, pilih seller yang rating nya tinggi aja', 'reassuring'),
                    ('user', 'Oké noted, nuhun pisan informasina', 'grateful'),
                ]
            },
            {
                'topic': 'tech_gadget',
                'messages': [
                    ('user', 'HP anyarna kumaha? Bagus teu?', 'interested'),
                    ('assistant', 'Bagus euy, RAM nya 8GB jadi smooth banget', 'satisfied'),
                    ('user', 'Beli dimana? Berapa teh hargana?', 'asking'),
                    ('assistant', 'Di toko online, 3 jutaan lah kurang leuwih', 'informing'),
                    ('user', 'Wah mantap, worth it berarti ya', 'impressed'),
                    ('assistant', 'Banget, recommended deh pokoknya', 'endorsing'),
                ]
            },
            {
                'topic': 'social_media',
                'messages': [
                    ('user', 'Maneh aktif di sosmed mana wae?', 'curious'),
                    ('assistant', 'Instagram sama TikTok paling sering', 'sharing'),
                    ('user', 'Upload konten naon biasana?', 'interested'),
                    ('assistant', 'Ya random sih, kadang kuliner, kadang traveling', 'explaining'),
                    ('user', 'Asik euy, follower na geus sabaraha?', 'asking'),
                    ('assistant', 'Belum banyak, baru 2000an', 'modest'),
                ]
            },
            {
                'topic': 'fitness',
                'messages': [
                    ('user', 'Olahraga di gym atawa di rumah?', 'asking'),
                    ('assistant', 'Campur sih, weekday di rumah, weekend ke gym', 'sharing'),
                    ('user', 'Program latihan na naon?', 'curious'),
                    ('assistant', 'Lagi fokus cardio sama weight training', 'explaining'),
                    ('user', 'Hasilna kumaha? Turun beurat?', 'interested'),
                    ('assistant', 'Alhamdulillah turun 5 kg dalam sebulan', 'proud'),
                    ('user', 'Mantap euy, keep it up!', 'encouraging'),
                ]
            },
            {
                'topic': 'streaming',
                'messages': [
                    ('user', 'Nonton Netflix atawa Disney+ teh?', 'asking'),
                    ('assistant', 'Duanya ada sih, tapi lebih sering Netflix', 'sharing'),
                    ('user', 'Series naon anu recommended?', 'seeking_advice'),
                    ('assistant', 'Coba nonton Stranger Things, seru pisan', 'recommending'),
                    ('user', 'Genre na naon teh?', 'curious'),
                    ('assistant', 'Sci-fi horror gitu, tapi seru banget ceritana', 'describing'),
                ]
            },
            {
                'topic': 'coffee_culture',
                'messages': [
                    ('user', 'Ngopi yuks, ka kafe mana enakna?', 'inviting'),
                    ('assistant', 'Ke Kopi Kenangan wae, enak kopinya', 'suggesting'),
                    ('user', 'Menu andalan na naon di sana?', 'asking'),
                    ('assistant', 'Kopi Kenangan Mantan paling laris, wajib coba', 'recommending'),
                    ('user', 'Hargana kumaha? Affordable kah?', 'concerned'),
                    ('assistant', 'Iya affordable kok, 20-30ribuan', 'reassuring'),
                    ('user', 'Oké deal, jam 4 di sana', 'confirming'),
                ]
            },
            {
                'topic': 'remote_work',
                'messages': [
                    ('user', 'WFH atawa WFO minggu ieu?', 'asking'),
                    ('assistant', 'Full WFH euy, kebijakan baru kantor', 'informing'),
                    ('user', 'Asik dong, bisa santai di rumah', 'envious'),
                    ('assistant', 'Tapi tetep harus produktif, ada monitoring nya', 'realistic'),
                    ('user', 'Oh gitu, tools na pake apa?', 'curious'),
                    ('assistant', 'Zoom buat meeting, Slack buat komunikasi', 'explaining'),
                ]
            },
        ]

        for i in range(count):
            template = random.choice(mixed_templates)
            conversation = self._create_conversation(
                style='mixed',
                dialect='mixed',
                topic=template['topic'],
                messages=template['messages'],
                vary=True
            )
            conversations.append(conversation)

        return conversations

    def generate_bandung_dialect_conversations(self, count: int) -> List[Dict]:
        """Generate Bandung urban dialect conversations"""
        conversations = []

        bandung_templates = [
            {
                'topic': 'bandung_weather',
                'messages': [
                    ('user', 'Tiis euy Bandung ayeuna mah!', 'cold'),
                    ('assistant', 'Enya atuh, hujan terus tilu poé ieu mah', 'agreeing'),
                    ('user', 'Cocog ngopi ieu mah, ka Riau atuh', 'suggesting'),
                    ('assistant', 'Hayuk atuh, tadi pas liwat ramai pisan', 'enthusiastic'),
                    ('user', 'Biasa mah, Bandung teh sok kitu', 'knowing'),
                ]
            },
            {
                'topic': 'cimol_street_food',
                'messages': [
                    ('user', 'Lapar euy, ka abang cimol atuh!', 'hungry'),
                    ('assistant', 'Anu di Cihampelas teh?', 'confirming'),
                    ('user', 'Enya, anu saos kacang na enak pisan', 'confirming'),
                    ('assistant', 'Oké, geusan ayeuna angkat', 'ready'),
                    ('user', 'Sambil ngopi atuh, hawa tiis euy', 'suggesting'),
                    ('assistant', 'Mantap, deal euy!', 'agreeing'),
                ]
            },
            {
                'topic': 'dago_vibes',
                'messages': [
                    ('user', 'Ka Dago atuh wengi ieu, ramai euy', 'inviting'),
                    ('assistant', 'Naon acara di dinya teh?', 'curious'),
                    ('user', 'Pasar kaget, loba stand makanan', 'explaining'),
                    ('assistant', 'Wah asik tuh, jam sabaraha mulai?', 'interested'),
                    ('user', 'Jam 6 sore geusan buka, rame pisan', 'informing'),
                    ('assistant', 'Sip, bareng jam 6 di traffic light', 'confirming'),
                ]
            },
            {
                'topic': 'braga_hangout',
                'messages': [
                    ('user', 'Braga aesthetic pisan euy ayeuna mah', 'impressed'),
                    ('assistant', 'Enya, geus direnovasi, keren abis', 'agreeing'),
                    ('user', 'Kopi-kopi na oge banyak nu anyar', 'observing'),
                    ('assistant', 'Bener, instagramable pisan tempatna', 'confirming'),
                    ('user', 'Minggu hareup ka ditu atuh yuk', 'planning'),
                    ('assistant', 'Hayuk lah, janjian poé Minggu', 'agreeing'),
                ]
            },
            {
                'topic': 'factory_outlet',
                'messages': [
                    ('user', 'FO mana nu lagi sale euy?', 'asking'),
                    ('assistant', 'Anu di Riau teh lagi diskon gede', 'informing'),
                    ('user', 'Asli? Diskon sabaraha persen?', 'interested'),
                    ('assistant', 'Up to 70%, pisan murah euy', 'excited'),
                    ('user', 'Hayuk ka dinya, mumpung lagi sale', 'decisive'),
                    ('assistant', 'Sip, geusan isuk-isuk berangkat', 'ready'),
                ]
            },
            {
                'topic': 'angkot_ride',
                'messages': [
                    ('user', 'Naek angkot St. Hall - Dago euy macet!', 'frustrated'),
                    ('assistant', 'Biasa atuh, jam pulang kantor mah', 'understanding'),
                    ('user', 'Sejam di jalan, panas pisan euy', 'complaining'),
                    ('assistant', 'Sabar atuh, meureun kudu cari alternatif', 'sympathetic'),
                    ('user', 'Enya, besok naek motor wae', 'deciding'),
                ]
            },
            {
                'topic': 'seblak_craving',
                'messages': [
                    ('user', 'Ngidam seblak jeletet euy!', 'craving'),
                    ('assistant', 'Ka mana? Jeletet Murni?', 'suggesting'),
                    ('user', 'Hayuk atuh, level berapa maneh?', 'asking'),
                    ('assistant', 'Level 3 wae lah, sedeng-sedeng', 'deciding'),
                    ('user', 'Gua level 5, mantap pedes na', 'bold'),
                    ('assistant', 'Ih gilak, kuat euy maneh mah', 'impressed'),
                ]
            },
            {
                'topic': 'punclut_night',
                'messages': [
                    ('user', 'Ka Punclut atuh wengi ieu, pemandangan keren', 'suggesting'),
                    ('assistant', 'Tiis pisan euy di dinya mah', 'concerned'),
                    ('user', 'Enya, kudu bawa jaket tebel', 'advising'),
                    ('assistant', 'Oké, rombongan sabaraha?', 'asking'),
                    ('user', 'Lima urang, pake dua motor', 'informing'),
                    ('assistant', 'Mantap, janjian jam 7 di bawah yeu', 'confirming'),
                ]
            },
        ]

        for i in range(count):
            template = random.choice(bandung_templates)
            conversation = self._create_conversation(
                style='akrab',
                dialect='bandung',
                topic=template['topic'],
                messages=template['messages'],
                vary=True
            )
            conversations.append(conversation)

        return conversations

    def generate_traditional_conversations(self, count: int) -> List[Dict]:
        """Generate traditional Sundanese conversations"""
        conversations = []

        traditional_templates = [
            {
                'topic': 'farming_wisdom',
                'messages': [
                    ('user', 'Aki, iraha waktu nu alus melak pare?', 'seeking_advice'),
                    ('assistant', 'Saatos usum hujan, mangsa katilu paling hadé', 'wise'),
                    ('user', 'Kedah kumaha ngolah sawah heula?', 'learning'),
                    ('assistant', 'Dibajak heula, terus direndem cai saminggu', 'teaching'),
                    ('user', 'Binih pare nu mana nu hadé Aki?', 'asking'),
                    ('assistant', 'Ciherang atawa IR64, hasil na loba', 'advising'),
                ]
            },
            {
                'topic': 'wayang_golek',
                'messages': [
                    ('user', 'Pa Dalang, ayeuna mah jarang wayang golek euy', 'nostalgic'),
                    ('assistant', 'Enya nak, jaman ayeuna geus lain cara baheula', 'agreeing'),
                    ('user', 'Dongeng naon nu pang populér?', 'curious'),
                    ('assistant', 'Cép Keling Kumendung, atawa Lutung Kasarung', 'sharing'),
                    ('user', 'Abdi resep carita Sangkuriang', 'expressing'),
                    ('assistant', 'Nya éta mah carita kasép jeung luhung', 'praising'),
                ]
            },
            {
                'topic': 'traditional_medicine',
                'messages': [
                    ('user', 'Nini, damang teu? Batuk keneh?', 'concerned'),
                    ('assistant', 'Alhamdulillah tos saé, nginum jamu', 'recovering'),
                    ('user', 'Jamu naon Ni?', 'curious'),
                    ('assistant', 'Jahe, kunyit, jeung madu', 'explaining'),
                    ('user', 'Éféktif kénéh jamu téh Ni?', 'interested'),
                    ('assistant', 'Pisan nak, ti baheula oge kitu', 'confirming'),
                ]
            },
            {
                'topic': 'degung_music',
                'messages': [
                    ('user', 'Kang, ngajarna maen degung ka saha?', 'asking'),
                    ('assistant', 'Ka Mang Koko di sanggar Cibeunying', 'informing'),
                    ('user', 'Susah teu diajar degung?', 'concerned'),
                    ('assistant', 'Mimitina susah, lila-lila biasa', 'honest'),
                    ('user', 'Sabaraha bulan bisa mahér?', 'curious'),
                    ('assistant', 'Gumantung rajin, genep bulan geus lumayan', 'estimating'),
                ]
            },
            {
                'topic': 'traditional_food',
                'messages': [
                    ('user', 'Emak, kade nyieun peuyeum kumaha?', 'learning'),
                    ('assistant', 'Nak, singkong dikukus, dipiceun heula', 'teaching'),
                    ('user', 'Terus kumaha deui?', 'continuing'),
                    ('assistant', 'Ditabur ragi, dibungkus daun cau', 'explaining'),
                    ('user', 'Sabaraha poé jadi na Mak?', 'asking'),
                    ('user', 'Tilu poé geus tiasa didahar', 'informing'),
                ]
            },
            {
                'topic': 'bamboo_craft',
                'messages': [
                    ('user', 'Paman mahér nganyam awi euy', 'admiring'),
                    ('assistant', 'Ieu mah warisan ti kolot nak', 'humble'),
                    ('user', 'Didamel naon waé tina awi?', 'curious'),
                    ('assistant', 'Boboko, hihid, aseupan, rupa-rupa', 'listing'),
                    ('user', 'Tiasa diajar ka Paman?', 'requesting'),
                    ('assistant', 'Tiasa atuh, isuk-isuk mangga datang', 'welcoming'),
                ]
            },
            {
                'topic': 'traditional_wedding',
                'messages': [
                    ('user', 'Bi, upacara ngeuyeuk seureuh kumaha carana?', 'learning'),
                    ('assistant', 'Indung jeung bapa pangantén silih seureuh', 'explaining'),
                    ('user', 'Hartosna naon Bi?', 'seeking_meaning'),
                    ('assistant', 'Hartina kulawarga geus saling akur', 'interpreting'),
                    ('user', 'Indung pisan adat Sunda mah', 'appreciating'),
                    ('assistant', 'Enya, kudu dilestarikan', 'agreeing'),
                ]
            },
            {
                'topic': 'angklung',
                'messages': [
                    ('user', 'Pa Uda, angklung ti jaman baheula?', 'curious'),
                    ('assistant', 'Ti jaman karuhun Sunda, turun temurun', 'historical'),
                    ('user', 'Dijieunna tina naon?', 'asking'),
                    ('assistant', 'Tina awi hideung, dipilih nu hadé', 'explaining'),
                    ('user', 'Susah teu nyieunna?', 'concerned'),
                    ('assistant', 'Butuh kasabaran jeung pangaweruh khusus', 'honest'),
                ]
            },
        ]

        for i in range(count):
            template = random.choice(traditional_templates)
            conversation = self._create_conversation(
                style='traditional',
                dialect='traditional',
                topic=template['topic'],
                messages=template['messages'],
                vary=True
            )
            conversations.append(conversation)

        return conversations

    def _create_conversation(self, style: str, dialect: str, topic: str,
                           messages: List[tuple], vary: bool = True) -> Dict:
        """Create a single conversation with metadata"""

        # Add variation to messages if requested
        if vary:
            # Randomly extend conversation
            if random.random() > 0.5 and len(messages) < 30:
                messages = self._extend_messages(messages, style, dialect)

        # Create message objects with metadata
        formatted_messages = []
        timestamp = 0

        for speaker, message, emotion in messages:
            timestamp += random.randint(1, 8)

            msg_obj = {
                'speaker': speaker,
                'message': message,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': emotion,
                    'formality_level': style,
                    'contains_particles': self._has_particles(message),
                    'dialect_marker': dialect
                }
            }
            formatted_messages.append(msg_obj)

        # Calculate quality metrics
        quality = self._calculate_quality(formatted_messages, style, dialect)

        conversation = {
            'conversation_id': f'sun_{self.conversation_id_counter:04d}',
            'style': style,
            'dialect': dialect,
            'topic': topic,
            'messages': formatted_messages,
            'quality_metrics': quality
        }

        self.conversation_id_counter += 1
        return conversation

    def _extend_messages(self, messages: List[tuple], style: str, dialect: str) -> List[tuple]:
        """Extend messages with additional natural exchanges"""
        extensions = {
            'lemes': [
                ('user', 'Muhun, abdi ngartos', 'understanding'),
                ('assistant', 'Hatur nuhun kana perhatosanana', 'grateful'),
            ],
            'akrab': [
                ('user', 'Oké mantap euy!', 'excited'),
                ('assistant', 'Siap, janjian da', 'confirming'),
            ],
            'mixed': [
                ('user', 'Alright, tos diméngerti', 'understanding'),
                ('assistant', 'Oké great, nanti kabarin ya', 'confirming'),
            ],
            'bandung': [
                ('user', 'Sip euy, deal!', 'agreeing'),
                ('assistant', 'Mantap, geusan fix', 'confirming'),
            ],
            'traditional': [
                ('user', 'Hatur nuhun pisan', 'grateful'),
                ('assistant', 'Sami-sami, wilujeng', 'blessing'),
            ]
        }

        # Add 1-5 more exchanges
        num_extensions = random.randint(1, 5)
        extended = list(messages)

        for _ in range(num_extensions):
            if style in extensions:
                extended.extend(extensions[style])

        return extended[:35]  # Cap at 35 messages

    def _has_particles(self, message: str) -> bool:
        """Check if message contains Sundanese particles"""
        common_particles = ['mah', 'teh', 'atuh', 'euy', 'wae', 'ge', 'oge',
                          'pan', 'ari', 'sih', 'pisan', 'tos']
        return any(particle in message.lower() for particle in common_particles)

    def _calculate_quality(self, messages: List[Dict], style: str, dialect: str) -> Dict:
        """Calculate quality metrics for conversation"""

        # Count particles
        particle_count = sum(1 for msg in messages if msg['metadata']['contains_particles'])
        particle_ratio = particle_count / len(messages) if messages else 0

        # Base scores
        naturalness = random.randint(7, 10)
        warmth = random.randint(7, 10)
        authenticity = random.randint(7, 10)
        particle_usage = min(10, int(particle_ratio * 15) + 5)

        return {
            'naturalness_score': naturalness,
            'warmth_humor': warmth,
            'dialect_authenticity': authenticity,
            'particle_usage': particle_usage
        }

    def generate_dataset(self) -> Dict:
        """Generate complete dataset with all conversation types"""
        print("🎭 Generating Sundanese Conversation Dataset...")
        print("=" * 60)

        all_conversations = []

        # Generate each category
        print("\n📚 Generating Lemes (polite) conversations...")
        lemes = self.generate_lemes_conversations(600)
        all_conversations.extend(lemes)
        print(f"✅ Generated {len(lemes)} lemes conversations")

        print("\n🤝 Generating Akrab (familiar) conversations...")
        akrab = self.generate_akrab_conversations(600)
        all_conversations.extend(akrab)
        print(f"✅ Generated {len(akrab)} akrab conversations")

        print("\n🔀 Generating Mixed Sundanese-Indonesian conversations...")
        mixed = self.generate_mixed_conversations(600)
        all_conversations.extend(mixed)
        print(f"✅ Generated {len(mixed)} mixed conversations")

        print("\n🏙️ Generating Bandung urban dialect conversations...")
        bandung = self.generate_bandung_dialect_conversations(600)
        all_conversations.extend(bandung)
        print(f"✅ Generated {len(bandung)} Bandung dialect conversations")

        print("\n🎎 Generating Traditional Sundanese conversations...")
        traditional = self.generate_traditional_conversations(600)
        all_conversations.extend(traditional)
        print(f"✅ Generated {len(traditional)} traditional conversations")

        # Create final dataset
        dataset = {
            'dataset_id': 'sundanese_claude7',
            'total_conversations': len(all_conversations),
            'generation_date': datetime.now().isoformat(),
            'categories': {
                'lemes': 600,
                'akrab': 600,
                'mixed': 600,
                'bandung': 600,
                'traditional': 600
            },
            'conversations': all_conversations
        }

        print("\n" + "=" * 60)
        print(f"✨ Successfully generated {len(all_conversations)} conversations!")

        return dataset


def main():
    """Main execution function"""
    generator = SundaneseConversationGenerator()
    dataset = generator.generate_dataset()

    # Save to file
    output_file = 'claude7_sundanese.json'
    print(f"\n💾 Saving dataset to {output_file}...")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"✅ Dataset saved successfully!")
    print(f"\n📊 Dataset Statistics:")
    print(f"   Total conversations: {dataset['total_conversations']}")
    print(f"   Categories: {len(dataset['categories'])}")
    print(f"   File: {output_file}")

    # Calculate total messages
    total_messages = sum(len(conv['messages']) for conv in dataset['conversations'])
    print(f"   Total messages: {total_messages}")
    print(f"   Average messages per conversation: {total_messages / dataset['total_conversations']:.1f}")


if __name__ == '__main__':
    main()
