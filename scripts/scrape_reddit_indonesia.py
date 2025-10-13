#!/usr/bin/env python3
"""
Reddit r/indonesia Scraper - Ethical Web Scraping for Training Data

Estrae discussioni autentiche da r/indonesia per catturare:
- Problemi Gen Z/Millennials reali
- Linguaggio colloquiale (bahasa gaul)
- Issues sociali (economia, lavoro, relazioni)
- Cultural insights autentici

Usage:
    python scripts/scrape_reddit_indonesia.py --posts 500 --output data/reddit_indonesia.jsonl
"""

import praw
import json
import time
import re
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
import argparse

# ==========================================
# CONFIGURATION
# ==========================================

# Reddit API credentials (FREE - create at https://www.reddit.com/prefs/apps)
# Istruzioni:
# 1. Vai su https://www.reddit.com/prefs/apps
# 2. Clicca "create app" o "create another app"
# 3. Scegli "script" type
# 4. Compila nome, descrizione, redirect uri (http://localhost:8080)
# 5. Copia client_id (sotto "personal use script") e client_secret

REDDIT_CONFIG = {
    "client_id": "H3WfBT4W1_TMNHXiAkS87w",
    "client_secret": "fSY2vbDk-IgAjrZ0YfCIx2mgHMX3wA",
    "user_agent": "ZANTARA Training Data Collector v1.0"
}

# Subreddit target
SUBREDDIT = "indonesia"

# Topics rilevanti per ZANTARA
RELEVANT_FLAIRS = [
    "Discussion",
    "Ask Indonesia",
    "Advice",
    "Question",
    "Rant",
    "Story",
    "Culture",
    "Economy & Finance",
    "Politics & Society",
    "Work & Career"
]

# Keywords per filtrare post rilevanti
RELEVANT_KEYWORDS = [
    # Lavoro & Carriera
    "gaji", "salary", "kerja", "work", "job", "karir", "career",
    "resign", "interview", "lowongan", "unemployment", "pengangguran",

    # Problemi economici
    "utang", "debt", "pinjol", "cicilan", "kredit", "loan",
    "mahal", "expensive", "harga", "price", "afford", "mampu",

    # Social issues
    "toxic", "stress", "mental health", "depresi", "anxiety",
    "relationship", "hubungan", "keluarga", "family", "ortu",
    "nikah", "marriage", "jomblo", "single",

    # Generational
    "gen z", "millenial", "boomer", "muda", "young", "tua",

    # Cultural
    "budaya", "culture", "adat", "tradition", "modern",
    "agama", "religion", "islam", "christian", "hindu",

    # Location
    "jakarta", "bali", "surabaya", "bandung", "yogya", "medan",

    # Aspirazioni
    "mimpi", "dream", "cita", "goal", "plan", "rencana",
    "pindah", "move", "abroad", "luar negeri"
]

# ==========================================
# ANONYMIZATION & PRIVACY
# ==========================================

def anonymize_username(username: str) -> str:
    """Anonimizza username per privacy"""
    # Hash username per consistency mantenendo privacy
    import hashlib
    return f"user_{hashlib.md5(username.encode()).hexdigest()[:8]}"

def remove_personal_info(text: str) -> str:
    """Rimuove info personali da testo"""
    # Rimuovi email
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)

    # Rimuovi phone numbers indonesiani
    text = re.sub(r'\b(\+62|62|0)[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b', '[PHONE]', text)

    # Rimuovi NIK (Indonesian ID)
    text = re.sub(r'\b\d{16}\b', '[NIK]', text)

    # Rimuovi URLs (mantieni domain per context)
    text = re.sub(r'https?://(?:www\.)?([^/\s]+)(?:/[^\s]*)?', r'[LINK:\1]', text)

    return text

# ==========================================
# SCRAPING FUNCTIONS
# ==========================================

def is_relevant_post(post) -> bool:
    """Determina se post è rilevante per training"""
    # Check flair
    if hasattr(post, 'link_flair_text') and post.link_flair_text:
        if any(flair.lower() in post.link_flair_text.lower() for flair in RELEVANT_FLAIRS):
            return True

    # Check keywords in title + selftext
    text = f"{post.title} {post.selftext}".lower()

    # Almeno 1 keyword rilevante
    if any(keyword in text for keyword in RELEVANT_KEYWORDS):
        return True

    # Post con engagement alto (likely interesting)
    if post.score > 50 or post.num_comments > 20:
        return True

    return False

def extract_post_data(post, reddit) -> Dict:
    """Estrae dati da Reddit post"""
    # Get top comments (max 10)
    post.comments.replace_more(limit=0)  # No "load more comments"
    top_comments = []

    for comment in post.comments[:10]:
        if hasattr(comment, 'body') and len(comment.body) > 20:  # Minimum length
            top_comments.append({
                "author": anonymize_username(str(comment.author)),
                "text": remove_personal_info(comment.body),
                "score": comment.score,
                "created": datetime.fromtimestamp(comment.created_utc).isoformat()
            })

    return {
        "id": post.id,
        "title": remove_personal_info(post.title),
        "text": remove_personal_info(post.selftext),
        "author": anonymize_username(str(post.author)),
        "flair": post.link_flair_text if hasattr(post, 'link_flair_text') else None,
        "score": post.score,
        "upvote_ratio": post.upvote_ratio,
        "num_comments": post.num_comments,
        "created": datetime.fromtimestamp(post.created_utc).isoformat(),
        "url": f"https://reddit.com{post.permalink}",
        "comments": top_comments,
        "source": "reddit",
        "subreddit": SUBREDDIT
    }

def scrape_reddit(max_posts: int = 500, sort_by: str = "hot") -> List[Dict]:
    """
    Scrape r/indonesia posts

    Args:
        max_posts: Max number of posts to scrape
        sort_by: "hot", "top", "new", "rising"

    Returns:
        List of post dictionaries
    """
    # Initialize Reddit client
    reddit = praw.Reddit(
        client_id=REDDIT_CONFIG["client_id"],
        client_secret=REDDIT_CONFIG["client_secret"],
        user_agent=REDDIT_CONFIG["user_agent"]
    )

    print(f"🔍 Scraping r/{SUBREDDIT} ({sort_by}) - Target: {max_posts} posts")

    # Get subreddit
    subreddit = reddit.subreddit(SUBREDDIT)

    # Choose sort method
    if sort_by == "hot":
        posts_generator = subreddit.hot(limit=max_posts * 3)  # Get 3x, filter later
    elif sort_by == "top":
        posts_generator = subreddit.top(time_filter="month", limit=max_posts * 3)
    elif sort_by == "new":
        posts_generator = subreddit.new(limit=max_posts * 3)
    else:
        posts_generator = subreddit.rising(limit=max_posts * 3)

    collected_posts = []
    processed = 0

    for post in posts_generator:
        processed += 1

        # Rate limiting (respectful scraping)
        if processed % 10 == 0:
            print(f"  Processed {processed} posts, collected {len(collected_posts)}...")
            time.sleep(2)  # 2 sec pause every 10 posts

        # Filter relevance
        if not is_relevant_post(post):
            continue

        # Skip removed/deleted
        if post.removed_by_category or post.author == '[deleted]':
            continue

        # Extract data
        try:
            post_data = extract_post_data(post, reddit)
            collected_posts.append(post_data)

            if len(collected_posts) >= max_posts:
                break

        except Exception as e:
            print(f"  ⚠️ Error extracting post {post.id}: {e}")
            continue

    print(f"✅ Scraping complete: {len(collected_posts)} relevant posts collected")
    return collected_posts

# ==========================================
# CONVERSION TO TRAINING FORMAT
# ==========================================

def convert_to_training_format(posts: List[Dict]) -> List[Dict]:
    """
    Converte Reddit posts in formato training JSONL

    Format: {"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
    """
    training_examples = []

    for post in posts:
        # Post come Q&A (title = question)
        if post["comments"]:
            # Use top comment as answer
            top_comment = post["comments"][0]

            training_examples.append({
                "messages": [
                    {
                        "role": "user",
                        "content": post["title"]
                    },
                    {
                        "role": "assistant",
                        "content": top_comment["text"]
                    }
                ],
                "metadata": {
                    "source": "reddit",
                    "subreddit": post["subreddit"],
                    "post_id": post["id"],
                    "score": post["score"],
                    "flair": post["flair"],
                    "created": post["created"]
                }
            })

        # Post body + top comment conversation
        if post["text"] and post["comments"]:
            for comment in post["comments"][:3]:  # Max 3 comments
                training_examples.append({
                    "messages": [
                        {
                            "role": "user",
                            "content": f"{post['title']}\n\n{post['text']}"
                        },
                        {
                            "role": "assistant",
                            "content": comment["text"]
                        }
                    ],
                    "metadata": {
                        "source": "reddit",
                        "type": "discussion",
                        "post_id": post["id"],
                        "comment_score": comment["score"]
                    }
                })

    return training_examples

# ==========================================
# MAIN
# ==========================================

def main():
    parser = argparse.ArgumentParser(description="Scrape r/indonesia for training data")
    parser.add_argument("--posts", type=int, default=500, help="Max posts to scrape")
    parser.add_argument("--sort", choices=["hot", "top", "new", "rising"], default="hot")
    parser.add_argument("--output", type=str, default="data/reddit_indonesia_raw.json")
    parser.add_argument("--training-output", type=str, default="data/reddit_indonesia_training.jsonl")

    args = parser.parse_args()

    # Validate Reddit credentials
    if "YOUR_CLIENT_ID" in REDDIT_CONFIG["client_id"]:
        print("❌ ERROR: Please configure Reddit API credentials in REDDIT_CONFIG")
        print("\nInstructions:")
        print("1. Go to https://www.reddit.com/prefs/apps")
        print("2. Click 'create app' or 'create another app'")
        print("3. Choose 'script' type")
        print("4. Fill name, description, redirect uri (http://localhost:8080)")
        print("5. Copy client_id and client_secret to REDDIT_CONFIG in this script")
        return

    # Create output directory
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)

    # Scrape Reddit
    posts = scrape_reddit(max_posts=args.posts, sort_by=args.sort)

    # Save raw data
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    print(f"📁 Raw data saved: {args.output}")

    # Convert to training format
    training_data = convert_to_training_format(posts)

    # Save training data (JSONL)
    with open(args.training_output, 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')

    print(f"📁 Training data saved: {args.training_output}")
    print(f"📊 Stats:")
    print(f"   - Raw posts: {len(posts)}")
    print(f"   - Training examples: {len(training_data)}")
    print(f"   - Avg comments per post: {sum(len(p['comments']) for p in posts) / len(posts):.1f}")

    # Show sample
    if training_data:
        print("\n📝 Sample training example:")
        sample = training_data[0]
        print(f"   User: {sample['messages'][0]['content'][:100]}...")
        print(f"   Assistant: {sample['messages'][1]['content'][:100]}...")

if __name__ == "__main__":
    main()
