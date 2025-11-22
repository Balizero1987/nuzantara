#!/usr/bin/env python3
"""
Zantara Knowledge Base PDF Collector
Script robusto per raccogliere PDF da tutto il Mac escludendo cartelle di sistema
"""

import os
import shutil
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Set, Generator
import logging

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('zantara_kb_collector.log')
    ]
)

class ZantaraKBCollector:
    def __init__(self):
        self.home_dir = Path.home()
        self.destination_dir = Path.home() / "Desktop" / "Zantara_KB_Source"
        self.copied_files = 0
        self.skipped_files = 0
        self.errors = 0

        # Percorsi da escludere (assoluti e relativi)
        self.exclude_paths = {
            '/Library',
            '/Applications',
            '/System',
            '/Volumes',
            '/Network',
            '/usr',
            '/bin',
            '/sbin',
            '/etc',
            '/var',
            '/tmp',
            '/private'
        }

        # Pattern da escludere nei percorsi
        self.exclude_patterns = {
            '.Trash',
            'node_modules',
            '.git',
            '.vscode',
            '.DS_Store',
            '__pycache__',
            '.pyc',
            '.log',
            '.cache',
            '.tmp',
            'temp',
            'tmp'
        }

    def should_exclude_path(self, path: Path) -> bool:
        """Verifica se un percorso deve essere escluso"""
        path_str = str(path)

        # Controlla percorsi assoluti da escludere
        if any(exclude in path_str for exclude in self.exclude_paths):
            return True

        # Controlla pattern relativi da escludere
        if any(pattern in path.name for pattern in self.exclude_patterns):
            return True

        # Controlla se il path inizia con . (file nascosti di sistema)
        if any(part.startswith('.') and part not in {'.config', '.local'} for part in path.parts):
            return True

        return False

    def find_pdf_files(self) -> Generator[Path, None, None]:
        """Cerca ricorsivamente tutti i file PDF"""
        logging.info(f"🔍 Inizio scansione da: {self.home_dir}")

        try:
            for root, dirs, files in os.walk(self.home_dir):
                root_path = Path(root)

                # Salta le directory che devono essere escluse
                if self.should_exclude_path(root_path):
                    # Rimuovi le sottodirectory dalla navigazione
                    dirs.clear()
                    continue

                # Filtra le directory da esplorare
                dirs[:] = [d for d in dirs if not self.should_exclude_path(root_path / d)]

                # Cerca file PDF
                for file in files:
                    if file.lower().endswith('.pdf'):
                        file_path = root_path / file

                        # Verifica dimensione file (escludi file vuoti o troppo piccoli)
                        try:
                            if file_path.stat().st_size > 1024:  # Minimo 1KB
                                yield file_path
                        except (OSError, PermissionError) as e:
                            logging.warning(f"⚠️  Impossibile accedere a {file_path}: {e}")
                            self.errors += 1

        except KeyboardInterrupt:
            logging.info("\n⏹️  Scansione interrotta dall'utente")
            raise
        except Exception as e:
            logging.error(f"❌ Errore durante la scansione: {e}")
            self.errors += 1

    def generate_unique_filename(self, file_path: Path, dest_dir: Path) -> Path:
        """Genera un nome file unico nella cartella di destinazione"""
        original_name = file_path.name
        dest_path = dest_dir / original_name

        if not dest_path.exists():
            return dest_path

        # Se esiste già, aggiungi timestamp e hash breve
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Genera hash breve del contenuto per identificare file duplicati
        try:
            with open(file_path, 'rb') as f:
                # Leggi solo i primi 8KB per generare un hash veloce
                content_sample = f.read(8192)
                hash_suffix = hashlib.md5(content_sample).hexdigest()[:6]
        except Exception:
            hash_suffix = "unknown"

        name_without_ext = file_path.stem
        extension = file_path.suffix

        new_name = f"{name_without_ext}_{timestamp}_{hash_suffix}{extension}"
        return dest_dir / new_name

    def copy_pdf_file(self, source: Path) -> bool:
        """Copia un singolo file PDF nella destinazione"""
        try:
            # Crea la cartella di destinazione se non esiste
            self.destination_dir.mkdir(parents=True, exist_ok=True)

            # Genera nome file unico
            dest_path = self.generate_unique_filename(source, self.destination_dir)

            # Copia il file
            shutil.copy2(source, dest_path)

            # Log del file copiato
            relative_path = source.relative_to(self.home_dir)
            logging.info(f"📄 Copiato: {relative_path} → {dest_path.name}")

            self.copied_files += 1
            return True

        except Exception as e:
            logging.error(f"❌ Errore nella copia di {source}: {e}")
            self.errors += 1
            return False

    def run_collection(self):
        """Esegue l'intero processo di raccolta"""
        start_time = datetime.now()

        print("🚀 Inizio raccolta Knowledge Base Zantara PDF")
        print(f"📁 Cartella utente: {self.home_dir}")
        print(f"📂 Destinazione: {self.destination_dir}")
        print("=" * 60)

        try:
            # Scansione e copia
            for pdf_file in self.find_pdf_files():
                self.copy_pdf_file(pdf_file)

        except KeyboardInterrupt:
            print("\n⏹️  Operazione interrotta dall'utente")
            return

        except Exception as e:
            logging.error(f"❌ Errore critico: {e}")
            return

        # Riepilogo finale
        end_time = datetime.now()
        duration = end_time - start_time

        print("\n" + "=" * 60)
        print("📊 RIEPILOGO OPERAZIONE")
        print("=" * 60)
        print(f"✅ File copiati con successo: {self.copied_files}")
        print(f"⚠️  File ignorati (duplicati): {self.skipped_files}")
        print(f"❌ Errori riscontrati: {self.errors}")
        print(f"⏱️  Durata totale: {duration}")
        print(f"📁 Dimensione cartella: {self._get_folder_size()}")
        print("=" * 60)

        if self.copied_files > 0:
            print("✅ Raccolta completata! Ora trascina la cartella 'Zantara_KB_Source' nel tuo Google Drive qui:")
            print("🔗 https://drive.google.com/drive/folders/1Zy0oD3Mk6ASZ9mufwa4T6XmC4QREcnSU?usp=drive_link")
        else:
            print("⚠️  Nessun file PDF trovato o copiato.")

    def _get_folder_size(self) -> str:
        """Calcola la dimensione totale della cartella di destinazione"""
        if not self.destination_dir.exists():
            return "0 MB"

        try:
            total_size = 0
            for file_path in self.destination_dir.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size

            # Converti in MB
            size_mb = total_size / (1024 * 1024)
            return f"{size_mb:.2f} MB"

        except Exception:
            return "Sconosciuta"

def main():
    """Funzione principale"""
    try:
        collector = ZantaraKBCollector()
        collector.run_collection()

    except KeyboardInterrupt:
        print("\n⏹️  Script interrotto dall'utente")
    except Exception as e:
        logging.error(f"❌ Errore fatale: {e}")
        print(f"\n❌ Si è verificato un errore: {e}")

if __name__ == "__main__":
    main()