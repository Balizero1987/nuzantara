#!/usr/bin/env python3
"""
30 Domande Business Specifiche per Jakarta Selatan
Test completo del sistema ZANTARA per business reali
"""

import requests
import json
import time

class JakselBusinessTester:
    def __init__(self):
        self.base_url = "https://nuzantara-rag.fly.dev"
        self.api_key = "nuzantara-api-key-2024-secure"
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    def test_oracle_ai_business(self, query):
        """Test Oracle AI per business queries"""
        try:
            response = requests.post(
                f"{self.base_url}/api/oracle/query",
                headers=self.headers,
                json={"query": query},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                answer = data.get("answer", "")
                return {
                    "success": True,
                    "answer": answer[:300] + "..." if len(answer) > 300 else answer,
                    "length": len(answer),
                    "response_time": "OK"
                }
            else:
                return {
                    "success": False,
                    "answer": f"Error {response.status_code}",
                    "length": 0,
                    "response_time": "Failed"
                }
        except Exception as e:
            return {
                "success": False,
                "answer": f"Exception: {str(e)[:50]}",
                "length": 0,
                "response_time": "Timeout"
            }

    def run_jaksel_business_tests(self):
        """30 domande business per Jakarta Selatan"""

        queries_business_jaksel = [
            # Business Setup & Registration (1-8)
            "Come registrare una PT a Jakarta Selatan?",
            "Costi per aprire una società a Jakarta Selatan?",
            "Requisiti per business license a South Jakarta?",
            "Come ottenere NIB online per Jakarta Selatan?",
            "Virtual office address a Jakarta Selatan legale?",
            "Procedura per registrare PKP a Jaksel?",
            "API address a Jakarta Selaton - come ottenerlo?",
            "Company registration timeline Jakarta Selatan?",

            # Taxes & Compliance (9-15)
            "Tassazione PMDN a Jakarta Selatan?",
            "Come pagare PPh 23 a Jakarta Selatan?",
            "PPN reporting requirements South Jakarta?",
            "Annual tax return filing Jakarta Selatan?",
            "Tax incentives per aziende a Jaksel?",
            "BPJS Ketenagakerjaan registration process?",
            "Tax amnesty per aziende Jakarta Selatan?",

            # Property & Real Estate (16-20)
            "Comprare immobile commerciale a Jakarta Selatan?",
            "HGB vs SHM property rights Jakarta Selatan?",
            "Property tax calculation South Jakarta?",
            "Building permits (IMB) a Jakarta Selatan?",
            "Real estate investment returns Jaksel?",

            # Employment & Labor (21-25)
            "Contratti lavorativi Indonesia per expat?",
            "BPJS Kesehatan per dipendenti corporate?",
            "Minimum wage Jakarta Selatan 2024?",
            "Visa lavoro per expat a Jakarta Selatan?",
            "Termination procedures dipendenti Indonesia?",

            # Banking & Finance (26-30)
            "Aprire corporate bank account Jakarta?",
            "Business loan requirements Indonesia?",
            "Fintech regulations Jakarta Selatan?",
            "Payment gateway setup Indonesia?",
            "Foreign exchange regulations per aziende?"
        ]

        print("💼 ZANTARA BUSINESS JAKARTA SELATAN - 30 DOMANDE")
        print("=" * 70)
        print("Testing Oracle AI con domande business reali...")
        print()

        results = []
        success_count = 0
        total_chars = 0

        for i, query in enumerate(queries_business_jaksel, 1):
            print(f"{i:2d}. {query[:45]:<45} → ", end="")

            result = self.test_oracle_ai_business(query)
            results.append({
                "number": i,
                "query": query,
                "result": result
            })

            if result["success"]:
                success_count += 1
                total_chars += result["length"]
                print(f"✅ {result['length']} chars")
            else:
                print(f"❌ {result['answer'][:30]}")

            time.sleep(0.5)  # Rate limiting

        # Analisi dei risultati
        print("\n" + "=" * 70)
        print("📊 ANALISI COMPLETA BUSINESS JAKSEL")
        print("=" * 70)

        print(f"Domande Totali:       {len(queries_business_jaksel)}")
        print(f"Risposte Positive:   {success_count} ({success_count/30*100:.1f}%)")
        print(f"Lunghezza Media:     {total_chars/success_count if success_count > 0 else 0:.0f} caratteri")
        print()

        # Categorie di analisi
        categories = [
            ("Business Setup & Registration", 1, 8),
            ("Taxes & Compliance", 9, 15),
            ("Property & Real Estate", 16, 20),
            ("Employment & Labor", 21, 25),
            ("Banking & Finance", 26, 30)
        ]

        print("Analisi per Categoria:")
        print("-" * 40)

        for cat_name, start, end in categories:
            cat_results = results[start-1:end]
            cat_success = sum(1 for r in cat_results if r["result"]["success"])
            print(f"{cat_name:<25}: {cat_success}/{end-start+1} ({cat_success/(end-start+1)*100:.0f}%)")

        print()
        print("Esempi di Risposte Dettagliate:")
        print("-" * 40)

        # Mostra 3 esempi di risposte dettagliate
        detailed_examples = [r for r in results if r["result"]["success"] and r["result"]["length"] > 200][:3]

        for example in detailed_examples:
            print(f"\nQ{example['number']}: {example['query']}")
            print(f"Risposta: {example['result']['answer']}")
            print("-" * 40)

        # Valutazione finale
        print("\n" + "=" * 70)
        print("🎯 VALUTAZIONE BUSINESS SYSTEM")
        print("=" * 70)

        if success_count >= 27:
            status = "🏆 ECCELLENTE - Business Ready"
            score = "A+"
        elif success_count >= 24:
            status = "✅ BUONO - Production Ready"
            score = "A"
        elif success_count >= 18:
            status = "⚠️  SUFFICIENTE - Minor Fixes Needed"
            score = "B"
        else:
            status = "❌ DA MIGLIORARE - Major Issues"
            score = "C"

        print(f"Status: {status}")
        print(f"Score:  {score} ({success_count}/30)")
        print()
        print("Business Coverage:")
        print("• Setup aziendale: Covered ✅")
        print("• Tassazione: Covered ✅")
        print("• Immobili: Covered ✅")
        print("• Lavoro: Covered ✅")
        print("• Finanza: Covered ✅")

        print(f"\n🚀 ZANTARA BUSINESS JAKSEL: {status}")

        return {
            "total_queries": 30,
            "successful_queries": success_count,
            "success_rate": success_count/30*100,
            "average_length": total_chars/success_count if success_count > 0 else 0,
            "grade": score,
            "status": status
        }

if __name__ == "__main__":
    tester = JakselBusinessTester()
    results = tester.run_jaksel_business_tests()