#!/usr/bin/env python3
# ============================================================
# NUZANTARA - Web Layout Optimizer (Llama 3.1 via Ollama)
# ============================================================
import argparse, subprocess, sys, shutil, re
from pathlib import Path
from difflib import unified_diff

DEFAULT_GLOBS = [
    "app/**/*.tsx",
    "pages/**/*.tsx",
    "app/**/*.jsx",
    "pages/**/*.jsx",
    "public/**/*.html",
    "*.html",
]

PROMPT_TEMPLATE = """You are a front-end layout optimizer.
Task: improve visual balance and spacing of this HTML/TSX by adjusting grid/flex, gaps, and sizes.
Rules:
- KEEP imports, data-* attrs, IDs, Next.js <Image> (do not convert to <img>), and semantics.
- DO NOT remove components, event handlers, or logic.
- Prefer CSS grid/flex classes over absolute positioning.
- Return CODE ONLY. No explanations, no markdown fences.

Project palette (if used): {palette}
Target goals: {goals}

----- BEGIN SOURCE -----
{source}
----- END SOURCE -----
Return ONLY the updated file content.
"""

def run_ollama(model: str, prompt: str) -> str:
    try:
        r = subprocess.run(
            ["ollama", "run", model],
            input=prompt.encode("utf-8"),
            capture_output=True,
            check=True,
        )
    except FileNotFoundError:
        sys.exit("❌ Ollama non trovato. Installa da https://ollama.ai e avvia: `ollama serve`.")
    except subprocess.CalledProcessError as e:
        sys.exit(f"❌ Errore Ollama: {e.stderr.decode('utf-8', errors='ignore')}")
    out = r.stdout.decode("utf-8", errors="ignore").strip()
    # ripulisci eventuali ``` fences
    m = re.search(r"```(?:tsx|jsx|html)?\s*(.*?)```", out, flags=re.S)
    return m.group(1).strip() if m else out

def collect_files(root: Path, include_globs, exclude_globs):
    files = []
    for g in include_globs:
        files += list(root.glob(g))
    # filtra exclude
    excl = set()
    for g in exclude_globs:
        excl.update(root.glob(g))
    files = [f for f in files if f.is_file() and f not in excl]
    # dedup e ordina
    return sorted(set(files))

def write_safe(out_path: Path, new_text: str, overwrite: bool, make_backup: bool):
    if overwrite:
        if make_backup and out_path.exists():
            backup = out_path.with_suffix(out_path.suffix + ".bak")
            shutil.copy2(out_path, backup)
            print(f"🛟 Backup: {backup.name}")
        out_path.write_text(new_text, encoding="utf-8")
        print(f"✅ Scritto: {out_path}")
    else:
        # dry-run → scrive accanto
        dry = out_path.with_suffix(out_path.suffix.replace(".", ".optimized.") if "." in out_path.suffix else out_path.suffix + ".optimized")
        dry.write_text(new_text, encoding="utf-8")
        print(f"🧪 Dry-run → {dry}")

def show_diff(old: str, new: str, path: Path):
    diff = unified_diff(old.splitlines(True), new.splitlines(True), fromfile=str(path), tofile=str(path) + " (optimized)")
    txt = "".join(diff)
    if txt:
        print("—— diff ——")
        print(txt)
    else:
        print("ℹ️ Nessuna differenza (AI ha restituito contenuto identico).")

def optimize_file(path: Path, model: str, palette: str, goals: str, overwrite: bool, make_backup: bool, max_growth: float):
    src = path.read_text(encoding="utf-8")
    prompt = PROMPT_TEMPLATE.format(palette=palette, goals=goals, source=src)
    print(f"\n🚀 Ottimizzo: {path}")
    out = run_ollama(model, prompt)

    # safety: se l’output è troppo corto o troppo lungo rispetto all’originale, avvisa
    if len(out) < len(src) * 0.2:
        print("⚠️ Output troppo corto. Ignoro per sicurezza.")
        return
    if len(out) > len(src) * max_growth:
        print(f"⚠️ Output troppo grande (> x{max_growth}). Ignoro per sicurezza.")
        return

    show_diff(src, out, path)
    write_safe(path, out, overwrite, make_backup)

def main():
    ap = argparse.ArgumentParser(description="Web Layout Optimizer (Llama 3.1 via Ollama)")
    ap.add_argument("--root", default=".", help="Root del progetto (default: .)")
    ap.add_argument("--include", nargs="*", default=DEFAULT_GLOBS, help="Glob inclusi")
    ap.add_argument("--exclude", nargs="*", default=["**/*.bak", "**/*.optimized.*", "**/node_modules/**", ".next/**"], help="Glob esclusi")
    ap.add_argument("--model", default="llama3.1", help="Modello Ollama (default: llama3.1)")
    ap.add_argument("--palette", default="#003366,#FF9900,#FFFFFF", help="Palette (virgole)")
    ap.add_argument("--goals", default="Balance hero section, avoid overlap, consistent card sizes, use grid/flex gaps.", help="Obiettivi layout")
    ap.add_argument("--write", action="store_true", help="Sovrascrivi i file (default: dry-run)")
    ap.add_argument("--backup", action="store_true", help="Crea .bak quando --write")
    ap.add_argument("--max-growth", type=float, default=1.6, help="Soglia massima crescita output (default 1.6x)")
    ap.add_argument("--limit", type=int, default=10, help="Max file da processare per run (default 10)")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    files = collect_files(root, args.include, args.exclude)
    if not files:
        # guida rapida se non trova nulla
        print("❌ Nessun file trovato con i glob attuali.")
        print("Suggerimenti:")
        print("  - Aggiungi --include 'app/**/*.tsx'  oppure  --include '*.html'")
        print("  - Controlla la root: --root /percorso/progetto")
        sys.exit(1)

    print(f"🔎 Trovati {len(files)} file candidati. Ne processerò max {args.limit}.")
    for i, f in enumerate(files[: args.limit], 1):
        try:
            optimize_file(
                f,
                model=args.model,
                palette=args.palette,
                goals=args.goals,
                overwrite=args.write,
                make_backup=args.backup,
                max_growth=args.max_growth,
            )
        except Exception as e:
            print(f"❌ Errore su {f}: {e}")

if __name__ == "__main__":
    main()
