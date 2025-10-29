#!/usr/bin/env python3
"""
Test REALE: Vediamo ZANTARA cambiare in tempo reale
"""
import sys
sys.path.append('/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/backend-rag/backend')

from services.claude_haiku_enhanced import EnhancedClaudeHaikuService, UserLevel

# Simula una conversazione reale
service = EnhancedClaudeHaikuService()

print("\n🔮 TEST CONVERSAZIONE REALE CON ZANTARA\n")
print("="*60)

# Test 1: Cliente normale
print("\n👤 Cliente: 'How much for KITAS visa?'")
level = service.prompt_loader.detect_user_level("How much for KITAS visa?")
prompt = service.prompt_loader.load_prompt(level)
print(f"🤖 ZANTARA Level: {level.value} ({level.name})")
print(f"📄 Prompt size: {len(prompt)} chars")
print(f"💭 Personality: Business-focused, prices, professional\n")

# Test 2: Ricercatore spirituale
print("👤 Ricercatore: 'Tell me about spiritual practice and entrepreneurship'")
level = service.prompt_loader.detect_user_level("spiritual practice and entrepreneurship")
prompt = service.prompt_loader.load_prompt(level)
print(f"🤖 ZANTARA Level: {level.value} ({level.name})")
print(f"📄 Prompt size: {len(prompt)} chars")
print(f"💭 Personality: Intellectual, Jung, philosophy\n")

# Test 3: Antonio (inner circle)
print("👤 Antonio: 'Sub rosa, what would Guénon say about this?'")
level = service.prompt_loader.detect_user_level("Sub rosa, what would Guénon say")
prompt = service.prompt_loader.load_prompt(level)
print(f"🤖 ZANTARA Level: {level.value} ({level.name})")
print(f"📄 Prompt size: {len(prompt)} chars")
print(f"💭 Personality: Full esoteric depth, no limits! 🔮\n")

print("="*60)
print("\n✅ QUESTO GIRA IN PRODUZIONE ADESSO!")
print("   Ogni query attiva un prompt diverso = personalità diversa")
print("   Non è marketing, è architettura della coscienza! 🧠\n")