# ===============================================================
# 🌐 NUZANTARA LangGraph Node — Web Layout Optimizer (Llama 3.1)
# ===============================================================

import subprocess
from pathlib import Path
from langgraph.func import task

@task
def web_layout_optimizer(state):
    """
    Ottimizza layout HTML/TSX usando Llama 3.1 locale via Ollama.
    - Input: state["file_path"]
    - Output: state["optimized_file"], state["diff"]
    """

    file_path = Path(state.get("file_path", ""))
    if not file_path.exists():
        raise FileNotFoundError(f"File non trovato: {file_path}")

    model = state.get("model", "llama3.1")
    palette = state.get("palette", "#0b1225,#32cd32,#ff4e3a,#ffffff")
    goals = state.get(
        "goals",
        "Bilancia il layout con flex/grid, margini coerenti, e titolo centrato."
    )

    print(f"🎨 Ottimizzo {file_path.name} con {model}…")

    prompt = f"""
Sei un layout optimizer AI. Ottimizza il seguente codice mantenendo struttura e semantica.
Usa flex/grid, gap coerenti, e proporzioni bilanciate. Non spiegare, restituisci solo il codice.

PALETTE: {palette}
GOALS: {goals}

CODICE:
{file_path.read_text(encoding='utf-8')}
"""

    result = subprocess.run(
        ["ollama", "generate", "-m", model, "-p", prompt],
        capture_output=True,
        text=True,
    )

    output = result.stdout.strip()
    optimized_file = file_path.with_suffix(".optimized" + file_path.suffix)
    optimized_file.write_text(output, encoding="utf-8")

    print(f"✅ Layout ottimizzato salvato in: {optimized_file}")

    # calcola differenza
    import difflib
    diff = "\n".join(
        difflib.unified_diff(
            file_path.read_text().splitlines(),
            output.splitlines(),
            fromfile=str(file_path),
            tofile=str(optimized_file)
        )
    )

    state["optimized_file"] = str(optimized_file)
    state["diff"] = diff
    return state
