# ============================================================
# 🤖 NUZANTARA - Web Layout Optimizer (Llama 3.1 via Ollama)
# ============================================================

import subprocess
from pathlib import Path

# === CONFIG ===
HTML_FILE = Path("app/page.tsx")        # file di input
OUTPUT_FILE = Path("page_optimized.tsx")# file di output
MODEL = "llama3.1"                      # modello Ollama locale

# === FUNZIONE DI OTTIMIZZAZIONE ===
def optimize_layout():
    html_content = HTML_FILE.read_text(encoding="utf-8")

    prompt = f"""
Sei un layout optimizer AI. Analizza il codice HTML/TSX seguente e ottimizza:
- la disposizione dei blocchi <div>, <img>, <article>
- le dimensioni e le proporzioni
- la distribuzione visiva (usa grid o flex più bilanciata)

Restituisci solo il codice HTML/TSX aggiornato, nessuna spiegazione.

CODICE ORIGINALE:
{html_content}
"""

    print("🚀 Ottimizzazione in corso con Llama 3.1...")
    result = subprocess.run(
        ["ollama", "run", MODEL],
        input=prompt.encode("utf-8"),
        capture_output=True
    )

    optimized = result.stdout.decode("utf-8").strip()
    OUTPUT_FILE.write_text(optimized, encoding="utf-8")
    print(f"✅ Layout aggiornato salvato in: {OUTPUT_FILE}")

# === AVVIO ===
if __name__ == "__main__":
    optimize_layout()
