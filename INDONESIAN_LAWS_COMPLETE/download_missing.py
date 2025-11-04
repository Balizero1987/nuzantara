#!/usr/bin/env python3
import requests
import time
from pathlib import Path

# URL alternativi per le 11 mancanti
missing = [
    {"name": "UU_7_2021_HPP_Tax", "url": "https://jdih.kemenkeu.go.id/fulltext/2021/7TAHUN2021UU.pdf"},
    {"name": "PP_55_2022_PPh_Tax", "url": "https://jdih.kemenkeu.go.id/fulltext/2022/55TAHUN2022PP.pdf"},
    {"name": "PP_44_2022_PPN_Tax", "url": "https://jdih.kemenkeu.go.id/fulltext/2022/44TAHUN2022PP.pdf"},
    {"name": "UU_13_2003_Manpower", "url": "https://peraturan.go.id/id/uu-no-13-tahun-2003"},
    {"name": "PP_35_2021_PKWT", "url": "https://jdih.kemnaker.go.id/asset/data_puu/PP_35_TAHUN_2021.pdf"},
    {"name": "UU_11_2020_Omnibus_Law", "url": "https://peraturan.go.id/id/uu-no-11-tahun-2020"},
    {"name": "KUHPerdata_Civil_Code", "url": "https://www.hukumonline.com/pusatdata/download/lt4c48bdde85b99/node/4369"},
    {"name": "UU_19_2016_ITE", "url": "https://jdih.kominfo.go.id/produk_hukum/view/id/555/t/undangundang+nomor+19+tahun+2016"},
    {"name": "PP_71_2019_PSE", "url": "https://jdih.kominfo.go.id/produk_hukum/view/id/759/t/peraturan+pemerintah+nomor+71+tahun+2019"},
    {"name": "UU_2_2017_Construction", "url": "https://jdih.pu.go.id/detail-dokumen/1270"},
    {"name": "UU_12_2012_Higher_Education", "url": "https://jdih.kemdikbud.go.id/arsip/UU%20Nomor%2012%20Tahun%202012.pdf"}
]

print(f"🔄 Retry downloading {len(missing)} missing laws...")
print("=" * 60)

for i, law in enumerate(missing, 1):
    try:
        print(f"⏳ [{i}/{len(missing)}] {law['name']}...", end=" ")
        response = requests.get(law["url"], timeout=30, allow_redirects=True, verify=False)
        
        if response.status_code == 200 and len(response.content) > 1000:
            filepath = Path(f"{law['name']}.pdf")
            filepath.write_bytes(response.content)
            print(f"✅ OK ({len(response.content)//1024}KB)")
        else:
            print(f"❌ HTTP {response.status_code} or empty")
    except Exception as e:
        print(f"❌ {str(e)[:50]}")
    
    time.sleep(2)

print("=" * 60)
