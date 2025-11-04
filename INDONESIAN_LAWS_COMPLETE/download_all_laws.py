#!/usr/bin/env python3
import requests
import time
from pathlib import Path

# Lista COMPLETA 35 leggi
laws = [
    # Critical (6)
    {"name": "UU_6_2023_Cipta_Kerja", "url": "https://peraturan.bpk.go.id/Download/272970/UU%20Nomor%206%20Tahun%202023.pdf"},
    {"name": "UU_7_2021_HPP_Tax", "url": "https://jdih.kemenkeu.go.id/download/24b1c6c0-56a6-11ec-b1a6-d1e6df3e8d80/UU%20Nomor%207%20Tahun%202021.pdf"},
    {"name": "PP_55_2022_PPh_Tax", "url": "https://jdih.kemenkeu.go.id/download/f2927c50-fd9f-11ec-b1a6-d1e6df3e8d80/PP%20Nomor%2055%20Tahun%202022.pdf"},
    {"name": "PP_44_2022_PPN_Tax", "url": "https://jdih.kemenkeu.go.id/download/7c1e3a70-ed0f-11ec-b1a6-d1e6df3e8d80/PP%20Nomor%2044%20Tahun%202022.pdf"},
    {"name": "UU_6_2011_Immigration", "url": "https://peraturan.bpk.go.id/Download/39393/UU%20Nomor%206%20Tahun%202011.pdf"},
    {"name": "PP_31_2013_Immigration_Detail", "url": "https://peraturan.bpk.go.id/Download/67933/PP%20Nomor%2031%20Tahun%202013.pdf"},
    
    # High Priority (10)
    {"name": "UU_40_2007_PT_PMA", "url": "https://peraturan.bpk.go.id/Download/27827/UU%20Nomor%2040%20Tahun%202007.pdf"},
    {"name": "UU_25_2007_Investment", "url": "https://peraturan.bpk.go.id/Download/27819/UU%20Nomor%2025%20Tahun%202007.pdf"},
    {"name": "PP_28_2025_PBBR_LICENSED", "url": "ALREADY_DOWNLOADED"},
    {"name": "UU_5_1960_Real_Estate", "url": "https://peraturan.bpk.go.id/Download/7084/UU%20Nomor%205%20Tahun%201960.pdf"},
    {"name": "UU_13_2003_Manpower", "url": "https://peraturan.bpk.go.id/Download/20210/UU%20Nomor%2013%20Tahun%202003.pdf"},
    {"name": "PP_35_2021_PKWT", "url": "https://peraturan.bpk.go.id/Download/206527/PP%20Nomor%2035%20Tahun%202021.pdf"},
    {"name": "UU_11_2020_Omnibus_Law", "url": "https://peraturan.bpk.go.id/Download/158830/UU%20Nomor%2011%20Tahun%202020.pdf"},
    {"name": "UU_1_2022_Relations_Central_Regional", "url": "https://peraturan.bpk.go.id/Download/247854/UU%20Nomor%201%20Tahun%202022.pdf"},
    {"name": "PP_5_2021_OSS", "url": "https://peraturan.bpk.go.id/Download/196894/PP%20Nomor%205%20Tahun%202021.pdf"},
    {"name": "UU_20_2016_TKA", "url": "https://peraturan.bpk.go.id/Download/109879/UU%20Nomor%2020%20Tahun%202016.pdf"},
    
    # Codes (4)
    {"name": "KUHP_2025_New_Penal_Code", "url": "https://peraturan.bpk.go.id/Download/264351/UU%20Nomor%201%20Tahun%202023.pdf"},
    {"name": "KUHPerdata_Civil_Code", "url": "https://peraturan.bpk.go.id/Download/73/Kitab%20Undang-Undang%20Hukum%20Perdata.pdf"},
    {"name": "UU_19_2016_ITE", "url": "https://peraturan.bpk.go.id/Download/109877/UU%20Nomor%2019%20Tahun%202016.pdf"},
    {"name": "PP_71_2019_PSE", "url": "https://peraturan.bpk.go.id/Download/145960/PP%20Nomor%2071%20Tahun%202019.pdf"},
    
    # Sector Laws (14)
    # Banking
    {"name": "UU_7_1992_Banking", "url": "https://peraturan.bpk.go.id/Download/10990/UU%20Nomor%207%20Tahun%201992.pdf"},
    {"name": "UU_21_2008_Sharia_Banking", "url": "https://peraturan.bpk.go.id/Download/31033/UU%20Nomor%2021%20Tahun%202008.pdf"},
    {"name": "UU_4_2023_Financial_Sector_Dev", "url": "https://peraturan.bpk.go.id/Download/264349/UU%20Nomor%204%20Tahun%202023.pdf"},
    
    # Construction
    {"name": "UU_2_2017_Construction", "url": "https://peraturan.bpk.go.id/Download/117666/UU%20Nomor%202%20Tahun%202017.pdf"},
    {"name": "PP_14_2021_Housing", "url": "https://peraturan.bpk.go.id/Download/200378/PP%20Nomor%2014%20Tahun%202021.pdf"},
    
    # Healthcare
    {"name": "UU_36_2009_Health", "url": "https://peraturan.bpk.go.id/Download/36913/UU%20Nomor%2036%20Tahun%202009.pdf"},
    {"name": "UU_29_2004_Medical_Practice", "url": "https://peraturan.bpk.go.id/Download/25686/UU%20Nomor%2029%20Tahun%202004.pdf"},
    {"name": "UU_24_2011_BPJS", "url": "https://peraturan.bpk.go.id/Download/39398/UU%20Nomor%2024%20Tahun%202011.pdf"},
    
    # Environment
    {"name": "UU_32_2009_Environment", "url": "https://peraturan.bpk.go.id/Download/36909/UU%20Nomor%2032%20Tahun%202009.pdf"},
    {"name": "PP_22_2021_Environment_Protection", "url": "https://peraturan.bpk.go.id/Download/202002/PP%20Nomor%2022%20Tahun%202021.pdf"},
    
    # Maritime
    {"name": "UU_17_2008_Shipping", "url": "https://peraturan.bpk.go.id/Download/31029/UU%20Nomor%2017%20Tahun%202008.pdf"},
    {"name": "UU_31_2004_Fisheries", "url": "https://peraturan.bpk.go.id/Download/25687/UU%20Nomor%2031%20Tahun%202004.pdf"},
    
    # Education
    {"name": "UU_20_2003_Education_System", "url": "https://peraturan.bpk.go.id/Download/20214/UU%20Nomor%2020%20Tahun%202003.pdf"},
    {"name": "UU_12_2012_Higher_Education", "url": "https://peraturan.bpk.go.id/Download/43676/UU%20Nomor%2012%20Tahun%202012.pdf"}
]

print(f"📥 Downloading {len(laws)} Indonesian Laws...")
print("=" * 60)

success = 0
failed = []

for i, law in enumerate(laws, 1):
    if law["url"] == "ALREADY_DOWNLOADED":
        print(f"✅ [{i}/{len(laws)}] {law['name']}: Already processed")
        success += 1
        continue
    
    try:
        print(f"⏳ [{i}/{len(laws)}] Downloading {law['name']}...", end=" ")
        response = requests.get(law["url"], timeout=30, allow_redirects=True)
        
        if response.status_code == 200:
            filepath = Path(f"{law['name']}.pdf")
            filepath.write_bytes(response.content)
            print(f"✅ OK ({len(response.content)//1024}KB)")
            success += 1
        else:
            print(f"❌ HTTP {response.status_code}")
            failed.append(law['name'])
    except Exception as e:
        print(f"❌ {str(e)[:50]}")
        failed.append(law['name'])
    
    time.sleep(1)  # Rate limiting

print("=" * 60)
print(f"\n📊 SUMMARY:")
print(f"   ✅ Downloaded: {success}/{len(laws)}")
print(f"   ❌ Failed: {len(failed)}")
if failed:
    print(f"\n❌ Failed laws:")
    for f in failed:
        print(f"   - {f}")
