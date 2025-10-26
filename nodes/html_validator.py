# ===============================================================
# ✅ NUZANTARA LangGraph Node — HTML Validator (Claude 3 Haiku)
# ===============================================================

import os
from pathlib import Path
from anthropic import Anthropic
from langgraph.func import task
from dotenv import load_dotenv

load_dotenv()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@task
def html_validator(state):
    """
    Valida il layout HTML prodotto da Llama 3.1:
    - Controlla se il codice è valido
    - Segnala errori o tag mancanti
    - Restituisce True/False e un breve report
    """

    optimized_file = Path(state.get("optimized_file", ""))
    if not optimized_file.exists():
        raise FileNotFoundError(f"File ottimizzato non trovato: {optimized_file}")

    html_code = optimized_file.read_text(encoding="utf-8")

    prompt = f"""
You are a senior front-end validator.
Analyze the following HTML and respond in JSON with:
{{
  "is_valid": true/false,
  "issues": ["list of problems, if any"],
  "summary": "1-line summary of HTML quality"
}}

Check for:
- Unclosed tags
- Missing <html>, <head>, or <body>
- Broken <script> or <div> blocks
- Invalid nesting
- Removed or corrupted sections

HTML CODE:
{html_code}
"""

    print("🧪 Validazione HTML in corso con Claude Haiku...")

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.content[0].text.strip()
        state["validation_report"] = content

        if '"is_valid": true' in content.lower():
            state["approved"] = True
            print("✅ Validazione superata!")
        else:
            state["approved"] = False
            print("⚠️ Problemi rilevati nel layout HTML.")

    except Exception as e:
        state["approved"] = False
        state["validation_report"] = str(e)
        print("❌ Errore durante la validazione:", e)

    return state
