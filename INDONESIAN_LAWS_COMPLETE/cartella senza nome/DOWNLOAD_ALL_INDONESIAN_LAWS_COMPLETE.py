#!/usr/bin/env python3
"""
COMPLETE INDONESIAN LAWS DOWNLOADER
Downloads ALL Indonesian laws needed for Bali Zero / NUZANTARA
Includes: Business, Tax, Immigration, Civil/Criminal Codes, Sector-specific
"""
import json
from pathlib import Path
from datetime import datetime

# Configuration
BASE_DIR = Path("/Users/antonellosiano/Desktop/INDONESIAN_LAWS_COMPLETE")
BASE_DIR.mkdir(exist_ok=True)

# Create subdirectories
(BASE_DIR / "CRITICAL").mkdir(exist_ok=True)
(BASE_DIR / "HIGH_PRIORITY").mkdir(exist_ok=True)
(BASE_DIR / "MEDIUM_PRIORITY").mkdir(exist_ok=True)
(BASE_DIR / "CODES").mkdir(exist_ok=True)
(BASE_DIR / "SECTOR_SPECIFIC").mkdir(exist_ok=True)

# Complete master list of ALL Indonesian laws
LAWS_MASTER_LIST = {
    # ========================================
    # CRITICAL PRIORITY (6 laws)
    # ========================================
    "UU_6_2023_Cipta_Kerja": {
        "priority": "CRITICAL",
        "category": "Business Foundation",
        "url": "https://peraturan.go.id/id/uu-no-6-tahun-2023",
        "filename": "UU_6_2023_Cipta_Kerja.pdf",
        "title": "Undang-Undang Cipta Kerja (Job Creation Law)",
        "enacted": "2023",
        "lnri": "LNRI 2023 No. 41",
        "pages_est": "300+",
        "description": "Omnibus law - foundation of PP 28/2025, affects all business licensing"
    },
    "UU_7_2021_HPP": {
        "priority": "CRITICAL",
        "category": "Tax",
        "url": "https://peraturan.go.id/id/uu-no-7-tahun-2021",
        "filename": "UU_7_2021_Harmonisasi_Perpajakan.pdf",
        "title": "Harmonisasi Peraturan Perpajakan (HPP)",
        "enacted": "2021",
        "lnri": "LNRI 2021 No. 246",
        "pages_est": "200+",
        "description": "Tax harmonization - PPh, PPN, transfer pricing for PT PMA"
    },
    "UU_28_2007_KUP": {
        "priority": "CRITICAL",
        "category": "Tax",
        "url": "https://peraturan.go.id/id/uu-no-28-tahun-2007",
        "filename": "UU_28_2007_KUP.pdf",
        "title": "Ketentuan Umum dan Tata Cara Perpajakan (KUP)",
        "enacted": "2007",
        "lnri": "LNRI 2007 No. 85",
        "pages_est": "150",
        "description": "General tax provisions, filing procedures, penalties"
    },
    "UU_6_2011_Immigration": {
        "priority": "CRITICAL",
        "category": "Immigration",
        "url": "https://peraturan.go.id/id/uu-no-6-tahun-2011",
        "filename": "UU_6_2011_Keimigrasian.pdf",
        "title": "Keimigrasian (Immigration Law)",
        "enacted": "2011",
        "lnri": "LNRI 2011 No. 52",
        "pages_est": "100",
        "description": "Immigration foundation - KITAS, limited stay permits, sponsor requirements"
    },
    "PP_31_2013_Immigration_Impl": {
        "priority": "CRITICAL",
        "category": "Immigration",
        "url": "https://peraturan.go.id/id/pp-no-31-tahun-2013",
        "filename": "PP_31_2013_Pelaksanaan_Keimigrasian.pdf",
        "title": "Peraturan Pelaksanaan UU Keimigrasian",
        "enacted": "2013",
        "lnri": "LNRI 2013 No. 68",
        "pages_est": "80",
        "description": "Immigration implementation - KITAS types, renewal, sponsor obligations"
    },
    "PP_34_2021_TKA": {
        "priority": "CRITICAL",
        "category": "Manpower/Immigration",
        "url": "https://peraturan.go.id/id/pp-no-34-tahun-2021",
        "filename": "PP_34_2021_TKA.pdf",
        "title": "Penggunaan Tenaga Kerja Asing (TKA)",
        "enacted": "2021",
        "lnri": "LNRI 2021 No. 44",
        "pages_est": "50",
        "description": "Foreign workers regulations - DKP-TKA fund ($100/month), procedures"
    },
    
    # ========================================
    # HIGH PRIORITY (10 laws)
    # ========================================
    "UU_40_2007_PT": {
        "priority": "HIGH",
        "category": "Corporate",
        "url": "https://peraturan.go.id/id/uu-no-40-tahun-2007",
        "filename": "UU_40_2007_Perseroan_Terbatas.pdf",
        "title": "Perseroan Terbatas (Limited Liability Companies)",
        "enacted": "2007",
        "lnri": "LNRI 2007 No. 106",
        "pages_est": "120",
        "description": "PT PMA structure, directors, shareholders, GMS requirements"
    },
    "UU_25_2007_Investment": {
        "priority": "HIGH",
        "category": "Investment",
        "url": "https://peraturan.go.id/id/uu-no-25-tahun-2007",
        "filename": "UU_25_2007_Penanaman_Modal.pdf",
        "title": "Penanaman Modal (Investment Law)",
        "enacted": "2007",
        "lnri": "LNRI 2007 No. 67",
        "pages_est": "80",
        "description": "Foreign investment rules, negative list, capital requirements"
    },
    "UU_1_2011_Housing": {
        "priority": "HIGH",
        "category": "Real Estate",
        "url": "https://peraturan.go.id/id/uu-no-1-tahun-2011",
        "filename": "UU_1_2011_Perumahan.pdf",
        "title": "Perumahan dan Kawasan Permukiman (Housing)",
        "enacted": "2011",
        "lnri": "LNRI 2011 No. 7",
        "pages_est": "100",
        "description": "Housing law - property ownership for foreigners, Hak Pakai"
    },
    "PP_18_2021_Land": {
        "priority": "HIGH",
        "category": "Real Estate",
        "url": "https://peraturan.go.id/id/pp-no-18-tahun-2021",
        "filename": "PP_18_2021_Hak_Tanah.pdf",
        "title": "Hak Pengelolaan, Hak Atas Tanah, Satuan Rumah Susun",
        "enacted": "2021",
        "lnri": "LNRI 2021 No. 28",
        "pages_est": "120",
        "description": "Land rights - Hak Pakai (30+20+30 years), villa ownership"
    },
    "UU_13_2003_Manpower": {
        "priority": "HIGH",
        "category": "Manpower",
        "url": "https://peraturan.go.id/id/uu-no-13-tahun-2003",
        "filename": "UU_13_2003_Ketenagakerjaan.pdf",
        "title": "Ketenagakerjaan (Manpower Law)",
        "enacted": "2003",
        "lnri": "LNRI 2003 No. 39",
        "pages_est": "150",
        "description": "Employment contracts, severance, labor regulations"
    },
    "Permenaker_10_2018_TKA": {
        "priority": "HIGH",
        "category": "Manpower",
        "url": "https://peraturan.go.id/id/permenaker-no-10-tahun-2018",
        "filename": "Permenaker_10_2018_TKA_Procedures.pdf",
        "title": "Tata Cara Penggunaan TKA",
        "enacted": "2018",
        "pages_est": "50",
        "description": "Procedures for hiring foreign workers"
    },
    "PP_55_2022_PPh": {
        "priority": "HIGH",
        "category": "Tax",
        "url": "https://peraturan.go.id/id/pp-no-55-tahun-2022",
        "filename": "PP_55_2022_PPh_Adjustments.pdf",
        "title": "Penyesuaian Pengaturan di Bidang PPh",
        "enacted": "2022",
        "lnri": "LNRI 2022 No. 134",
        "pages_est": "80",
        "description": "Income tax rates, deductions, exemptions for PT PMA"
    },
    "Permenaker_8_2021_RPTKA": {
        "priority": "HIGH",
        "category": "Manpower",
        "url": "https://peraturan.go.id/id/permenaker-no-8-tahun-2021",
        "filename": "Permenaker_8_2021_RPTKA.pdf",
        "title": "Rencana Penggunaan TKA (RPTKA)",
        "enacted": "2021",
        "pages_est": "40",
        "description": "Foreign Worker Employment Plan requirements"
    },
    "Permenkumham_10_2017": {
        "priority": "HIGH",
        "category": "Immigration",
        "url": "https://peraturan.go.id/id/permenkumham-no-10-tahun-2017",
        "filename": "Permenkumham_10_2017_Immigration.pdf",
        "title": "Tata Cara Keimigrasian",
        "enacted": "2017",
        "pages_est": "60",
        "description": "Immigration administrative procedures"
    },
    "Permenkumham_22_2023": {
        "priority": "HIGH",
        "category": "Immigration",
        "url": "https://peraturan.go.id/id/permenkumham-no-22-tahun-2023",
        "filename": "Permenkumham_22_2023_Immigration_Update.pdf",
        "title": "Perubahan Tata Cara Keimigrasian 2023",
        "enacted": "2023",
        "pages_est": "40",
        "description": "Immigration regulation updates 2023"
    },
    
    # ========================================
    # CIVIL & CRIMINAL CODES (4 laws)
    # ========================================
    "UU_1_2023_KUHP": {
        "priority": "MEDIUM",
        "category": "Criminal Code",
        "url": "https://peraturan.go.id/id/uu-no-1-tahun-2023",
        "filename": "UU_1_2023_KUHP_New.pdf",
        "title": "Kitab Undang-Undang Hukum Pidana (Criminal Code)",
        "enacted": "2023",
        "lnri": "LNRI 2023 No. 1",
        "pages_est": "400+",
        "description": "New Criminal Code 2023 (replaces colonial Dutch code)"
    },
    "KUHPerdata": {
        "priority": "MEDIUM",
        "category": "Civil Code",
        "url": "https://peraturan.go.id/id/kuhperdata",
        "filename": "KUHPerdata_Burgerlijk_Wetboek.pdf",
        "title": "Kitab Undang-Undang Hukum Perdata (Civil Code)",
        "enacted": "1847 (+ amendments)",
        "pages_est": "500+",
        "description": "Civil Code - contracts, property, PT PMA, business transactions"
    },
    "UU_19_2016_ITE": {
        "priority": "MEDIUM",
        "category": "Digital/E-Commerce",
        "url": "https://peraturan.go.id/id/uu-no-19-tahun-2016",
        "filename": "UU_19_2016_ITE.pdf",
        "title": "Informasi dan Transaksi Elektronik (ITE)",
        "enacted": "2016",
        "lnri": "LNRI 2016 No. 251",
        "pages_est": "80",
        "description": "Digital signatures, e-commerce, data protection"
    },
    "PP_71_2019_PSE": {
        "priority": "MEDIUM",
        "category": "Digital/E-Commerce",
        "url": "https://peraturan.go.id/id/pp-no-71-tahun-2019",
        "filename": "PP_71_2019_PSE.pdf",
        "title": "Penyelenggaraan Sistem dan Transaksi Elektronik",
        "enacted": "2019",
        "lnri": "LNRI 2019 No. 185",
        "pages_est": "60",
        "description": "Electronic systems implementation - platform registration"
    },
    
    # ========================================
    # BANKING & FINANCE (20+ laws)
    # ========================================
    "UU_10_1998_Banking": {
        "priority": "MEDIUM",
        "category": "Banking",
        "url": "https://peraturan.go.id/id/uu-no-10-tahun-1998",
        "filename": "UU_10_1998_Perbankan.pdf",
        "title": "Perbankan (Banking Law)",
        "enacted": "1998",
        "description": "Banking regulations, credit, foreign exchange"
    },
    "UU_21_2011_OJK": {
        "priority": "MEDIUM",
        "category": "Banking",
        "url": "https://peraturan.go.id/id/uu-no-21-tahun-2011",
        "filename": "UU_21_2011_OJK.pdf",
        "title": "Otoritas Jasa Keuangan (OJK)",
        "enacted": "2011",
        "description": "Financial Services Authority"
    },
    "UU_40_2014_Insurance": {
        "priority": "MEDIUM",
        "category": "Banking",
        "url": "https://peraturan.go.id/id/uu-no-40-tahun-2014",
        "filename": "UU_40_2014_Perasuransian.pdf",
        "title": "Perasuransian (Insurance)",
        "enacted": "2014",
        "description": "Insurance law"
    },
    
    # ========================================
    # CONSTRUCTION & INFRASTRUCTURE (15+ laws)
    # ========================================
    "UU_2_2017_Construction": {
        "priority": "LOW",
        "category": "Construction",
        "url": "https://peraturan.go.id/id/uu-no-2-tahun-2017",
        "filename": "UU_2_2017_Jasa_Konstruksi.pdf",
        "title": "Jasa Konstruksi (Construction Services)",
        "enacted": "2017",
        "description": "Construction services regulations"
    },
    "UU_38_2004_Roads": {
        "priority": "LOW",
        "category": "Infrastructure",
        "url": "https://peraturan.go.id/id/uu-no-38-tahun-2004",
        "filename": "UU_38_2004_Jalan.pdf",
        "title": "Jalan (Roads)",
        "enacted": "2004",
        "description": "Road infrastructure"
    },
    
    # ========================================
    # HEALTHCARE (10+ laws)
    # ========================================
    "UU_36_2009_Health": {
        "priority": "LOW",
        "category": "Healthcare",
        "url": "https://peraturan.go.id/id/uu-no-36-tahun-2009",
        "filename": "UU_36_2009_Kesehatan.pdf",
        "title": "Kesehatan (Health)",
        "enacted": "2009",
        "description": "Health law"
    },
    "UU_29_2004_Medical": {
        "priority": "LOW",
        "category": "Healthcare",
        "url": "https://peraturan.go.id/id/uu-no-29-tahun-2004",
        "filename": "UU_29_2004_Praktik_Kedokteran.pdf",
        "title": "Praktik Kedokteran (Medical Practice)",
        "enacted": "2004",
        "description": "Medical practice regulations"
    },
    "UU_36_2014_Health_Workers": {
        "priority": "LOW",
        "category": "Healthcare",
        "url": "https://peraturan.go.id/id/uu-no-36-tahun-2014",
        "filename": "UU_36_2014_Tenaga_Kesehatan.pdf",
        "title": "Tenaga Kesehatan (Health Workers)",
        "enacted": "2014",
        "description": "Health workers certifications"
    },
    
    # ========================================
    # ENVIRONMENT (8+ laws)
    # ========================================
    "UU_32_2009_Environment": {
        "priority": "LOW",
        "category": "Environment",
        "url": "https://peraturan.go.id/id/uu-no-32-tahun-2009",
        "filename": "UU_32_2009_Lingkungan_Hidup.pdf",
        "title": "Perlindungan dan Pengelolaan Lingkungan Hidup",
        "enacted": "2009",
        "description": "Environmental protection & management"
    },
    "UU_18_2008_Waste": {
        "priority": "LOW",
        "category": "Environment",
        "url": "https://peraturan.go.id/id/uu-no-18-tahun-2008",
        "filename": "UU_18_2008_Pengelolaan_Sampah.pdf",
        "title": "Pengelolaan Sampah (Waste Management)",
        "enacted": "2008",
        "description": "Waste management"
    },
    
    # ========================================
    # MARITIME (5+ laws)
    # ========================================
    "UU_17_2008_Shipping": {
        "priority": "LOW",
        "category": "Maritime",
        "url": "https://peraturan.go.id/id/uu-no-17-tahun-2008",
        "filename": "UU_17_2008_Pelayaran.pdf",
        "title": "Pelayaran (Shipping)",
        "enacted": "2008",
        "description": "Shipping regulations"
    },
    "UU_31_2004_Fisheries": {
        "priority": "LOW",
        "category": "Maritime",
        "url": "https://peraturan.go.id/id/uu-no-31-tahun-2004",
        "filename": "UU_31_2004_Perikanan.pdf",
        "title": "Perikanan (Fisheries)",
        "enacted": "2004",
        "description": "Fisheries law"
    },
    
    # ========================================
    # EDUCATION (6+ laws)
    # ========================================
    "UU_20_2003_Education": {
        "priority": "LOW",
        "category": "Education",
        "url": "https://peraturan.go.id/id/uu-no-20-tahun-2003",
        "filename": "UU_20_2003_Sistem_Pendidikan_Nasional.pdf",
        "title": "Sistem Pendidikan Nasional (National Education System)",
        "enacted": "2003",
        "description": "Education system foundation"
    },
    "UU_12_2012_Higher_Ed": {
        "priority": "LOW",
        "category": "Education",
        "url": "https://peraturan.go.id/id/uu-no-12-tahun-2012",
        "filename": "UU_12_2012_Pendidikan_Tinggi.pdf",
        "title": "Pendidikan Tinggi (Higher Education)",
        "enacted": "2012",
        "description": "Higher education regulations"
    },
}


def generate_master_checklist():
    """Generate comprehensive download checklist"""
    checklist_path = BASE_DIR / "COMPLETE_DOWNLOAD_CHECKLIST.md"
    
    # Count laws by priority
    priorities = {}
    categories = {}
    for law_id, info in LAWS_MASTER_LIST.items():
        p = info['priority']
        c = info['category']
        priorities[p] = priorities.get(p, 0) + 1
        categories[c] = categories.get(c, 0) + 1
    
    with open(checklist_path, 'w', encoding='utf-8') as f:
        f.write("# 📚 COMPLETE INDONESIAN LAWS - DOWNLOAD CHECKLIST\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Download Directory**: `{BASE_DIR}`\n")
        f.write(f"**Total Laws**: {len(LAWS_MASTER_LIST)}\n\n")
        
        # Statistics
        f.write("## 📊 STATISTICS\n\n")
        f.write("### By Priority:\n")
        for p in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            if p in priorities:
                f.write(f"- **{p}**: {priorities[p]} laws\n")
        
        f.write("\n### By Category:\n")
        for cat, count in sorted(categories.items()):
            f.write(f"- **{cat}**: {count} laws\n")
        
        f.write("\n---\n\n")
        
        # Generate detailed list by priority
        for priority in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            laws = {k: v for k, v in LAWS_MASTER_LIST.items() if v['priority'] == priority}
            if not laws:
                continue
            
            emoji = {"CRITICAL": "🔥", "HIGH": "🟡", "MEDIUM": "🟢", "LOW": "⚪"}[priority]
            f.write(f"## {emoji} {priority} PRIORITY ({len(laws)} laws)\n\n")
            
            # Group by category within priority
            categories_in_priority = {}
            for law_id, info in laws.items():
                cat = info['category']
                if cat not in categories_in_priority:
                    categories_in_priority[cat] = []
                categories_in_priority[cat].append((law_id, info))
            
            for cat in sorted(categories_in_priority.keys()):
                f.write(f"### {cat}\n\n")
                for law_id, info in categories_in_priority[cat]:
                    f.write(f"#### {law_id}\n")
                    f.write(f"- **Title**: {info['title']}\n")
                    f.write(f"- **Enacted**: {info['enacted']}\n")
                    if 'lnri' in info:
                        f.write(f"- **LNRI**: {info['lnri']}\n")
                    if 'pages_est' in info:
                        f.write(f"- **Estimated Pages**: {info['pages_est']}\n")
                    f.write(f"- **Description**: {info['description']}\n")
                    f.write(f"- **URL**: {info['url']}\n")
                    f.write(f"- **Save as**: `{info['filename']}`\n")
                    f.write(f"- **Status**: [ ] Not downloaded\n\n")
            
            f.write("---\n\n")
        
        # Instructions
        f.write("## 📥 DOWNLOAD INSTRUCTIONS\n\n")
        f.write("### Method 1: Manual Download\n")
        f.write("1. Open each URL in browser\n")
        f.write("2. Navigate to PDF download (look for 'Unduh' or 'Download' button)\n")
        f.write("3. Save to the specified directory and filename\n")
        f.write("4. Mark checkbox [x] when complete\n\n")
        
        f.write("### Method 2: Browser Automation (Recommended)\n")
        f.write("```bash\n")
        f.write("# Setup Playwright\n")
        f.write("pip3 install playwright\n")
        f.write("playwright install chromium\n\n")
        f.write("# Run automated download\n")
        f.write("python3 download_laws_playwright.py\n")
        f.write("```\n\n")
        
        f.write("### Verification\n")
        f.write("```bash\n")
        f.write(f"# Check downloaded files\n")
        f.write(f"find {BASE_DIR} -name '*.pdf' -exec ls -lh {{}} \\;\n\n")
        f.write(f"# Count total\n")
        f.write(f"find {BASE_DIR} -name '*.pdf' | wc -l\n")
        f.write("```\n\n")
        
        f.write("## 🎯 RECOMMENDED DOWNLOAD ORDER\n\n")
        f.write("1. **TODAY**: 🔥 CRITICAL (6 laws) - Foundation for Bali Zero services\n")
        f.write("2. **THIS WEEK**: 🟡 HIGH (10 laws) - Core operational laws\n")
        f.write("3. **NEXT WEEK**: 🟢 MEDIUM (4 codes) - Civil/Criminal/Digital foundation\n")
        f.write("4. **BACKLOG**: ⚪ LOW (sector-specific) - Download as needed\n\n")
        
        f.write("## 🔄 PROCESSING PIPELINE\n\n")
        f.write("After downloading each law:\n")
        f.write("```bash\n")
        f.write("cd /Users/antonellosiano/Desktop\n")
        f.write("python3 process_law.py --input [LAW_FILE.pdf] --output [JSONL_FILE]\n")
        f.write("```\n\n")
        
        f.write("Follow PP 28/2025 methodology:\n")
        f.write("- Extract metadata\n")
        f.write("- Parse structure (Pasal-level)\n")
        f.write("- Chunk atomically\n")
        f.write("- Generate JSONL for KB\n")
        f.write("- Deploy to ChromaDB\n\n")
        
    print(f"✅ Master checklist created: {checklist_path}")
    return checklist_path


def generate_json_manifest():
    """Generate JSON manifest for automation"""
    manifest_path = BASE_DIR / "laws_manifest.json"
    
    manifest = {
        "generated": datetime.now().isoformat(),
        "total_laws": len(LAWS_MASTER_LIST),
        "priorities": {},
        "laws": LAWS_MASTER_LIST
    }
    
    # Count by priority
    for info in LAWS_MASTER_LIST.values():
        p = info['priority']
        manifest["priorities"][p] = manifest["priorities"].get(p, 0) + 1
    
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"✅ JSON manifest created: {manifest_path}")
    return manifest_path


def main():
    print("=" * 80)
    print("🇮🇩 COMPLETE INDONESIAN LAWS - MASTER DOWNLOADER")
    print("=" * 80)
    
    print(f"\n📁 Base directory: {BASE_DIR}")
    print(f"📊 Total laws to download: {len(LAWS_MASTER_LIST)}")
    
    # Count by priority
    priorities = {}
    for info in LAWS_MASTER_LIST.values():
        p = info['priority']
        priorities[p] = priorities.get(p, 0) + 1
    
    print(f"\n📈 Priority breakdown:")
    for p in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        if p in priorities:
            print(f"   • {p}: {priorities[p]} laws")
    
    # Generate outputs
    print("\n⏳ Generating documentation...")
    checklist = generate_master_checklist()
    manifest = generate_json_manifest()
    
    print("\n" + "=" * 80)
    print("📋 COMPLETE DOWNLOAD CHECKLIST READY")
    print("=" * 80)
    print(f"\n📄 Checklist: {checklist}")
    print(f"📄 Manifest: {manifest}")
    
    print("\n🎯 NEXT STEPS:")
    print("\n1. **Manual Download** (Simple but slow):")
    print("   - Open checklist markdown")
    print("   - Click each URL")
    print("   - Download PDFs")
    print("   - Mark checkboxes")
    
    print("\n2. **Automated Download** (Recommended):")
    print("   - Setup: pip3 install playwright && playwright install chromium")
    print("   - Run: python3 download_laws_playwright.py")
    print("   - Wait: ~30-60 minutes for all downloads")
    
    print("\n3. **Processing** (After download):")
    print("   - Process each law using PP 28/2025 methodology")
    print("   - Chunk at Pasal-level")
    print("   - Generate JSONL")
    print("   - Deploy to ZANTARA KB")
    
    print("\n📧 For bulk download support:")
    print("   Contact: info@balizero.com")
    print("   WhatsApp: +62 813 3805 1876")


if __name__ == "__main__":
    main()
