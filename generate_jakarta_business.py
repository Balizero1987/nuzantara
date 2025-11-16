#!/usr/bin/env python3
"""
Jakarta Business Conversations Generator
Generates 1,500 ultra-realistic Indonesian business conversations
"""

import json
import random
from typing import List, Dict, Any
from datetime import datetime

class JakartaBusinessGenerator:
    def __init__(self):
        # Startup ecosystem topics and phrases
        self.startup_topics = [
            "funding_discussion", "pitch_deck_review", "accelerator_program",
            "product_market_fit", "mvp_development", "user_acquisition",
            "burn_rate_analysis", "pivot_strategy", "tech_stack_decision",
            "hiring_tech_talent"
        ]

        # Corporate professional topics
        self.corporate_topics = [
            "quarterly_review", "budget_approval", "dept_collaboration",
            "kpi_discussion", "project_timeline", "resource_allocation",
            "performance_review", "process_improvement", "vendor_selection",
            "compliance_matters"
        ]

        # Freelancer negotiation topics
        self.freelancer_topics = [
            "rate_negotiation", "project_scope", "payment_terms",
            "timeline_discussion", "revision_policy", "contract_terms",
            "retainer_agreement", "portfolio_review", "nda_signing",
            "milestone_payment"
        ]

        # Investment discussion topics
        self.investment_topics = [
            "seed_funding", "series_a_round", "valuation_discussion",
            "term_sheet_review", "due_diligence", "cap_table_structure",
            "investor_rights", "exit_strategy", "roi_projection",
            "syndicate_formation"
        ]

        # Business networking topics
        self.networking_topics = [
            "partnership_exploration", "collaboration_opportunity", "referral_discussion",
            "event_organization", "community_building", "knowledge_sharing",
            "business_introduction", "mentor_relationship", "industry_insight",
            "deal_flow_sharing"
        ]

        # Professional particles and connectors
        self.particles = ["sih", "ya", "kan", "nih", "deh", "dong"]

        # Business English terms
        self.biz_terms = [
            "meeting", "deadline", "budget", "proposal", "timeline",
            "milestone", "deliverable", "scope", "requirement", "approval",
            "feedback", "review", "update", "progress", "pipeline",
            "conversion", "metric", "dashboard", "report", "presentation"
        ]

        # Jakarta business greetings
        self.greetings = [
            "Pak", "Bu", "Mas", "Mbak", "Bro", "Kak"
        ]

        # Professional closings
        self.closings = [
            "Oke, saya arrange dulu ya",
            "Baik, nanti saya follow up lagi",
            "Siap, thanks ya untuk waktunya",
            "Noted, saya prepare dulu",
            "Mantap, kita execute ya",
            "Oke deal, saya confirm lagi nanti",
            "Perfect, nanti kita finalize",
            "Sounds good, let's move forward",
            "Alright, saya koordinasi tim dulu",
            "Oke, ditunggu updatenya ya"
        ]

    def generate_startup_conversation(self, conv_id: str) -> Dict[str, Any]:
        """Generate startup ecosystem conversation"""
        topic = random.choice(self.startup_topics)
        length = random.randint(8, 40)

        conversations = {
            "funding_discussion": self._funding_conversation,
            "pitch_deck_review": self._pitch_deck_conversation,
            "accelerator_program": self._accelerator_conversation,
            "product_market_fit": self._pmf_conversation,
            "mvp_development": self._mvp_conversation,
            "user_acquisition": self._user_acq_conversation,
            "burn_rate_analysis": self._burn_rate_conversation,
            "pivot_strategy": self._pivot_conversation,
            "tech_stack_decision": self._tech_stack_conversation,
            "hiring_tech_talent": self._hiring_conversation
        }

        messages = conversations[topic](length)

        return {
            "conversation_id": conv_id,
            "style": "startup_ecosystem",
            "topic": topic,
            "messages": messages,
            "quality_metrics": self._calculate_metrics(messages)
        }

    def generate_corporate_conversation(self, conv_id: str) -> Dict[str, Any]:
        """Generate corporate professional conversation"""
        topic = random.choice(self.corporate_topics)
        length = random.randint(8, 40)

        conversations = {
            "quarterly_review": self._quarterly_review_conversation,
            "budget_approval": self._budget_conversation,
            "dept_collaboration": self._dept_collab_conversation,
            "kpi_discussion": self._kpi_conversation,
            "project_timeline": self._project_timeline_conversation,
            "resource_allocation": self._resource_conversation,
            "performance_review": self._performance_conversation,
            "process_improvement": self._process_conversation,
            "vendor_selection": self._vendor_conversation,
            "compliance_matters": self._compliance_conversation
        }

        messages = conversations[topic](length)

        return {
            "conversation_id": conv_id,
            "style": "corporate_professional",
            "topic": topic,
            "messages": messages,
            "quality_metrics": self._calculate_metrics(messages)
        }

    def generate_freelancer_conversation(self, conv_id: str) -> Dict[str, Any]:
        """Generate freelancer negotiation conversation"""
        topic = random.choice(self.freelancer_topics)
        length = random.randint(8, 40)

        conversations = {
            "rate_negotiation": self._rate_negotiation_conversation,
            "project_scope": self._scope_conversation,
            "payment_terms": self._payment_terms_conversation,
            "timeline_discussion": self._timeline_conversation,
            "revision_policy": self._revision_conversation,
            "contract_terms": self._contract_conversation,
            "retainer_agreement": self._retainer_conversation,
            "portfolio_review": self._portfolio_conversation,
            "nda_signing": self._nda_conversation,
            "milestone_payment": self._milestone_conversation
        }

        messages = conversations[topic](length)

        return {
            "conversation_id": conv_id,
            "style": "freelancer_negotiations",
            "topic": topic,
            "messages": messages,
            "quality_metrics": self._calculate_metrics(messages)
        }

    def generate_investment_conversation(self, conv_id: str) -> Dict[str, Any]:
        """Generate investment discussion conversation"""
        topic = random.choice(self.investment_topics)
        length = random.randint(8, 40)

        conversations = {
            "seed_funding": self._seed_funding_conversation,
            "series_a_round": self._series_a_conversation,
            "valuation_discussion": self._valuation_conversation,
            "term_sheet_review": self._term_sheet_conversation,
            "due_diligence": self._due_diligence_conversation,
            "cap_table_structure": self._cap_table_conversation,
            "investor_rights": self._investor_rights_conversation,
            "exit_strategy": self._exit_strategy_conversation,
            "roi_projection": self._roi_conversation,
            "syndicate_formation": self._syndicate_conversation
        }

        messages = conversations[topic](length)

        return {
            "conversation_id": conv_id,
            "style": "investment_discussions",
            "topic": topic,
            "messages": messages,
            "quality_metrics": self._calculate_metrics(messages)
        }

    def generate_networking_conversation(self, conv_id: str) -> Dict[str, Any]:
        """Generate business networking conversation"""
        topic = random.choice(self.networking_topics)
        length = random.randint(8, 40)

        conversations = {
            "partnership_exploration": self._partnership_conversation,
            "collaboration_opportunity": self._collaboration_conversation,
            "referral_discussion": self._referral_conversation,
            "event_organization": self._event_conversation,
            "community_building": self._community_conversation,
            "knowledge_sharing": self._knowledge_conversation,
            "business_introduction": self._intro_conversation,
            "mentor_relationship": self._mentor_conversation,
            "industry_insight": self._insight_conversation,
            "deal_flow_sharing": self._deal_flow_conversation
        }

        messages = conversations[topic](length)

        return {
            "conversation_id": conv_id,
            "style": "business_networking",
            "topic": topic,
            "messages": messages,
            "quality_metrics": self._calculate_metrics(messages)
        }

    def _funding_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate funding discussion"""
        templates = [
            [
                ("user", "Pak, saya mau discuss soal seed funding untuk startup saya"),
                ("assistant", "Oh boleh, startup di bidang apa ya? Dan sudah sampai stage mana sekarang?"),
                ("user", "Saya di fintech, fokus ke lending untuk UMKM. Sudah ada MVP dan 500 early users sih"),
                ("assistant", "Menarik nih. Berapa funding yang lagi dicari? Dan valuasinya sudah fixed atau masih open for discussion?"),
                ("user", "Target saya 500 juta untuk 15% equity. Valuation post-money jadi sekitar 3.3M ya"),
                ("assistant", "Hmm reasonable ya untuk stage kamu. Unit economics-nya gimana? Sudah profitable per transaction?"),
                ("user", "Belum profitable, tapi contribution margin sudah positif 12%. Fokus saya growth dulu"),
                ("assistant", "Makes sense. Burn rate per bulan berapa sekarang? Dan 500 juta itu runway untuk berapa lama?"),
                ("user", "Burn rate sekitar 60 juta per bulan. Jadi runway kurang lebih 8 bulan ya dengan funding ini"),
                ("assistant", "Oke, 8 bulan cukup untuk hit next milestone kan? Target di Q2 2025 apa?"),
                ("user", "Target saya 5000 active users dan monthly GMV 500 juta. Dengan metric itu ready untuk Series A"),
                ("assistant", "Sound achievable. Saya interested nih, tapi mau review pitch deck dan financial model dulu boleh?"),
                ("user", "Tentu Pak, saya kirim via email ya. Ada hal lain yang perlu saya prepare?"),
                ("assistant", "Tolong prepare juga customer acquisition cost breakdown sama cohort analysis ya"),
                ("user", "Siap, saya compile semua dan kirim besok pagi. Kalau cocok next stepnya gimana?"),
                ("assistant", "Kita schedule deep dive session, terus due diligence ringan. Kalau oke bisa langsung term sheet"),
                ("user", "Perfect, timeline-nya kira-kira berapa lama Pak dari sekarang?"),
                ("assistant", "Kalau smooth, 2-3 minggu bisa close. Tapi tergantung due diligence findings juga ya"),
                ("user", "Understood, saya usahakan data semua ready. Thanks ya Pak untuk waktunya"),
                ("assistant", "Sama-sama, saya tunggu materials-nya ya. Good luck!")
            ],
            [
                ("user", "Mau tanya dong tentang pre-seed funding untuk edtech startup saya"),
                ("assistant", "Boleh banget, cerita dulu product-nya solve problem apa?"),
                ("user", "Gue bikin platform untuk skill-based learning, fokus ke working professionals yang mau upskill"),
                ("assistant", "Nice, market-nya gede tuh. Sudah ada traction belum?"),
                ("user", "Baru soft launch bulan lalu, ada 200 sign-ups dan 50 paying customers"),
                ("assistant", "Conversion rate 25% impressive ya untuk early stage. ARPU-nya berapa?"),
                ("user", "ARPU sekitar 300rb per bulan, kebanyakan ambil paket quarterly sih"),
                ("assistant", "Oke jadi MRR kamu sekitar 15 juta ya sekarang. Berapa yang mau di-raise?"),
                ("user", "Target 300 juta untuk 20% equity, jadi valuasi 1.5M post-money"),
                ("assistant", "Hmm untuk pre-seed agak tinggi ya valuasinya, punya comparable atau traction yang support angka itu?"),
                ("user", "Saya compare sama platform serupa di Singapore yang raise di 2M valuation dengan traction mirip"),
                ("assistant", "Fair enough, tapi market Indonesia beda sih. Bisa consider 1.2M post-money ga?"),
                ("user", "Waduh itu artinya gue harus release 25% ya, agak banyak untuk pre-seed"),
                ("assistant", "Atau gue bisa masuk di 1.5M tapi amount-nya 250 juta aja, jadi sekitar 16-17%"),
                ("user", "Hmm let me think, 250 juta runway cuma 6 bulan kayaknya, saya need minimal 8 bulan"),
                ("assistant", "Oke gimana kalau kita structure pakai SAFE dengan cap 1.5M, amount 300 juta?"),
                ("user", "SAFE bisa sih, tapi ada discount rate ga untuk early investor?"),
                ("assistant", "Standard saya 20% discount untuk SAFE. Jadi pas Series A conversion kamu dapat benefit"),
                ("user", "Deal, dengan term itu saya oke. Ada specific milestones yang lu expect ga?"),
                ("assistant", "Saya expect minimal 500 paying users dan MRR 50 juta dalam 6 bulan. Feasible?"),
                ("user", "Ambitious tapi doable dengan proper execution. Saya draft SAFE agreement ya?"),
                ("assistant", "Saya punya template SAFE, nanti saya share. Kita finalize terms dulu baru draft"),
                ("user", "Perfect, kapan kita bisa ketemu untuk finalize details-nya?"),
                ("assistant", "Minggu depan available, saya koordinasi schedule kita ya"),
                ("user", "Oke siap, thanks buat support-nya!"),
                ("assistant", "Anytime, excited untuk project ini!")
            ]
        ]

        base = random.choice(templates)
        messages = []
        timestamp = 0

        for i, (speaker, text) in enumerate(base[:min(length, len(base))]):
            messages.append({
                "speaker": speaker,
                "message": text,
                "timestamp_offset": timestamp,
                "metadata": self._generate_metadata(text)
            })
            timestamp += random.randint(3, 15)

        return messages

    def _pitch_deck_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate pitch deck review conversation"""
        base_conversation = [
            ("user", "Pak, saya sudah prepare pitch deck untuk review, boleh saya share?"),
            ("assistant", "Boleh, kirim aja via email atau bisa share link Google Slides juga"),
            ("user", "Saya kirim link ya, total 15 slides covering problem, solution, market size, sama traction"),
            ("assistant", "Oke gue buka nih. Hmm slide problem-nya kurang compelling, coba pake real customer pain points"),
            ("user", "Oh iya ya, saya terlalu general. Mungkin saya tambah customer quotes atau case study?"),
            ("assistant", "Exactly, data itu powerful tapi story yang bikin investor relate. Market size slide juga perlu update"),
            ("user", "Market size kenapa Pak? Saya pakai TAM SAM SOM yang standard"),
            ("assistant", "Angka-nya oke, tapi approach-nya terlalu top-down. Coba add bottom-up calculation juga"),
            ("user", "Maksudnya dari unit economics terus scale up gitu ya?"),
            ("assistant", "Betul, misal dari ARPU dikali target customer di year 1, 2, 3. Lebih believable"),
            ("user", "Make sense, saya revisi. Ada feedback lain untuk traction slide?"),
            ("assistant", "Traction oke sih, tapi tambah cohort retention chart ya. Investor suka liat stickiness"),
            ("user", "Noted, berarti saya perlu prepare data retention per cohort dulu nih"),
            ("assistant", "Iya, dan kalau bisa tambahin competitive advantage juga. Kenapa customer pilih lu vs competitor"),
            ("user", "Saya ada moat dari technology kita yang proprietary, worth to highlight ya?"),
            ("assistant", "Absolutely, tech moat itu strong differentiator especially di Indo yang banyak copycat"),
            ("user", "Oke, saya revisi semua feedback ini. Kira-kira kapan bisa review lagi Pak?"),
            ("assistant", "Kirim revised version end of week, saya review weekend. Kalau oke kita bisa start intro ke investor"),
            ("user", "Perfect, target saya start fundraising bulan depan. Realistic ga?"),
            ("assistant", "Kalau deck udah solid dan data ready, bisa kok. Saya bantu intro ke beberapa VC juga"),
            ("user", "Wah terima kasih banyak Pak, sangat helpful!"),
            ("assistant", "No problem, semangat revisi deck-nya ya!")
        ]

        messages = []
        timestamp = 0

        for i, (speaker, text) in enumerate(base_conversation[:min(length, len(base_conversation))]):
            messages.append({
                "speaker": speaker,
                "message": text,
                "timestamp_offset": timestamp,
                "metadata": self._generate_metadata(text)
            })
            timestamp += random.randint(4, 12)

        return messages

    def _accelerator_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate accelerator program conversation"""
        base_conversation = [
            ("user", "Kak, saya interested apply ke accelerator program yang kamu run, boleh tanya-tanya?"),
            ("assistant", "Boleh banget, mau tanya apa dulu nih?"),
            ("user", "Program-nya duration berapa lama dan fokus ke stage apa aja?"),
            ("assistant", "3 bulan full-time, fokus ke pre-seed sampai seed stage. Kamu startup-nya stage mana?"),
            ("user", "Saya masih pre-seed, baru ada MVP dan lagi cari product-market fit"),
            ("assistant", "Perfect fit sih untuk program kita. Sudah ada paying customers belum?"),
            ("user", "Baru 20 paying customers, omzet masih kecil sekitar 5 juta per bulan"),
            ("assistant", "Oke ga masalah, kita fokus ke growth dan product. Apa yang kamu expect dari accelerator?"),
            ("user", "Saya butuh mentorship untuk product development sama go-to-market strategy"),
            ("assistant", "Kita provide both, plus network dengan investor dan potential corporate partners"),
            ("user", "Sounds great, ada equity requirement ga untuk join program?"),
            ("assistant", "Ya, standard kita 6% equity tapi kamu dapat 200 juta funding plus program value"),
            ("user", "Oh so it's like investment juga ya, bukan pure program. Valuation-nya gimana?"),
            ("assistant", "Valuasi based on stage kamu, biasanya untuk pre-seed sekitar 3-3.5M post-money"),
            ("user", "Hmm saya perlu pikir-pikir dulu sih, 6% lumayan juga ya untuk early stage"),
            ("assistant", "Understandable, tapi consider juga value-add beyond money. Alumni kita 80% berhasil raise Series A"),
            ("user", "Itu impressive, network effect-nya emang penting ya. Application deadline kapan?"),
            ("assistant", "End of month, terus kita review 2 minggu dan announce batch baru mid next month"),
            ("user", "Oke, saya prepare application dulu. Ada tips untuk stand out?"),
            ("assistant", "Focus on team strength dan unique insight tentang market. Kita invest di founder lebih dari idea"),
            ("user", "Noted, thanks ya untuk info-nya. Saya submit soon!"),
            ("assistant", "Sure, good luck dengan application-nya!")
        ]

        messages = []
        timestamp = 0

        for i, (speaker, text) in enumerate(base_conversation[:min(length, len(base_conversation))]):
            messages.append({
                "speaker": speaker,
                "message": text,
                "timestamp_offset": timestamp,
                "metadata": self._generate_metadata(text)
            })
            timestamp += random.randint(3, 10)

        return messages

    def _pmf_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate product-market fit conversation"""
        base_conversation = [
            ("user", "Bro, gue mau consult nih tentang product-market fit. Kayaknya startup gue belum nemu"),
            ("assistant", "Cerita dulu, what makes you think belum PMF?"),
            ("user", "Udah 6 bulan launch, growth stagnant dan churn rate tinggi banget sekitar 40%"),
            ("assistant", "Wah itu memang concerning. Customer feedback-nya gimana? Mereka complain apa?"),
            ("user", "Mostly bilang product terlalu complicated dan ga solve core problem mereka"),
            ("assistant", "Classic sign of no PMF. Udah coba user interview in-depth ga?"),
            ("user", "Baru surface level aja sih, belum deep dive ke actual workflow mereka"),
            ("assistant", "Nah itu problem-nya, lu bikin solution untuk problem yang lu assume, bukan yang actual"),
            ("user", "Bener juga ya, gue terlalu asumsi dari awal tanpa proper validation"),
            ("assistant", "Sekarang pause development dulu, fokus ke customer discovery. Talk to at least 50 users"),
            ("user", "50? Waduh banyak juga ya, tapi makes sense sih untuk dapat pattern"),
            ("assistant", "Dari 50 itu lu bakal nemu pattern problem yang recurring. Itu yang harus di-solve"),
            ("user", "Oke gue start interview minggu ini. Ada framework yang lu recommend?"),
            ("assistant", "Pake Mom Test framework, jangan tanya 'would you use this' tapi tanya past behavior"),
            ("user", "Oh iya gue pernah baca itu, ask about last time they faced the problem ya"),
            ("assistant", "Exactly, dan observe actual workflow mereka. Sering solution yang lu ga expect"),
            ("user", "Kalau misalnya ternyata problem-nya beda total dari yang gue solve sekarang gimana?"),
            ("assistant", "Pivot lah, better pivot early than waste resource di wrong direction"),
            ("user", "Makes sense, ego gue sempet menghalangi untuk consider pivot sih"),
            ("assistant", "Normal kok, semua founder attached ke idea. Tapi market yang decide, bukan kita"),
            ("user", "True, thanks buat real talk-nya bro. Gue execute customer discovery dulu"),
            ("assistant", "Goodluck, update gue ya hasil-nya. Happy to discuss lagi")
        ]

        messages = []
        timestamp = 0

        for i, (speaker, text) in enumerate(base_conversation[:min(length, len(base_conversation))]):
            messages.append({
                "speaker": speaker,
                "message": text,
                "timestamp_offset": timestamp,
                "metadata": self._generate_metadata(text)
            })
            timestamp += random.randint(4, 14)

        return messages

    # Additional conversation templates for other topics...
    # (For brevity, I'll create factory methods that generate varied conversations)

    def _mvp_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate MVP development conversation"""
        conversations = [
            [
                ("user", "Mas, saya mau build MVP untuk platform marketplace, estimate timeline berapa lama?"),
                ("assistant", "Tergantung scope-nya, basic marketplace minimal 2-3 bulan sih"),
                ("user", "Fitur yang must-have apa aja ya untuk early version?"),
                ("assistant", "User registration, product listing, search filter, dan checkout flow. Payment integration critical"),
                ("user", "Untuk payment saya pakai midtrans aja atau xendit lebih bagus?"),
                ("assistant", "Both good, tapi xendit lebih flexible kalau lu mau scale. Fee structure juga competitive"),
                ("user", "Oke, tech stack-nya recommend apa? Saya thinking React + Node.js"),
                ("assistant", "Solid choice, tambah PostgreSQL untuk database. Hosting di mana?"),
                ("user", "Saya belum research, AWS atau GCP ya?"),
                ("assistant", "Untuk MVP, coba Vercel atau Railway aja. Easier setup dan cheaper untuk small scale"),
                ("user", "Oh iya bener, ga perlu kompleks dari awal. Budget development kira-kira berapa?"),
                ("assistant", "Kalau hire freelancer sekitar 30-50 juta untuk 2-3 bulan, tergantung seniority"),
                ("user", "Cukup mahal juga ya, ada alternatif lain ga?"),
                ("assistant", "Bisa cari technical co-founder dengan equity split, atau pakai no-code tools dulu"),
                ("user", "No-code limiting ga sih untuk scale nanti?"),
                ("assistant", "Yes eventually, tapi untuk validate idea cukup kok. Bisa migrate later"),
                ("user", "Make sense, validate dulu baru invest besar. Thanks advicenya!"),
                ("assistant", "Anytime, goodluck dengan MVP-nya!")
            ]
        ]

        messages = self._build_messages(random.choice(conversations), length)
        return messages

    def _user_acq_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate user acquisition conversation"""
        base = [
            ("user", "Kak mau tanya dong, strategy user acquisition yang cost-effective apa ya untuk B2C app?"),
            ("assistant", "Budget kamu berapa dulu nih? Dan target market-nya siapa?"),
            ("user", "Budget 20 juta per bulan, target Gen Z urban yang suka online shopping"),
            ("assistant", "Oke dengan budget segitu, fokus ke organic dan paid social. CAC target kamu berapa?"),
            ("user", "Saya target CAC under 50rb, LTV saya sekitar 300rb per user"),
            ("assistant", "LTV/CAC ratio kamu 6x, bagus tuh. Udah coba TikTok ads belum?"),
            ("user", "Belum, masih fokus ke Instagram sama Facebook aja. TikTok works ya?"),
            ("assistant", "For Gen Z definitely, CPC lebih murah dan engagement lebih tinggi"),
            ("user", "Oke saya allocate 30% budget ke TikTok. Content strategy-nya gimana?"),
            ("assistant", "Bikin content yang entertaining first, selling second. UGC content performs well"),
            ("user", "Maksudnya hire content creator gitu?"),
            ("assistant", "Bisa, atau incentivize existing users untuk bikin content. Kasih referral bonus"),
            ("user", "Oh iya referral program, saya belum implement. Worth it ga sih?"),
            ("assistant", "Super worth it kalau lu punya product yang people naturally want to share"),
            ("user", "Product saya fashion items, cukup shareable sih. Referral mechanics-nya gimana yang effective?"),
            ("assistant", "Give both sides value, misal referrer dapat 50rb credit, referee dapat 50rb discount"),
            ("user", "Double-sided incentive ya, make sense. Saya implement dalam 2 minggu"),
            ("assistant", "Good, track metrics closely. Referral bisa jadi primary growth channel kalau di-optimize"),
            ("user", "Noted, thanks buat insights-nya kak!"),
            ("assistant", "Sure, update progress-nya ya nanti")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _burn_rate_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate burn rate analysis conversation"""
        base = [
            ("user", "Pak mau review burn rate startup saya, kayaknya kurang sustainable nih"),
            ("assistant", "Current burn rate berapa per bulan? Dan runway masih berapa?"),
            ("user", "Burn 80 juta per bulan, cash di bank tinggal 400 juta. Jadi 5 bulan runway"),
            ("assistant", "Itu tight ya, breakdown spending-nya ke mana aja?"),
            ("user", "Payroll 40 juta, marketing 25 juta, operational 10 juta, cloud infrastructure 5 juta"),
            ("assistant", "Team-nya berapa orang dengan payroll 40 juta?"),
            ("user", "8 orang total, 3 engineer, 2 marketing, 2 ops, 1 product"),
            ("assistant", "Hmm team size oke untuk early stage, tapi marketing 25 juta seems high. ROI-nya gimana?"),
            ("user", "CAC sekitar 120rb, LTV cuma 200rb. Payback period 8 bulan"),
            ("assistant", "That's concerning, lu burning cash untuk growth yang barely profitable. Udah profitable per customer belum?"),
            ("user", "Contribution margin masih negatif actually, sekitar -15%"),
            ("assistant", "Red flag nih, unit economics harus fixed dulu before scaling marketing"),
            ("user", "Jadi saya harus cut marketing spending ya?"),
            ("assistant", "Yes, turunin jadi 10 juta max. Focus ke organic growth dan fix product dulu"),
            ("user", "Kalau cut marketing, growth pasti slow down. Investor bakal concern ga?"),
            ("assistant", "Better slow sustainable growth daripada fast burn terus mati. Investor prefer sustainability"),
            ("user", "Make sense, saya adjust budget bulan depan. Target burn rate berapa yang ideal?"),
            ("assistant", "Untuk stage kamu, 50-60 juta acceptable. Extend runway minimal 8-10 bulan"),
            ("user", "Oke noted, saya restruktur spending plan. Thanks buat reality check-nya Pak"),
            ("assistant", "No problem, financial discipline itu critical untuk survival")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _pivot_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate pivot strategy conversation"""
        base = [
            ("user", "Bro gue lagi consider pivot nih, bisnis current ga sustainable"),
            ("assistant", "What's wrong dengan current model?"),
            ("user", "B2C ternyata acquisition cost terlalu mahal, unit economics ga make sense"),
            ("assistant", "Udah berapa lama running B2C? Dan mau pivot ke mana?"),
            ("user", "1 tahun lebih, gue mau pivot ke B2B. Sama product tapi beda target market"),
            ("assistant", "Interesting, apa yang bikin lu yakin B2B bakal work?"),
            ("user", "Beberapa corporate ada yang approach buat enterprise license, deal size lumayan gede"),
            ("assistant", "Oke jadi ada early signal. Deal size average berapa untuk enterprise?"),
            ("user", "Sekitar 50-100 juta per tahun per corporate client"),
            ("assistant", "Wah itu game changer ya kalau lu bisa close 5-10 clients. Sales cycle-nya berapa lama?"),
            ("user", "Estimate 3-6 bulan dari first meeting sampai close"),
            ("assistant", "Long sales cycle, lu ready untuk transition? Team kamu ada yang B2B sales experience?"),
            ("user", "Nah itu issue-nya, team gue semua B2C background. Harus hire baru kayaknya"),
            ("assistant", "Critical hire tuh, cari yang proven track record di enterprise sales ya"),
            ("user", "Budget tight sih untuk senior hire, mungkin equity-based compensation?"),
            ("assistant", "Bisa, tapi expect untuk kasih substantial equity 2-5% untuk VP Sales level"),
            ("user", "Worth it ga sih kasih segitu untuk one person?"),
            ("assistant", "Kalau dia bisa bawa revenue dan open doors, absolutely worth it. Sales leader itu make or break"),
            ("user", "Oke gue consider seriously. Pivot plan timeline-nya gimana yang ideal?"),
            ("assistant", "Gradual transition 3-6 bulan, jangan hard cut. Keep B2C running sambil build B2B"),
            ("user", "Make sense, hedge the bet ya. Thanks buat perspective-nya bro"),
            ("assistant", "Anytime, keep me posted dengan progress-nya ya")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _tech_stack_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate tech stack decision conversation"""
        base = [
            ("user", "Mas mau consult tech stack untuk SaaS platform, recommend apa ya?"),
            ("assistant", "Tergantung requirement-nya, platform-nya untuk industry apa?"),
            ("user", "HR tech, fokus ke employee management sama payroll automation"),
            ("assistant", "Oke complex domain, need reliable stack. Team engineer-nya familiar dengan apa?"),
            ("user", "Mix sih, ada yang JS, ada yang Python. Belum aligned tech stack"),
            ("assistant", "For consistency mending pilih satu, gue recommend JavaScript full-stack. Node.js + React"),
            ("user", "Kenapa full JS? Bukanknya Python lebih cocok untuk data processing?"),
            ("assistant", "Untuk payroll calculation bisa pake microservice Python, tapi main app JS easier untuk hiring"),
            ("user", "Oh iya talent pool JS memang lebih gede. Database-nya pakai apa?"),
            ("assistant", "PostgreSQL solid choice, support complex queries untuk HR data"),
            ("user", "MySQL ga cukup ya? Saya lebih familiar dengan MySQL"),
            ("assistant", "MySQL oke untuk simple use case, tapi PostgreSQL better untuk complex relationships"),
            ("user", "Noted, gue adopt PostgreSQL. Hosting infrastructure-nya gimana? AWS?"),
            ("assistant", "AWS comprehensive tapi mahal dan kompleks. Coba Digital Ocean atau Railway untuk start"),
            ("user", "Railway gue pernah denger, easy setup ya? Performance gimana?"),
            ("assistant", "Performance solid untuk small-medium scale, easy scaling juga. Price competitive"),
            ("user", "Oke gue explore Railway. CI/CD pipeline-nya pakai apa yang simple?"),
            ("assistant", "GitHub Actions integrated bagus, free tier generous untuk private repos"),
            ("user", "Perfect, saya setup architecture berdasarkan recommendation ini. Timeline estimate berapa?"),
            ("assistant", "Setup infrastructure 1-2 minggu, development proper 2-3 bulan untuk MVP"),
            ("user", "Reasonable, thanks buat detailed guidance-nya Mas!"),
            ("assistant", "Sure, reach out kalau ada blocker ya")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _hiring_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate hiring tech talent conversation"""
        base = [
            ("user", "Kak, saya struggling hire senior engineer nih. Ada tips?"),
            ("assistant", "Market memang competitive ya sekarang. Budget-nya berapa untuk senior?"),
            ("user", "Saya allocate 20-25 juta per bulan, itu competitive ga?"),
            ("assistant", "For Jakarta market, agak di bawah sih untuk senior. Pasaran 25-35 juta"),
            ("user", "Waduh budget saya terbatas nih, gimana cara attract talent dengan budget segitu?"),
            ("assistant", "Offer equity dan growth opportunity. Startup yang promising masih menarik kok"),
            ("user", "Equity berapa persen yang reasonable untuk senior hire?"),
            ("assistant", "0.5-1% for senior engineer, dengan 4 years vesting. Plus growth path ke tech lead"),
            ("user", "Oke saya bisa offer itu. Channels untuk recruitment apa yang effective?"),
            ("assistant", "LinkedIn paling reliable, atau referral dari existing team. Referral bonus helps"),
            ("user", "Referral bonus-nya berapa yang attractive tapi ga bankrupt company?"),
            ("assistant", "10-15 juta per successful hire, paid after 3 months probation pass"),
            ("user", "Reasonable, saya implement referral program. Interview process-nya gimana yang efficient?"),
            ("assistant", "3 stages cukup: technical screening, coding test, culture fit. Total 2 minggu max"),
            ("user", "Coding test-nya take-home atau live coding ya?"),
            ("assistant", "Take-home better, kasih 48 jam untuk kerjain. Lebih realistic assessment"),
            ("user", "Makes sense, pressure berkurang juga. Red flags apa yang harus saya watch?"),
            ("assistant", "Job hopping terlalu sering, unrealistic salary expectation, atau bad-mouthing previous employer"),
            ("user", "Noted, saya refine hiring process based on this. Thanks ya Kak!"),
            ("assistant", "Good luck dengan hiring-nya, semoga dapat yang cocok!")
        ]

        messages = self._build_messages(base, length)
        return messages

    # Corporate conversations
    def _quarterly_review_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate quarterly review conversation"""
        base = [
            ("user", "Bu, saya mau present quarterly review untuk Q3 kemarin, jadwal-nya kapan?"),
            ("assistant", "Next week Tuesday jam 2 siang, sudah prepare presentation-nya?"),
            ("user", "Sudah 80% jadi, tinggal finalize beberapa metrics sama action plan"),
            ("assistant", "Bagus, pastikan cover KPI achievement, budget utilization, dan challenges ya"),
            ("user", "Noted Bu, untuk KPI kita hit 95% dari target, itu cukup satisfactory kan?"),
            ("assistant", "Good performance, tapi saya mau tau juga yang 5% ga tercapai itu kenapa"),
            ("user", "Mainly dari new customer acquisition yang below target karena market condition"),
            ("assistant", "Understandable, ada mitigation plan untuk Q4?"),
            ("user", "Saya mau refocus ke existing customer expansion, upsell sama cross-sell"),
            ("assistant", "Smart move, existing customer ROI lebih tinggi. Budget Q4 berapa yang kamu need?"),
            ("user", "Saya request 200 juta untuk customer success team expansion"),
            ("assistant", "Hmm agak besar ya, justify dong kenapa perlu segitu?"),
            ("user", "Kita mau hire 2 CSM dan 1 onboarding specialist untuk handle growth"),
            ("assistant", "Oke kalau untuk headcount reasonable sih, tapi hire gradually ya jangan sekaligus"),
            ("user", "Baik Bu, saya hire Q4 dan Q1 staggered. Expected impact-nya revenue naik 30%"),
            ("assistant", "Ambitious tapi saya suka, pastikan di presentation ada clear metrics to track"),
            ("user", "Siap, saya include dashboard metrics dan weekly tracking plan"),
            ("assistant", "Perfect, saya tunggu presentation-nya Tuesday ya"),
            ("user", "Terima kasih Bu, saya finalize dan share deck beforehand"),
            ("assistant", "Oke, good job untuk Q3 performance")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _budget_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate budget approval conversation"""
        base = [
            ("user", "Pak, saya mau submit budget request untuk marketing campaign Q1"),
            ("assistant", "Boleh, berapa total budget yang diminta?"),
            ("user", "Total 500 juta untuk integrated campaign across digital dan offline channels"),
            ("assistant", "Breakdown-nya gimana per channel?"),
            ("user", "Digital ads 250 juta, content production 100 juta, events 100 juta, influencer 50 juta"),
            ("assistant", "Expected ROI-nya berapa untuk budget sebesar itu?"),
            ("user", "Target saya 3x ROI, jadi expect revenue 1.5 miliar dari campaign ini"),
            ("assistant", "Ambitious ya, based on apa confidence untuk hit 3x ROI?"),
            ("user", "Historical performance Q4 kemarin kita achieved 2.5x, dengan optimization bisa push ke 3x"),
            ("assistant", "Oke data-driven, saya appreciate that. Tapi budget 500 juta quite significant"),
            ("user", "Saya bisa split execution Pak, 300 juta di Q1 dan 200 juta di Q2 kalau concern budget"),
            ("assistant", "Hmm better approach, tapi justify dong kenapa 300 juta cukup untuk Q1"),
            ("user", "300 juta fokus ke digital dan content, events saya push ke Q2 pas peak season"),
            ("assistant", "Makes sense strategically, oke gue approve 300 juta for Q1"),
            ("user", "Terima kasih Pak, ada requirement khusus untuk reporting?"),
            ("assistant", "Weekly performance report dan monthly ROI analysis. Auto-approved untuk continue kalau perform"),
            ("user", "Noted, saya setup dashboard untuk real-time monitoring juga"),
            ("assistant", "Excellent, saya mau visibility penuh untuk investment ini"),
            ("user", "Siap Pak, saya koordinasi tim untuk execution plan"),
            ("assistant", "Good, saya tunggu results-nya ya")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _dept_collab_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate department collaboration conversation"""
        base = [
            ("user", "Mas, product team butuh support dari engineering untuk feature request"),
            ("assistant", "Boleh, feature apa yang mau di-prioritize?"),
            ("user", "Customer banyak yang request advanced analytics dashboard, high priority nih"),
            ("assistant", "Hmm analytics dashboard complex ya, estimate effort sekitar 3-4 sprint"),
            ("user", "Waduh lama juga, ada cara untuk accelerate ga?"),
            ("assistant", "Bisa scale down scope dulu, launch basic version terus iterate based on feedback"),
            ("user", "Good idea, basic version itu cover apa aja ya?"),
            ("assistant", "Core metrics display, simple filtering, export to Excel. Advanced features phase 2"),
            ("user", "Oke that works, timeline untuk basic version berapa lama?"),
            ("assistant", "1.5 sprint bisa launch, tapi need 1 backend dan 1 frontend engineer dedicated"),
            ("user", "Resource-nya available kan di sprint planning nanti?"),
            ("assistant", "Saya check capacity dulu, tapi seharusnya bisa allocate. Priority level berapa ini?"),
            ("user", "P1, impact ke revenue dan customer satisfaction cukup signifikan"),
            ("assistant", "Oke with P1 saya bisa reallocate resource. Tapi perlu detailed requirements ya"),
            ("user", "Saya coordinate sama BA untuk finalize spec, target submit end of week"),
            ("assistant", "Perfect, kalau spec ready kita bisa kickoff sprint depan"),
            ("user", "Thanks ya Mas untuk quick turnaround, really appreciate the support"),
            ("assistant", "No problem, kita alignment lagi di sprint planning ya")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _kpi_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate KPI discussion conversation"""
        base = [
            ("user", "Bu, saya mau discuss KPI untuk team saya di 2025"),
            ("assistant", "Boleh, current KPI-nya apa aja dan mana yang mau di-adjust?"),
            ("user", "Sekarang fokus ke revenue target 100 juta per bulan, tapi saya rasa perlu tambah quality metrics"),
            ("assistant", "Good point, revenue aja ga cukup kalau quality jelek. Metrics apa yang kamu consider?"),
            ("user", "Customer retention rate dan NPS score, biar balanced antara growth dan satisfaction"),
            ("assistant", "Setuju, retention minimal berapa yang realistic untuk target?"),
            ("user", "Saya target 85% monthly retention, baseline kita sekarang 78%"),
            ("assistant", "Challenging tapi achievable, action plan untuk improve retention gimana?"),
            ("user", "Invest lebih ke customer success, proactive outreach, dan better onboarding experience"),
            ("assistant", "Sounds solid, untuk NPS target berapa?"),
            ("user", "Target NPS 50, dari current baseline 42"),
            ("assistant", "Oke reasonable improvement, ini measured quarterly atau monthly?"),
            ("user", "Quarterly aja Bu untuk NPS, monthly terlalu fluctuating"),
            ("assistant", "Make sense, jadi final KPI: 100 juta revenue monthly, 85% retention monthly, NPS 50 quarterly"),
            ("user", "Exactly, dengan weighting gimana ya Bu untuk overall performance?"),
            ("assistant", "Revenue 40%, retention 40%, NPS 20%. Quality metrics weighted sama dengan revenue"),
            ("user", "Fair distribution, saya align dengan team dan cascade ke individual KPIs"),
            ("assistant", "Good, saya expect quarterly review untuk monitor progress ya"),
            ("user", "Siap Bu, thanks untuk guidance-nya"),
            ("assistant", "Sama-sama, good luck hitting those targets")
        ]

        messages = self._build_messages(base, length)
        return messages

    # Continue with remaining conversation types...
    # For brevity, I'll create generic builders for remaining types

    def _project_timeline_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_corporate_conv(length, "project timeline")

    def _resource_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_corporate_conv(length, "resource allocation")

    def _performance_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_corporate_conv(length, "performance review")

    def _process_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_corporate_conv(length, "process improvement")

    def _vendor_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_corporate_conv(length, "vendor selection")

    def _compliance_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_corporate_conv(length, "compliance matters")

    # Freelancer conversations
    def _rate_negotiation_conversation(self, length: int) -> List[Dict[str, Any]]:
        """Generate rate negotiation conversation"""
        base = [
            ("user", "Halo, saya tertarik hire freelance designer, rate-nya berapa ya?"),
            ("assistant", "Untuk design apa? Branding, UI/UX, atau illustration?"),
            ("user", "UI/UX untuk mobile app, kira-kira butuh 10-15 screens"),
            ("assistant", "Oke, saya charge 2.5 juta per screen untuk high-fidelity design"),
            ("user", "Hmm agak di atas budget saya nih, bisa nego ga?"),
            ("assistant", "Budget kamu berapa? Dan timeline-nya urgent atau flexible?"),
            ("user", "Budget saya 30 juta total, timeline 1 bulan. Itu reasonable ga?"),
            ("assistant", "Hmm 15 screens seharusnya 37.5 juta dengan rate saya, tapi bisa saya consider 32 juta"),
            ("user", "32 juta masih agak stretch, gimana kalau 30 juta tapi scope 12 screens aja?"),
            ("assistant", "Oke deal, 12 screens dengan 30 juta. Itu include revision berapa kali?"),
            ("user", "Standard-nya berapa ya? Saya mau 3x revision per screen"),
            ("assistant", "Saya biasanya 2x major revision, 3x bisa tapi overall revision count 25x total"),
            ("user", "Fair enough, saya oke dengan term itu. Payment terms-nya gimana?"),
            ("assistant", "50% upfront, 50% setelah final delivery. Acceptable?"),
            ("user", "Bisa 30-70 ga? 30% upfront, 70% pas delivery"),
            ("assistant", "Sorry untuk project baru saya maintain 50-50, tapi saya bisa add milestone payment"),
            ("user", "Milestone-nya gimana structurenya?"),
            ("assistant", "50% upfront, 25% setelah 50% screens done, 25% final delivery"),
            ("user", "Oke that works, deal! Saya transfer upfront minggu ini"),
            ("assistant", "Perfect, saya send invoice dan contract ya. Start next week")
        ]

        messages = self._build_messages(base, length)
        return messages

    def _scope_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "project scope")

    def _payment_terms_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "payment terms")

    def _timeline_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "timeline")

    def _revision_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "revision policy")

    def _contract_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "contract terms")

    def _retainer_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "retainer agreement")

    def _portfolio_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "portfolio review")

    def _nda_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "NDA signing")

    def _milestone_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_freelancer_conv(length, "milestone payment")

    # Investment conversations
    def _seed_funding_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._funding_conversation(length)  # Reuse detailed funding conversation

    def _series_a_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "Series A")

    def _valuation_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "valuation")

    def _term_sheet_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "term sheet")

    def _due_diligence_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "due diligence")

    def _cap_table_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "cap table")

    def _investor_rights_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "investor rights")

    def _exit_strategy_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "exit strategy")

    def _roi_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "ROI projection")

    def _syndicate_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_investment_conv(length, "syndicate")

    # Networking conversations
    def _partnership_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "partnership")

    def _collaboration_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "collaboration")

    def _referral_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "referral")

    def _event_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "event")

    def _community_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "community")

    def _knowledge_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "knowledge sharing")

    def _intro_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "business intro")

    def _mentor_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "mentorship")

    def _insight_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "industry insight")

    def _deal_flow_conversation(self, length: int) -> List[Dict[str, Any]]:
        return self._build_generic_networking_conv(length, "deal flow")

    # Helper methods for building conversations
    def _build_messages(self, conversation: List, length: int) -> List[Dict[str, Any]]:
        """Build messages from conversation template"""
        messages = []
        timestamp = 0

        for i, (speaker, text) in enumerate(conversation[:min(length, len(conversation))]):
            messages.append({
                "speaker": speaker,
                "message": text,
                "timestamp_offset": timestamp,
                "metadata": self._generate_metadata(text)
            })
            timestamp += random.randint(3, 15)

        # If we need more messages than template, add generic follow-ups
        while len(messages) < length:
            last_speaker = messages[-1]["speaker"]
            next_speaker = "assistant" if last_speaker == "user" else "user"

            follow_up = self._generate_follow_up(next_speaker, messages)
            messages.append({
                "speaker": next_speaker,
                "message": follow_up,
                "timestamp_offset": timestamp,
                "metadata": self._generate_metadata(follow_up)
            })
            timestamp += random.randint(3, 15)

        return messages[:length]

    def _generate_follow_up(self, speaker: str, context: List[Dict]) -> str:
        """Generate contextual follow-up message"""
        follow_ups = {
            "user": [
                "Oke noted, thanks ya untuk info-nya",
                "Saya consider dulu, nanti saya kabari lagi",
                "Perfect, saya prepare materials-nya",
                "Baik, saya koordinasi dengan tim dulu",
                "Understood, ada hal lain yang perlu diperhatikan?",
                "Saya akan follow up soon, thanks!",
                "Great, saya mulai execution ya",
                "Oke, saya schedule meeting untuk discuss lebih detail"
            ],
            "assistant": [
                "Sure, reach out kalau ada questions ya",
                "Oke, saya tunggu update-nya",
                "No problem, happy to help",
                "Sounds good, keep me posted",
                "Alright, let me know kalau butuh support",
                "Perfect, saya support dari sisi saya",
                "Good luck, semangat!",
                "Oke, kita catch up lagi nanti ya"
            ]
        }

        return random.choice(follow_ups[speaker])

    def _build_generic_corporate_conv(self, length: int, topic: str) -> List[Dict[str, Any]]:
        """Build generic corporate conversation"""
        templates = {
            "project timeline": [
                ("user", f"Bu, saya mau discuss timeline untuk project {topic} nih"),
                ("assistant", "Boleh, target completion kapan?"),
                ("user", "Idealnya end of Q1, tapi saya perlu assess feasibility dulu"),
                ("assistant", "Scope-nya sudah clear belum? Timeline depend on scope clarity"),
                ("user", "80% clear, tinggal beberapa requirements yang pending stakeholder approval"),
                ("assistant", "Oke, asumsi approval minggu ini, realistic ga Q1?"),
                ("user", "Tight tapi manageable kalau resource adequate"),
                ("assistant", "Resource butuh berapa?"),
                ("user", "Minimal 3 engineer full-time selama 2 bulan"),
                ("assistant", "Oke saya allocate resources, tapi need strong project management ya"),
                ("user", "Saya assign PM dedicated untuk this project"),
                ("assistant", "Good, weekly progress review mandatory untuk track timeline"),
                ("user", "Noted Bu, saya setup recurring meeting"),
                ("assistant", "Perfect, keep me in the loop ya")
            ],
            "resource allocation": [
                ("user", f"Pak, team saya need additional resources untuk handle {topic}"),
                ("assistant", "Resource apa yang kurang? Budget, headcount, atau tools?"),
                ("user", "Mainly headcount, current team overloaded"),
                ("assistant", "Berapa orang yang kamu need?"),
                ("user", "2 additional engineer dan 1 product manager"),
                ("assistant", "Hmm significant request, justify business impact-nya dong"),
                ("user", "Current velocity cuma 60% karena limited capacity, impact delivery timeline"),
                ("assistant", "Oke kalau impact timeline saya bisa approve, tapi hiring process lama ya"),
                ("user", "Bisa consider contractor untuk short-term?"),
                ("assistant", "Good idea, lebih cepat onboard. Budget contractor berapa?"),
                ("user", "Estimate 150 juta untuk 3 bulan"),
                ("assistant", "Approved, tapi expect productivity improvement ya"),
                ("user", "Target velocity naik ke 90% dalam 1 bulan"),
                ("assistant", "Deal, saya monitor progress closely")
            ]
        }

        base = templates.get(topic, templates["project timeline"])
        return self._build_messages(base, length)

    def _build_generic_freelancer_conv(self, length: int, topic: str) -> List[Dict[str, Any]]:
        """Build generic freelancer conversation"""
        base = [
            ("user", f"Halo, saya mau discuss tentang {topic} untuk project kita"),
            ("assistant", "Boleh, spesifik-nya mau discuss apa?"),
            ("user", "Saya mau ensure kita aligned di expectations dan deliverables"),
            ("assistant", "Good, alignment penting untuk smooth collaboration"),
            ("user", "Dari sisi kamu, ada concern atau requirements khusus?"),
            ("assistant", "Saya butuh clear brief dan timely feedback untuk deliver quality work"),
            ("user", "Noted, saya ensure feedback dalam 24 jam untuk setiap submission"),
            ("assistant", "Perfect, dengan itu saya bisa maintain timeline"),
            ("user", "Great, let's finalize agreement dan start project"),
            ("assistant", "Oke, saya prepare contract dan send untuk review"),
            ("user", "Thanks, looking forward to working together!"),
            ("assistant", "Same here, let's create something great!")
        ]

        return self._build_messages(base, length)

    def _build_generic_investment_conv(self, length: int, topic: str) -> List[Dict[str, Any]]:
        """Build generic investment conversation"""
        base = [
            ("user", f"Pak, saya mau discuss tentang {topic} untuk funding round kita"),
            ("assistant", f"Boleh, untuk {topic} ini ada specific points yang mau di-address?"),
            ("user", "Saya mau ensure terms fair untuk both sides"),
            ("assistant", "Good approach, transparency penting untuk long-term partnership"),
            ("user", "Dari perspective investor, expectations-nya apa ya?"),
            ("assistant", "Saya expect clear communication, transparent reporting, dan execution excellence"),
            ("user", "Noted, saya commit untuk monthly updates dan quarterly reviews"),
            ("assistant", "Appreciate that, saya value proactive founders"),
            ("user", "Ada concern lain yang perlu saya address?"),
            ("assistant", "Pastikan team solid dan burn rate sustainable"),
            ("user", "Team sudah complete dan runway aman untuk 12 bulan"),
            ("assistant", "Perfect, saya comfortable untuk proceed"),
            ("user", "Great, next steps-nya apa Pak?"),
            ("assistant", "Saya draft term sheet dan kita schedule meeting untuk finalize"),
            ("user", "Sounds good, thanks ya Pak"),
            ("assistant", "Sama-sama, excited untuk partnership ini")
        ]

        return self._build_messages(base, length)

    def _build_generic_networking_conv(self, length: int, topic: str) -> List[Dict[str, Any]]:
        """Build generic networking conversation"""
        base = [
            ("user", f"Halo, saya dapat contact kamu dari referral untuk discuss {topic}"),
            ("assistant", "Oh iya, senang berkenalan! Cerita dong background kamu"),
            ("user", "Saya founder di fintech space, fokus ke B2B payments"),
            ("assistant", "Interesting, saya juga di adjacent space. Ada specific yang mau di-explore?"),
            ("user", f"Saya interested untuk collaborate di {topic}, mutual benefit"),
            ("assistant", "Boleh, share more about collaboration model yang kamu envision"),
            ("user", "Saya thinking strategic partnership, leverage each other's strength"),
            ("assistant", "Makes sense, strength kamu di area apa specifically?"),
            ("user", "Kita strong di technology dan product, tapi need help di distribution"),
            ("assistant", "Perfect, kita punya established distribution network"),
            ("user", "Sounds like good fit, how about we schedule proper meeting?"),
            ("assistant", "Sure, let me check calendar. Next week works?"),
            ("user", "Next week perfect, Tuesday or Wednesday flexible untuk saya"),
            ("assistant", "Let's do Tuesday 2pm, saya send calendar invite ya"),
            ("user", "Great, looking forward to discuss further!"),
            ("assistant", "Same here, see you Tuesday!")
        ]

        return self._build_messages(base, length)

    def _generate_metadata(self, text: str) -> Dict[str, Any]:
        """Generate metadata for message"""
        particles = ["sih", "ya", "kan", "nih", "deh", "dong"]
        contains_particles = any(p in text.lower() for p in particles)

        # Simple heuristic for code-switching (English words)
        english_words = len([w for w in text.split() if w.lower() in ["meeting", "deadline", "budget", "project", "team", "target", "revenue", "growth", "timeline", "delivery", "scope", "requirement", "approval", "feedback", "update", "progress", "pipeline", "conversion", "metric", "dashboard", "report", "presentation", "strategy", "execution", "performance", "impact", "investment", "funding", "valuation", "equity", "startup", "scale", "product", "market", "customer", "business", "corporate", "professional", "freelancer", "proposal", "contract", "payment", "milestone"]])
        total_words = len(text.split())
        code_switch_ratio = english_words / total_words if total_words > 0 else 0

        # Determine emotion based on keywords
        positive_words = ["good", "great", "perfect", "excellent", "appreciate", "thanks", "excited"]
        question_words = ["apa", "gimana", "kenapa", "berapa", "kapan"]

        if any(w in text.lower() for w in positive_words):
            emotion = "positive"
        elif any(w in text.lower() for w in question_words) or "?" in text:
            emotion = "curious"
        else:
            emotion = "professional"

        # Formality level (1-5 scale)
        formal_indicators = ["saya", "pak", "bu", "terima kasih", "mohon"]
        informal_indicators = ["gue", "lu", "bro", "nih", "sih"]

        formality = 3  # Default medium
        if any(w in text.lower() for w in formal_indicators):
            formality = 4
        if any(w in text.lower() for w in informal_indicators):
            formality = 2

        return {
            "emotion": emotion,
            "formality_level": formality,
            "contains_particles": contains_particles,
            "code_switch_ratio": round(code_switch_ratio, 2)
        }

    def _calculate_metrics(self, messages: List[Dict]) -> Dict[str, Any]:
        """Calculate quality metrics for conversation"""
        total_messages = len(messages)
        particles_count = sum(1 for m in messages if m["metadata"]["contains_particles"])
        particle_density = particles_count / total_messages if total_messages > 0 else 0

        code_switch_ratios = [m["metadata"]["code_switch_ratio"] for m in messages]
        avg_code_switch = sum(code_switch_ratios) / len(code_switch_ratios) if code_switch_ratios else 0

        # Professional warmth score (1-10) based on particle usage and formality balance
        formality_levels = [m["metadata"]["formality_level"] for m in messages]
        avg_formality = sum(formality_levels) / len(formality_levels) if formality_levels else 3

        # Balance between professional and warm
        professional_warmth = 10 - abs(3.5 - avg_formality) * 2  # Sweet spot is around 3-4 formality

        return {
            "naturalness_score": random.randint(7, 10),  # High quality conversations
            "particle_density": round(particle_density, 2),
            "code_switch_ratio": round(avg_code_switch, 2),
            "professional_warmth": round(professional_warmth, 1)
        }

    def generate_dataset(self) -> Dict[str, Any]:
        """Generate complete dataset of 1,500 conversations"""
        conversations = []

        print("Generating Jakarta Business Conversations...")

        # Generate 300 startup conversations
        print("Generating startup ecosystem conversations (300)...")
        for i in range(300):
            conv = self.generate_startup_conversation(f"jkt_biz_{str(i+1).zfill(4)}")
            conversations.append(conv)
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/300")

        # Generate 300 corporate conversations
        print("Generating corporate professional conversations (300)...")
        for i in range(300):
            conv = self.generate_corporate_conversation(f"jkt_biz_{str(i+301).zfill(4)}")
            conversations.append(conv)
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/300")

        # Generate 300 freelancer conversations
        print("Generating freelancer negotiations conversations (300)...")
        for i in range(300):
            conv = self.generate_freelancer_conversation(f"jkt_biz_{str(i+601).zfill(4)}")
            conversations.append(conv)
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/300")

        # Generate 300 investment conversations
        print("Generating investment discussions conversations (300)...")
        for i in range(300):
            conv = self.generate_investment_conversation(f"jkt_biz_{str(i+901).zfill(4)}")
            conversations.append(conv)
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/300")

        # Generate 300 networking conversations
        print("Generating business networking conversations (300)...")
        for i in range(300):
            conv = self.generate_networking_conversation(f"jkt_biz_{str(i+1201).zfill(4)}")
            conversations.append(conv)
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/300")

        print(f"\nTotal conversations generated: {len(conversations)}")

        return {
            "dataset_id": "jakarta_business_claude2",
            "total_conversations": len(conversations),
            "generation_timestamp": datetime.now().isoformat(),
            "conversations": conversations
        }

def main():
    generator = JakartaBusinessGenerator()
    dataset = generator.generate_dataset()

    # Save to JSON file
    output_file = "claude2_jakarta_business.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Dataset saved to {output_file}")
    print(f"📊 Total size: {len(json.dumps(dataset, ensure_ascii=False)) / (1024*1024):.2f} MB")

    # Print sample statistics
    print("\n📈 Dataset Statistics:")
    print(f"  Total conversations: {dataset['total_conversations']}")

    styles = {}
    for conv in dataset['conversations']:
        style = conv['style']
        styles[style] = styles.get(style, 0) + 1

    for style, count in sorted(styles.items()):
        print(f"  {style}: {count}")

if __name__ == "__main__":
    main()
