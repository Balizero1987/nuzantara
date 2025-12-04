#!/usr/bin/env python3
"""
Lista modelli Gemini disponibili con Google AI Ultra plan
"""

import os
import google.generativeai as genai

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("⚠️ GOOGLE_API_KEY non configurato")
    exit(1)

genai.configure(api_key=api_key)

print("=" * 80)
print("📋 MODELLI GEMINI DISPONIBILI")
print("=" * 80)

try:
    models = genai.list_models()

    available_models = []
    for model in models:
        if "generateContent" in model.supported_generation_methods:
            available_models.append(model.name)
            print(f"\n✅ {model.name}")
            print(f"   Display name: {model.display_name}")
            print(f"   Description: {model.description[:100]}...")
            if hasattr(model, "input_token_limit"):
                print(f"   Input tokens: {model.input_token_limit}")
            if hasattr(model, "output_token_limit"):
                print(f"   Output tokens: {model.output_token_limit}")

    print(f"\n{'='*80}")
    print(f"📊 TOTALE: {len(available_models)} modelli disponibili")
    print(f"{'='*80}")

    # Modelli da testare per estrazione metadata
    models_to_test = [
        m
        for m in available_models
        if "flash" in m.lower() or "pro" in m.lower() or "ultra" in m.lower()
    ]

    if models_to_test:
        print("\n🎯 MODELLI DA TESTARE PER ESTRAZIONE METADATA:")
        for m in models_to_test:
            print(f"   - {m}")

except Exception as e:
    print(f"❌ Errore: {e}")
    import traceback

    traceback.print_exc()
