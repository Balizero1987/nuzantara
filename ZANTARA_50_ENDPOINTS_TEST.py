#!/usr/bin/env python3
"""
Test Completivo - 50 Endpoint Zantara Verifica End-to-End
"""

import requests
import json
import time
import concurrent.futures
from datetime import datetime

def test_50_zantara_endpoints():
    """Test completo di 50 endpoint Zantara con diverse categorie"""

    base_url = "https://nuzantara-rag.fly.dev"
    api_key = "zantara-secret-2024"

    print("🎯 ZANTARA 50 ENDPOINTS TEST - COMPLETO")
    print("=" * 80)
    print(f"📅 Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Base URL: {base_url}")
    print(f"🔑 API Key: {api_key}")
    print("=" * 80)

    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key
    }

    results = []
    success_count = 0
    error_count = 0

    # Categoria 1: Health & Status (5 endpoint)
    health_endpoints = [
        ("/health", "GET", {}, "Public Health Check"),
        ("/api/csrf-token", "GET", {}, "Public CSRF Token"),
        ("/api/oracle/health", "GET", {}, "Oracle Service Health"),
        ("/api/search/health", "GET", {}, "Search Service Health"),
        ("/api/intel/health", "GET", {}, "Intel Service Health"),
    ]

    # Categoria 2: Oracle Service (10 endpoint)
    oracle_endpoints = [
        ("/api/oracle/personalities", "GET", {}, "Oracle Personalities"),
        ("/api/oracle/gemini/test", "GET", {}, "Gemini Test"),
        ("/api/oracle/analyze", "POST", {"text": "Test analysis"}, "Oracle Analysis"),
        ("/api/oracle/predict", "POST", {"query": "Test prediction"}, "Oracle Prediction"),
        ("/api/oracle/recommend", "POST", {"context": "Test context"}, "Oracle Recommendation"),
        ("/api/oracle/summarize", "POST", {"content": "Long test content for summarization..."}, "Oracle Summarization"),
        ("/api/oracle/translate", "POST", {"text": "Hello world", "target_lang": "it"}, "Oracle Translation"),
        ("/api/oracle/classify", "POST", {"text": "Business meeting tomorrow"}, "Oracle Classification"),
        ("/api/oracle/sentiment", "POST", {"text": "I love this product!"}, "Oracle Sentiment"),
        ("/api/oracle/entities", "POST", {"text": "Apple and Microsoft are tech companies"}, "Oracle Entity Recognition"),
    ]

    # Categoria 3: Search Service (8 endpoint)
    search_endpoints = [
        ("/api/search/query", "POST", {"query": "test search"}, "Basic Search"),
        ("/api/search/similar", "POST", {"text": "test content"}, "Similar Search"),
        ("/api/search/vector", "POST", {"query": "test embedding"}, "Vector Search"),
        ("/api/search/hybrid", "POST", {"query": "test hybrid"}, "Hybrid Search"),
        ("/api/search/semantic", "POST", {"query": "test semantic"}, "Semantic Search"),
        ("/api/search/filters", "POST", {"query": "test", "filters": {"category": "tech"}}, "Filtered Search"),
        ("/api/search/aggregations", "POST", {"query": "test", "aggs": {"category": {}}}, "Aggregated Search"),
        ("/api/search/suggestions", "POST", {"query": "test sugg"}, "Search Suggestions"),
    ]

    # Categoria 4: Intel Service (8 endpoint)
    intel_endpoints = [
        ("/api/intel/critical", "GET", {}, "Critical Intel"),
        ("/api/intel/trends", "GET", {}, "Intel Trends"),
        ("/api/intel/alerts", "GET", {}, "Intel Alerts"),
        ("/api/intel/reports", "GET", {}, "Intel Reports"),
        ("/api/intel/analytics", "POST", {"type": "usage"}, "Intel Analytics"),
        ("/api/intel/metrics", "POST", {"period": "daily"}, "Intel Metrics"),
        ("/api/intel/insights", "POST", {"category": "performance"}, "Intel Insights"),
        ("/api/intel/forecast", "POST", {"metric": "users"}, "Intel Forecast"),
    ]

    # Categoria 5: CRM Service (7 endpoint)
    crm_endpoints = [
        ("/api/crm/interactions/sync-gmail", "POST", {"test": "true"}, "Gmail Sync"),
        ("/api/crm/contacts/list", "POST", {}, "Contacts List"),
        ("/api/crm/activities/create", "POST", {"type": "call", "description": "Test call"}, "Create Activity"),
        ("/api/crm/deals/list", "POST", {}, "Deals List"),
        ("/api/crm/notes/add", "POST", {"contact_id": "test", "content": "Test note"}, "Add Note"),
        ("/api/crm/tasks/create", "POST", {"title": "Test task"}, "Create Task"),
        ("/api/crm/calendar/sync", "POST", {}, "Calendar Sync"),
    ]

    # Categoria 6: Dashboard & Analytics (6 endpoint)
    dashboard_endpoints = [
        ("/api/dashboard/stats", "GET", {}, "Dashboard Stats"),
        ("/api/dashboard/metrics", "POST", {"period": "week"}, "Dashboard Metrics"),
        ("/api/dashboard/charts", "POST", {"type": "line"}, "Dashboard Charts"),
        ("/api/dashboard/reports", "POST", {"type": "performance"}, "Dashboard Reports"),
        ("/api/dashboard/alerts", "GET", {}, "Dashboard Alerts"),
        ("/api/dashboard/overview", "GET", {}, "Dashboard Overview"),
    ]

    # Categoria 7: Bali-Zero Chat Service (6 endpoint)
    chat_endpoints = [
        ("/bali-zero/chat-stream", "GET", {"query": "hello test"}, "Chat Stream"),
        ("/bali-zero/chat-complete", "POST", {"message": "Complete this thought"}, "Chat Complete"),
        ("/bali-zero/chat-history", "GET", {"limit": 10}, "Chat History"),
        ("/bali-zero/chat-settings", "GET", {}, "Chat Settings"),
        ("/bali-zero/chat-reset", "POST", {}, "Chat Reset"),
        ("/bali-zero/chat-status", "GET", {}, "Chat Status"),
    ]

    # Categoria 8: Admin & Config (5 endpoint)
    admin_endpoints = [
        ("/api/admin/settings", "GET", {}, "Admin Settings"),
        ("/api/admin/users", "GET", {}, "Admin Users"),
        ("/api/admin/logs", "GET", {"lines": 100}, "Admin Logs"),
        ("/api/admin/backup", "POST", {}, "Admin Backup"),
        ("/api/admin/status", "GET", {}, "Admin Status"),
    ]

    # Categoria 9: Handlers & Tools (5 endpoint)
    handlers_endpoints = [
        ("/api/handlers/list", "GET", {}, "Handlers List"),
        ("/api/handlers/execute", "POST", {"handler": "test", "input": "test data"}, "Execute Handler"),
        ("/api/handlers/status", "GET", {"handler": "test"}, "Handler Status"),
        ("/api/handlers/config", "GET", {}, "Handlers Config"),
        ("/api/handlers/logs", "GET", {"handler": "test"}, "Handler Logs"),
    ]

    # Categoria 10: Files & Storage (5 endpoint)
    files_endpoints = [
        ("/api/files/upload", "POST", {}, "File Upload"),
        ("/api/files/list", "POST", {}, "Files List"),
        ("/api/files/download", "POST", {"file_id": "test"}, "File Download"),
        ("/api/files/delete", "POST", {"file_id": "test"}, "File Delete"),
        ("/api/files/info", "POST", {"file_id": "test"}, "File Info"),
    ]

    all_endpoints = [
        ("HEALTH", health_endpoints),
        ("ORACLE", oracle_endpoints),
        ("SEARCH", search_endpoints),
        ("INTEL", intel_endpoints),
        ("CRM", crm_endpoints),
        ("DASHBOARD", dashboard_endpoints),
        ("CHAT", chat_endpoints),
        ("ADMIN", admin_endpoints),
        ("HANDLERS", handlers_endpoints),
        ("FILES", files_endpoints),
    ]

    # Test di tutti gli endpoint
    total_endpoints = sum(len(endpoints) for _, endpoints in all_endpoints)

    print(f"\n🧪 Inizio test di {total_endpoints} endpoint...")
    print("=" * 80)

    for category, endpoints in all_endpoints:
        print(f"\n📁 Categoria: {category.upper()}")
        print("-" * 50)

        for i, (endpoint, method, data, description) in enumerate(endpoints, 1):
            print(f"  {i:2d}. {description}")

            try:
                start_time = time.time()

                if method == "GET":
                    if data:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers, params=data, timeout=10)
                    else:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=10)
                else:  # POST
                    response = requests.post(f"{base_url}{endpoint}", headers=headers, json=data, timeout=10)

                elapsed = time.time() - start_time

                # Valuta la risposta
                if response.status_code == 200:
                    status = "✅ SUCCESS"
                    success_count += 1

                    # Controlla se è JSON valido
                    try:
                        json_data = response.json()
                        json_size = len(json.dumps(json_data))
                        print(f"      Status: {response.status_code} | Time: {elapsed:.3f}s | Size: {json_size} bytes | ✅ JSON Valid")
                    except:
                        content_size = len(response.text)
                        print(f"      Status: {response.status_code} | Time: {elapsed:.3f}s | Size: {content_size} chars | 📄 Text Response")

                elif response.status_code in [404, 415, 500, 501, 502, 503]:
                    status = "⚠️  EXPECTED"
                    error_count += 1
                    print(f"      Status: {response.status_code} | Time: {elapsed:.3f}s | {status} | Endpoint not implemented or wrong method")

                else:
                    status = "❌ ERROR"
                    error_count += 1
                    print(f"      Status: {response.status_code} | Time: {elapsed:.3f}s | {status} | {response.text[:100]}")

                results.append({
                    "endpoint": endpoint,
                    "method": method,
                    "status": response.status_code,
                    "time": elapsed,
                    "success": response.status_code == 200
                })

            except Exception as e:
                error_count += 1
                print(f"      Status: ERROR | Time: N/A | ❌ FAILED | {str(e)}")
                results.append({
                    "endpoint": endpoint,
                    "method": method,
                    "status": "ERROR",
                    "time": 0,
                    "success": False,
                    "error": str(e)
                })

    # Test speciali: Concurrent requests
    print(f"\n🔄 Test di richieste concorrenti...")
    print("-" * 50)

    concurrent_endpoints = [
        ("/api/oracle/health", "GET"),
        ("/api/search/health", "GET"),
        ("/api/intel/critical", "GET"),
        ("/api/dashboard/stats", "GET"),
        ("/bali-zero/chat-stream", "GET", {"query": "concurrent test"}),
    ]

    def make_concurrent_request(endpoint_info):
        endpoint, method = endpoint_info[:2]
        data = endpoint_info[2] if len(endpoint_info) > 2 else {}

        try:
            start_time = time.time()
            if method == "GET" and data:
                response = requests.get(f"{base_url}{endpoint}", headers=headers, params=data, timeout=5)
            elif method == "GET":
                response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=5)
            else:
                response = requests.post(f"{base_url}{endpoint}", headers=headers, json=data, timeout=5)

            elapsed = time.time() - start_time
            return (endpoint, response.status_code, elapsed, response.elapsed.total_seconds())
        except Exception as e:
            return (endpoint, f"ERROR: {e}", 0, 0)

    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        concurrent_results = list(executor.map(make_concurrent_request, concurrent_endpoints))
    total_time = time.time() - start_time

    print(f"   5 richieste concorrenti completate in {total_time:.3f}s")
    for endpoint, status, elapsed, total in concurrent_results:
        status_str = "✅" if status == 200 else "❌"
        print(f"   {endpoint}: {status} ({elapsed:.3f}s) {status_str}")

    # Report finale
    print("\n" + "=" * 80)
    print("🎉 ZANTARA 50 ENDPOINTS TEST - RIEPILOGO FINALE")
    print("=" * 80)

    print(f"\n📊 Statistiche Generali:")
    print(f"   • Endpoint totali testati: {total_endpoints}")
    print(f"   • Successi: {success_count} ({(success_count/total_endpoints)*100:.1f}%)")
    print(f"   • Errori: {error_count} ({(error_count/total_endpoints)*100:.1f}%)")
    print(f"   • Tempo totale test: {total_time:.3f}s (concurrent)")

    # Per categoria
    print(f"\n📁 Performance per Categoria:")
    for category, endpoints in all_endpoints:
        category_success = sum(1 for r in results if r["endpoint"] in [e[0] for e in endpoints] and r["success"])
        category_total = len(endpoints)
        category_rate = (category_success/category_total)*100 if category_total > 0 else 0
        print(f"   • {category}: {category_success}/{category_total} ({category_rate:.1f}%)")

    # Endpoint più lenti
    slow_endpoints = sorted([r for r in results if r.get("time", 0) > 0], key=lambda x: x["time"], reverse=True)[:5]
    print(f"\n⏰ Endpoint più lenti:")
    for endpoint in slow_endpoints:
        print(f"   • {endpoint['endpoint']}: {endpoint['time']:.3f}s")

    # Endpoint con errori
    error_endpoints = [r for r in results if not r["success"]]
    if error_endpoints:
        print(f"\n❌ Endpoint con errori:")
        for endpoint in error_endpoints[:10]:  # Mostra solo i primi 10
            error_msg = endpoint.get("error", "Unknown error")
            print(f"   • {endpoint['endpoint']}: {error_msg}")

    # Valutazione finale
    success_rate = (success_count / total_endpoints) * 100
    print(f"\n🎯 VALUTAZIONE FINALE:")

    if success_rate >= 80:
        grade = "A"
        status = "🏆 ECCELLENTE - Sistema production ready"
    elif success_rate >= 60:
        grade = "B"
        status = "✅ BUONO - Sistema funzionante con alcuni miglioramenti"
    elif success_rate >= 40:
        grade = "C"
        status = "⚠️  SUFFICIENTE - Sistema parzialmente funzionante"
    else:
        grade = "D"
        status = "❌ INSUFFICIENTE - Richiede attenzione immediata"

    print(f"   • Voto: {grade}")
    print(f"   • Tasso di successo: {success_rate:.1f}%")
    print(f"   • Stato: {status}")

    # Salva risultati in file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f"/Users/antonellosiano/Desktop/nuzantara/ZANTARA_50_ENDPOINTS_RESULTS_{timestamp}.json", "w") as f:
        json.dump({
            "timestamp": timestamp,
            "total_endpoints": total_endpoints,
            "success_count": success_count,
            "error_count": error_count,
            "success_rate": success_rate,
            "results": results,
            "concurrent_results": concurrent_results
        }, f, indent=2)

    print(f"\n💾 Risultati salvati in: ZANTARA_50_ENDPOINTS_RESULTS_{timestamp}.json")

    return success_rate, results

if __name__ == "__main__":
    test_50_zantara_endpoints()