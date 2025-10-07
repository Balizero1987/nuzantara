#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 1: Crawl4AI Scraper
Scrapes 240 sources across 8 categories for Bali intelligence
Cost: $0 (fully open source)
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import hashlib
from urllib.parse import urlparse

try:
    from crawl4ai import AsyncWebCrawler, CacheMode
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy
except ImportError:
    print("Installing crawl4ai...")
    os.system("pip install crawl4ai")
    from crawl4ai import AsyncWebCrawler, CacheMode
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base directory for scraped content
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

# Category configuration with owners
CATEGORY_OWNERS = {
    # Standard categories (→ Social Media)
    "immigration": "adit@balizero.com",
    "business_bkpm": "dea@balizero.com",
    "real_estate": "krisna@balizero.com",
    "events_culture": "surya@balizero.com",
    "social_media": "sahira@balizero.com",
    "competitors": "damar@balizero.com",
    "general_news": "vino@balizero.com",
    "health_wellness": "ari@balizero.com",
    "tax_djp": "veronika@balizero.com",
    "jobs": "anton@balizero.com",
    "lifestyle": "dewaayu@balizero.com",

    # Special categories (→ Email Only)
    "ai_tech_global": "zero@balizero.com",
    "dev_code_library": "zero@balizero.com",
    "future_trends": "zero@balizero.com",
}

# Special categories that skip Claude and social media
SPECIAL_CATEGORIES = {"ai_tech_global", "dev_code_library", "future_trends"}

# Intel sources by category
INTEL_SOURCES = {
    "immigration": [
        # TIER 1 - Official Government Sources
        {"url": "https://www.imigrasi.go.id/id/berita/", "tier": 1, "name": "Direktorat Imigrasi"},
        {"url": "https://bali.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Bali"},
        {"url": "https://denpasar.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Denpasar"},
        {"url": "https://www.kemlu.go.id/portal/id/", "tier": 1, "name": "Kementerian Luar Negeri"},
        {"url": "https://jakarta.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Jakarta"},
        {"url": "https://surabaya.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Surabaya"},
        {"url": "https://bandung.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Bandung"},
        {"url": "https://medan.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Medan"},
        {"url": "https://yogyakarta.imigrasi.go.id/", "tier": 1, "name": "Imigrasi Yogyakarta"},
        {"url": "https://www.indonesia.go.id/", "tier": 1, "name": "Portal Indonesia"},

        # TIER 2 - International News & Media
        {"url": "https://www.thejakartapost.com/indonesia", "tier": 2, "name": "Jakarta Post Indonesia"},
        {"url": "https://www.thejakartapost.com/travel", "tier": 2, "name": "Jakarta Post Travel"},
        {"url": "https://en.tempo.co/tag/immigration", "tier": 2, "name": "Tempo Immigration"},
        {"url": "https://en.tempo.co/tag/visa", "tier": 2, "name": "Tempo Visa"},
        {"url": "https://www.balibible.com/visa-immigration", "tier": 2, "name": "Bali Bible Visa"},
        {"url": "https://jakartaglobe.id/category/indonesia", "tier": 2, "name": "Jakarta Globe Indonesia"},
        {"url": "https://www.reuters.com/places/indonesia", "tier": 2, "name": "Reuters Indonesia"},
        {"url": "https://www.bbc.com/news/world/asia/indonesia", "tier": 2, "name": "BBC Indonesia"},
        {"url": "https://www.bloomberg.com/indonesia", "tier": 2, "name": "Bloomberg Indonesia"},
        {"url": "https://www.scmp.com/topics/indonesia", "tier": 2, "name": "South China Morning Post"},
        {"url": "https://www.channelnewsasia.com/indonesia", "tier": 2, "name": "CNA Indonesia"},
        {"url": "https://www.straitstimes.com/tags/indonesia", "tier": 2, "name": "Straits Times Indonesia"},
        {"url": "https://www.aljazeera.com/where/indonesia/", "tier": 2, "name": "Al Jazeera Indonesia"},

        # TIER 2 - Expat & Travel Resources
        {"url": "https://www.indonesia-expat.id/", "tier": 2, "name": "Indonesia Expat Magazine"},
        {"url": "https://nowbali.co.id/", "tier": 2, "name": "Now Bali"},
        {"url": "https://www.livinginindonesiaforum.org/", "tier": 2, "name": "Living in Indonesia Forum"},
        {"url": "https://www.expat.com/en/destination/asia/indonesia/", "tier": 2, "name": "Expat.com Indonesia"},
        {"url": "https://www.internations.org/indonesia-expats", "tier": 2, "name": "InterNations Indonesia"},
        {"url": "https://coconuts.co/jakarta/", "tier": 2, "name": "Coconuts Jakarta"},
        {"url": "https://coconuts.co/bali/", "tier": 2, "name": "Coconuts Bali"},
        {"url": "https://www.thebalibible.com/", "tier": 2, "name": "The Bali Bible"},
        {"url": "https://whatsnewbali.com/", "tier": 2, "name": "What's New Bali"},
        {"url": "https://www.baligateway.com/", "tier": 2, "name": "Bali Gateway"},
        {"url": "https://thehoneycombers.com/bali/", "tier": 2, "name": "Honeycombers Bali"},
        {"url": "https://thehoneycombers.com/jakarta/", "tier": 2, "name": "Honeycombers Jakarta"},
        {"url": "https://www.timeout.com/jakarta", "tier": 2, "name": "Time Out Jakarta"},
        {"url": "https://www.timeout.com/bali", "tier": 2, "name": "Time Out Bali"},

        # TIER 2 - Indonesian News Media
        {"url": "https://www.kompas.com/", "tier": 2, "name": "Kompas"},
        {"url": "https://www.detik.com/", "tier": 2, "name": "DetikNews"},
        {"url": "https://nasional.kompas.com/", "tier": 2, "name": "Kompas Nasional"},
        {"url": "https://news.detik.com/", "tier": 2, "name": "DetikNews Politik"},
        {"url": "https://www.cnnindonesia.com/", "tier": 2, "name": "CNN Indonesia"},
        {"url": "https://www.liputan6.com/", "tier": 2, "name": "Liputan6"},
        {"url": "https://www.tribunnews.com/", "tier": 2, "name": "Tribun News"},

        # TIER 3 - Community & Forums
        {"url": "https://www.expatindo.org/", "tier": 3, "name": "Expat Indo Forum"},
        {"url": "https://www.reddit.com/r/bali/", "tier": 3, "name": "Reddit Bali"},
        {"url": "https://www.reddit.com/r/indonesia/", "tier": 3, "name": "Reddit Indonesia"},
        {"url": "https://www.reddit.com/r/expats/", "tier": 3, "name": "Reddit Expats"},
        {"url": "https://www.tripadvisor.com/ShowForum-g294226-i7220-Bali.html", "tier": 3, "name": "TripAdvisor Bali Forum"},
        {"url": "https://www.facebook.com/groups/baliexpats/", "tier": 3, "name": "Facebook Bali Expats"},
        {"url": "https://www.facebook.com/groups/jakartaexpats/", "tier": 3, "name": "Facebook Jakarta Expats"},
        {"url": "https://forum.balipod.com/", "tier": 3, "name": "Bali Pod Forum"},
    ],

    "business_bkpm": [
        # TIER 1 - Official Government & Regulatory
        {"url": "https://www.bkpm.go.id/id/publikasi/siaran-pers", "tier": 1, "name": "BKPM Press Releases"},
        {"url": "https://www.bkpm.go.id/id/publikasi/detail/berita", "tier": 1, "name": "BKPM News"},
        {"url": "https://oss.go.id/", "tier": 1, "name": "OSS System"},
        {"url": "https://www.kemenkeu.go.id/", "tier": 1, "name": "Kemenkeu"},
        {"url": "https://www.kemenkeu.go.id/publikasi/berita/", "tier": 1, "name": "Kemenkeu News"},
        {"url": "https://www.ekon.go.id/", "tier": 1, "name": "Kementerian Koordinator Ekonomi"},
        {"url": "https://www.kemenperin.go.id/", "tier": 1, "name": "Kementerian Perindustrian"},
        {"url": "https://www.kemendag.go.id/", "tier": 1, "name": "Kementerian Perdagangan"},
        {"url": "https://www.bi.go.id/id/Default.aspx", "tier": 1, "name": "Bank Indonesia"},
        {"url": "https://www.ojk.go.id/", "tier": 1, "name": "OJK"},
        {"url": "https://www.bps.go.id/", "tier": 1, "name": "BPS Statistics Indonesia"},

        # TIER 2 - International Business News
        {"url": "https://www.indonesia-investments.com/", "tier": 2, "name": "Indonesia Investments"},
        {"url": "https://jakartaglobe.id/business", "tier": 2, "name": "Jakarta Globe Business"},
        {"url": "https://www.thejakartapost.com/business", "tier": 2, "name": "Jakarta Post Business"},
        {"url": "https://en.tempo.co/business", "tier": 2, "name": "Tempo Business"},
        {"url": "https://www.reuters.com/world/asia-pacific/", "tier": 2, "name": "Reuters Asia Pacific"},
        {"url": "https://www.bloomberg.com/asia", "tier": 2, "name": "Bloomberg Asia"},
        {"url": "https://www.ft.com/indonesia", "tier": 2, "name": "Financial Times Indonesia"},
        {"url": "https://asia.nikkei.com/Economy/Indonesia", "tier": 2, "name": "Nikkei Asia Indonesia"},
        {"url": "https://www.scmp.com/business", "tier": 2, "name": "SCMP Business"},
        {"url": "https://www.channelnewsasia.com/business", "tier": 2, "name": "CNA Business"},

        # TIER 2 - Consulting & Professional Services
        {"url": "https://www.pwc.com/id/en/media-centre.html", "tier": 2, "name": "PwC Indonesia"},
        {"url": "https://www.ey.com/id_id", "tier": 2, "name": "EY Indonesia"},
        {"url": "https://www.deloitte.com/id/en.html", "tier": 2, "name": "Deloitte Indonesia"},
        {"url": "https://www.kpmg.com/id/en/home.html", "tier": 2, "name": "KPMG Indonesia"},
        {"url": "https://www.mckinsey.com/id/overview", "tier": 2, "name": "McKinsey Indonesia"},
        {"url": "https://www.bcg.com/offices/jakarta", "tier": 2, "name": "BCG Jakarta"},
        {"url": "https://www.bakermckenzie.com/en/locations/asia-pacific/indonesia", "tier": 2, "name": "Baker McKenzie Indonesia"},

        # TIER 2 - Indonesian Business Media
        {"url": "https://www.bisnis.com/", "tier": 2, "name": "Bisnis Indonesia"},
        {"url": "https://ekonomi.bisnis.com/", "tier": 2, "name": "Bisnis Ekonomi"},
        {"url": "https://www.cnbcindonesia.com/", "tier": 2, "name": "CNBC Indonesia"},
        {"url": "https://finansial.bisnis.com/", "tier": 2, "name": "Bisnis Finansial"},
        {"url": "https://ekonomi.kompas.com/", "tier": 2, "name": "Kompas Ekonomi"},
        {"url": "https://finance.detik.com/", "tier": 2, "name": "Detik Finance"},
        {"url": "https://www.kontan.co.id/", "tier": 2, "name": "Kontan"},
        {"url": "https://www.beritasatu.com/ekonomi", "tier": 2, "name": "BeritaSatu Ekonomi"},

        # TIER 2 - Political News Impacting Business
        {"url": "https://www.thejakartapost.com/indonesia/politics", "tier": 2, "name": "Jakarta Post Politics"},
        {"url": "https://en.tempo.co/politics", "tier": 2, "name": "Tempo Politics"},
        {"url": "https://jakartaglobe.id/news/indonesia", "tier": 2, "name": "Jakarta Globe Indonesia"},
        {"url": "https://www.reuters.com/world/indonesia/", "tier": 2, "name": "Reuters Indonesia Politics"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/bkpmri/", "tier": 3, "name": "Instagram BKPM"},
        {"url": "https://twitter.com/BKPM_RI", "tier": 3, "name": "X BKPM Official"},
        {"url": "https://www.facebook.com/BKPMRI/", "tier": 3, "name": "Facebook BKPM"},
        {"url": "https://www.instagram.com/kemenkeu.ri/", "tier": 3, "name": "Instagram Kemenkeu"},
        {"url": "https://twitter.com/KemenkeuRI", "tier": 3, "name": "X Kemenkeu"},
        {"url": "https://www.tiktok.com/@kemenkeu.ri", "tier": 3, "name": "TikTok Kemenkeu"},
        {"url": "https://www.linkedin.com/company/bkpm/", "tier": 3, "name": "LinkedIn BKPM"},
    ],

    "real_estate": [
        # TIER 1 - Government & Official
        {"url": "https://www.atrbpn.go.id/", "tier": 1, "name": "BPN Land Agency"},
        {"url": "https://www.atrbpn.go.id/Berita-Dan-Informasi/Siaran-Pers", "tier": 1, "name": "BPN Press Releases"},
        {"url": "https://bali.bpn.go.id/", "tier": 1, "name": "BPN Bali"},
        {"url": "https://jakarta.bpn.go.id/", "tier": 1, "name": "BPN Jakarta"},
        {"url": "https://jabar.bpn.go.id/", "tier": 1, "name": "BPN Jawa Barat"},
        {"url": "https://jatim.bpn.go.id/", "tier": 1, "name": "BPN Jawa Timur"},

        # TIER 2 - Major Property Portals
        {"url": "https://www.propertyguru.co.id/property-guides", "tier": 2, "name": "PropertyGuru Guides"},
        {"url": "https://www.propertyguru.co.id/property-news", "tier": 2, "name": "PropertyGuru News"},
        {"url": "https://www.rumah.com/berita-properti", "tier": 2, "name": "Rumah.com News"},
        {"url": "https://www.rumah123.com/berita-properti/", "tier": 2, "name": "Rumah123 News"},
        {"url": "https://www.lamudi.co.id/journal/", "tier": 2, "name": "Lamudi Journal"},
        {"url": "https://www.99.co/blog/indonesia/", "tier": 2, "name": "99.co Indonesia Blog"},
        {"url": "https://www.olx.co.id/properti/", "tier": 2, "name": "OLX Property"},
        {"url": "https://www.urbanindo.com/blog", "tier": 2, "name": "UrbanIndo Blog"},

        # TIER 2 - Bali-Specific Real Estate
        {"url": "https://www.bali-property.id/news", "tier": 2, "name": "Bali Property News"},
        {"url": "https://www.balirealestate.com/news", "tier": 2, "name": "Bali Real Estate News"},
        {"url": "https://www.balivillasforsale.com/blog/", "tier": 2, "name": "Bali Villas Blog"},
        {"url": "https://www.bali-luxury-villas.com/blog/", "tier": 2, "name": "Bali Luxury Villas Blog"},
        {"url": "https://www.bali-living.com/blog/", "tier": 2, "name": "Bali Living Blog"},
        {"url": "https://www.balihome.com/", "tier": 2, "name": "Bali Home Property"},
        {"url": "https://www.harcourts.co.id/", "tier": 2, "name": "Harcourts Indonesia"},
        {"url": "https://www.sothebysrealty.com/eng/associates/bali", "tier": 2, "name": "Sotheby's Bali"},

        # TIER 2 - International Property News
        {"url": "https://www.thejakartapost.com/life/property", "tier": 2, "name": "Jakarta Post Property"},
        {"url": "https://en.tempo.co/business/property", "tier": 2, "name": "Tempo Property"},
        {"url": "https://jakartaglobe.id/business/property", "tier": 2, "name": "Jakarta Globe Property"},

        # TIER 2 - Indonesian Property Media
        {"url": "https://www.rumahmesin.com/", "tier": 2, "name": "RumahMesin"},
        {"url": "https://properti.kompas.com/", "tier": 2, "name": "Kompas Properti"},
        {"url": "https://www.suara.com/properti", "tier": 2, "name": "Suara Properti"},
        {"url": "https://www.grid.id/tag/properti", "tier": 2, "name": "Grid Properti"},

        # TIER 2 - Investment & Development
        {"url": "https://www.colliers.com/en-id", "tier": 2, "name": "Colliers Indonesia"},
        {"url": "https://www.cushmanwakefield.com/id-id", "tier": 2, "name": "Cushman & Wakefield Indonesia"},
        {"url": "https://www.cbre.co.id/", "tier": 2, "name": "CBRE Indonesia"},
        {"url": "https://www.jll.co.id/", "tier": 2, "name": "JLL Indonesia"},
        {"url": "https://www.knightfrank.co.id/", "tier": 2, "name": "Knight Frank Indonesia"},
        {"url": "https://www.savills.co.id/", "tier": 2, "name": "Savills Indonesia"},

        # TIER 3 - Forums & Social Media
        {"url": "https://forum.balipod.com/", "tier": 3, "name": "Bali Pod Forum"},
        {"url": "https://www.reddit.com/r/bali/", "tier": 3, "name": "Reddit Bali Property"},
        {"url": "https://www.instagram.com/balipropertycom/", "tier": 3, "name": "Instagram Bali Property"},
        {"url": "https://www.instagram.com/propertyguru_id/", "tier": 3, "name": "Instagram PropertyGuru"},
        {"url": "https://www.facebook.com/PropertyGuruIndonesia/", "tier": 3, "name": "Facebook PropertyGuru"},
        {"url": "https://www.tiktok.com/@propertyguru_id", "tier": 3, "name": "TikTok PropertyGuru"},
        {"url": "https://www.instagram.com/rumah123com/", "tier": 3, "name": "Instagram Rumah123"},
        {"url": "https://twitter.com/PropertyGuru_ID", "tier": 3, "name": "X PropertyGuru"},
        {"url": "https://www.linkedin.com/company/propertyguru-indonesia/", "tier": 3, "name": "LinkedIn PropertyGuru"},
    ],

    "events_culture": [
        # TIER 1 - Government & Official
        {"url": "https://www.baliprov.go.id/", "tier": 1, "name": "Pemprov Bali Official"},
        {"url": "https://www.denpasarkota.go.id/", "tier": 1, "name": "Pemkot Denpasar"},
        {"url": "https://badungkab.go.id/", "tier": 1, "name": "Kab. Badung"},
        {"url": "https://www.kemenparekraf.go.id/", "tier": 1, "name": "Kemenpar & Ekraf"},
        {"url": "https://www.indonesia.travel/id/id/home", "tier": 1, "name": "Wonderful Indonesia Official"},

        # TIER 2 - Event Platforms & Calendars
        {"url": "https://www.thebalibible.com/events", "tier": 2, "name": "Bali Bible Events"},
        {"url": "https://whatsnewbali.com/", "tier": 2, "name": "What's New Bali"},
        {"url": "https://whatsnewbali.com/events/", "tier": 2, "name": "What's New Bali Events"},
        {"url": "https://thehoneycombers.com/bali/events/", "tier": 2, "name": "Honeycombers Bali Events"},
        {"url": "https://www.eventbrite.com/d/indonesia--bali/events/", "tier": 2, "name": "Eventbrite Bali"},
        {"url": "https://www.meetup.com/cities/id/bali/", "tier": 2, "name": "Meetup Bali"},
        {"url": "https://allevents.in/bali/", "tier": 2, "name": "AllEvents Bali"},
        {"url": "https://www.timeout.com/bali/things-to-do", "tier": 2, "name": "Time Out Bali Events"},
        {"url": "https://www.balipost.com/", "tier": 2, "name": "Bali Post Culture"},
        {"url": "https://www.baliforum.com/", "tier": 2, "name": "Bali Forum Events"},
        {"url": "https://www.balispirit.com/", "tier": 2, "name": "Bali Spirit Festival"},
        {"url": "https://www.ubud.org/", "tier": 2, "name": "Ubud Village"},
        {"url": "https://www.ubudfoodfesstival.com/", "tier": 2, "name": "Ubud Food Festival"},
        {"url": "https://www.baliartsfestival.com/", "tier": 2, "name": "Bali Arts Festival"},
        {"url": "https://www.balimusicfestival.com/", "tier": 2, "name": "Bali Music Festival"},
        {"url": "https://www.hubud.org/events/", "tier": 2, "name": "Hubud Events"},
        {"url": "https://www.outpost-asia.com/bali/", "tier": 2, "name": "Outpost Bali"},
        {"url": "https://www.dojobali.org/", "tier": 2, "name": "Dojo Bali"},
        {"url": "https://www.liveworkplay.org/", "tier": 2, "name": "Live Work Play"},
        {"url": "https://www.techcrunch.com/events/", "tier": 2, "name": "TechCrunch Events Indonesia"},
        {"url": "https://whatsnewjakarta.com/", "tier": 2, "name": "What's New Jakarta"},
        {"url": "https://thehoneycombers.com/jakarta/", "tier": 2, "name": "Honeycombers Jakarta"},
        {"url": "https://www.timeout.com/jakarta", "tier": 2, "name": "Time Out Jakarta"},
        {"url": "https://www.eventbrite.com/d/indonesia--jakarta/events/", "tier": 2, "name": "Eventbrite Jakarta"},
        {"url": "https://www.cntraveler.com/destination/bali", "tier": 2, "name": "Conde Nast Traveler Bali"},
        {"url": "https://www.lonelyplanet.com/indonesia/bali/events", "tier": 2, "name": "Lonely Planet Bali Events"},
        {"url": "https://www.tripadvisor.com/Attractions-g294226-Activities-c42-Bali.html", "tier": 2, "name": "TripAdvisor Bali Events"},
        {"url": "https://travel.kompas.com/", "tier": 2, "name": "Kompas Travel"},
        {"url": "https://travel.detik.com/", "tier": 2, "name": "Detik Travel"},
        {"url": "https://lifestyle.kompas.com/", "tier": 2, "name": "Kompas Lifestyle"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/thebalibible/", "tier": 3, "name": "Instagram Bali Bible"},
        {"url": "https://www.instagram.com/whatsnewbali/", "tier": 3, "name": "Instagram What's New Bali"},
        {"url": "https://www.instagram.com/balilife/", "tier": 3, "name": "Instagram Bali Life"},
        {"url": "https://www.facebook.com/BaliBible/", "tier": 3, "name": "Facebook Bali Bible"},
        {"url": "https://www.facebook.com/groups/balievents/", "tier": 3, "name": "Facebook Bali Events Group"},
        {"url": "https://www.tiktok.com/@thebalibible", "tier": 3, "name": "TikTok Bali Bible"},
        {"url": "https://twitter.com/thebalibible", "tier": 3, "name": "X Bali Bible"},
    ],

    "social_media": [
        # TIER 2 - Major Sources
        {"url": "https://coconuts.co/bali/", "tier": 2, "name": "Coconuts Bali"},
        {"url": "https://thebalipost.com/", "tier": 2, "name": "Bali Post"},
        {"url": "https://seminyaktimes.com/", "tier": 2, "name": "Seminyak Times"},
        {"url": "https://nowbali.co.id/", "tier": 2, "name": "Now Bali"},
        {"url": "https://www.thebalibible.com/", "tier": 2, "name": "The Bali Bible"},
        {"url": "https://www.viva.co.id/trending", "tier": 2, "name": "Viva Trending"},
        {"url": "https://hot.detik.com/", "tier": 2, "name": "Detik Hot"},
        {"url": "https://www.idntimes.com/", "tier": 2, "name": "IDN Times"},
        {"url": "https://www.popbela.com/", "tier": 2, "name": "Popbela"},
        {"url": "https://www.hipwee.com/", "tier": 2, "name": "Hipwee"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/explore/tags/bali/", "tier": 3, "name": "Instagram #Bali"},
        {"url": "https://www.instagram.com/explore/tags/balibusiness/", "tier": 3, "name": "Instagram #BaliBusiness"},
        {"url": "https://www.instagram.com/explore/tags/balilife/", "tier": 3, "name": "Instagram #BaliLife"},
        {"url": "https://www.instagram.com/explore/tags/expatbali/", "tier": 3, "name": "Instagram #ExpatBali"},
        {"url": "https://www.instagram.com/thebalibible/", "tier": 3, "name": "Instagram Bali Bible"},
        {"url": "https://www.instagram.com/balibucketlist/", "tier": 3, "name": "Instagram Bali Bucket List"},
        {"url": "https://www.instagram.com/bali.indo/", "tier": 3, "name": "Instagram Bali Indo"},
        {"url": "https://www.tiktok.com/tag/bali", "tier": 3, "name": "TikTok #Bali"},
        {"url": "https://www.tiktok.com/tag/balibusiness", "tier": 3, "name": "TikTok #BaliBusiness"},
        {"url": "https://www.tiktok.com/@thebalibible", "tier": 3, "name": "TikTok Bali Bible"},
        {"url": "https://www.tiktok.com/tag/indonesia", "tier": 3, "name": "TikTok #Indonesia"},
        {"url": "https://twitter.com/thebalibible", "tier": 3, "name": "X Bali Bible"},
        {"url": "https://twitter.com/search?q=bali&src=trend_click", "tier": 3, "name": "X Bali Trending"},
        {"url": "https://twitter.com/hashtag/BaliLife", "tier": 3, "name": "X #BaliLife"},
        {"url": "https://www.facebook.com/groups/baliexpats/", "tier": 3, "name": "Facebook Bali Expats"},
        {"url": "https://www.facebook.com/groups/balibusiness/", "tier": 3, "name": "Facebook Bali Business"},
        {"url": "https://www.facebook.com/BaliBible/", "tier": 3, "name": "Facebook Bali Bible Page"},
    ],

    "competitors": [
        # TIER 2 - Bali/Indonesia Competitors
        {"url": "https://emerhub.com/indonesia/blog/", "tier": 2, "name": "Emerhub Blog"},
        {"url": "https://www.cekindo.com/blog/", "tier": 2, "name": "Cekindo Blog"},
        {"url": "https://www.letsmoveindonesia.com/blog/", "tier": 2, "name": "Lets Move Blog"},
        {"url": "https://www.bali-internship.com/blog/", "tier": 2, "name": "Bali Internship Blog"},
        {"url": "https://www.balitravelandtours.com/blog/", "tier": 2, "name": "Bali Travel & Tours"},
        {"url": "https://www.balidiscovery.com/", "tier": 2, "name": "Bali Discovery"},
        {"url": "https://www.paul-wide.com/", "tier": 2, "name": "Paul Wide Indonesia Business"},
        {"url": "https://www.indonesia-briefing.com/", "tier": 2, "name": "Indonesia Briefing"},
        {"url": "https://www.aseanbriefing.com/", "tier": 2, "name": "ASEAN Briefing"},
        {"url": "https://www.iglu.net/", "tier": 2, "name": "Iglu Thailand/SE Asia"},
        {"url": "https://www.siam-legal.com/", "tier": 2, "name": "Siam Legal Thailand"},
        {"url": "https://www.thaiembassy.com/", "tier": 2, "name": "Thai Embassy Resources"},
        {"url": "https://www.vietnam-briefing.com/", "tier": 2, "name": "Vietnam Briefing"},
        {"url": "https://www.malaysia-briefing.com/", "tier": 2, "name": "Malaysia Briefing"},
        {"url": "https://www.philippines-briefing.com/", "tier": 2, "name": "Philippines Briefing"},
        {"url": "https://www.internations.org/", "tier": 2, "name": "InterNations Global"},
        {"url": "https://www.expat.com/", "tier": 2, "name": "Expat.com Global"},
        {"url": "https://www.expatica.com/", "tier": 2, "name": "Expatica"},
        {"url": "https://www.expatfocus.com/", "tier": 2, "name": "Expat Focus"},
        {"url": "https://www.expat-blog.com/", "tier": 2, "name": "Expat Blog"},
        {"url": "https://www.incorporations.io/", "tier": 2, "name": "Incorporations.io"},
        {"url": "https://www.stripe.com/atlas", "tier": 2, "name": "Stripe Atlas"},
        {"url": "https://www.doola.com/", "tier": 2, "name": "Doola"},
        {"url": "https://www.firstbase.io/", "tier": 2, "name": "Firstbase"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/emerhub/", "tier": 3, "name": "Instagram Emerhub"},
        {"url": "https://www.instagram.com/cekindo/", "tier": 3, "name": "Instagram Cekindo"},
        {"url": "https://www.linkedin.com/company/emerhub/", "tier": 3, "name": "LinkedIn Emerhub"},
        {"url": "https://www.linkedin.com/company/cekindo/", "tier": 3, "name": "LinkedIn Cekindo"},
        {"url": "https://twitter.com/IndonesiaBrief", "tier": 3, "name": "X Indonesia Briefing"},
        {"url": "https://www.facebook.com/IndonesiaBriefing/", "tier": 3, "name": "Facebook Indonesia Briefing"},
    ],

    "general_news": [
        # TIER 1 - Government & Official
        {"url": "https://www.baliprov.go.id/", "tier": 1, "name": "Pemprov Bali"},
        {"url": "https://www.indonesia.go.id/", "tier": 1, "name": "Portal Indonesia"},
        {"url": "https://www.presidenri.go.id/", "tier": 1, "name": "Presiden RI"},
        {"url": "https://www.denpasarkota.go.id/", "tier": 1, "name": "Pemkot Denpasar"},

        # TIER 2 - Major Sources
        {"url": "https://www.thejakartapost.com/", "tier": 2, "name": "Jakarta Post"},
        {"url": "https://www.thejakartapost.com/bali", "tier": 2, "name": "Jakarta Post Bali"},
        {"url": "https://en.tempo.co/", "tier": 2, "name": "Tempo English"},
        {"url": "https://jakartaglobe.id/", "tier": 2, "name": "Jakarta Globe"},
        {"url": "https://www.reuters.com/places/indonesia", "tier": 2, "name": "Reuters Indonesia"},
        {"url": "https://www.bbc.com/news/world/asia/indonesia", "tier": 2, "name": "BBC Indonesia"},
        {"url": "https://www.aljazeera.com/where/indonesia/", "tier": 2, "name": "Al Jazeera Indonesia"},
        {"url": "https://www.channelnewsasia.com/indonesia", "tier": 2, "name": "CNA Indonesia"},
        {"url": "https://www.straitstimes.com/tags/indonesia", "tier": 2, "name": "Straits Times Indonesia"},
        {"url": "https://www.scmp.com/topics/indonesia", "tier": 2, "name": "SCMP Indonesia"},
        {"url": "https://www.balidiscovery.com/", "tier": 2, "name": "Bali Discovery"},
        {"url": "https://www.nusabali.com/", "tier": 2, "name": "Nusa Bali"},
        {"url": "https://baliexpress.jawapos.com/", "tier": 2, "name": "Bali Express"},
        {"url": "https://www.thebalisun.com/", "tier": 2, "name": "Bali Sun"},
        {"url": "https://thebalipost.com/", "tier": 2, "name": "The Bali Post"},
        {"url": "https://bali.tribunnews.com/", "tier": 2, "name": "Tribun Bali"},
        {"url": "https://radarbali.jawapos.com/", "tier": 2, "name": "Radar Bali"},
        {"url": "https://baliportalnews.com/", "tier": 2, "name": "Bali Portal News"},
        {"url": "https://www.kompas.com/", "tier": 2, "name": "Kompas"},
        {"url": "https://www.detik.com/", "tier": 2, "name": "Detik"},
        {"url": "https://www.liputan6.com/", "tier": 2, "name": "Liputan6"},
        {"url": "https://www.cnnindonesia.com/", "tier": 2, "name": "CNN Indonesia"},
        {"url": "https://www.tribunnews.com/", "tier": 2, "name": "Tribun News"},
        {"url": "https://www.merdeka.com/", "tier": 2, "name": "Merdeka"},
        {"url": "https://www.suara.com/", "tier": 2, "name": "Suara"},
        {"url": "https://www.republika.co.id/", "tier": 2, "name": "Republika"},
        {"url": "https://www.antaranews.com/", "tier": 2, "name": "Antara News"},
        {"url": "https://www.jpnn.com/", "tier": 2, "name": "JPNN"},
        {"url": "https://www.inews.id/", "tier": 2, "name": "iNews"},
        {"url": "https://www.sindonews.com/", "tier": 2, "name": "Sindonews"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/kompascom/", "tier": 3, "name": "Instagram Kompas"},
        {"url": "https://www.instagram.com/detikcom/", "tier": 3, "name": "Instagram Detik"},
        {"url": "https://twitter.com/kompascom", "tier": 3, "name": "X Kompas"},
        {"url": "https://twitter.com/detikcom", "tier": 3, "name": "X Detik"},
        {"url": "https://www.tiktok.com/@kompascom", "tier": 3, "name": "TikTok Kompas"},
        {"url": "https://www.tiktok.com/@detikcom", "tier": 3, "name": "TikTok Detik"},
    ],

    "health_wellness": [
        # TIER 1 - Government & Official
        {"url": "https://www.kemkes.go.id/", "tier": 1, "name": "Kementerian Kesehatan"},
        {"url": "https://www.kemkes.go.id/id/berita", "tier": 1, "name": "Kemkes Berita"},
        {"url": "https://bali.kemkes.go.id/", "tier": 1, "name": "Dinkes Bali"},
        {"url": "https://www.bpom.go.id/", "tier": 1, "name": "BPOM"},

        # TIER 2 - Major Sources
        {"url": "https://www.who.int/indonesia", "tier": 2, "name": "WHO Indonesia"},
        {"url": "https://www.who.int/news", "tier": 2, "name": "WHO News"},
        {"url": "https://www.healthline.com/", "tier": 2, "name": "Healthline"},
        {"url": "https://www.webmd.com/", "tier": 2, "name": "WebMD"},
        {"url": "https://www.medicalnewstoday.com/", "tier": 2, "name": "Medical News Today"},
        {"url": "https://health.kompas.com/", "tier": 2, "name": "Kompas Health"},
        {"url": "https://health.detik.com/", "tier": 2, "name": "Detik Health"},
        {"url": "https://www.halodoc.com/artikel", "tier": 2, "name": "Halodoc Articles"},
        {"url": "https://www.alodokter.com/", "tier": 2, "name": "Alodokter"},
        {"url": "https://www.klikdokter.com/", "tier": 2, "name": "KlikDokter"},
        {"url": "https://www.sehatq.com/artikel", "tier": 2, "name": "SehatQ Articles"},
        {"url": "https://www.mindbodygreen.com/", "tier": 2, "name": "MindBodyGreen"},
        {"url": "https://www.wellandgood.com/", "tier": 2, "name": "Well+Good"},
        {"url": "https://www.goop.com/", "tier": 2, "name": "Goop"},
        {"url": "https://www.prevention.com/", "tier": 2, "name": "Prevention"},
        {"url": "https://www.everydayhealth.com/", "tier": 2, "name": "Everyday Health"},
        {"url": "https://www.thebalibible.com/wellness", "tier": 2, "name": "Bali Bible Wellness"},
        {"url": "https://www.balispirit.com/", "tier": 2, "name": "Bali Spirit"},
        {"url": "https://www.yogabarn.com/blog/", "tier": 2, "name": "Yoga Barn Blog"},
        {"url": "https://www.radiancyoga.com/blog/", "tier": 2, "name": "Radiantly Alive Blog"},
        {"url": "https://www.thepractivebali.com/blog/", "tier": 2, "name": "The Practice Bali Blog"},
        {"url": "https://www.siloamhospitals.com/en/news-articles", "tier": 2, "name": "Siloam Hospitals News"},
        {"url": "https://www.rspondokindah.co.id/", "tier": 2, "name": "RS Pondok Indah"},
        {"url": "https://www.bimc.co.id/news/", "tier": 2, "name": "BIMC Bali News"},
        {"url": "https://www.kasihibu.co.id/", "tier": 2, "name": "Kasih Ibu Hospital"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/kemenkes_ri/", "tier": 3, "name": "Instagram Kemkes"},
        {"url": "https://www.instagram.com/halodoc/", "tier": 3, "name": "Instagram Halodoc"},
        {"url": "https://www.tiktok.com/@halodoc", "tier": 3, "name": "TikTok Halodoc"},
        {"url": "https://twitter.com/KemenkesRI", "tier": 3, "name": "X Kemkes"},
    ],

    "tax_djp": [
        # TIER 1 - Government & Official
        {"url": "https://www.pajak.go.id/", "tier": 1, "name": "DJP Direktorat Jenderal Pajak"},
        {"url": "https://www.pajak.go.id/id/siaran-pers", "tier": 1, "name": "DJP Press Releases"},
        {"url": "https://www.pajak.go.id/id/berita", "tier": 1, "name": "DJP Berita"},
        {"url": "https://www.kemenkeu.go.id/", "tier": 1, "name": "Kemenkeu"},
        {"url": "https://www.kemenkeu.go.id/publikasi/berita/", "tier": 1, "name": "Kemenkeu Berita"},
        {"url": "https://bali.pajak.go.id/", "tier": 1, "name": "DJP Bali"},
        {"url": "https://jakarta.pajak.go.id/", "tier": 1, "name": "DJP Jakarta"},

        # TIER 2 - Major Sources
        {"url": "https://www.pwc.com/id/en/services/tax.html", "tier": 2, "name": "PwC Tax Indonesia"},
        {"url": "https://www.ey.com/id_id/tax", "tier": 2, "name": "EY Tax Indonesia"},
        {"url": "https://www.deloitte.com/id/en/services/tax.html", "tier": 2, "name": "Deloitte Tax Indonesia"},
        {"url": "https://www.kpmg.com/id/en/home/services/tax.html", "tier": 2, "name": "KPMG Tax Indonesia"},
        {"url": "https://www.ddtcnews.com/", "tier": 2, "name": "DDTC News"},
        {"url": "https://news.ddtc.co.id/", "tier": 2, "name": "DDTC News Portal"},
        {"url": "https://www.thejakartapost.com/business/tax", "tier": 2, "name": "Jakarta Post Tax"},
        {"url": "https://en.tempo.co/business/tax", "tier": 2, "name": "Tempo Tax"},
        {"url": "https://jakartaglobe.id/business/tax", "tier": 2, "name": "Jakarta Globe Tax"},
        {"url": "https://www.reuters.com/markets/asia/indonesia/", "tier": 2, "name": "Reuters Indonesia Markets"},
        {"url": "https://www.bloomberg.com/indonesia", "tier": 2, "name": "Bloomberg Indonesia"},
        {"url": "https://finansial.bisnis.com/", "tier": 2, "name": "Bisnis Finansial"},
        {"url": "https://finance.detik.com/", "tier": 2, "name": "Detik Finance"},
        {"url": "https://ekonomi.kompas.com/", "tier": 2, "name": "Kompas Ekonomi"},
        {"url": "https://www.kontan.co.id/", "tier": 2, "name": "Kontan"},
        {"url": "https://www.cnbcindonesia.com/", "tier": 2, "name": "CNBC Indonesia"},
        {"url": "https://www.oecd.org/tax/", "tier": 2, "name": "OECD Tax"},
        {"url": "https://www.oecd.org/countries/indonesia/", "tier": 2, "name": "OECD Indonesia"},
        {"url": "https://www.imf.org/en/Countries/IDN", "tier": 2, "name": "IMF Indonesia"},
        {"url": "https://www.worldbank.org/en/country/indonesia", "tier": 2, "name": "World Bank Indonesia"},
        {"url": "https://www.hukumonline.com/klinik/kategori/bisnis-dan-keuangan/pajak", "tier": 2, "name": "Hukum Online Pajak"},
        {"url": "https://www.bakermckenzie.com/en/locations/asia-pacific/indonesia/tax", "tier": 2, "name": "Baker McKenzie Tax"},
        {"url": "https://www.ssek.com/practice-areas/tax", "tier": 2, "name": "SSEK Tax"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/ditjenpajakri/", "tier": 3, "name": "Instagram DJP"},
        {"url": "https://twitter.com/DitjenPajakRI", "tier": 3, "name": "X DJP"},
        {"url": "https://www.facebook.com/DitjenPajakRI/", "tier": 3, "name": "Facebook DJP"},
        {"url": "https://www.tiktok.com/@ditjenpajakri", "tier": 3, "name": "TikTok DJP"},
        {"url": "https://www.linkedin.com/company/direktorat-jenderal-pajak/", "tier": 3, "name": "LinkedIn DJP"},
    ],

    "jobs": [
        # TIER 2 - Major Sources
        {"url": "https://www.jobstreet.co.id/", "tier": 2, "name": "JobStreet Indonesia"},
        {"url": "https://www.linkedin.com/jobs/indonesia-jobs", "tier": 2, "name": "LinkedIn Jobs Indonesia"},
        {"url": "https://www.indeed.co.id/", "tier": 2, "name": "Indeed Indonesia"},
        {"url": "https://www.glassdoor.com/Job/indonesia-jobs-SRCH_IL.0,9_IN102.htm", "tier": 2, "name": "Glassdoor Indonesia"},
        {"url": "https://www.kalibrr.com/id-ID/home", "tier": 2, "name": "Kalibrr Indonesia"},
        {"url": "https://glints.com/id", "tier": 2, "name": "Glints Indonesia"},
        {"url": "https://www.karir.com/", "tier": 2, "name": "Karir.com"},
        {"url": "https://www.jobs.id/", "tier": 2, "name": "Jobs.id"},
        {"url": "https://www.urbanhire.com/", "tier": 2, "name": "UrbanHire"},
        {"url": "https://www.expatica.com/id/jobs/", "tier": 2, "name": "Expatica Jobs Indonesia"},
        {"url": "https://www.expat.com/en/jobs/asia/indonesia/", "tier": 2, "name": "Expat.com Jobs Indonesia"},
        {"url": "https://www.internations.org/indonesia-expats/job-offers", "tier": 2, "name": "InterNations Jobs"},
        {"url": "https://www.remoteworkjunkie.com/remote-jobs-indonesia/", "tier": 2, "name": "Remote Work Junkie Indonesia"},
        {"url": "https://weworkremotely.com/", "tier": 2, "name": "We Work Remotely"},
        {"url": "https://remoteok.com/remote-jobs/indonesia", "tier": 2, "name": "RemoteOK Indonesia"},
        {"url": "https://techinasia.com/jobs/indonesia", "tier": 2, "name": "Tech in Asia Jobs"},
        {"url": "https://angel.co/indonesia/jobs", "tier": 2, "name": "AngelList Indonesia"},
        {"url": "https://startup.jobs/indonesia-jobs", "tier": 2, "name": "Startup.jobs Indonesia"},
        {"url": "https://www.nodeflair.com/jobs/indonesia", "tier": 2, "name": "NodeFlair Indonesia"},
        {"url": "https://www.thejakartapost.com/life/career", "tier": 2, "name": "Jakarta Post Career"},
        {"url": "https://en.tempo.co/business/employment", "tier": 2, "name": "Tempo Employment"},
        {"url": "https://ekonomi.kompas.com/tag/ketenagakerjaan", "tier": 2, "name": "Kompas Employment"},

        # TIER 1 - Government Employment
        {"url": "https://www.kemnaker.go.id/", "tier": 1, "name": "Kemnaker"},
        {"url": "https://cpns.bkn.go.id/", "tier": 1, "name": "CPNS BKN"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/jobstreet_indonesia/", "tier": 3, "name": "Instagram JobStreet"},
        {"url": "https://www.instagram.com/glints_indonesia/", "tier": 3, "name": "Instagram Glints"},
        {"url": "https://www.facebook.com/groups/baliexpats/", "tier": 3, "name": "Facebook Bali Expats Jobs"},
        {"url": "https://www.facebook.com/groups/jakartajobs/", "tier": 3, "name": "Facebook Jakarta Jobs"},
        {"url": "https://www.linkedin.com/groups/", "tier": 3, "name": "LinkedIn Job Groups"},
    ],

    "lifestyle": [
        # TIER 2 - Major Sources
        {"url": "https://www.thebalibible.com/", "tier": 2, "name": "The Bali Bible"},
        {"url": "https://whatsnewbali.com/", "tier": 2, "name": "What's New Bali"},
        {"url": "https://thehoneycombers.com/bali/", "tier": 2, "name": "Honeycombers Bali"},
        {"url": "https://www.timeout.com/bali", "tier": 2, "name": "Time Out Bali"},
        {"url": "https://nowbali.co.id/", "tier": 2, "name": "Now Bali"},
        {"url": "https://coconuts.co/bali/", "tier": 2, "name": "Coconuts Bali"},
        {"url": "https://seminyaktimes.com/", "tier": 2, "name": "Seminyak Times"},
        {"url": "https://whatsnewjakarta.com/", "tier": 2, "name": "What's New Jakarta"},
        {"url": "https://thehoneycombers.com/jakarta/", "tier": 2, "name": "Honeycombers Jakarta"},
        {"url": "https://www.timeout.com/jakarta", "tier": 2, "name": "Time Out Jakarta"},
        {"url": "https://coconuts.co/jakarta/", "tier": 2, "name": "Coconuts Jakarta"},
        {"url": "https://www.thecitylane.com/", "tier": 2, "name": "The City Lane Jakarta"},
        {"url": "https://www.zomato.com/bali", "tier": 2, "name": "Zomato Bali"},
        {"url": "https://www.zomato.com/jakarta", "tier": 2, "name": "Zomato Jakarta"},
        {"url": "https://pergikuliner.com/", "tier": 2, "name": "Pergi Kuliner"},
        {"url": "https://www.qraved.com/", "tier": 2, "name": "Qraved"},
        {"url": "https://food.detik.com/", "tier": 2, "name": "Detik Food"},
        {"url": "https://lifestyle.kompas.com/kuliner", "tier": 2, "name": "Kompas Kuliner"},
        {"url": "https://www.popbela.com/", "tier": 2, "name": "Popbela"},
        {"url": "https://www.beautynesia.id/", "tier": 2, "name": "Beautynesia"},
        {"url": "https://www.fimela.com/", "tier": 2, "name": "Fimela"},
        {"url": "https://www.vogue.co.id/", "tier": 2, "name": "Vogue Indonesia"},
        {"url": "https://www.harpersbazaar.co.id/", "tier": 2, "name": "Harper's Bazaar Indonesia"},
        {"url": "https://www.idntimes.com/", "tier": 2, "name": "IDN Times"},
        {"url": "https://www.kapanlagi.com/", "tier": 2, "name": "KapanLagi"},
        {"url": "https://www.wowkeren.com/", "tier": 2, "name": "Wowkeren"},
        {"url": "https://lifestyle.kompas.com/", "tier": 2, "name": "Kompas Lifestyle"},
        {"url": "https://lifestyle.okezone.com/", "tier": 2, "name": "Okezone Lifestyle"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.instagram.com/thebalibible/", "tier": 3, "name": "Instagram Bali Bible"},
        {"url": "https://www.instagram.com/whatsnewbali/", "tier": 3, "name": "Instagram What's New Bali"},
        {"url": "https://www.tiktok.com/@thebalibible", "tier": 3, "name": "TikTok Bali Bible"},
        {"url": "https://www.facebook.com/BaliBible/", "tier": 3, "name": "Facebook Bali Bible"},
        {"url": "https://www.instagram.com/popbela/", "tier": 3, "name": "Instagram Popbela"},
        {"url": "https://www.tiktok.com/@popbela", "tier": 3, "name": "TikTok Popbela"},
    ],

    "ai_tech_global": [
        # TIER 1 - Official AI Companies
        {"url": "https://openai.com/news/", "tier": 1, "name": "OpenAI News"},
        {"url": "https://www.anthropic.com/news", "tier": 1, "name": "Anthropic News"},
        {"url": "https://deepmind.google/", "tier": 1, "name": "Google DeepMind"},
        {"url": "https://www.meta.ai/blog/", "tier": 1, "name": "Meta AI Blog"},
        {"url": "https://www.microsoft.com/en-us/ai", "tier": 1, "name": "Microsoft AI"},
        {"url": "https://ai.google/", "tier": 1, "name": "Google AI"},

        # TIER 2 - Major Tech News
        {"url": "https://techcrunch.com/category/artificial-intelligence/", "tier": 2, "name": "TechCrunch AI"},
        {"url": "https://www.technologyreview.com/topic/artificial-intelligence/", "tier": 2, "name": "MIT Tech Review AI"},
        {"url": "https://www.theverge.com/ai-artificial-intelligence", "tier": 2, "name": "The Verge AI"},
        {"url": "https://www.wired.com/tag/artificial-intelligence/", "tier": 2, "name": "Wired AI"},
        {"url": "https://www.bloomberg.com/technology", "tier": 2, "name": "Bloomberg Technology"},
        {"url": "https://www.reuters.com/technology/", "tier": 2, "name": "Reuters Technology"},
        {"url": "https://arstechnica.com/ai/", "tier": 2, "name": "Ars Technica AI"},
        {"url": "https://venturebeat.com/ai/", "tier": 2, "name": "VentureBeat AI"},
        {"url": "https://arxiv.org/list/cs.AI/recent", "tier": 2, "name": "ArXiv AI Papers"},
        {"url": "https://paperswithcode.com/", "tier": 2, "name": "Papers With Code"},
        {"url": "https://huggingface.co/blog", "tier": 2, "name": "Hugging Face Blog"},
        {"url": "https://ai.stanford.edu/blog/", "tier": 2, "name": "Stanford AI Lab Blog"},
        {"url": "https://www.artificialintelligence-news.com/", "tier": 2, "name": "AI News"},
        {"url": "https://www.unite.ai/", "tier": 2, "name": "Unite AI"},
        {"url": "https://analyticsindiamag.com/", "tier": 2, "name": "Analytics India Magazine"},
        {"url": "https://syncedreview.com/", "tier": 2, "name": "Synced AI"},
        {"url": "https://www.marktechpost.com/", "tier": 2, "name": "MarkTechPost"},
        {"url": "https://aws.amazon.com/blogs/machine-learning/", "tier": 2, "name": "AWS ML Blog"},
        {"url": "https://cloud.google.com/blog/products/ai-machine-learning", "tier": 2, "name": "Google Cloud AI Blog"},
        {"url": "https://azure.microsoft.com/en-us/blog/tag/artificial-intelligence/", "tier": 2, "name": "Azure AI Blog"},
        {"url": "https://engineering.fb.com/category/ml-applications/", "tier": 2, "name": "Meta Engineering AI"},
        {"url": "https://stability.ai/news", "tier": 2, "name": "Stability AI News"},
        {"url": "https://www.midjourney.com/", "tier": 2, "name": "Midjourney Updates"},
        {"url": "https://replicate.com/blog", "tier": 2, "name": "Replicate Blog"},
        {"url": "https://www.runway.ml/blog", "tier": 2, "name": "Runway ML Blog"},
        {"url": "https://techcrunch.com/", "tier": 2, "name": "TechCrunch"},
        {"url": "https://www.theinformation.com/", "tier": 2, "name": "The Information"},
        {"url": "https://techcrunch.com/category/startups/", "tier": 2, "name": "TechCrunch Startups"},
        {"url": "https://siliconangle.com/", "tier": 2, "name": "SiliconANGLE"},
    ],

    "dev_code_library": [
        # TIER 2 - Major Sources
        {"url": "https://github.com/trending", "tier": 2, "name": "GitHub Trending"},
        {"url": "https://github.com/topics/python", "tier": 2, "name": "GitHub Python"},
        {"url": "https://github.com/topics/javascript", "tier": 2, "name": "GitHub JavaScript"},
        {"url": "https://github.com/topics/typescript", "tier": 2, "name": "GitHub TypeScript"},
        {"url": "https://github.com/topics/machine-learning", "tier": 2, "name": "GitHub ML"},
        {"url": "https://github.com/topics/web-development", "tier": 2, "name": "GitHub Web Dev"},
        {"url": "https://stackoverflow.com/questions/tagged/python?sort=votes", "tier": 2, "name": "Stack Overflow Python"},
        {"url": "https://stackoverflow.com/questions/tagged/javascript?sort=votes", "tier": 2, "name": "Stack Overflow JavaScript"},
        {"url": "https://stackoverflow.blog/", "tier": 2, "name": "Stack Overflow Blog"},
        {"url": "https://dev.to/", "tier": 2, "name": "Dev.to"},
        {"url": "https://dev.to/t/python", "tier": 2, "name": "Dev.to Python"},
        {"url": "https://dev.to/t/javascript", "tier": 2, "name": "Dev.to JavaScript"},
        {"url": "https://news.ycombinator.com/", "tier": 2, "name": "Hacker News"},

        # TIER 3 - Social Media & Communities
        {"url": "https://www.reddit.com/r/programming/", "tier": 3, "name": "Reddit Programming"},
        {"url": "https://www.reddit.com/r/coding/", "tier": 3, "name": "Reddit Coding"},

        # TIER 2 - Major Sources
        {"url": "https://medium.com/tag/programming", "tier": 2, "name": "Medium Programming"},
        {"url": "https://towardsdatascience.com/", "tier": 2, "name": "Towards Data Science"},
        {"url": "https://www.freecodecamp.org/news/", "tier": 2, "name": "freeCodeCamp News"},
        {"url": "https://css-tricks.com/", "tier": 2, "name": "CSS-Tricks"},
        {"url": "https://www.smashingmagazine.com/", "tier": 2, "name": "Smashing Magazine"},
        {"url": "https://react.dev/blog", "tier": 2, "name": "React Blog"},
        {"url": "https://blog.vuejs.org/", "tier": 2, "name": "Vue.js Blog"},
        {"url": "https://angular.io/blog", "tier": 2, "name": "Angular Blog"},
        {"url": "https://nextjs.org/blog", "tier": 2, "name": "Next.js Blog"},
        {"url": "https://www.python.org/blogs/", "tier": 2, "name": "Python Blog"},
        {"url": "https://nodejs.org/en/blog/", "tier": 2, "name": "Node.js Blog"},
        {"url": "https://aws.amazon.com/blogs/aws/", "tier": 2, "name": "AWS Blog"},
        {"url": "https://cloud.google.com/blog/", "tier": 2, "name": "Google Cloud Blog"},
        {"url": "https://kubernetes.io/blog/", "tier": 2, "name": "Kubernetes Blog"},
        {"url": "https://www.docker.com/blog/", "tier": 2, "name": "Docker Blog"},
        {"url": "https://martinfowler.com/", "tier": 2, "name": "Martin Fowler"},
        {"url": "https://blog.cleancoder.com/", "tier": 2, "name": "Clean Coder"},
        {"url": "https://refactoring.guru/", "tier": 2, "name": "Refactoring Guru"},
        {"url": "https://www.patterns.dev/", "tier": 2, "name": "Patterns.dev"},
        {"url": "https://code.visualstudio.com/blogs", "tier": 2, "name": "VS Code Blog"},
        {"url": "https://blog.jetbrains.com/", "tier": 2, "name": "JetBrains Blog"},
        {"url": "https://github.blog/", "tier": 2, "name": "GitHub Blog"},
        {"url": "https://about.gitlab.com/blog/", "tier": 2, "name": "GitLab Blog"},
    ],

    "future_trends": [
        # TIER 2 - Major Sources
        {"url": "https://www.wired.com/", "tier": 2, "name": "Wired"},
        {"url": "https://www.technologyreview.com/", "tier": 2, "name": "MIT Technology Review"},
        {"url": "https://singularityhub.com/", "tier": 2, "name": "Singularity Hub"},
        {"url": "https://futurism.com/", "tier": 2, "name": "Futurism"},
        {"url": "https://www.fastcompany.com/", "tier": 2, "name": "Fast Company"},
        {"url": "https://www.technologyreview.com/topic/emerging-tech/", "tier": 2, "name": "MIT TR Emerging Tech"},
        {"url": "https://www.nature.com/", "tier": 2, "name": "Nature"},
        {"url": "https://www.science.org/", "tier": 2, "name": "Science Magazine"},
        {"url": "https://www.scientificamerican.com/", "tier": 2, "name": "Scientific American"},
        {"url": "https://www.newscientist.com/", "tier": 2, "name": "New Scientist"},
        {"url": "https://www.sciencedaily.com/", "tier": 2, "name": "Science Daily"},
        {"url": "https://www.forbes.com/innovation/", "tier": 2, "name": "Forbes Innovation"},
        {"url": "https://www.businessinsider.com/sai", "tier": 2, "name": "Business Insider Tech"},
        {"url": "https://hbr.org/topic/innovation", "tier": 2, "name": "HBR Innovation"},
        {"url": "https://www.mckinsey.com/featured-insights", "tier": 2, "name": "McKinsey Insights"},
        {"url": "https://www.space.com/news", "tier": 2, "name": "Space.com News"},
        {"url": "https://www.nasa.gov/news/", "tier": 2, "name": "NASA News"},
        {"url": "https://www.spacex.com/updates/", "tier": 2, "name": "SpaceX Updates"},
        {"url": "https://arstechnica.com/science/", "tier": 2, "name": "Ars Technica Science"},
        {"url": "https://www.ibm.com/quantum/blog", "tier": 2, "name": "IBM Quantum Blog"},
        {"url": "https://quantumcomputingreport.com/", "tier": 2, "name": "Quantum Computing Report"},
        {"url": "https://www.technologyreview.com/topic/quantum-computing/", "tier": 2, "name": "MIT TR Quantum"},
        {"url": "https://www.fiercebiotech.com/", "tier": 2, "name": "Fierce Biotech"},
        {"url": "https://www.statnews.com/", "tier": 2, "name": "STAT News"},
        {"url": "https://www.nature.com/nbt/", "tier": 2, "name": "Nature Biotechnology"},
        {"url": "https://www.greentechmedia.com/", "tier": 2, "name": "Greentech Media"},
        {"url": "https://www.technologyreview.com/topic/climate-change/", "tier": 2, "name": "MIT TR Climate"},
        {"url": "https://insideclimatenews.org/", "tier": 2, "name": "Inside Climate News"},
        {"url": "https://techcrunch.com/startups/", "tier": 2, "name": "TechCrunch Startups"},
        {"url": "https://www.crunchbase.com/discover/trending", "tier": 2, "name": "Crunchbase Trending"},
        {"url": "https://www.cbinsights.com/research/", "tier": 2, "name": "CB Insights Research"},
        {"url": "https://www.producthunt.com/", "tier": 2, "name": "Product Hunt"},
    ],
}

class IntelScraper:
    """Main scraper class using Crawl4AI"""

    def __init__(self):
        self.base_dir = BASE_DIR
        self.cache_file = self.base_dir / "scraper_cache.json"
        self.seen_urls = self.load_cache()

    def load_cache(self) -> set:
        """Load seen URLs from cache"""
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return set(json.load(f))
        return set()

    def save_cache(self):
        """Save seen URLs to cache"""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_file, 'w') as f:
            json.dump(list(self.seen_urls), f)

    def get_content_hash(self, content: str) -> str:
        """Generate hash for content deduplication"""
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    async def scrape_url(self, url: str, category: str, source_info: Dict) -> Optional[Dict]:
        """Scrape a single URL with Crawl4AI"""

        if url in self.seen_urls:
            logger.info(f"Skipping already scraped: {url}")
            return None

        try:
            logger.info(f"[{category.upper()}] Scraping {source_info['name']}: {url}")

            async with AsyncWebCrawler(verbose=False) as crawler:
                # Use smart extraction strategy with higher quality threshold
                result = await crawler.arun(
                    url=url,
                    cache_mode=CacheMode.BYPASS,  # Always get fresh content
                    word_count_threshold=300,  # Min words for meaningful articles (was 50)
                    exclude_external_links=True,
                    remove_overlay=True,
                    screenshot=False,  # We don't need screenshots
                )

                if not result.success or not result.markdown:
                    logger.warning(f"Failed to extract content from {url}")
                    return None

                # Validate content quality (reject pages with too little text)
                word_count = len(result.markdown.split())
                if word_count < 300:
                    logger.warning(f"Content too short ({word_count} words): {url}")
                    return None

                # Get metadata
                metadata = result.metadata or {}

                # Create document
                doc = {
                    "url": url,
                    "source_name": source_info['name'],
                    "tier": source_info['tier'],
                    "category": category,
                    "title": metadata.get('title', ''),
                    "description": metadata.get('description', ''),
                    "content": result.markdown,
                    "content_hash": self.get_content_hash(result.markdown),
                    "word_count": len(result.markdown.split()),
                    "scraped_at": datetime.now().isoformat(),
                    "language": metadata.get('language', 'en'),
                    "links": list(result.links)[:10] if result.links else [],
                }

                # Mark as seen
                self.seen_urls.add(url)

                return doc

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return None

    async def scrape_category(self, category: str, sources: List[Dict]) -> List[Dict]:
        """Scrape all sources in a category"""
        logger.info(f"Starting category: {category}")

        documents = []
        for source in sources:
            doc = await self.scrape_url(source['url'], category, source)
            if doc:
                documents.append(doc)
                # Save immediately
                self.save_document(doc, category)

            # Small delay to be respectful
            await asyncio.sleep(2)

        logger.info(f"Completed {category}: {len(documents)} documents scraped")
        return documents

    def save_document(self, doc: Dict, category: str):
        """Save scraped document to file system"""
        # Create directory structure
        output_dir = self.base_dir / category / "raw"
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        source_slug = doc['source_name'].lower().replace(' ', '_')
        filename = f"{timestamp}_{source_slug}_{doc['content_hash'][:8]}.json"

        # Save document
        filepath = output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved: {filepath.name}")

        # Also save markdown version for easy reading
        md_filepath = filepath.with_suffix('.md')
        with open(md_filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {doc['title']}\n\n")
            f.write(f"**Source**: {doc['source_name']} (Tier {doc['tier']})\n")
            f.write(f"**URL**: {doc['url']}\n")
            f.write(f"**Scraped**: {doc['scraped_at']}\n\n")
            f.write("---\n\n")
            f.write(doc['content'])

    async def scrape_all(self):
        """Main scraping orchestration"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 1: SCRAPING")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        total_scraped = 0

        for category, sources in INTEL_SOURCES.items():
            docs = await self.scrape_category(category, sources)
            total_scraped += len(docs)

            # Save category summary
            self.save_category_summary(category, docs)

        # Save cache
        self.save_cache()

        # Generate overall summary
        self.generate_daily_summary(total_scraped)

        logger.info("=" * 70)
        logger.info(f"SCRAPING COMPLETE: {total_scraped} documents")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

    def save_category_summary(self, category: str, documents: List[Dict]):
        """Save summary for a category"""
        summary_dir = self.base_dir / category
        summary_dir.mkdir(parents=True, exist_ok=True)

        summary = {
            "category": category,
            "timestamp": datetime.now().isoformat(),
            "total_documents": len(documents),
            "sources": [
                {
                    "name": doc['source_name'],
                    "tier": doc['tier'],
                    "word_count": doc['word_count'],
                    "title": doc['title']
                }
                for doc in documents
            ]
        }

        summary_file = summary_dir / f"summary_{datetime.now().strftime('%Y%m%d')}.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)

    def generate_daily_summary(self, total_scraped: int):
        """Generate daily summary report"""
        summary_file = self.base_dir / f"daily_summary_{datetime.now().strftime('%Y%m%d')}.md"

        with open(summary_file, 'w') as f:
            f.write(f"# Intel Scraping Daily Summary\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Total Documents**: {total_scraped}\n\n")

            f.write("## Categories Scraped\n\n")
            for category in INTEL_SOURCES.keys():
                raw_dir = self.base_dir / category / "raw"
                if raw_dir.exists():
                    count = len(list(raw_dir.glob("*.json")))
                    f.write(f"- **{category}**: {count} documents\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")


async def main():
    """Main entry point"""
    scraper = IntelScraper()
    await scraper.scrape_all()


if __name__ == "__main__":
    # Run the scraper
    asyncio.run(main())