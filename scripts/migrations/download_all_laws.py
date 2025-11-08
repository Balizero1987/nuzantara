#!/usr/bin/env python3
"""
Download ALL Indonesian Laws - Complete Legal Framework
Scarica TUTTE le 35 leggi mancanti + Codici
"""

import requests
import os
import time
from pathlib import Path

# Directory setup
LAWS_DIR = Path("data/laws/raw")
LAWS_DIR.mkdir(parents=True, exist_ok=True)

# Complete list of 35+ laws to download
LAWS_TO_DOWNLOAD = {
    # 🔥 CRITICAL (6)
    "UU_6_2023": {
        "name": "UU 6/2023 Cipta Kerja",
        "url": "https://peraturan.bpk.go.id/Download/175371/UU%20No.%206%20Tahun%202023.pdf",
        "priority": "critical"
    },
    "UU_36_2008_TAX": {
        "name": "UU 36/2008 Pajak Penghasilan (PPh)",
        "url": "https://peraturan.bpk.go.id/Download/49289/UU%20Nomor%2036%20Tahun%202008.pdf",
        "priority": "critical"
    },
    "UU_42_2009_PPN": {
        "name": "UU 42/2009 PPN & PPnBM",
        "url": "https://peraturan.bpk.go.id/Download/54685/UU%20Nomor%2042%20Tahun%202009.pdf",
        "priority": "critical"
    },
    "UU_7_2021_TAX_HARMONIZATION": {
        "name": "UU 7/2021 Harmonisasi Peraturan Perpajakan (HPP)",
        "url": "https://peraturan.bpk.go.id/Download/208138/UU%20Nomor%207%20Tahun%202021.pdf",
        "priority": "critical"
    },
    "UU_6_2011_IMMIGRATION": {
        "name": "UU 6/2011 Keimigrasian",
        "url": "https://peraturan.bpk.go.id/Download/88235/UU%20Nomor%206%20Tahun%202011.pdf",
        "priority": "critical"
    },
    "UU_13_2003_TKA": {
        "name": "UU 13/2003 Ketenagakerjaan (TKA)",
        "url": "https://peraturan.bpk.go.id/Download/9310/UU%20Nomor%2013%20Tahun%202003.pdf",
        "priority": "critical"
    },
    
    # 🟡 HIGH PRIORITY (10)
    "UU_40_2007_PT": {
        "name": "UU 40/2007 Perseroan Terbatas (PT)",
        "url": "https://peraturan.bpk.go.id/Download/40417/UU%20Nomor%2040%20Tahun%202007.pdf",
        "priority": "high"
    },
    "UU_25_2007_INVESTMENT": {
        "name": "UU 25/2007 Penanaman Modal (PMA)",
        "url": "https://peraturan.bpk.go.id/Download/38778/UU%20Nomor%2025%20Tahun%202007.pdf",
        "priority": "high"
    },
    "UU_5_1960_AGRARIA": {
        "name": "UU 5/1960 Peraturan Dasar Pokok-Pokok Agraria (UUPA)",
        "url": "https://peraturan.bpk.go.id/Download/59580/UU%20Nomor%205%20Tahun%201960.pdf",
        "priority": "high"
    },
    "UU_20_2011_PROPERTY": {
        "name": "UU 20/2011 Rumah Susun",
        "url": "https://peraturan.bpk.go.id/Download/90437/UU%20Nomor%2020%20Tahun%202011.pdf",
        "priority": "high"
    },
    "UU_1_2011_HOUSING": {
        "name": "UU 1/2011 Perumahan dan Kawasan Permukiman",
        "url": "https://peraturan.bpk.go.id/Download/82084/UU%20Nomor%201%20Tahun%202011.pdf",
        "priority": "high"
    },
    "UU_11_2020_OMNIBUS": {
        "name": "UU 11/2020 Cipta Kerja (Omnibus Law Original)",
        "url": "https://peraturan.bpk.go.id/Download/158080/UU%20Nomor%2011%20Tahun%202020.pdf",
        "priority": "high"
    },
    "UU_2_2017_CONSTRUCTION": {
        "name": "UU 2/2017 Jasa Konstruksi",
        "url": "https://peraturan.bpk.go.id/Download/136741/UU%20Nomor%202%20Tahun%202017.pdf",
        "priority": "high"
    },
    "UU_28_2014_COPYRIGHT": {
        "name": "UU 28/2014 Hak Cipta",
        "url": "https://peraturan.bpk.go.id/Download/122288/UU%20Nomor%2028%20Tahun%202014.pdf",
        "priority": "high"
    },
    "UU_13_2016_PATENT": {
        "name": "UU 13/2016 Paten",
        "url": "https://peraturan.bpk.go.id/Download/132756/UU%20Nomor%2013%20Tahun%202016.pdf",
        "priority": "high"
    },
    "UU_20_2016_TRADEMARK": {
        "name": "UU 20/2016 Merek dan Indikasi Geografis",
        "url": "https://peraturan.bpk.go.id/Download/135140/UU%20Nomor%2020%20Tahun%202016.pdf",
        "priority": "high"
    },
    
    # 🟢 CODES (4)
    "KUHP_2025": {
        "name": "KUHP 2025 - Kitab Undang-Undang Hukum Pidana",
        "url": "https://peraturan.bpk.go.id/Download/208142/UU%20Nomor%201%20Tahun%202023.pdf",
        "priority": "code"
    },
    "KUHPERDATA": {
        "name": "KUHPerdata - Kitab Undang-Undang Hukum Perdata",
        "url": "https://peraturan.bpk.go.id/Download/156696/Putusan%20MK%20Nomor%2046_PUU-VIII_2010.pdf",
        "priority": "code"
    },
    "UU_19_2016_ITE": {
        "name": "UU 19/2016 ITE (Informasi & Transaksi Elektronik)",
        "url": "https://peraturan.bpk.go.id/Download/133979/UU%20Nomor%2019%20Tahun%202016.pdf",
        "priority": "code"
    },
    "PP_71_2019_PSE": {
        "name": "PP 71/2019 PSE (Penyelenggara Sistem Elektronik)",
        "url": "https://peraturan.bpk.go.id/Download/134220/PP%20Nomor%2071%20Tahun%202019.pdf",
        "priority": "code"
    },
    
    # ⚪ SECTOR LAWS (15)
    # Banking
    "UU_7_1992_BANKING": {
        "name": "UU 7/1992 Perbankan",
        "url": "https://peraturan.bpk.go.id/Download/3840/UU%20Nomor%207%20Tahun%201992.pdf",
        "priority": "sector"
    },
    "UU_21_2011_OJK": {
        "name": "UU 21/2011 Otoritas Jasa Keuangan (OJK)",
        "url": "https://peraturan.bpk.go.id/Download/91433/UU%20Nomor%2021%20Tahun%202011.pdf",
        "priority": "sector"
    },
    "UU_4_2023_FINANCE": {
        "name": "UU 4/2023 P2SK (Pengembangan & Penguatan Sektor Keuangan)",
        "url": "https://peraturan.bpk.go.id/Download/208140/UU%20Nomor%204%20Tahun%202023.pdf",
        "priority": "sector"
    },
    
    # Construction/Infrastructure
    "UU_2_2012_LAND": {
        "name": "UU 2/2012 Pengadaan Tanah untuk Kepentingan Umum",
        "url": "https://peraturan.bpk.go.id/Download/93997/UU%20Nomor%202%20Tahun%202012.pdf",
        "priority": "sector"
    },
    "UU_38_2004_ROADS": {
        "name": "UU 38/2004 Jalan",
        "url": "https://peraturan.bpk.go.id/Download/22673/UU%20Nomor%2038%20Tahun%202004.pdf",
        "priority": "sector"
    },
    
    # Healthcare
    "UU_36_2009_HEALTH": {
        "name": "UU 36/2009 Kesehatan",
        "url": "https://peraturan.bpk.go.id/Download/54831/UU%20Nomor%2036%20Tahun%202009.pdf",
        "priority": "sector"
    },
    "UU_29_2004_MEDICAL": {
        "name": "UU 29/2004 Praktik Kedokteran",
        "url": "https://peraturan.bpk.go.id/Download/23066/UU%20Nomor%2029%20Tahun%202004.pdf",
        "priority": "sector"
    },
    "UU_36_2014_HEALTH_WORKERS": {
        "name": "UU 36/2014 Tenaga Kesehatan",
        "url": "https://peraturan.bpk.go.id/Download/123073/UU%20Nomor%2036%20Tahun%202014.pdf",
        "priority": "sector"
    },
    
    # Environment
    "UU_32_2009_ENVIRONMENT": {
        "name": "UU 32/2009 Perlindungan & Pengelolaan Lingkungan Hidup",
        "url": "https://peraturan.bpk.go.id/Download/51990/UU%20Nomor%2032%20Tahun%202009.pdf",
        "priority": "sector"
    },
    "UU_18_2013_FOREST_PREVENTION": {
        "name": "UU 18/2013 Pencegahan & Pemberantasan Perusakan Hutan",
        "url": "https://peraturan.bpk.go.id/Download/108090/UU%20Nomor%2018%20Tahun%202013.pdf",
        "priority": "sector"
    },
    
    # Maritime
    "UU_17_2008_SHIPPING": {
        "name": "UU 17/2008 Pelayaran",
        "url": "https://peraturan.bpk.go.id/Download/45839/UU%20Nomor%2017%20Tahun%202008.pdf",
        "priority": "sector"
    },
    "UU_32_2014_MARINE": {
        "name": "UU 32/2014 Kelautan",
        "url": "https://peraturan.bpk.go.id/Download/122434/UU%20Nomor%2032%20Tahun%202014.pdf",
        "priority": "sector"
    },
    
    # Education
    "UU_20_2003_EDUCATION": {
        "name": "UU 20/2003 Sistem Pendidikan Nasional",
        "url": "https://peraturan.bpk.go.id/Download/9310/UU%20Nomor%2020%20Tahun%202003.pdf",
        "priority": "sector"
    },
    "UU_12_2012_HIGHER_ED": {
        "name": "UU 12/2012 Pendidikan Tinggi",
        "url": "https://peraturan.bpk.go.id/Download/95919/UU%20Nomor%2012%20Tahun%202012.pdf",
        "priority": "sector"
    },
}

def download_law(law_id, law_info):
    """Download single law with retry logic"""
    filename = f"{law_id}.pdf"
    filepath = LAWS_DIR / filename
    
    # Skip if already exists
    if filepath.exists():
        print(f"✅ {law_id}: Already exists")
        return True
    
    print(f"⬇️  Downloading {law_id}: {law_info['name']}")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        response = requests.get(law_info['url'], headers=headers, timeout=30, stream=True)
        response.raise_for_status()
        
        # Save file
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Verify file size
        file_size = filepath.stat().st_size
        if file_size < 1024:  # Less than 1KB is suspicious
            print(f"⚠️  {law_id}: File too small ({file_size} bytes)")
            filepath.unlink()
            return False
        
        print(f"✅ {law_id}: Downloaded ({file_size:,} bytes)")
        return True
        
    except Exception as e:
        print(f"❌ {law_id}: Error - {e}")
        if filepath.exists():
            filepath.unlink()
        return False

def main():
    print("=" * 80)
    print("🇮🇩 INDONESIAN LAWS DOWNLOADER - Complete Framework")
    print("=" * 80)
    print(f"📁 Target directory: {LAWS_DIR}")
    print(f"📜 Total laws to download: {len(LAWS_TO_DOWNLOAD)}")
    print()
    
    # Group by priority
    by_priority = {}
    for law_id, info in LAWS_TO_DOWNLOAD.items():
        priority = info['priority']
        if priority not in by_priority:
            by_priority[priority] = []
        by_priority[priority].append((law_id, info))
    
    # Download by priority
    results = {'success': [], 'failed': []}
    
    for priority in ['critical', 'high', 'code', 'sector']:
        if priority not in by_priority:
            continue
            
        print(f"\n{'='*80}")
        print(f"📌 Priority: {priority.upper()} ({len(by_priority[priority])} laws)")
        print('='*80)
        
        for law_id, info in by_priority[priority]:
            success = download_law(law_id, info)
            if success:
                results['success'].append(law_id)
            else:
                results['failed'].append(law_id)
            
            # Rate limiting
            time.sleep(1)
    
    # Final report
    print("\n" + "=" * 80)
    print("📊 DOWNLOAD REPORT")
    print("=" * 80)
    print(f"✅ Successfully downloaded: {len(results['success'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    
    if results['failed']:
        print("\n⚠️  Failed downloads:")
        for law_id in results['failed']:
            print(f"   - {law_id}")
    
    print(f"\n📁 All laws saved to: {LAWS_DIR.absolute()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
