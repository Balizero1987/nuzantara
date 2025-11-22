import os
import time
import json
import google.generativeai as genai
from typing import List

# Configura qui la tua API Key se non è nell'ambiente
# os.environ["GOOGLE_API_KEY"] = "LA_TUA_CHIAVE_QUI"

class PremiumDatasetGenerator:
    def __init__(self):
        self.setup_ai()
        
        # Argomenti "Hard Core" per mettere alla prova il modello
        self.concepts = [
            "Differenza tra PT PMA e PT Local per stranieri",
            "Requisiti minimi di capitale (Paid-up capital) 10 Miliar",
            "Visto KITAS per investitori (Investor KITAS C313/C314)",
            "Tassazione sui dividendi per azionisti esteri",
            "Obbligo di ufficio fisico vs Virtual Office",
            "Nominee Agreement e rischi legali",
            "Laporan Kegiatan Penanaman Modal (LKPM)",
            "Processo OSS RBA (Risk Based Approach)",
            "Tax Amnesty e regolarizzazione asset",
            "Diritto del lavoro: pesangon (liquidazione) e contratti PKWT"
        ]

    def setup_ai(self):
        try:
            # Use the stable model name
            self.model_name = "gemini-1.5-flash" 
            genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
            self.model = genai.GenerativeModel(self.model_name)
            print(f"🧠 AI Engine Initialized: {self.model_name}")
        except Exception as e:
            print(f"❌ Error setting up AI: {e}")
            print("Make sure GOOGLE_API_KEY is set in your environment!")

    def generate_prompt(self, concept):
        return f"""
        TASK: Genera 5 esempi di training per un'IA che simula un consulente legale di "Jakarta Selatan" (Jaksel).
        
        CONCETTO DA SPIEGARE: {concept}
        
        PERSONA (STYLE):
        - Ruolo: Senior Legal Consultant a SCBD (Sud Jakarta).
        - Tono: Smart, diretto, misto Inglese-Indonesiano (Code-mixing naturale).
        - Vocabolario Chiave: "Basically", "Which is", "Literally", "Prefer", "Issue", "Regulation", "Compliance".
        - Atteggiamento: Professionale ma "chill". Non parla come un robot. Parla come un collega esperto su WhatsApp.
        
        FORMATO OUTPUT (JSON Lines rigoroso):
        {{"input": "Domanda formale/ingenua dell'utente in Indonesiano standard", "output": "Risposta nello stile Jaksel slang spiegato sopra"}}
        
        REGOLE:
        1. L'input deve essere una domanda che un cliente farebbe.
        2. L'output DEVE contenere la spiegazione tecnica corretta ma con lo slang.
        3. NON usare saluti balinesi (No "Om Swastiastu", No "Bli"). Usa "Bro", "Pak", "Guys".
        4. Genera 5 coppie diverse per questo concetto.
        5. Restituisci SOLO il JSON valido, niente markdown.
        """

    def generate_batch(self):
        print(f"🚀 Starting Premium Generation with {self.model_name}...")
        dataset = []
        
        for concept in self.concepts:
            print(f"   👉 Processing concept: {concept}...")
            try:
                prompt = self.generate_prompt(concept)
                response = self.model.generate_content(prompt)
                
                # Pulizia base per estrarre il JSON se l'IA mette markdown ```json ... ```
                text = response.text.replace("```json", "").replace("```", "").strip()
                
                # Parsing riga per riga
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('{') and line.endswith('}'):
                        try:
                            entry = json.loads(line)
                            dataset.append(entry)
                            print(f"      ✅ Generated: {entry['output'][:50]}...")
                        except json.JSONDecodeError:
                            pass
                            
                # Rispetto dei rate limit
                time.sleep(2)
                
            except Exception as e:
                print(f"      ⚠️ Error generating for {concept}: {e}")

        return dataset

    def save_dataset(self, data, filename="train_jaksel_premium.jsonl"):
        with open(filename, 'w', encoding='utf-8') as f:
            for entry in data:
                f.write(json.dumps(entry) + '\n')
        print(f"\n💎 Premium Dataset saved to {filename} ({len(data)} examples)")

if __name__ == "__main__":
    if not os.environ.get("GOOGLE_API_KEY"):
        print("❌ STOP: Devi impostare la variabile d'ambiente GOOGLE_API_KEY prima di lanciare questo script.")
        print("Esempio: export GOOGLE_API_KEY='la_tua_chiave'")
    else:
        generator = PremiumDatasetGenerator()
        data = generator.generate_batch()
        generator.save_dataset(data)
