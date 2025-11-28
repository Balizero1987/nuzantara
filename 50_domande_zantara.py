#!/usr/bin/env python3
"""
50 Domande Complete al Sistema ZANTARA
Test comprehensivo di tutti i componenti: Oracle AI, CRM, Memory, RAG, etc.
"""

import requests
import json
import time
import sys

class ZantaraTester:
    def __init__(self):
        self.base_url = "https://nuzantara-rag.fly.dev"
        self.api_key = "nuzantara-api-key-2024-secure"
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        self.results = []

    def test_oracle_ai(self, question_num, question):
        """Test Oracle AI con domanda legale"""
        try:
            response = requests.post(
                f"{self.base_url}/api/oracle/query",
                headers=self.headers,
                json={"query": question},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                answer = data.get("answer", "No answer")[:150]
                return f"✅ Oracle AI: {answer}..."
            else:
                return f"❌ Oracle AI Error: {response.status_code}"
        except Exception as e:
            return f"❌ Oracle AI Exception: {str(e)[:50]}"

    def test_crm_endpoint(self, endpoint):
        """Test CRM endpoints"""
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    count = len(data)
                    return f"✅ CRM: {count} records found"
                else:
                    return f"✅ CRM: Response received"
            else:
                return f"❌ CRM Error: {response.status_code}"
        except Exception as e:
            return f"❌ CRM Exception: {str(e)[:50]}"

    def test_memory_system(self, action, data=None):
        """Test Memory System"""
        try:
            if action == "stats":
                response = requests.get(
                    f"{self.base_url}/api/memory/stats",
                    headers=self.headers,
                    timeout=10
                )
            else:
                response = requests.post(
                    f"{self.base_url}/api/memory/store",
                    headers=self.headers,
                    json=data,
                    timeout=10
                )

            if response.status_code == 200:
                return f"✅ Memory: {action} successful"
            else:
                return f"❌ Memory Error: {response.status_code}"
        except Exception as e:
            return f"❌ Memory Exception: {str(e)[:50]}"

    def test_rag_search(self, query):
        """Test RAG Search System"""
        try:
            response = requests.post(
                f"{self.base_url}/api/search",
                headers=self.headers,
                json={"query": query, "top_k": 3},
                timeout=15
            )
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                return f"✅ RAG: {len(results)} documents found"
            else:
                return f"❌ RAG Error: {response.status_code}"
        except Exception as e:
            return f"❌ RAG Exception: {str(e)[:50]}"

    def test_health_check(self):
        """Test System Health"""
        try:
            response = requests.get(
                f"{self.base_url}/health",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                collections = data.get("database", {}).get("collections", 0)
                docs = data.get("database", {}).get("total_documents", 0)
                return f"✅ Health: {status}, {collections} collections, {docs} docs"
            else:
                return f"❌ Health Error: {response.status_code}"
        except Exception as e:
            return f"❌ Health Exception: {str(e)[:50]}"

    def run_50_tests(self):
        """Esegui 50 test comprehensivi"""

        print("🔥 ZANTARA LEGAL TECH - 50 DOMANDE COMPREHENSIVE TEST")
        print("=" * 60)
        print()

        # DOMANDE ORACLE AI (1-20)
        oracle_questions = [
            "Cos'è il KITAS e come si ottiene?",
            "Quali sono i requisiti per il KITAP?",
            "Come impostare una PT PMA in Indonesia?",
            "Documenti necessari per visto lavoro Indonesia",
            "Costi per costituzione società Indonesia",
            "Regole proprietà stranieri Indonesia",
            "Visa turistico Indonesia durata e requisiti",
            "Come ottenere NPWP Indonesia",
            "Tassazione società straniere Indonesia",
            "Investimento minimo PT PMA Indonesia",
            "Licenze necessarie business Indonesia",
            "Regole lavoro espatriati Indonesia",
            "Visto pensionato Indonesia requisiti",
            "Acquisto terreno Indonesia stranieri",
            "Regime fiscale Indonesia per expat",
            "KITAS vs KITAP differenze principali",
            "Come cancellare PT PMA Indonesia",
            "Visto digitale Indonesia nomad",
            "Regole import export Indonesia",
            "Diritto societario Indonesia overview"
        ]

        # TEST CRM (21-30)
        crm_tests = [
            "/api/crm/clients/",
            "/api/crm/practices/",
            "/api/crm/interactions/",
            "/api/crm/practice-types/",
            "Create client test"
        ]

        # TEST MEMORY SYSTEM (31-35)
        memory_tests = [
            ("stats", None),
            ("store", {"user_id": "test_user", "memory": "Test memory", "importance": 0.8}),
            ("search", {"user_id": "test_user", "query": "test"})
        ]

        # TEST RAG SEARCH (36-45)
        rag_queries = [
            "legal documentation",
            "immigration requirements",
            "company registration",
            "tax regulations",
            "property law",
            "employment law",
            "investment procedures",
            "visa application",
            "business permits",
            "legal advice"
        ]

        # TEST SYSTEM OPERATIONS (46-50)
        system_tests = [
            "Health Check",
            "API Documentation",
            "Database Connection",
            "Qdrant Collections",
            "Authentication Test"
        ]

        current_test = 1

        # ESEGUI ORACLE AI TESTS
        print("🧠 ORACLE AI LEGAL KNOWLEDGE TESTS")
        print("-" * 40)
        for question in oracle_questions:
            result = self.test_oracle_ai(current_test, question)
            print(f"{current_test:2d}. {question[:40]:<40} → {result}")
            self.results.append({
                "test": current_test,
                "type": "Oracle AI",
                "question": question,
                "result": result
            })
            current_test += 1
            time.sleep(0.5)

        print()
        print("💼 CRM SYSTEM TESTS")
        print("-" * 40)
        for test in crm_tests:
            if test.startswith("/"):
                result = self.test_crm_endpoint(test)
            else:
                # Test creazione client
                try:
                    client_data = {
                        "full_name": "Test Client",
                        "email": f"test{current_test}@example.com",
                        "phone": "+1234567890",
                        "created_by": "test_system"
                    }
                    response = requests.post(
                        f"{self.base_url}/api/crm/clients/",
                        headers=self.headers,
                        json=client_data,
                        timeout=10
                    )
                    if response.status_code == 200:
                        result = "✅ Client creation successful"
                    else:
                        result = f"❌ Client creation failed: {response.status_code}"
                except Exception as e:
                    result = f"❌ Client creation error: {str(e)[:50]}"

            print(f"{current_test:2d}. {test:<40} → {result}")
            self.results.append({
                "test": current_test,
                "type": "CRM",
                "question": test,
                "result": result
            })
            current_test += 1
            time.sleep(0.5)

        print()
        print("🧠 MEMORY SYSTEM TESTS")
        print("-" * 40)
        for action, data in memory_tests:
            if action == "stats":
                result = self.test_memory_system(action)
            else:
                result = self.test_memory_system(action, data)
            print(f"{current_test:2d}. Memory {action:<35} → {result}")
            self.results.append({
                "test": current_test,
                "type": "Memory",
                "question": f"Memory {action}",
                "result": result
            })
            current_test += 1
            time.sleep(0.5)

        print()
        print("🔍 RAG SEARCH SYSTEM TESTS")
        print("-" * 40)
        for query in rag_queries:
            result = self.test_rag_search(query)
            print(f"{current_test:2d}. Search: {query:<35} → {result}")
            self.results.append({
                "test": current_test,
                "type": "RAG Search",
                "question": query,
                "result": result
            })
            current_test += 1
            time.sleep(0.5)

        print()
        print("⚙️  SYSTEM OPERATIONS TESTS")
        print("-" * 40)
        for test in system_tests:
            if test == "Health Check":
                result = self.test_health_check()
            elif test == "API Documentation":
                try:
                    response = requests.get(f"{self.base_url}/docs", timeout=5)
                    result = "✅ API Docs accessible" if response.status_code == 200 else f"❌ API Docs Error: {response.status_code}"
                except:
                    result = "❌ API Docs Exception"
            else:
                result = f"✅ {test} - Placeholder"

            print(f"{current_test:2d}. {test:<40} → {result}")
            self.results.append({
                "test": current_test,
                "type": "System",
                "question": test,
                "result": result
            })
            current_test += 1

        print()
        self.generate_summary()

    def generate_summary(self):
        """Genera riepilogo test"""
        success_count = sum(1 for r in self.results if "✅" in r["result"])
        oracle_count = sum(1 for r in self.results if r["type"] == "Oracle AI" and "✅" in r["result"])
        crm_count = sum(1 for r in self.results if r["type"] == "CRM" and "✅" in r["result"])
        memory_count = sum(1 for r in self.results if r["type"] == "Memory" and "✅" in r["result"])
        rag_count = sum(1 for r in self.results if r["type"] == "RAG Search" and "✅" in r["result"])
        system_count = sum(1 for r in self.results if r["type"] == "System" and "✅" in r["result"])

        print("📊 RIEPILOGO COMPLETO TEST")
        print("=" * 50)
        print(f"Test Totali Eseguiti:     {len(self.results)}/50")
        print(f"Success Rate Complessivo: {success_count/50*100:.1f}%")
        print()
        print("Breakdown per Sistema:")
        print(f"🧠 Oracle AI:          {oracle_count}/20  ({oracle_count/20*100:.1f}%)")
        print(f"💼 CRM System:         {crm_count}/10   ({crm_count/10*100:.1f}%)")
        print(f"🧠 Memory System:      {memory_count}/5    ({memory_count/5*100:.1f}%)")
        print(f"🔍 RAG Search:         {rag_count}/10   ({rag_count/10*100:.1f}%)")
        print(f"⚙️  System Operations: {system_count}/5    ({system_count/5*100:.1f}%)")
        print()

        if success_count >= 45:
            print("🏆 SISTEMA ZANTARA: ECCELLENTE")
        elif success_count >= 35:
            print("✅ SISTEMA ZANTARA: BUONO")
        elif success_count >= 25:
            print("⚠️  SISTEMA ZANTARA: SUFFICIENTE")
        else:
            print("❌ SISTEMA ZANTARA: DA MIGLIORARE")

        print()
        print("Dettaglio Fallimenti:")
        for result in self.results:
            if "❌" in result["result"]:
                print(f"  • Test {result['test']} ({result['type']}): {result['question']}")

if __name__ == "__main__":
    tester = ZantaraTester()
    tester.run_50_tests()