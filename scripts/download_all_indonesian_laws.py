#!/usr/bin/env python3
"""
Download ALL Indonesian Laws (35 total)
- 10 existing stubs to complete
- 16 core missing laws
- 2 codes (KUHP, KUHPerdata)
- 7 sector laws (Banking, Construction, Healthcare, etc)
"""

import requests
import time
from pathlib import Path
from datetime import datetime

# Official sources
JDIH_BASE = "https://peraturan.go.id"
JDIH_API = f"{JDIH_BASE}/api/v2"

# Complete list of 35 laws
LAWS_TO_DOWNLOAD = {
    # 🔥 CRITICAL (6) - already partially stubbed
    "UU_6_2023": {
        "title": "UU No. 6 Tahun 2023 tentang Cipta Kerja",
        "year": 2023,
        "number": 6,
        "type": "UU",
        "priority": "critical"
    },
    "UU_7_2021": {
        "title": "UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan",
        "year": 2021,
        "number": 7,
        "type": "UU",
        "priority": "critical"
    },
    "PP_55_2022": {
        "title": "PP No. 55 Tahun 2022 tentang Penyesuaian Pengaturan di Bidang Pajak Penghasilan",
        "year": 2022,
        "number": 55,
        "type": "PP",
        "priority": "critical"
    },
    "PMK_168_2023": {
        "title": "PMK No. 168 Tahun 2023 tentang PPN",
        "year": 2023,
        "number": 168,
        "type": "PMK",
        "priority": "critical"
    },
    "UU_6_2011": {
        "title": "UU No. 6 Tahun 2011 tentang Keimigrasian",
        "year": 2011,
        "number": 6,
        "type": "UU",
        "priority": "critical"
    },
    "PP_31_2013": {
        "title": "PP No. 31 Tahun 2013 tentang Peraturan Pelaksanaan UU Keimigrasian",
        "year": 2013,
        "number": 31,
        "type": "PP",
        "priority": "critical"
    },
    
    # 🟡 HIGH (10)
    "UU_40_2007": {
        "title": "UU No. 40 Tahun 2007 tentang Perseroan Terbatas (PT)",
        "year": 2007,
        "number": 40,
        "type": "UU",
        "priority": "high"
    },
    "UU_25_2007": {
        "title": "UU No. 25 Tahun 2007 tentang Penanaman Modal",
        "year": 2007,
        "number": 25,
        "type": "UU",
        "priority": "high"
    },
    "UU_5_1960": {
        "title": "UU No. 5 Tahun 1960 tentang UUPA (Agraria)",
        "year": 1960,
        "number": 5,
        "type": "UU",
        "priority": "high"
    },
    "PP_18_2021": {
        "title": "PP No. 18 Tahun 2021 tentang Hak Pengelolaan, Hak Atas Tanah",
        "year": 2021,
        "number": 18,
        "type": "PP",
        "priority": "high"
    },
    "UU_13_2003": {
        "title": "UU No. 13 Tahun 2003 tentang Ketenagakerjaan",
        "year": 2003,
        "number": 13,
        "type": "UU",
        "priority": "high"
    },
    "PP_34_2021": {
        "title": "PP No. 34 Tahun 2021 tentang Tenaga Kerja Asing",
        "year": 2021,
        "number": 34,
        "type": "PP",
        "priority": "high"
    },
    "Permenaker_8_2021": {
        "title": "Permenaker No. 8 Tahun 2021 tentang RPTKA",
        "year": 2021,
        "number": 8,
        "type": "Permenaker",
        "priority": "high"
    },
    "PP_28_2025": {
        "title": "PP No. 28 Tahun 2025 tentang PBBR",
        "year": 2025,
        "number": 28,
        "type": "PP",
        "priority": "high",
        "status": "already_processed"
    },
    "Permenkumham_10_2017": {
        "title": "Permenkumham No. 10 Tahun 2017",
        "year": 2017,
        "number": 10,
        "type": "Permenkumham",
        "priority": "high"
    },
    "Permenkumham_11_2024": {
        "title": "Permenkumham No. 11 Tahun 2024",
        "year": 2024,
        "number": 11,
        "type": "Permenkumham",
        "priority": "high"
    },
    
    # 🟢 CODES (4)
    "KUHP_2025": {
        "title": "KUHP - Kitab Undang-Undang Hukum Pidana (Baru 2025)",
        "year": 2025,
        "number": 1,
        "type": "UU",
        "priority": "code"
    },
    "KUHPerdata": {
        "title": "KUHPerdata - Kitab Undang-Undang Hukum Perdata",
        "year": 1847,
        "number": 0,
        "type": "Wetboek",
        "priority": "code"
    },
    "UU_19_2016": {
        "title": "UU No. 19 Tahun 2016 tentang ITE (Informasi dan Transaksi Elektronik)",
        "year": 2016,
        "number": 19,
        "type": "UU",
        "priority": "code"
    },
    "PP_71_2019": {
        "title": "PP No. 71 Tahun 2019 tentang PSE (Penyelenggara Sistem Elektronik)",
        "year": 2019,
        "number": 71,
        "type": "PP",
        "priority": "code"
    },
    
    # ⚪ SECTOR LAWS (14)
    # Banking (3)
    "UU_7_1992": {
        "title": "UU No. 7 Tahun 1992 tentang Perbankan (as amended)",
        "year": 1992,
        "number": 7,
        "type": "UU",
        "priority": "sector"
    },
    "UU_3_2004": {
        "title": "UU No. 3 Tahun 2004 tentang Bank Indonesia",
        "year": 2004,
        "number": 3,
        "type": "UU",
        "priority": "sector"
    },
    "UU_21_2008": {
        "title": "UU No. 21 Tahun 2008 tentang Perbankan Syariah",
        "year": 2008,
        "number": 21,
        "type": "UU",
        "priority": "sector"
    },
    
    # Construction (2)
    "UU_2_2017": {
        "title": "UU No. 2 Tahun 2017 tentang Jasa Konstruksi",
        "year": 2017,
        "number": 2,
        "type": "UU",
        "priority": "sector"
    },
    "PP_22_2020": {
        "title": "PP No. 22 Tahun 2020 tentang Peraturan Pelaksanaan UU Jasa Konstruksi",
        "year": 2020,
        "number": 22,
        "type": "PP",
        "priority": "sector"
    },
    
    # Healthcare (3)
    "UU_36_2009": {
        "title": "UU No. 36 Tahun 2009 tentang Kesehatan",
        "year": 2009,
        "number": 36,
        "type": "UU",
        "priority": "sector"
    },
    "UU_18_2012": {
        "title": "UU No. 18 Tahun 2012 tentang Pangan",
        "year": 2012,
        "number": 18,
        "type": "UU",
        "priority": "sector"
    },
    "UU_29_2004": {
        "title": "UU No. 29 Tahun 2004 tentang Praktik Kedokteran",
        "year": 2004,
        "number": 29,
        "type": "UU",
        "priority": "sector"
    },
    
    # Environment (2)
    "UU_32_2009": {
        "title": "UU No. 32 Tahun 2009 tentang Perlindungan dan Pengelolaan Lingkungan Hidup",
        "year": 2009,
        "number": 32,
        "type": "UU",
        "priority": "sector"
    },
    "PP_22_2021": {
        "title": "PP No. 22 Tahun 2021 tentang Penyelenggaraan Perlindungan dan Pengelolaan Lingkungan Hidup",
        "year": 2021,
        "number": 22,
        "type": "PP",
        "priority": "sector"
    },
    
    # Maritime (2)
    "UU_17_2008": {
        "title": "UU No. 17 Tahun 2008 tentang Pelayaran",
        "year": 2008,
        "number": 17,
        "type": "UU",
        "priority": "sector"
    },
    "UU_32_2014": {
        "title": "UU No. 32 Tahun 2014 tentang Kelautan",
        "year": 2014,
        "number": 32,
        "type": "UU",
        "priority": "sector"
    },
    
    # Education (2)
    "UU_20_2003": {
        "title": "UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional",
        "year": 2003,
        "number": 20,
        "type": "UU",
        "priority": "sector"
    },
    "UU_12_2012": {
        "title": "UU No. 12 Tahun 2012 tentang Pendidikan Tinggi",
        "year": 2012,
        "number": 12,
        "type": "UU",
        "priority": "sector"
    },
}

def download_law(law_id: str, law_info: dict, output_dir: Path) -> bool:
    """Download single law PDF from JDIH"""
    
    if law_info.get("status") == "already_processed":
        print(f"⏭️  {law_id}: Already processed")
        return True
    
    print(f"🔍 Searching: {law_info['title']}")
    
    # Build search query
    search_params = {
        "tahun": law_info["year"],
        "nomor": law_info["number"],
        "jenis": law_info["type"]
    }
    
    try:
        # Search via JDIH API
        response = requests.get(
            f"{JDIH_API}/search",
            params=search_params,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("results") and len(data["results"]) > 0:
                doc = data["results"][0]
                pdf_url = doc.get("pdf_url")
                
                if pdf_url:
                    # Download PDF
                    pdf_response = requests.get(pdf_url, timeout=60)
                    
                    if pdf_response.status_code == 200:
                        # Save PDF
                        filename = f"{law_id}.pdf"
                        filepath = output_dir / filename
                        
                        with open(filepath, 'wb') as f:
                            f.write(pdf_response.content)
                        
                        print(f"✅ Downloaded: {filename} ({len(pdf_response.content)} bytes)")
                        return True
                    else:
                        print(f"❌ PDF download failed: {pdf_response.status_code}")
                        return False
                else:
                    print(f"⚠️  No PDF URL found")
                    return False
            else:
                print(f"⚠️  No results found")
                return False
        else:
            print(f"❌ API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Rate limiting
    time.sleep(2)

def main():
    # Output directory
    output_dir = Path("/Users/antonellosiano/Desktop/INDONESIAN_LAWS_COMPLETE")
    output_dir.mkdir(exist_ok=True)
    
    print("=" * 80)
    print("🇮🇩 DOWNLOAD ALL INDONESIAN LAWS (35 total)")
    print("=" * 80)
    print(f"Output: {output_dir}")
    print()
    
    # Statistics
    stats = {
        "critical": 0,
        "high": 0,
        "code": 0,
        "sector": 0,
        "success": 0,
        "failed": 0,
        "skipped": 0
    }
    
    # Download by priority
    for priority in ["critical", "high", "code", "sector"]:
        print(f"\n{'=' * 80}")
        print(f"🎯 {priority.upper()} LAWS")
        print(f"{'=' * 80}\n")
        
        for law_id, law_info in LAWS_TO_DOWNLOAD.items():
            if law_info["priority"] == priority:
                stats[priority] += 1
                
                if law_info.get("status") == "already_processed":
                    stats["skipped"] += 1
                    print(f"⏭️  {law_id}: Already processed\n")
                    continue
                
                success = download_law(law_id, law_info, output_dir)
                
                if success:
                    stats["success"] += 1
                else:
                    stats["failed"] += 1
                
                print()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 DOWNLOAD SUMMARY")
    print("=" * 80)
    print(f"Total laws: {len(LAWS_TO_DOWNLOAD)}")
    print(f"  🔥 Critical: {stats['critical']}")
    print(f"  🟡 High: {stats['high']}")
    print(f"  🟢 Codes: {stats['code']}")
    print(f"  ⚪ Sector: {stats['sector']}")
    print()
    print(f"✅ Success: {stats['success']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"⏭️  Skipped: {stats['skipped']}")
    print("=" * 80)
    
    # Create inventory
    inventory = {
        "timestamp": datetime.now().isoformat(),
        "total_laws": len(LAWS_TO_DOWNLOAD),
        "laws": LAWS_TO_DOWNLOAD,
        "stats": stats
    }
    
    import json
    inventory_file = output_dir / "INVENTORY.json"
    with open(inventory_file, 'w') as f:
        json.dump(inventory, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Inventory saved: {inventory_file}")

if __name__ == "__main__":
    main()
