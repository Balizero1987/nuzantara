#!/usr/bin/env python3
"""
INDONESIAN LAWS - AUTOMATED DOWNLOADER
Downloads all critical Indonesian laws from official government sources
"""
import requests
import time
from pathlib import Path
from urllib.parse import urljoin

# Configuration
DOWNLOAD_DIR = Path("/Users/antonellosiano/Desktop/INDONESIAN_LAWS_DOWNLOADS")
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Official sources and URLs
LAWS_TO_DOWNLOAD = {
    "UU_6_2023_Cipta_Kerja": {
        "priority": "CRITICAL",
        "url": "https://peraturan.go.id/id/uu-no-6-tahun-2023",
        "filename": "UU_6_2023_Cipta_Kerja.pdf",
        "description": "Job Creation Law (Omnibus Law)"
    },
    "UU_7_2021_HPP_Tax": {
        "priority": "CRITICAL",
        "url": "https://peraturan.go.id/id/uu-no-7-tahun-2021",
        "filename": "UU_7_2021_Harmonisasi_Perpajakan.pdf",
        "description": "Tax Harmonization Law"
    },
    "UU_28_2007_KUP_Tax": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/uu-no-28-tahun-2007",
        "filename": "UU_28_2007_KUP.pdf",
        "description": "General Provisions and Tax Procedures"
    },
    "PP_55_2022_PPh_Tax": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/pp-no-55-tahun-2022",
        "filename": "PP_55_2022_PPh_Adjustments.pdf",
        "description": "Income Tax Adjustments"
    },
    "UU_6_2011_Immigration": {
        "priority": "CRITICAL",
        "url": "https://peraturan.go.id/id/uu-no-6-tahun-2011",
        "filename": "UU_6_2011_Keimigrasian.pdf",
        "description": "Immigration Law"
    },
    "PP_31_2013_Immigration_Impl": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/pp-no-31-tahun-2013",
        "filename": "PP_31_2013_Peraturan_Pelaksanaan_Keimigrasian.pdf",
        "description": "Immigration Law Implementation"
    },
    "UU_40_2007_PT": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/uu-no-40-tahun-2007",
        "filename": "UU_40_2007_Perseroan_Terbatas.pdf",
        "description": "Limited Liability Companies Law"
    },
    "UU_25_2007_Investment": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/uu-no-25-tahun-2007",
        "filename": "UU_25_2007_Penanaman_Modal.pdf",
        "description": "Investment Law"
    },
    "UU_1_2011_Housing": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/uu-no-1-tahun-2011",
        "filename": "UU_1_2011_Perumahan.pdf",
        "description": "Housing and Settlement Areas Law"
    },
    "PP_18_2021_Land_Rights": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/pp-no-18-tahun-2021",
        "filename": "PP_18_2021_Hak_Tanah.pdf",
        "description": "Land Rights (Hak Pakai, Hak Guna Bangunan)"
    },
    "UU_13_2003_Manpower": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/uu-no-13-tahun-2003",
        "filename": "UU_13_2003_Ketenagakerjaan.pdf",
        "description": "Manpower Law"
    },
    "Permenaker_10_2018_TKA": {
        "priority": "HIGH",
        "url": "https://peraturan.go.id/id/permenaker-no-10-tahun-2018",
        "filename": "Permenaker_10_2018_TKA.pdf",
        "description": "Foreign Workers Procedures"
    },
    "UU_1_2023_KUHP": {
        "priority": "MEDIUM",
        "url": "https://peraturan.go.id/id/uu-no-1-tahun-2023",
        "filename": "UU_1_2023_KUHP.pdf",
        "description": "Criminal Code (New 2023)"
    },
    "KUHPerdata": {
        "priority": "MEDIUM",
        "url": "https://peraturan.go.id/id/kuhperdata",
        "filename": "KUHPerdata_Burgerlijk_Wetboek.pdf",
        "description": "Civil Code"
    },
    "UU_19_2016_ITE": {
        "priority": "MEDIUM",
        "url": "https://peraturan.go.id/id/uu-no-19-tahun-2016",
        "filename": "UU_19_2016_ITE.pdf",
        "description": "Electronic Information and Transactions (ITE)"
    },
    "PP_71_2019_PSE": {
        "priority": "MEDIUM",
        "url": "https://peraturan.go.id/id/pp-no-71-tahun-2019",
        "filename": "PP_71_2019_PSE.pdf",
        "description": "Electronic Systems and Transactions Implementation"
    }
}

def download_law(law_id, info):
    """Download a single law PDF"""
    print(f"\n{'='*80}")
    print(f"📥 Downloading: {law_id}")
    print(f"   Priority: {info['priority']}")
    print(f"   Description: {info['description']}")
    print(f"   URL: {info['url']}")
    
    output_path = DOWNLOAD_DIR / info['filename']
    
    # Check if already exists
    if output_path.exists():
        print(f"   ⏭️  Already exists: {output_path}")
        return True
    
    try:
        # Note: This is a TEMPLATE - actual implementation would need:
        # 1. Navigate peraturan.go.id interface
        # 2. Find PDF download link (often in <a> with "Unduh" or "Download")
        # 3. Handle authentication if needed
        # 4. Parse HTML to extract actual PDF URL
        
        print(f"   ⚠️  MANUAL DOWNLOAD REQUIRED")
        print(f"   → Open: {info['url']}")
        print(f"   → Download PDF to: {output_path}")
        print(f"   → Or use browser automation (Selenium/Playwright)")
        
        return False
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def generate_download_checklist():
    """Generate a checklist for manual downloads"""
    checklist_path = DOWNLOAD_DIR / "DOWNLOAD_CHECKLIST.md"
    
    with open(checklist_path, 'w', encoding='utf-8') as f:
        f.write("# 📋 INDONESIAN LAWS - DOWNLOAD CHECKLIST\n\n")
        f.write(f"**Generated**: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Download Directory**: `{DOWNLOAD_DIR}`\n\n")
        f.write("---\n\n")
        
        # Group by priority
        for priority in ["CRITICAL", "HIGH", "MEDIUM"]:
            laws = {k: v for k, v in LAWS_TO_DOWNLOAD.items() if v['priority'] == priority}
            if not laws:
                continue
                
            f.write(f"## 🔥 {priority} PRIORITY ({len(laws)} laws)\n\n")
            
            for law_id, info in laws.items():
                f.write(f"### {law_id}\n")
                f.write(f"- **Description**: {info['description']}\n")
                f.write(f"- **URL**: {info['url']}\n")
                f.write(f"- **Save as**: `{info['filename']}`\n")
                f.write(f"- **Status**: [ ] Not downloaded\n\n")
        
        f.write("---\n\n")
        f.write("## 📥 DOWNLOAD INSTRUCTIONS\n\n")
        f.write("### Manual Method:\n")
        f.write("1. Open each URL in browser\n")
        f.write("2. Navigate to PDF download link (look for 'Unduh' or 'Download')\n")
        f.write("3. Save to the specified filename\n\n")
        f.write("### Automated Method (Advanced):\n")
        f.write("```bash\n")
        f.write("# Use browser automation (requires setup)\n")
        f.write("python3 download_laws_selenium.py\n")
        f.write("```\n\n")
        f.write("### Verification:\n")
        f.write("```bash\n")
        f.write(f"ls -lh {DOWNLOAD_DIR}/*.pdf\n")
        f.write("```\n\n")
    
    print(f"\n✅ Checklist created: {checklist_path}")
    return checklist_path

def main():
    print("=" * 80)
    print("🇮🇩 INDONESIAN LAWS - AUTOMATED DOWNLOADER")
    print("=" * 80)
    
    print(f"\n📁 Download directory: {DOWNLOAD_DIR}")
    print(f"📊 Total laws to download: {len(LAWS_TO_DOWNLOAD)}")
    
    # Count by priority
    priorities = {}
    for info in LAWS_TO_DOWNLOAD.values():
        p = info['priority']
        priorities[p] = priorities.get(p, 0) + 1
    
    print(f"\n📈 Priority breakdown:")
    for p, count in sorted(priorities.items()):
        print(f"   • {p}: {count} laws")
    
    # Generate checklist
    print("\n⏳ Generating download checklist...")
    checklist = generate_download_checklist()
    
    print("\n" + "=" * 80)
    print("⚠️  MANUAL DOWNLOAD REQUIRED")
    print("=" * 80)
    print("\nThe official Indonesian law database (peraturan.go.id) requires:")
    print("  1. Browser navigation")
    print("  2. Clicking through to find PDF links")
    print("  3. Possible CAPTCHA solving")
    print("\n📋 See the checklist for URLs and instructions:")
    print(f"   → {checklist}")
    print("\n💡 TIP: Use browser automation (Selenium/Playwright) for bulk downloads")
    print("\n🎯 PRIORITY:")
    print("   1. Download CRITICAL laws first (6 laws)")
    print("   2. Process and chunk them like PP 28/2025")
    print("   3. Deploy to ZANTARA KB")

if __name__ == "__main__":
    main()
