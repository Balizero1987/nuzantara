#!/usr/bin/env python3
"""
Admiralty Code Source Validator
Military intelligence standard for source credibility assessment
"""

import re
from urllib.parse import urlparse
from typing import Dict, Tuple

# Admiralty Code: Source Reliability (A-E)
# A = Completely Reliable (verified, official, corroborated)
# B = Usually Reliable (reputable, formal vetting)
# C = Fairly Reliable (known experts, often correct)
# D = Not Usually Reliable (mixed history)
# E = Unreliable (no authenticity, history of errors)

ADMIRALTY_SOURCES = {
    # === A - COMPLETELY RELIABLE (Official Government) ===
    # All .go.id domains are official Indonesian government
    'imigrasi.go.id': {
        'reliability': 'A',
        'rationale': 'Official immigration authority',
        'use_for_rag': True
    },
    'bkpm.go.id': {
        'reliability': 'A',
        'rationale': 'Official investment coordinating board',
        'use_for_rag': True
    },
    'djp.go.id': {
        'reliability': 'A',
        'rationale': 'Official tax directorate',
        'use_for_rag': True
    },
    'pajak.go.id': {
        'reliability': 'A',
        'rationale': 'Official tax directorate (DJP)',
        'use_for_rag': True
    },
    'kemenkumham.go.id': {
        'reliability': 'A',
        'rationale': 'Ministry of Law and Human Rights',
        'use_for_rag': True
    },
    'kemlu.go.id': {
        'reliability': 'A',
        'rationale': 'Ministry of Foreign Affairs',
        'use_for_rag': True
    },
    'kemenkeu.go.id': {
        'reliability': 'A',
        'rationale': 'Ministry of Finance',
        'use_for_rag': True
    },
    'kemkes.go.id': {
        'reliability': 'A',
        'rationale': 'Ministry of Health',
        'use_for_rag': True
    },
    'kemnaker.go.id': {
        'reliability': 'A',
        'rationale': 'Ministry of Manpower',
        'use_for_rag': True
    },
    'atrbpn.go.id': {
        'reliability': 'A',
        'rationale': 'Land agency (BPN) - official',
        'use_for_rag': True
    },
    'oss.go.id': {
        'reliability': 'A',
        'rationale': 'Official business licensing system',
        'use_for_rag': True
    },
    'indonesia.go.id': {
        'reliability': 'A',
        'rationale': 'Official Indonesia portal',
        'use_for_rag': True
    },
    'bi.go.id': {
        'reliability': 'A',
        'rationale': 'Bank Indonesia (central bank)',
        'use_for_rag': True
    },
    'ojk.go.id': {
        'reliability': 'A',
        'rationale': 'Financial Services Authority',
        'use_for_rag': True
    },
    'bps.go.id': {
        'reliability': 'A',
        'rationale': 'Statistics Indonesia',
        'use_for_rag': True
    },
    'bpom.go.id': {
        'reliability': 'A',
        'rationale': 'Food and Drug Monitoring Agency',
        'use_for_rag': True
    },
    'peraturan.go.id': {
        'reliability': 'A',
        'rationale': 'Indonesian Regulations Database',
        'use_for_rag': True
    },
    'ahu.go.id': {
        'reliability': 'A',
        'rationale': 'Company Registration (AHU)',
        'use_for_rag': True
    },
    'bpjsketenagakerjaan.go.id': {
        'reliability': 'A',
        'rationale': 'BPJS Employment',
        'use_for_rag': True
    },
    'bpjs-kesehatan.go.id': {
        'reliability': 'A',
        'rationale': 'BPJS Health',
        'use_for_rag': True
    },

    # === B - USUALLY RELIABLE (Reputable Media/Institutions) ===
    'thejakartapost.com': {
        'reliability': 'B',
        'rationale': 'Established English-language newspaper, fact-checked',
        'use_for_rag': True
    },
    'tempo.co': {
        'reliability': 'B',
        'rationale': 'Reputable Indonesian news agency',
        'use_for_rag': True
    },
    'kompas.com': {
        'reliability': 'B',
        'rationale': 'Major Indonesian newspaper, credible',
        'use_for_rag': True
    },
    'reuters.com': {
        'reliability': 'B',
        'rationale': 'International news agency, fact-checked',
        'use_for_rag': True
    },
    'bloomberg.com': {
        'reliability': 'B',
        'rationale': 'Financial news, credible data',
        'use_for_rag': True
    },
    'bbc.com': {
        'reliability': 'B',
        'rationale': 'British public broadcaster, fact-checked',
        'use_for_rag': True
    },
    'channelnewsasia.com': {
        'reliability': 'B',
        'rationale': 'Regional news, credible reporting',
        'use_for_rag': True
    },

    # === C - FAIRLY RELIABLE (Expat Resources, Known Experts) ===
    'coconuts.co': {
        'reliability': 'C',
        'rationale': 'Expat-focused news, often correct but less formal vetting',
        'use_for_rag': True
    },
    'nowbali.co.id': {
        'reliability': 'C',
        'rationale': 'Local Bali news, mixed vetting',
        'use_for_rag': True
    },
    'indonesia-expat.id': {
        'reliability': 'C',
        'rationale': 'Expat magazine, community-focused',
        'use_for_rag': True
    },
    'thebalibible.com': {
        'reliability': 'C',
        'rationale': 'Expat lifestyle guide, often accurate',
        'use_for_rag': True
    },
    'whatsnewbali.com': {
        'reliability': 'C',
        'rationale': 'Event listings, community news',
        'use_for_rag': False  # Lifestyle content, low actionability
    },

    # === D - NOT USUALLY RELIABLE (Promotional, Blogs) ===
    'bakermckenzie.com': {
        'reliability': 'D',
        'rationale': 'Law firm promotional content, biased',
        'use_for_rag': False
    },
    'deloitte.com': {
        'reliability': 'D',
        'rationale': 'Consulting promotional, biased',
        'use_for_rag': False
    },
    'harcourts.co.id': {
        'reliability': 'D',
        'rationale': 'Real estate agency promotional',
        'use_for_rag': False
    },
    'rumahmesin.com': {
        'reliability': 'E',  # Actually E, machinery seller
        'rationale': 'Agricultural equipment, not real estate!',
        'use_for_rag': False
    },

    # === E - UNRELIABLE (Social Media, UGC) ===
    'tiktok.com': {
        'reliability': 'E',
        'rationale': 'User-generated content, no fact-checking',
        'use_for_rag': False
    },
    'facebook.com': {
        'reliability': 'E',
        'rationale': 'Social media, unverified information',
        'use_for_rag': False
    },
    'instagram.com': {
        'reliability': 'E',
        'rationale': 'Social media, promotional content',
        'use_for_rag': False
    },
    'linkedin.com': {
        'reliability': 'E',
        'rationale': 'Professional network, promotional posts',
        'use_for_rag': False
    },
    'reddit.com': {
        'reliability': 'E',
        'rationale': 'User forums, anecdotal information',
        'use_for_rag': False
    },
    'twitter.com': {
        'reliability': 'E',
        'rationale': 'Social media, unverified claims',
        'use_for_rag': False
    },
    'x.com': {
        'reliability': 'E',
        'rationale': 'Twitter rebrand, same issues',
        'use_for_rag': False
    },
}


def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # Remove www.
        domain = re.sub(r'^www\.', '', domain)
        return domain
    except:
        return ""


def assess_source_reliability(url: str) -> Dict:
    """
    Assess source reliability using Admiralty Code

    Returns:
        {
            'url': original URL,
            'domain': extracted domain,
            'reliability': 'A'|'B'|'C'|'D'|'E',
            'rationale': explanation,
            'use_for_rag': bool,
            'admiralty_tier': int (0-4 for backward compat)
        }
    """

    domain = extract_domain(url)

    # Check known sources
    if domain in ADMIRALTY_SOURCES:
        source_info = ADMIRALTY_SOURCES[domain]
        reliability = source_info['reliability']
    # Special rule: All .go.id domains are Indonesian government (Tier A)
    elif domain.endswith('.go.id'):
        reliability = 'A'
        source_info = {
            'rationale': 'Indonesian government domain (.go.id)',
            'use_for_rag': True
        }
    else:
        # Default: D (Not Usually Reliable) for unknown sources
        reliability = 'D'
        source_info = {
            'rationale': 'Unknown source, no established credibility',
            'use_for_rag': False
        }

    # Map to old tier system for backward compatibility
    reliability_to_tier = {
        'A': 1,  # Official gov (was Tier 1)
        'B': 2,  # Reputable media (was Tier 2)
        'C': 2,  # Fair sources (was Tier 2)
        'D': 0,  # Unreliable (was Tier 0)
        'E': 0,  # Very unreliable (was Tier 0)
    }

    return {
        'url': url,
        'domain': domain,
        'reliability': reliability,
        'rationale': source_info['rationale'],
        'use_for_rag': source_info['use_for_rag'],
        'admiralty_tier': reliability_to_tier[reliability],
        'is_tier_e': reliability == 'E',  # Flag for removal
    }


def should_scrape_source(url: str) -> Tuple[bool, str]:
    """
    Determine if URL should be scraped based on Admiralty assessment

    Returns:
        (should_scrape: bool, reason: str)
    """

    assessment = assess_source_reliability(url)

    # Reject Tier E sources immediately
    if assessment['reliability'] == 'E':
        return False, f"Tier E (Unreliable): {assessment['rationale']}"

    # Reject Tier D unless whitelisted
    if assessment['reliability'] == 'D' and not assessment['use_for_rag']:
        return False, f"Tier D (Promotional): {assessment['rationale']}"

    # Accept A/B/C
    return True, f"Tier {assessment['reliability']}: {assessment['rationale']}"


def get_admiralty_stats(urls: list) -> Dict:
    """
    Get Admiralty distribution stats for a list of URLs

    Returns:
        {
            'A': count,
            'B': count,
            'C': count,
            'D': count,
            'E': count,
            'total': count,
            'use_for_rag': count,
            'top_tier_pct': percentage (A+B)
        }
    """

    stats = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'total': 0, 'use_for_rag': 0}

    for url in urls:
        assessment = assess_source_reliability(url)
        stats[assessment['reliability']] += 1
        stats['total'] += 1
        if assessment['use_for_rag']:
            stats['use_for_rag'] += 1

    # Calculate top-tier percentage (A+B)
    stats['top_tier_pct'] = ((stats['A'] + stats['B']) / stats['total'] * 100) if stats['total'] > 0 else 0

    return stats


if __name__ == "__main__":
    # Test examples
    test_urls = [
        "https://imigrasi.go.id/berita/",
        "https://www.thejakartapost.com/indonesia",
        "https://coconuts.co/bali/",
        "https://www.tiktok.com/@bali",
        "https://www.bakermckenzie.com/indonesia",
    ]

    print("=" * 70)
    print("ADMIRALTY CODE SOURCE VALIDATOR - TEST")
    print("=" * 70)

    for url in test_urls:
        assessment = assess_source_reliability(url)
        should_scrape, reason = should_scrape_source(url)

        print(f"\nURL: {url}")
        print(f"  Domain: {assessment['domain']}")
        print(f"  Reliability: {assessment['reliability']}")
        print(f"  Rationale: {assessment['rationale']}")
        print(f"  Use for RAG: {assessment['use_for_rag']}")
        print(f"  Should Scrape: {'✅ YES' if should_scrape else '❌ NO'} - {reason}")

    # Stats
    print("\n" + "=" * 70)
    print("STATISTICS")
    print("=" * 70)
    stats = get_admiralty_stats(test_urls)
    print(f"Total URLs: {stats['total']}")
    print(f"Tier A (Official): {stats['A']}")
    print(f"Tier B (Reputable): {stats['B']}")
    print(f"Tier C (Fair): {stats['C']}")
    print(f"Tier D (Mixed): {stats['D']}")
    print(f"Tier E (Unreliable): {stats['E']}")
    print(f"Top-tier (A+B): {stats['top_tier_pct']:.1f}%")
    print(f"Usable for RAG: {stats['use_for_rag']}/{stats['total']}")
