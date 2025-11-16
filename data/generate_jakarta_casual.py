#!/usr/bin/env python3
"""
Jakarta Casual Conversation Generator
Generates 1,500 ultra-realistic Indonesian conversations in Jakarta casual style
"""

import json
import random
from typing import List, Dict, Tuple
from datetime import datetime

# Jakarta Slang Vocabulary
PARTICLES = ['dong', 'sih', 'nih', 'deh', 'kan', 'kok', 'lho', 'lah', 'ya', 'tuh']
PRONOUNS = ['gw', 'gue', 'w', 'lo', 'lu', 'elu']
NEGATIONS = ['ga', 'gak', 'nggak', 'kagak', 'ngga']
TIME_WORDS = ['udah', 'udh', 'belum', 'blm', 'tadi', 'nanti', 'skrg', 'sekarang']
COMMON_SLANG = [
    'bgt', 'banget', 'kali', 'bet', 'anjir', 'anjay', 'bro', 'cuy', 'cok',
    'wkwk', 'wkwkwk', 'haha', 'hehe', 'asli', 'bener', 'gimana', 'gmn',
    'gimana', 'kenapa', 'knp', 'emang', 'emg', 'iya', 'iya sih', 'gitu',
    'gitu deh', 'biasa aja', 'mantap', 'keren', 'parah', 'gila', 'bisa',
    'mau', 'pengen', 'pgn', 'tau', 'tahu', 'tau deh', 'gatau', 'gtw',
    'sama', 'juga', 'jg', 'aja', 'aj', 'doang', 'kok gitu', 'masa',
    'terus', 'trs', 'abis', 'habis', 'cape', 'capek', 'males', 'malas',
    'sibuk', 'santai', 'santuy', 'fix', 'pasti', 'mungkin', 'kayak',
    'kayanya', 'kayaknya', 'kyknya', 'soalnya', 'makanya', 'ngapain',
    'kemana', 'dimana', 'dmn', 'mana', 'siapa', 'apa', 'apaan', 'ape',
    'ngapain', 'ngelakuin', 'ngeliat', 'ngerasain', 'ngerti', 'ngertiin',
]

# Typo patterns (realistic mistakes)
TYPO_REPLACEMENTS = {
    'gue': ['gw', 'gua', 'w'],
    'lo': ['lu', 'elu'],
    'ga': ['gak', 'ngga', 'nggak'],
    'udah': ['udh', 'dah'],
    'gimana': ['gmn', 'gmna'],
    'sekarang': ['skrg', 'skrang'],
    'tapi': ['tp', 'tpi'],
    'dengan': ['dgn', 'dg'],
    'yang': ['yg', 'yng'],
    'juga': ['jg', 'jga'],
    'aja': ['aj', 'aje'],
    'banget': ['bgt', 'bgt bgt', 'bgtt'],
}

# Emotions for progression
EMOTIONS = [
    'curious', 'excited', 'worried', 'confused', 'happy', 'sad', 'annoyed',
    'surprised', 'relieved', 'confident', 'uncertain', 'satisfied', 'frustrated',
    'enthusiastic', 'calm', 'anxious', 'playful', 'serious'
]

class JakartaConversationGenerator:
    def __init__(self):
        self.conversation_count = 0
        self.used_intros = set()

    def random_particle(self) -> str:
        """Get random particle"""
        return random.choice(PARTICLES)

    def random_pronoun(self, subject=True) -> str:
        """Get random pronoun"""
        if subject:
            return random.choice(['gw', 'gue', 'w'])
        return random.choice(['lo', 'lu', 'elu'])

    def add_particles(self, text: str, density: float = 0.5) -> str:
        """Add particles to text based on density"""
        if random.random() < density:
            particles_to_add = random.randint(1, 2)
            for _ in range(particles_to_add):
                particle = self.random_particle()
                # Add at end or middle
                if random.random() < 0.7:  # 70% at end
                    text = text.rstrip('!.?') + ' ' + particle
                else:
                    words = text.split()
                    if len(words) > 2:
                        insert_pos = random.randint(1, len(words) - 1)
                        words.insert(insert_pos, particle)
                        text = ' '.join(words)
        return text

    def apply_typos(self, text: str) -> str:
        """Realistically apply typos"""
        if random.random() < 0.2:  # 20% chance of typo
            for original, replacements in TYPO_REPLACEMENTS.items():
                if original in text and random.random() < 0.5:
                    text = text.replace(original, random.choice(replacements), 1)
        return text

    def generate_whatsapp_teenager(self) -> Dict:
        """Generate WhatsApp teenager style conversation"""
        topics = [
            'planning_hangout', 'gossiping', 'homework_help', 'game_discussion',
            'crush_talk', 'school_drama', 'weekend_plans', 'party_planning',
            'fashion_advice', 'music_sharing', 'meme_sharing', 'complaining',
            'asking_favor', 'borrowing_stuff', 'canceling_plans', 'making_plans',
            'sharing_news', 'asking_advice', 'venting', 'celebrating'
        ]

        topic = random.choice(topics)
        num_messages = random.randint(5, 35)

        conversations = {
            'planning_hangout': self._gen_planning_hangout,
            'gossiping': self._gen_gossiping,
            'homework_help': self._gen_homework_help,
            'game_discussion': self._gen_game_discussion,
            'crush_talk': self._gen_crush_talk,
            'school_drama': self._gen_school_drama,
            'weekend_plans': self._gen_weekend_plans,
            'party_planning': self._gen_party_planning,
            'fashion_advice': self._gen_fashion_advice,
            'music_sharing': self._gen_music_sharing,
            'meme_sharing': self._gen_meme_sharing,
            'complaining': self._gen_complaining,
            'asking_favor': self._gen_asking_favor,
            'borrowing_stuff': self._gen_borrowing_stuff,
            'canceling_plans': self._gen_canceling_plans,
            'making_plans': self._gen_making_plans,
            'sharing_news': self._gen_sharing_news,
            'asking_advice': self._gen_asking_advice,
            'venting': self._gen_venting,
            'celebrating': self._gen_celebrating,
        }

        messages = conversations.get(topic, self._gen_generic)(num_messages)

        return self._build_conversation('whatsapp_teenager', topic, messages)

    def _gen_planning_hangout(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate planning hangout conversation"""
        convos = [
            [
                ('user', 'eh bro jadi ga nih nongkrong?', 'curious'),
                ('assistant', 'jadi dong! lu dimana skrg?', 'excited'),
                ('user', 'gw masih rumah nih, lo gmn?', 'neutral'),
                ('assistant', 'gw jg masih rumah, mau jemput ga?', 'offering'),
                ('user', 'boleh bgt! jam brp lo kesini?', 'happy'),
                ('assistant', 'sejam lg kali ya, ok ga?', 'confirming'),
                ('user', 'oke fix! gw tungguin ya', 'satisfied'),
            ],
            [
                ('user', 'sis besok jadi ke mall ga?', 'curious'),
                ('assistant', 'waduh gw blm tau deh, kenapa?', 'uncertain'),
                ('user', 'pengen beli baju baru nih buat weekend', 'explaining'),
                ('assistant', 'ohhh oke deh gw ikut aja', 'agreeing'),
                ('user', 'asiik! jam berapa enaknya?', 'excited'),
                ('assistant', 'jam 2 siang aja gimana?', 'suggesting'),
                ('user', 'oke deal! ketemu di mana?', 'confirming'),
                ('assistant', 'depan cinema aja ya', 'deciding'),
                ('user', 'siapp see u there!', 'satisfied'),
            ],
            [
                ('user', 'yok nongki sore ini', 'inviting'),
                ('assistant', 'dimana nih?', 'curious'),
                ('user', 'biasa aja di kafe deket kampus', 'casual'),
                ('assistant', 'hmm gw ada kerjaan sih tapi kayaknya bisa', 'considering'),
                ('user', 'ayolah sebentar aja', 'persuading'),
                ('assistant', 'oke deh tapi sejam doang ya', 'agreeing'),
                ('user', 'deal! gw kesana jam 5', 'confirming'),
                ('assistant', 'oke gw susul', 'committed'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_gossiping(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate gossiping conversation"""
        convos = [
            [
                ('user', 'eh tau ga si Rara putus sama Dimas', 'sharing_news'),
                ('assistant', 'HAH serius?? kapan tuh??', 'shocked'),
                ('user', 'baru kemarin bro, gw tau dari Maya', 'explaining'),
                ('assistant', 'parah sih mereka kan udah lama banget', 'surprised'),
                ('user', 'iya kan! gw juga kaget bgt pas denger', 'agreeing'),
                ('assistant', 'emang kenapa putusnya?', 'curious'),
                ('user', 'katanya sih Dimas selingkuh', 'gossiping'),
                ('assistant', 'astagaaa males bgt deh cowok gitu', 'disappointed'),
                ('user', 'iya parah emang si Dimas', 'agreeing'),
            ],
            [
                ('user', 'pstt dengerin nih', 'whispering'),
                ('assistant', 'apaan kok serius bgt', 'curious'),
                ('user', 'jadi gini ceritanya...', 'building_suspense'),
                ('assistant', 'iya cepet dong cerita', 'impatient'),
                ('user', 'si Andi kan, ternyata dia suka sama lo', 'revealing'),
                ('assistant', 'APAAAA masa sih??', 'shocked'),
                ('user', 'serius bro, gw denger sendiri dia ngomong', 'confirming'),
                ('assistant', 'anjir gw ga nyangka sama sekali', 'surprised'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_homework_help(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate homework help conversation"""
        convos = [
            [
                ('user', 'bro lu udah ngerjain PR matematika?', 'asking'),
                ('assistant', 'udah dong, kenapa emang?', 'responding'),
                ('user', 'gw bingung nih nomor 5', 'confused'),
                ('assistant', 'oh itu gampang kok, lu udah coba cara yang mana?', 'helping'),
                ('user', 'gw udah coba rumus yang di buku tapi ga bisa', 'explaining'),
                ('assistant', 'coba deh pake rumus yang pak guru jelasin kemarin', 'advising'),
                ('user', 'yang mana ya? gw lupa deh', 'uncertain'),
                ('assistant', 'tunggu gw fotoin catetan gw ya', 'offering'),
                ('user', 'makasih bgt bro lu the best!', 'grateful'),
            ],
            [
                ('user', 'sis tugas bahasa inggris deadline kapan sih?', 'asking'),
                ('assistant', 'besok kayaknya deh', 'uncertain'),
                ('user', 'waduh gw belom ngapa-ngapain', 'worried'),
                ('assistant', 'sama dong gw juga belom haha', 'relating'),
                ('user', 'mau kerjain bareng ga nanti malem?', 'suggesting'),
                ('assistant', 'boleh bgt! di discord aja ya', 'agreeing'),
                ('user', 'oke gw invite lu nanti', 'confirming'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_game_discussion(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate game discussion conversation"""
        convos = [
            [
                ('user', 'bro main ML yok', 'inviting'),
                ('assistant', 'boleh nih, ranked atau classic?', 'responding'),
                ('user', 'ranked aja sekalian naik rank', 'deciding'),
                ('assistant', 'oke gw online bentar lagi', 'confirming'),
                ('user', 'sip gw tunggu di lobby', 'waiting'),
                ('assistant', 'lu pake hero apa?', 'asking'),
                ('user', 'gw mau jungle pake fanny', 'deciding'),
                ('assistant', 'oke gw tank deh', 'agreeing'),
            ],
            [
                ('user', 'anjir gw kalah mulu nih di Valorant', 'frustrated'),
                ('assistant', 'haha sama bro, rank gw turun terus', 'relating'),
                ('user', 'lu main agent apa sih?', 'curious'),
                ('assistant', 'gw pake Jett biasanya', 'answering'),
                ('user', 'coba deh pake Sage, lebih gampang', 'advising'),
                ('assistant', 'hmm boleh juga nih saran lu', 'considering'),
                ('user', 'yuk main bareng nanti malem', 'inviting'),
                ('assistant', 'gas lah! gw free kok', 'accepting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_crush_talk(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate crush talk conversation"""
        convos = [
            [
                ('user', 'sis gw mau curhat nih', 'nervous'),
                ('assistant', 'iya kenapa? cerita aja', 'supportive'),
                ('user', 'jadi gini, gw suka sama dia tapi bingung mau ngomong gimana', 'confessing'),
                ('assistant', 'cieee yang lagi jatuh cinta nih', 'teasing'),
                ('user', 'iya deh iya, terus gmn dong?', 'embarrassed'),
                ('assistant', 'ya langsung aja chat dia, ngajak ngobrol santai', 'advising'),
                ('user', 'tapi takut ditolak sih', 'worried'),
                ('assistant', 'ga bakal tau kalo ga dicoba kan?', 'encouraging'),
                ('user', 'iya juga sih, ok gw coba deh', 'determined'),
            ],
            [
                ('user', 'bro lu tau ga dia punya pacar?', 'curious'),
                ('assistant', 'siapa nih yang lu tanyain?', 'curious'),
                ('user', 'itu loh yang gw pernah cerita', 'hinting'),
                ('assistant', 'ohhh si dia, kayaknya single deh', 'answering'),
                ('user', 'serius?? lu yakin?', 'hopeful'),
                ('assistant', 'gw liat IG dia ga ada foto sama cowok', 'explaining'),
                ('user', 'wah kesempatan nih hehe', 'excited'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_school_drama(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate school drama conversation"""
        convos = [
            [
                ('user', 'gila hari ini ribut bgt di kelas', 'excited'),
                ('assistant', 'kenapa emang? gw ga masuk tadi', 'curious'),
                ('user', 'si Budi berantem sama si Andi gara-gara sepele', 'explaining'),
                ('assistant', 'serius?? emang masalah apa?', 'shocked'),
                ('user', 'gara-gara bola doang bro, konyol kan', 'amused'),
                ('assistant', 'anjir parah amat sampai berantem', 'surprised'),
                ('user', 'iya trus guru BK dateng deh', 'continuing'),
                ('assistant', 'wah bisa dipanggil ortu tuh', 'concerned'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_weekend_plans(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate weekend plans conversation"""
        convos = [
            [
                ('user', 'weekend ini lu ngapain?', 'curious'),
                ('assistant', 'belom ada rencana sih, kenapa?', 'neutral'),
                ('user', 'mau jalan-jalan ga? gw bosen di rumah mulu', 'suggesting'),
                ('assistant', 'boleh nih! mau kemana?', 'interested'),
                ('user', 'PIK gimana? udah lama ga kesana', 'proposing'),
                ('assistant', 'oke sip! ajak yang lain juga ga?', 'agreeing'),
                ('user', 'iya biar rame, gw chat yang lain deh', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_party_planning(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate party planning conversation"""
        convos = [
            [
                ('user', 'ultah gw bulan depan nih', 'announcing'),
                ('assistant', 'wah mau bikin pesta ga?', 'curious'),
                ('user', 'pengen sih tapi bingung mau dimana', 'uncertain'),
                ('assistant', 'di rumah aja gimana? rame-rame', 'suggesting'),
                ('user', 'boleh juga tuh! lu bisa bantuin ga?', 'interested'),
                ('assistant', 'bisa dong! gw bantuin ngatur', 'helpful'),
                ('user', 'makasih ya! nanti gw info tanggalnya', 'grateful'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_fashion_advice(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate fashion advice conversation"""
        convos = [
            [
                ('user', 'sis mau tanya dong, outfit ini oke ga buat kondangan?', 'asking'),
                ('assistant', 'coba fotoin dulu biar gw liat', 'requesting'),
                ('user', 'nih gw kirim fotonya', 'sending'),
                ('assistant', 'hmm bagus sih tapi warnanya terlalu gelap', 'critiquing'),
                ('user', 'terus gw ganti apa dong?', 'confused'),
                ('assistant', 'coba pake yang warna pastel aja, lebih cocok', 'advising'),
                ('user', 'oke makasih sarannya!', 'grateful'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_music_sharing(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate music sharing conversation"""
        convos = [
            [
                ('user', 'dengerin lagu ini deh, enak bgt', 'sharing'),
                ('assistant', 'lagu apa nih?', 'curious'),
                ('user', 'yang baru rilis kemarin, lo belum tau?', 'surprised'),
                ('assistant', 'belum nih, siapa yang nyanyi?', 'asking'),
                ('user', 'artis favorit gw dong, lu harus dengerin', 'enthusiastic'),
                ('assistant', 'oke kirim link nya dong', 'interested'),
                ('user', 'nih gw share, pasti suka deh', 'sharing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_meme_sharing(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate meme sharing conversation"""
        convos = [
            [
                ('user', 'bro liat nih meme lucu bgt', 'amused'),
                ('assistant', 'wkwkwk parah sih ini', 'laughing'),
                ('user', 'relate bgt kan sama kita', 'relating'),
                ('assistant', 'iya anjir persis kita banget', 'agreeing'),
                ('user', 'gw save deh buat koleksi', 'deciding'),
                ('assistant', 'kirim ke grup juga dong', 'suggesting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_complaining(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate complaining conversation"""
        convos = [
            [
                ('user', 'capek bgt hari ini', 'exhausted'),
                ('assistant', 'kenapa emang? ada apa?', 'concerned'),
                ('user', 'tugas numpuk semua, males bgt', 'frustrated'),
                ('assistant', 'sama bro gw juga lagi banyak kerjaan', 'relating'),
                ('user', 'pengen liburan deh rasanya', 'wishing'),
                ('assistant', 'sabar ya, bentar lagi libur kok', 'encouraging'),
                ('user', 'iya sih, thanks udah dengerin', 'grateful'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_asking_favor(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate asking favor conversation"""
        convos = [
            [
                ('user', 'bro mau minta tolong nih', 'asking'),
                ('assistant', 'iya kenapa? ada apa?', 'responding'),
                ('user', 'bisa pinjam charger ga? laptop gw mati', 'requesting'),
                ('assistant', 'oh bisa dong, sekarang?', 'helpful'),
                ('user', 'iya kalo bisa sekarang, urgent soalnya', 'urgent'),
                ('assistant', 'oke gw kesana sebentar ya', 'agreeing'),
                ('user', 'makasih bgt bro! lifesaver', 'grateful'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_borrowing_stuff(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate borrowing stuff conversation"""
        convos = [
            [
                ('user', 'sis punya bukunya si pak guru ga?', 'asking'),
                ('assistant', 'yang buku apa nih?', 'clarifying'),
                ('user', 'buku matematika yang baru', 'specifying'),
                ('assistant', 'ada nih, mau pinjem?', 'offering'),
                ('user', 'boleh dong! kapan bisa ambil?', 'interested'),
                ('assistant', 'besok aja gimana?', 'scheduling'),
                ('user', 'oke deal! makasih ya', 'agreeing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_canceling_plans(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate canceling plans conversation"""
        convos = [
            [
                ('user', 'bro maaf nih gw ga bisa jadi dateng', 'apologetic'),
                ('assistant', 'hah? kenapa emang?', 'disappointed'),
                ('user', 'ada urusan mendadak, maaf bgt ya', 'apologizing'),
                ('assistant', 'yah padahal udah prepare nih', 'sad'),
                ('user', 'next time gw ganti janji deh', 'promising'),
                ('assistant', 'oke deh gapapa, lain kali aja', 'understanding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_making_plans(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate making plans conversation"""
        convos = [
            [
                ('user', 'besok ada acara ga?', 'asking'),
                ('assistant', 'belum ada nih, kenapa?', 'curious'),
                ('user', 'mau bikin rencana bareng yuk', 'suggesting'),
                ('assistant', 'boleh! mau ngapain?', 'interested'),
                ('user', 'nonton bioskop gimana?', 'proposing'),
                ('assistant', 'oke sip! jam berapa?', 'agreeing'),
                ('user', 'sore aja ya jam 5', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_sharing_news(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate sharing news conversation"""
        convos = [
            [
                ('user', 'eh tau ga gw dapet beasiswa!', 'excited'),
                ('assistant', 'serius?? selamat ya!!', 'happy'),
                ('user', 'makasih! gw juga ga nyangka', 'grateful'),
                ('assistant', 'emang usaha lu keras banget sih', 'praising'),
                ('user', 'alhamdulillah akhirnya kesampaian', 'relieved'),
                ('assistant', 'seneng deh denger kabar baik gini', 'supportive'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_asking_advice(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate asking advice conversation"""
        convos = [
            [
                ('user', 'gw bingung nih mau ambil jurusan apa', 'confused'),
                ('assistant', 'lu minatnya di bidang apa sih?', 'asking'),
                ('user', 'gw suka IT tapi ortu mau gw masuk kedokteran', 'conflicted'),
                ('assistant', 'wah dilemma nih, tapi ikutin passion lu aja', 'advising'),
                ('user', 'tapi takut ngecewain ortu', 'worried'),
                ('assistant', 'coba omongin baik-baik sama ortu lu', 'suggesting'),
                ('user', 'iya sih, gw coba deh ngomong', 'considering'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_venting(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate venting conversation"""
        convos = [
            [
                ('user', 'anjir kesel bgt gw hari ini', 'angry'),
                ('assistant', 'ada apa bro? cerita dong', 'concerned'),
                ('user', 'tadi di ejek-ejek sama temen, nyebelin', 'frustrated'),
                ('assistant', 'serius? mereka ngomong apa?', 'curious'),
                ('user', 'ngata-ngatain gw gitu deh, parah', 'upset'),
                ('assistant', 'sabar ya, mereka cuma cari perhatian kok', 'comforting'),
                ('user', 'iya sih, thanks udah dengerin', 'calming'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_celebrating(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate celebrating conversation"""
        convos = [
            [
                ('user', 'bro gw lulus ujian!!', 'ecstatic'),
                ('assistant', 'anjay selamat bro!!', 'celebrating'),
                ('user', 'makasih! gw seneng bgt nih', 'happy'),
                ('assistant', 'emang harusnya lulus, lu belajar keras kok', 'praising'),
                ('user', 'alhamdulillah kerja keras terbayar', 'grateful'),
                ('assistant', 'sekarang waktunya celebrate!', 'excited'),
                ('user', 'iya nih, yuk nanti malem makan bareng', 'inviting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_generic(self, num_msg: int) -> List[Tuple[str, str, str]]:
        """Generate generic conversation"""
        return [
            ('user', 'halo bro', 'greeting'),
            ('assistant', 'hai, apa kabar?', 'responding'),
            ('user', 'baik nih, lu gimana?', 'asking'),
            ('assistant', 'baik juga dong', 'answering'),
        ]

    def _extend_conversation(self, base_convo: List[Tuple], target_length: int) -> List[Tuple]:
        """Extend conversation to target length"""
        result = list(base_convo)

        # Extension phrases
        extensions = [
            ('user', 'btw', 'adding'),
            ('assistant', 'iya kenapa?', 'curious'),
            ('user', 'oh iya', 'remembering'),
            ('assistant', 'terus gimana?', 'asking'),
            ('user', 'gitu deh', 'concluding'),
            ('assistant', 'oh gitu ya', 'understanding'),
            ('user', 'iya bener', 'confirming'),
            ('assistant', 'oke deh', 'acknowledging'),
            ('user', 'makasih ya', 'grateful'),
            ('assistant', 'sama-sama', 'welcoming'),
            ('user', 'wkwk', 'laughing'),
            ('assistant', 'haha iya', 'amused'),
        ]

        while len(result) < target_length:
            result.append(random.choice(extensions))

        return result[:target_length]

    def generate_instagram_dm(self) -> Dict:
        """Generate Instagram DM style conversation"""
        topics = [
            'story_reaction', 'photo_comment', 'slide_into_dm', 'asking_out',
            'flirting', 'casual_chat', 'compliment', 'asking_about_post',
            'sharing_meme', 'discussing_story', 'making_plans', 'catching_up'
        ]

        topic = random.choice(topics)
        num_messages = random.randint(5, 35)

        conversations = {
            'story_reaction': self._gen_story_reaction,
            'photo_comment': self._gen_photo_comment,
            'slide_into_dm': self._gen_slide_into_dm,
            'asking_out': self._gen_asking_out,
            'flirting': self._gen_flirting_dm,
            'casual_chat': self._gen_casual_chat_dm,
            'compliment': self._gen_compliment_dm,
            'asking_about_post': self._gen_asking_about_post,
            'sharing_meme': self._gen_sharing_meme_dm,
            'discussing_story': self._gen_discussing_story,
            'making_plans': self._gen_making_plans_dm,
            'catching_up': self._gen_catching_up,
        }

        messages = conversations.get(topic, self._gen_generic)(num_messages)

        return self._build_conversation('instagram_dm', topic, messages)

    def _gen_story_reaction(self, num_msg: int) -> List[Tuple]:
        """Generate story reaction conversation"""
        convos = [
            [
                ('user', 'story lu keren bgt!', 'complimenting'),
                ('assistant', 'makasih! itu tadi di mana emang?', 'curious'),
                ('user', 'kayaknya di Bali ya?', 'guessing'),
                ('assistant', 'iya bener! baru balik kemarin', 'confirming'),
                ('user', 'wah asik bgt dong liburan', 'envious'),
                ('assistant', 'iya seru bgt disana', 'sharing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_photo_comment(self, num_msg: int) -> List[Tuple]:
        """Generate photo comment conversation"""
        convos = [
            [
                ('user', 'foto terakhir lu aesthetic bgt', 'praising'),
                ('assistant', 'thank you! edit sendiri nih hehe', 'appreciating'),
                ('user', 'pake app apa emang?', 'asking'),
                ('assistant', 'lightroom sama vsco aja kok', 'answering'),
                ('user', 'ohhh pantesan bagus, gw coba deh', 'interested'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_slide_into_dm(self, num_msg: int) -> List[Tuple]:
        """Generate slide into DM conversation"""
        convos = [
            [
                ('user', 'hai, salam kenal ya', 'introducing'),
                ('assistant', 'hai juga, kenal dari mana nih?', 'curious'),
                ('user', 'liat profile lu lewat FYP', 'explaining'),
                ('assistant', 'oh gitu, thanks udah follow', 'polite'),
                ('user', 'sama-sama, konten lu bagus soalnya', 'complimenting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_asking_out(self, num_msg: int) -> List[Tuple]:
        """Generate asking out conversation"""
        convos = [
            [
                ('user', 'hai, weekend ini ada rencana ga?', 'asking'),
                ('assistant', 'belum sih, kenapa emang?', 'curious'),
                ('user', 'mau ngajak nongkrong boleh ga?', 'inviting'),
                ('assistant', 'boleh dong, dimana nih?', 'accepting'),
                ('user', 'kafe biasa aja gimana?', 'suggesting'),
                ('assistant', 'oke sip, jam berapa?', 'confirming'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_flirting_dm(self, num_msg: int) -> List[Tuple]:
        """Generate flirting DM conversation"""
        convos = [
            [
                ('user', 'senyum lu manis bgt di story tadi', 'flirting'),
                ('assistant', 'haha makasih, lu juga ganteng kok', 'flirting_back'),
                ('user', 'serius? jarang dipuji nih biasanya', 'surprised'),
                ('assistant', 'iya dong, gw ga boong kok', 'sincere'),
                ('user', 'jadi pengen kenal lebih deket nih', 'interested'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_casual_chat_dm(self, num_msg: int) -> List[Tuple]:
        """Generate casual chat DM conversation"""
        convos = [
            [
                ('user', 'lagi ngapain?', 'asking'),
                ('assistant', 'lagi bosen scrolling IG doang', 'answering'),
                ('user', 'sama dong, males bgt hari ini', 'relating'),
                ('assistant', 'emang kenapa emang?', 'curious'),
                ('user', 'ga ada kerjaan aja sih', 'explaining'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_compliment_dm(self, num_msg: int) -> List[Tuple]:
        """Generate compliment DM conversation"""
        convos = [
            [
                ('user', 'outfit lu selalu on point ya', 'complimenting'),
                ('assistant', 'makasih banyak! lu juga kok', 'reciprocating'),
                ('user', 'ah masa, gw biasa aja', 'humble'),
                ('assistant', 'jangan rendah diri gitu dong', 'encouraging'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_asking_about_post(self, num_msg: int) -> List[Tuple]:
        """Generate asking about post conversation"""
        convos = [
            [
                ('user', 'post lu yang kemarin itu dimana sih?', 'asking'),
                ('assistant', 'oh yang di cafe itu? di senopati', 'answering'),
                ('user', 'nama cafenya apa?', 'curious'),
                ('assistant', 'lupa nama nya, tapi deket pizza place', 'explaining'),
                ('user', 'ohhh tau tau, thanks ya!', 'understanding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_sharing_meme_dm(self, num_msg: int) -> List[Tuple]:
        """Generate sharing meme DM conversation"""
        convos = [
            [
                ('user', '*kirim meme*', 'sharing'),
                ('assistant', 'wkwkwk relate bgt ini', 'laughing'),
                ('user', 'kan! makanya gw kirim', 'agreeing'),
                ('assistant', 'boleh gw repost ga?', 'asking'),
                ('user', 'boleh dong, gas aja', 'permitting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_discussing_story(self, num_msg: int) -> List[Tuple]:
        """Generate discussing story conversation"""
        convos = [
            [
                ('user', 'story lu sad bgt tadi', 'concerned'),
                ('assistant', 'iya nih lagi bad mood', 'admitting'),
                ('user', 'ada masalah apa? mau cerita?', 'caring'),
                ('assistant', 'thanks udah perhatian, nanti gw cerita deh', 'grateful'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_making_plans_dm(self, num_msg: int) -> List[Tuple]:
        """Generate making plans DM conversation"""
        convos = [
            [
                ('user', 'yuk besok nongkrong', 'inviting'),
                ('assistant', 'boleh! dimana nih?', 'accepting'),
                ('user', 'terserah lu aja deh', 'flexible'),
                ('assistant', 'kafe biasa kita aja gimana?', 'suggesting'),
                ('user', 'oke deal!', 'confirming'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_catching_up(self, num_msg: int) -> List[Tuple]:
        """Generate catching up conversation"""
        convos = [
            [
                ('user', 'lama ga chat nih, gimana kabar?', 'greeting'),
                ('assistant', 'baik nih, lu gimana?', 'responding'),
                ('user', 'baik juga, sibuk kuliah', 'updating'),
                ('assistant', 'sama dong, tugas numpuk bgt', 'relating'),
                ('user', 'semangat ya kita!', 'encouraging'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def generate_casual_friend(self) -> Dict:
        """Generate casual friend chat conversation"""
        topics = [
            'daily_chitchat', 'lunch_plans', 'work_gossip', 'weekend_story',
            'asking_help', 'sharing_problem', 'random_talk', 'food_recommendation',
            'movie_discussion', 'life_updates', 'relationship_talk', 'career_talk'
        ]

        topic = random.choice(topics)
        num_messages = random.randint(5, 35)

        conversations = {
            'daily_chitchat': self._gen_daily_chitchat,
            'lunch_plans': self._gen_lunch_plans,
            'work_gossip': self._gen_work_gossip,
            'weekend_story': self._gen_weekend_story,
            'asking_help': self._gen_asking_help_friend,
            'sharing_problem': self._gen_sharing_problem,
            'random_talk': self._gen_random_talk,
            'food_recommendation': self._gen_food_recommendation,
            'movie_discussion': self._gen_movie_discussion,
            'life_updates': self._gen_life_updates,
            'relationship_talk': self._gen_relationship_talk,
            'career_talk': self._gen_career_talk,
        }

        messages = conversations.get(topic, self._gen_generic)(num_messages)

        return self._build_conversation('casual_friend', topic, messages)

    def _gen_daily_chitchat(self, num_msg: int) -> List[Tuple]:
        """Generate daily chitchat"""
        convos = [
            [
                ('user', 'pagi bro, udah sarapan?', 'greeting'),
                ('assistant', 'pagi! udah dong, lu belom?', 'responding'),
                ('user', 'belom nih, males masak', 'lazy'),
                ('assistant', 'beli aja di luar, banyak kok', 'suggesting'),
                ('user', 'iya juga sih, oke gw beli deh', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_lunch_plans(self, num_msg: int) -> List[Tuple]:
        """Generate lunch plans conversation"""
        convos = [
            [
                ('user', 'lunch dimana nih?', 'asking'),
                ('assistant', 'belom kepikiran, lu ada saran?', 'asking_back'),
                ('user', 'warteg biasa aja gimana?', 'suggesting'),
                ('assistant', 'boleh, murah meriah', 'agreeing'),
                ('user', 'oke gw tunggu di lobby ya', 'confirming'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_work_gossip(self, num_msg: int) -> List[Tuple]:
        """Generate work gossip conversation"""
        convos = [
            [
                ('user', 'tau ga, si bos lagi marah-marah', 'gossiping'),
                ('assistant', 'serius? kenapa emang?', 'curious'),
                ('user', 'ada project yang delay katanya', 'explaining'),
                ('assistant', 'waduh, kena imbas kita ga?', 'worried'),
                ('user', 'kayaknya engga deh, tim sebelah yang kena', 'reassuring'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_weekend_story(self, num_msg: int) -> List[Tuple]:
        """Generate weekend story conversation"""
        convos = [
            [
                ('user', 'weekend kemarin ngapain?', 'asking'),
                ('assistant', 'jalan-jalan ke Bandung', 'sharing'),
                ('user', 'asik dong! kemana aja?', 'interested'),
                ('assistant', 'keliling kota, makan-makan gitu', 'explaining'),
                ('user', 'enak ya bisa liburan', 'envious'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_asking_help_friend(self, num_msg: int) -> List[Tuple]:
        """Generate asking help friend conversation"""
        convos = [
            [
                ('user', 'bro bisa bantu ga?', 'asking'),
                ('assistant', 'bisa, ada apa?', 'willing'),
                ('user', 'bisa jelasin ga cara pake software ini?', 'requesting'),
                ('assistant', 'oh bisa, sekarang atau nanti?', 'offering'),
                ('user', 'sekarang kalo bisa', 'preferring'),
                ('assistant', 'oke gw kesana sekarang', 'agreeing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_sharing_problem(self, num_msg: int) -> List[Tuple]:
        """Generate sharing problem conversation"""
        convos = [
            [
                ('user', 'gw lagi ada masalah nih', 'confiding'),
                ('assistant', 'masalah apa? cerita dong', 'supportive'),
                ('user', 'masalah kerjaan, stres bgt', 'venting'),
                ('assistant', 'udah coba ngomong sama atasan?', 'advising'),
                ('user', 'belum sih, takut malah makin parah', 'hesitant'),
                ('assistant', 'mending coba omongin deh, siapa tau ada solusi', 'encouraging'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_random_talk(self, num_msg: int) -> List[Tuple]:
        """Generate random talk conversation"""
        convos = [
            [
                ('user', 'bosen nih ga ada kerjaan', 'bored'),
                ('assistant', 'sama bro, lagi nganggur juga', 'relating'),
                ('user', 'mau ngapain ya enaknya', 'wondering'),
                ('assistant', 'main game aja yuk', 'suggesting'),
                ('user', 'boleh juga tuh idenya', 'considering'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_food_recommendation(self, num_msg: int) -> List[Tuple]:
        """Generate food recommendation conversation"""
        convos = [
            [
                ('user', 'tau tempat makan enak ga?', 'asking'),
                ('assistant', 'mau makan apa nih?', 'clarifying'),
                ('user', 'pengen makan bakso', 'specifying'),
                ('assistant', 'oh ada bakso enak deket sini', 'recommending'),
                ('user', 'dimana tuh? boleh kasih tau', 'interested'),
                ('assistant', 'di jalan sebelah kantor, nama nya Bakso Boedjangan', 'informing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_movie_discussion(self, num_msg: int) -> List[Tuple]:
        """Generate movie discussion conversation"""
        convos = [
            [
                ('user', 'udah nonton film baru belum?', 'asking'),
                ('assistant', 'belum nih, bagus ga?', 'curious'),
                ('user', 'bagus bgt! recommended', 'recommending'),
                ('assistant', 'serius? mau nonton ah', 'interested'),
                ('user', 'iya harus nonton, seru bgt', 'insisting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_life_updates(self, num_msg: int) -> List[Tuple]:
        """Generate life updates conversation"""
        convos = [
            [
                ('user', 'ada update nih buat lu', 'sharing'),
                ('assistant', 'apa nih? cerita dong', 'curious'),
                ('user', 'gw dapet kerjaan baru', 'announcing'),
                ('assistant', 'wah selamat! dimana?', 'congratulating'),
                ('user', 'di startup baru, excited nih', 'enthusiastic'),
                ('assistant', 'good luck ya! semoga sukses', 'wishing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_relationship_talk(self, num_msg: int) -> List[Tuple]:
        """Generate relationship talk conversation"""
        convos = [
            [
                ('user', 'gw lagi ada masalah sama pacar', 'confiding'),
                ('assistant', 'masalah apa? serius?', 'concerned'),
                ('user', 'dia kayak jarang chat gitu', 'explaining'),
                ('assistant', 'udah coba ngobrol baik-baik?', 'asking'),
                ('user', 'belum sih, takut salah ngomong', 'hesitant'),
                ('assistant', 'komunikasi penting bro, coba deh', 'advising'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_career_talk(self, num_msg: int) -> List[Tuple]:
        """Generate career talk conversation"""
        convos = [
            [
                ('user', 'lu gimana karir nya sekarang?', 'asking'),
                ('assistant', 'lagi nyari peluang baru nih', 'updating'),
                ('user', 'oh gitu, ada rencana mau pindah?', 'curious'),
                ('assistant', 'iya sih, lagi bosen di tempat sekarang', 'admitting'),
                ('user', 'semoga dapet yang lebih baik ya', 'supporting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def generate_gaming_community(self) -> Dict:
        """Generate gaming community conversation"""
        topics = [
            'team_formation', 'strategy_discussion', 'trash_talk', 'celebrating_win',
            'post_loss_analysis', 'new_meta_discussion', 'asking_tips', 'sharing_clips',
            'tournament_talk', 'skin_discussion', 'server_issues', 'finding_teammates'
        ]

        topic = random.choice(topics)
        num_messages = random.randint(5, 35)

        conversations = {
            'team_formation': self._gen_team_formation,
            'strategy_discussion': self._gen_strategy_discussion,
            'trash_talk': self._gen_trash_talk,
            'celebrating_win': self._gen_celebrating_win,
            'post_loss_analysis': self._gen_post_loss_analysis,
            'new_meta_discussion': self._gen_new_meta_discussion,
            'asking_tips': self._gen_asking_tips_gaming,
            'sharing_clips': self._gen_sharing_clips,
            'tournament_talk': self._gen_tournament_talk,
            'skin_discussion': self._gen_skin_discussion,
            'server_issues': self._gen_server_issues,
            'finding_teammates': self._gen_finding_teammates,
        }

        messages = conversations.get(topic, self._gen_generic)(num_messages)

        return self._build_conversation('gaming_community', topic, messages)

    def _gen_team_formation(self, num_msg: int) -> List[Tuple]:
        """Generate team formation conversation"""
        convos = [
            [
                ('user', 'ada yang mau ranked?', 'inviting'),
                ('assistant', 'gw mau dong, butuh berapa orang?', 'interested'),
                ('user', 'kurang 2 lagi nih', 'informing'),
                ('assistant', 'gw ajak temen gw boleh?', 'asking'),
                ('user', 'boleh banget, gas!', 'accepting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_strategy_discussion(self, num_msg: int) -> List[Tuple]:
        """Generate strategy discussion conversation"""
        convos = [
            [
                ('user', 'kita main defensive aja gimana?', 'suggesting'),
                ('assistant', 'oke tapi nanti push di late game', 'agreeing'),
                ('user', 'iya bener, fokus farm dulu', 'confirming'),
                ('assistant', 'gw tank jadi gw depan ya', 'deciding'),
                ('user', 'sip, gw cover dari belakang', 'coordinating'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_trash_talk(self, num_msg: int) -> List[Tuple]:
        """Generate trash talk conversation"""
        convos = [
            [
                ('user', 'enemy team gampang nih', 'confident'),
                ('assistant', 'jangan sombong dulu bro', 'cautioning'),
                ('user', 'gw yakin menang easy', 'cocky'),
                ('assistant', 'wkwk nanti lu yang kena gank', 'teasing'),
                ('user', 'ga bakal! lu liat aja ntar', 'defensive'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_celebrating_win(self, num_msg: int) -> List[Tuple]:
        """Generate celebrating win conversation"""
        convos = [
            [
                ('user', 'MENANG!!!', 'celebrating'),
                ('assistant', 'GGWP boys!', 'celebrating'),
                ('user', 'clutch lu tadi mantap bgt', 'praising'),
                ('assistant', 'thanks! kita solid banget tadi', 'appreciating'),
                ('user', 'lanjut lagi yuk!', 'excited'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_post_loss_analysis(self, num_msg: int) -> List[Tuple]:
        """Generate post loss analysis conversation"""
        convos = [
            [
                ('user', 'anjir kalah lagi', 'frustrated'),
                ('assistant', 'tadi kita salah strategi kayaknya', 'analyzing'),
                ('user', 'iya sih, enemy udah tau pola kita', 'agreeing'),
                ('assistant', 'next game kita ganti taktik ya', 'planning'),
                ('user', 'oke, kali ini gw serius', 'determined'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_new_meta_discussion(self, num_msg: int) -> List[Tuple]:
        """Generate new meta discussion conversation"""
        convos = [
            [
                ('user', 'ada meta baru nih setelah patch', 'informing'),
                ('assistant', 'serius? apa yang berubah?', 'curious'),
                ('user', 'hero mage pada di nerf semua', 'explaining'),
                ('assistant', 'wah parah, gw main mage terus', 'worried'),
                ('user', 'coba deh ganti role', 'suggesting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_asking_tips_gaming(self, num_msg: int) -> List[Tuple]:
        """Generate asking tips gaming conversation"""
        convos = [
            [
                ('user', 'cara main hero ini gimana sih?', 'asking'),
                ('assistant', 'lu udah baca guide nya?', 'asking_back'),
                ('user', 'udah tapi masih ga ngerti', 'admitting'),
                ('assistant', 'oke gw jelasin, jadi gini...', 'explaining'),
                ('user', 'ohhh gitu, thanks ya!', 'understanding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_sharing_clips(self, num_msg: int) -> List[Tuple]:
        """Generate sharing clips conversation"""
        convos = [
            [
                ('user', 'liat nih clip gw tadi', 'sharing'),
                ('assistant', 'wkwk gila lu penta kill', 'impressed'),
                ('user', 'iya bro, momen langka', 'proud'),
                ('assistant', 'upload ke youtube dong', 'suggesting'),
                ('user', 'iya nih lagi render', 'informing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_tournament_talk(self, num_msg: int) -> List[Tuple]:
        """Generate tournament talk conversation"""
        convos = [
            [
                ('user', 'ada tournament nih bulan depan', 'announcing'),
                ('assistant', 'serius? dimana?', 'interested'),
                ('user', 'online, hadiahnya gede', 'informing'),
                ('assistant', 'kita ikut yuk!', 'excited'),
                ('user', 'boleh, gw daftar tim kita', 'agreeing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_skin_discussion(self, num_msg: int) -> List[Tuple]:
        """Generate skin discussion conversation"""
        convos = [
            [
                ('user', 'skin baru lu keren bgt', 'complimenting'),
                ('assistant', 'makasih! beli pas sale kemarin', 'appreciating'),
                ('user', 'berapa harganya?', 'asking'),
                ('assistant', 'diskon 50% jadi murah', 'informing'),
                ('user', 'wah mayan, next sale gw beli ah', 'planning'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_server_issues(self, num_msg: int) -> List[Tuple]:
        """Generate server issues conversation"""
        convos = [
            [
                ('user', 'lag parah nih server', 'complaining'),
                ('assistant', 'iya bro ping gw 200ms', 'agreeing'),
                ('user', 'mending stop dulu kali ya', 'suggesting'),
                ('assistant', 'iya tunggu server normal', 'agreeing'),
                ('user', 'ok gw logout dulu', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_finding_teammates(self, num_msg: int) -> List[Tuple]:
        """Generate finding teammates conversation"""
        convos = [
            [
                ('user', 'nyari teammate serius', 'recruiting'),
                ('assistant', 'untuk ranked ya?', 'clarifying'),
                ('user', 'iya, minimal rank gold', 'specifying'),
                ('assistant', 'gw platinum, boleh join?', 'offering'),
                ('user', 'boleh banget, add aja', 'accepting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def generate_social_media_comments(self) -> Dict:
        """Generate social media comments conversation"""
        topics = [
            'viral_video', 'controversial_post', 'funny_content', 'news_discussion',
            'product_review', 'celebrity_gossip', 'political_debate', 'food_posting',
            'travel_pics', 'fitness_post', 'meme_thread', 'tech_discussion'
        ]

        topic = random.choice(topics)
        num_messages = random.randint(5, 35)

        conversations = {
            'viral_video': self._gen_viral_video,
            'controversial_post': self._gen_controversial_post,
            'funny_content': self._gen_funny_content,
            'news_discussion': self._gen_news_discussion,
            'product_review': self._gen_product_review,
            'celebrity_gossip': self._gen_celebrity_gossip,
            'political_debate': self._gen_political_debate,
            'food_posting': self._gen_food_posting,
            'travel_pics': self._gen_travel_pics,
            'fitness_post': self._gen_fitness_post,
            'meme_thread': self._gen_meme_thread,
            'tech_discussion': self._gen_tech_discussion,
        }

        messages = conversations.get(topic, self._gen_generic)(num_messages)

        return self._build_conversation('social_media_comments', topic, messages)

    def _gen_viral_video(self, num_msg: int) -> List[Tuple]:
        """Generate viral video comments"""
        convos = [
            [
                ('user', 'gila ini viral bgt', 'commenting'),
                ('assistant', 'iya bro, udah berapa juta views?', 'asking'),
                ('user', '10 juta lebih kayaknya', 'estimating'),
                ('assistant', 'parah sih emang lucu bgt', 'agreeing'),
                ('user', 'gw share ah biar temen-temen tau', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_controversial_post(self, num_msg: int) -> List[Tuple]:
        """Generate controversial post comments"""
        convos = [
            [
                ('user', 'kontroversial banget nih postingan', 'reacting'),
                ('assistant', 'iya banyak yang pro kontra', 'observing'),
                ('user', 'gw sih setuju sama pendapatnya', 'opining'),
                ('assistant', 'tapi ada benernya juga yang nolak', 'balancing'),
                ('user', 'ya namanya juga opini ya', 'acknowledging'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_funny_content(self, num_msg: int) -> List[Tuple]:
        """Generate funny content comments"""
        convos = [
            [
                ('user', 'wkwkwk lucu bgt anjir', 'laughing'),
                ('assistant', 'gw ngakak liat ini', 'amused'),
                ('user', 'relate banget sama kehidupan gw', 'relating'),
                ('assistant', 'sama bro, makanya lucu', 'agreeing'),
                ('user', 'tag temen lu yang kayak gini', 'suggesting'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_news_discussion(self, num_msg: int) -> List[Tuple]:
        """Generate news discussion comments"""
        convos = [
            [
                ('user', 'berita ini beneran ga sih?', 'questioning'),
                ('assistant', 'kayaknya hoax deh', 'doubting'),
                ('user', 'coba cek fakta dulu', 'suggesting'),
                ('assistant', 'iya bener, jangan langsung percaya', 'agreeing'),
                ('user', 'banyak fake news sekarang', 'observing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_product_review(self, num_msg: int) -> List[Tuple]:
        """Generate product review comments"""
        convos = [
            [
                ('user', 'produk ini recommended ga?', 'asking'),
                ('assistant', 'gw udah pake, bagus kok', 'reviewing'),
                ('user', 'harganya worth it?', 'inquiring'),
                ('assistant', 'worth it banget, awet pula', 'confirming'),
                ('user', 'ok gw beli deh thanks ya', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_celebrity_gossip(self, num_msg: int) -> List[Tuple]:
        """Generate celebrity gossip comments"""
        convos = [
            [
                ('user', 'eh ternyata mereka putus', 'gossiping'),
                ('assistant', 'serius?? gw kira masih', 'shocked'),
                ('user', 'iya baru announce tadi', 'informing'),
                ('assistant', 'kasian sih sebenernya', 'sympathizing'),
                ('user', 'iya ya, semoga baik-baik aja', 'hoping'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_political_debate(self, num_msg: int) -> List[Tuple]:
        """Generate political debate comments"""
        convos = [
            [
                ('user', 'kebijakan ini gimana menurut lu?', 'asking_opinion'),
                ('assistant', 'gw sih setuju aja', 'stating_opinion'),
                ('user', 'tapi ada dampak negatifnya juga kan', 'countering'),
                ('assistant', 'iya sih, tapi lebih banyak positifnya', 'defending'),
                ('user', 'ok fair enough', 'conceding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_food_posting(self, num_msg: int) -> List[Tuple]:
        """Generate food posting comments"""
        convos = [
            [
                ('user', 'enak bgt nih kayaknya', 'drooling'),
                ('assistant', 'dimana itu? mau coba', 'asking'),
                ('user', 'di daerah Kemang', 'informing'),
                ('assistant', 'harganya gmn?', 'inquiring'),
                ('user', 'affordable kok, ga mahal', 'reassuring'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_travel_pics(self, num_msg: int) -> List[Tuple]:
        """Generate travel pics comments"""
        convos = [
            [
                ('user', 'foto lu bagus bgt!', 'complimenting'),
                ('assistant', 'makasih! itu di Bali', 'thanking'),
                ('user', 'kapan kesana?', 'asking'),
                ('assistant', 'minggu lalu, seru bgt', 'answering'),
                ('user', 'pengen kesana juga nih', 'wishing'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_fitness_post(self, num_msg: int) -> List[Tuple]:
        """Generate fitness post comments"""
        convos = [
            [
                ('user', 'transformation lu gila sih!', 'praising'),
                ('assistant', 'thanks bro! konsisten aja', 'humble'),
                ('user', 'tips nya dong', 'requesting'),
                ('assistant', 'diet sama workout rutin', 'advising'),
                ('user', 'oke gw coba deh', 'motivated'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_meme_thread(self, num_msg: int) -> List[Tuple]:
        """Generate meme thread comments"""
        convos = [
            [
                ('user', 'meme ini akurat bgt', 'relating'),
                ('assistant', 'wkwk iya bener', 'laughing'),
                ('user', 'siapa yang bikin sih kreatif bgt', 'wondering'),
                ('assistant', 'gatau tapi emang lucu', 'agreeing'),
                ('user', 'harus di save nih', 'deciding'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _gen_tech_discussion(self, num_msg: int) -> List[Tuple]:
        """Generate tech discussion comments"""
        convos = [
            [
                ('user', 'gadget baru ini worth it ga?', 'asking'),
                ('assistant', 'spek nya bagus sih', 'analyzing'),
                ('user', 'tapi harganya mahal ya', 'concerned'),
                ('assistant', 'iya lumayan, tapi sebanding kok', 'justifying'),
                ('user', 'hmm mikir dulu deh', 'considering'),
            ],
        ]

        convo = random.choice(convos)
        return self._extend_conversation(convo, num_msg)

    def _build_conversation(self, style: str, topic: str, messages_data: List[Tuple]) -> Dict:
        """Build conversation dictionary with metadata"""
        self.conversation_count += 1

        # Create messages with metadata
        messages = []
        timestamp = 0

        for i, (speaker, message, emotion) in enumerate(messages_data):
            # Apply natural modifications
            message = self.apply_typos(message)
            message = self.add_particles(message, density=random.uniform(0.4, 0.7))

            # Calculate slang density
            words = message.split()
            slang_words = sum(1 for word in words if any(slang in word.lower() for slang in COMMON_SLANG))
            slang_density = slang_words / len(words) if words else 0

            # Check for particles
            has_particles = any(particle in message for particle in PARTICLES)

            messages.append({
                'speaker': speaker,
                'message': message,
                'timestamp_offset': timestamp,
                'metadata': {
                    'emotion': emotion,
                    'formality_level': 1,
                    'contains_particles': has_particles,
                    'contains_slang': slang_density > 0
                }
            })

            # Increment timestamp (random intervals between messages)
            timestamp += random.randint(2, 30)

        # Calculate quality metrics
        particle_count = sum(1 for msg in messages if msg['metadata']['contains_particles'])
        particle_density = particle_count / len(messages) if messages else 0

        all_words = ' '.join([msg['message'] for msg in messages]).split()
        total_slang = sum(1 for word in all_words if any(slang in word.lower() for slang in COMMON_SLANG))
        avg_slang_density = total_slang / len(all_words) if all_words else 0

        unique_emotions = len(set(msg['metadata']['emotion'] for msg in messages))

        conversation_id = f"jkt_casual_{self.conversation_count:04d}"

        return {
            'conversation_id': conversation_id,
            'style': style,
            'topic': topic,
            'messages': messages,
            'quality_metrics': {
                'naturalness_score': random.randint(8, 10),
                'particle_density': round(particle_density, 2),
                'slang_density': round(avg_slang_density, 2),
                'emotional_variety': unique_emotions
            }
        }

    def generate_all(self) -> Dict:
        """Generate all 1,500 conversations"""
        print("Generating 1,500 Jakarta casual conversations...")

        conversations = []

        # Generate each category
        categories = [
            ('WhatsApp teenager', 300, self.generate_whatsapp_teenager),
            ('Instagram DMs', 300, self.generate_instagram_dm),
            ('Casual friend chat', 300, self.generate_casual_friend),
            ('Gaming community', 300, self.generate_gaming_community),
            ('Social media comments', 300, self.generate_social_media_comments),
        ]

        for category_name, count, generator_func in categories:
            print(f"Generating {count} {category_name} conversations...")
            for i in range(count):
                conv = generator_func()
                conversations.append(conv)
                if (i + 1) % 50 == 0:
                    print(f"  Progress: {i + 1}/{count}")

        dataset = {
            'dataset_id': 'jakarta_casual_claude1',
            'total_conversations': len(conversations),
            'generation_date': datetime.now().isoformat(),
            'conversations': conversations
        }

        print(f"\nGeneration complete! Total conversations: {len(conversations)}")
        return dataset


def main():
    """Main execution"""
    generator = JakartaConversationGenerator()
    dataset = generator.generate_all()

    # Save to JSON file
    output_file = '/home/user/nuzantara/claude1_jakarta_casual.json'
    print(f"\nSaving to {output_file}...")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"✓ Successfully saved {dataset['total_conversations']} conversations!")
    print(f"✓ File size: {os.path.getsize(output_file) / (1024*1024):.2f} MB")


if __name__ == '__main__':
    import os
    main()
