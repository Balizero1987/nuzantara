#!/usr/bin/env python3
"""
Test ZANTARA conversation quality for spontaneous human-like interactions
"""

import requests
import json
import os
from datetime import datetime

# Backend URL
BACKEND_URL = "https://zantara-rag-backend-himaadsxua-ew.a.run.app"

def test_conversation(message, test_name):
    """Test a single conversation with ZANTARA"""
    print(f"\n{'='*60}")
    print(f"🧪 TEST: {test_name}")
    print(f"{'='*60}")
    print(f"👤 USER: {message}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/bali-zero/chat",
            json={
                "query": message,
                "user_id": "test_conversation_quality",
                "session_id": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            zantara_response = data.get('answer', data.get('response', 'No response'))
            
            print(f"🤖 ZANTARA: {zantara_response}\n")
            
            # Analyze response quality
            analyze_response(zantara_response, message)
            
            return zantara_response
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def analyze_response(response, original_message):
    """Analyze if response is human-like and natural"""
    print(f"📊 QUALITY ANALYSIS:")
    print(f"{'-'*60}")
    
    issues = []
    good_points = []
    
    # Check length appropriateness
    words = len(response.split())
    if "ciao" in original_message.lower() or "hi" in original_message.lower():
        if words > 30:
            issues.append(f"⚠️  Too long for greeting ({words} words, expect <15)")
        else:
            good_points.append(f"✅ Appropriate length for greeting ({words} words)")
    
    # Check for emojis (shows personality)
    has_emoji = any(char in response for char in "😊🌸✨💫🎯🏢👋🌟💬")
    if has_emoji:
        good_points.append("✅ Uses emojis (shows personality)")
    else:
        issues.append("⚠️  No emojis (too formal/robotic)")
    
    # Check for natural expressions
    natural_expressions = [
        "ciao", "benissimo", "ottimo", "fantastico", "wow", "oh",
        "that's great", "i'm excited", "i understand", "let me help"
    ]
    has_natural = any(expr in response.lower() for expr in natural_expressions)
    if has_natural:
        good_points.append("✅ Uses natural expressions")
    else:
        issues.append("⚠️  Lacks natural expressions (too formal)")
    
    # Check for robotic patterns
    robotic_patterns = [
        "as an ai", "i am programmed", "my function is", "i am designed to",
        "according to my training", "i don't have emotions", "i cannot feel"
    ]
    is_robotic = any(pattern in response.lower() for pattern in robotic_patterns)
    if is_robotic:
        issues.append("🚨 CRITICAL: Uses robotic self-references!")
    else:
        good_points.append("✅ No robotic self-references")
    
    # Check for overly technical/formal language
    formal_words = [
        "facilitate", "utilize", "endeavor", "furthermore", "nevertheless",
        "hereby", "herein", "aforementioned"
    ]
    overly_formal = sum(1 for word in formal_words if word in response.lower())
    if overly_formal > 2:
        issues.append(f"⚠️  Too formal ({overly_formal} formal words)")
    else:
        good_points.append("✅ Conversational tone")
    
    # Check for questions (shows engagement)
    has_questions = "?" in response
    if has_questions and len(original_message.split()) < 10:
        good_points.append("✅ Asks engaging questions")
    
    # Print results
    for point in good_points:
        print(point)
    
    for issue in issues:
        print(issue)
    
    # Overall score
    score = len(good_points) / (len(good_points) + len(issues)) * 100 if (good_points or issues) else 0
    print(f"\n🎯 HUMAN-LIKE SCORE: {score:.0f}%")
    
    if score >= 80:
        print("✅ EXCELLENT: Very human-like")
    elif score >= 60:
        print("⚠️  GOOD: Mostly human-like, minor improvements needed")
    elif score >= 40:
        print("⚠️  FAIR: Some robotic patterns, needs improvement")
    else:
        print("🚨 POOR: Too robotic, major improvements needed")
    
    print(f"{'-'*60}\n")

def main():
    """Run conversation quality tests"""
    print("🤖 ZANTARA CONVERSATION QUALITY TEST")
    print("Testing human-like spontaneous conversations")
    print(f"Backend: {BACKEND_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test cases
    tests = [
        # Simple greetings (should be brief and warm)
        ("Ciao!", "Simple Italian Greeting"),
        ("Hi there!", "Simple English Greeting"),
        
        # Casual questions (should be personal and engaging)
        ("Come stai?", "How are you (Italian)"),
        ("How's it going?", "How are you (English)"),
        
        # Personal interaction (should show memory and personality)
        ("Mi puoi aiutare?", "Can you help me (Italian)"),
        ("Tell me about yourself", "Self-introduction"),
        
        # Business question (should be professional but warm)
        ("What is KITAS?", "Business question - KITAS"),
        ("Come si apre una PT PMA?", "Business question - PT PMA"),
    ]
    
    results = []
    for message, test_name in tests:
        response = test_conversation(message, test_name)
        results.append({
            'test': test_name,
            'message': message,
            'response': response
        })
        
        # Wait a bit between requests
        import time
        time.sleep(2)
    
    # Summary
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    print(f"Total tests: {len(tests)}")
    print(f"Successful: {sum(1 for r in results if r['response'])}")
    print(f"Failed: {sum(1 for r in results if not r['response'])}")
    
    # Save results
    with open('test-zantara-conversation-results.json', 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'backend': BACKEND_URL,
            'tests': results
        }, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Results saved to: test-zantara-conversation-results.json")

if __name__ == "__main__":
    main()
