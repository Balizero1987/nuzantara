#!/usr/bin/env python3
"""
Script per scaricare gli ultimi 5 post da @balizero0
"""
import instaloader
import os
import json
from datetime import datetime

# Configurazione
USERNAME = "balizero0"
PASSWORD = "Balizero1987"
OUTPUT_DIR = "/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website/public/instagram"
POST_COUNT = 5

def download_latest_posts():
    # Crea directory output
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Inizializza Instaloader
    L = instaloader.Instaloader(
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=True,
        compress_json=False,
        post_metadata_txt_pattern='',
    )

    print(f"🔐 Login come @{USERNAME}...")
    try:
        L.load_session_from_file(USERNAME)
        print("✅ Sessione esistente caricata")
    except:
        print("🔑 Eseguo login...")
        try:
            L.login(USERNAME, PASSWORD)
            L.save_session_to_file()
            print("✅ Login effettuato e sessione salvata")
        except instaloader.exceptions.TwoFactorAuthRequiredException:
            print("\n⚠️  Autenticazione a due fattori richiesta!")
            two_factor_code = input("📱 Inserisci il codice 2FA ricevuto: ").strip()
            L.two_factor_login(two_factor_code)
            L.save_session_to_file()
            print("✅ Login con 2FA completato e sessione salvata")

    # Scarica profilo
    print(f"\n📥 Scarico ultimi {POST_COUNT} post da @{USERNAME}...")
    profile = instaloader.Profile.from_username(L.context, USERNAME)

    posts_data = []
    downloaded_count = 0

    for post in profile.get_posts():
        if downloaded_count >= POST_COUNT:
            break

        print(f"\n📸 Post {downloaded_count + 1}/{POST_COUNT}")
        print(f"   Data: {post.date}")
        print(f"   Likes: {post.likes}")
        print(f"   Caption: {post.caption[:100] if post.caption else 'Nessuna caption'}...")

        # Scarica il post
        L.download_post(post, target=f"{OUTPUT_DIR}/post_{downloaded_count + 1}")

        # Salva metadati
        post_info = {
            "post_number": downloaded_count + 1,
            "url": f"https://www.instagram.com/p/{post.shortcode}/",
            "date": post.date.isoformat(),
            "caption": post.caption,
            "likes": post.likes,
            "comments": post.comments,
            "is_video": post.is_video,
            "shortcode": post.shortcode,
        }
        posts_data.append(post_info)

        downloaded_count += 1

    # Salva JSON con tutti i metadati
    with open(f"{OUTPUT_DIR}/posts_metadata.json", "w", encoding="utf-8") as f:
        json.dump(posts_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Scaricati {downloaded_count} post!")
    print(f"📁 Salvati in: {OUTPUT_DIR}")
    print(f"📄 Metadati salvati in: {OUTPUT_DIR}/posts_metadata.json")

    return posts_data

if __name__ == "__main__":
    try:
        posts = download_latest_posts()
        print("\n" + "="*60)
        print("RIEPILOGO POST SCARICATI:")
        print("="*60)
        for post in posts:
            print(f"\n{post['post_number']}. {post['url']}")
            print(f"   Data: {post['date']}")
            print(f"   Likes: {post['likes']} | Comments: {post['comments']}")
            if post['caption']:
                print(f"   Caption: {post['caption'][:150]}...")
    except Exception as e:
        print(f"\n❌ Errore: {e}")
        import traceback
        traceback.print_exc()
