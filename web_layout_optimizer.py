prompt = f"""
Sei un layout optimizer AI. Analizza il seguente HTML e migliora **solo i layout CSS**
(senza modificare JavaScript, logica, né eliminare blocchi esistenti).
Mantieni l'intera struttura DOM, solo rendila più pulita e proporzionata.

PALETTE: {palette}
GOALS: {goals}

CODICE ORIGINALE:
{file_path.read_text(encoding='utf-8')}
"""
