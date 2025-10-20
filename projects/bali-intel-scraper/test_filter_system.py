#!/usr/bin/env python3
"""
TEST IN DIRETTA: Sistema di Filtraggio Intelligente LLAMA
Mostra ogni riga di codice in esecuzione
"""

import json
import logging
from datetime import datetime
from llama_intelligent_filter import LLAMAFilter

# Setup logging per vedere tutto
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_filter.log')
    ]
)

def create_test_data():
    """Crea dati di test realistici per il sistema"""
    print("🔧 CREANDO DATI DI TEST...")
    
    test_articles = [
        {
            'title': 'New Visa Requirements for Indonesia 2024 - Government Update',
            'content': 'The Indonesian government has announced new visa requirements for foreign nationals. The new regulations will take effect from January 1, 2024. All applicants must provide additional documentation including health certificates and proof of financial stability. The processing time has been extended to 14 business days.',
            'url': 'https://immigration.go.id/new-visa-requirements-2024',
            'tier': 'T1',
            'category': 'immigration',
            'scraped_at': '2024-01-15T10:00:00Z',
            'impact_level': 'high',
            'source_name': 'Indonesian Immigration Office'
        },
        {
            'title': 'Click here for more info',
            'content': 'Advertisement content. Click here to read more about our sponsored services. This is an advertisement.',
            'url': 'https://spam.com/click-here',
            'tier': 'T3',
            'category': 'immigration',
            'scraped_at': '2024-01-15T10:00:00Z',
            'impact_level': 'low',
            'source_name': 'Spam Site'
        },
        {
            'title': 'New Visa Requirements for Indonesia 2024 - Government Update',
            'content': 'The Indonesian government has announced new visa requirements for foreign nationals. The new regulations will take effect from January 1, 2024. All applicants must provide additional documentation including health certificates and proof of financial stability. The processing time has been extended to 14 business days.',
            'url': 'https://duplicate.com/visa-requirements',
            'tier': 'T1',
            'category': 'immigration',
            'scraped_at': '2024-01-15T10:00:00Z',
            'impact_level': 'high',
            'source_name': 'Duplicate Site'
        },
        {
            'title': 'Business License Registration Process in Bali',
            'content': 'Starting a business in Bali requires proper licensing through the BKPM (Investment Coordinating Board). The process involves several steps including company registration, tax identification, and business permit applications. The average processing time is 30-45 days.',
            'url': 'https://bkpm.go.id/business-license-bali',
            'tier': 'T1',
            'category': 'business',
            'scraped_at': '2024-01-15T09:30:00Z',
            'impact_level': 'medium',
            'source_name': 'BKPM Official'
        },
        {
            'title': 'Short',
            'content': 'Too short content.',
            'url': 'https://short.com',
            'tier': 'T3',
            'category': 'business',
            'scraped_at': '2024-01-15T09:30:00Z',
            'impact_level': 'low',
            'source_name': 'Short Site'
        },
        {
            'title': 'Property Investment Opportunities in Ubud',
            'content': 'Ubud offers excellent property investment opportunities for foreign investors. The area has seen significant growth in tourism and real estate values. New regulations allow foreign ownership of certain property types with proper documentation and investment thresholds.',
            'url': 'https://property-bali.com/ubud-investment',
            'tier': 'T2',
            'category': 'property',
            'scraped_at': '2024-01-15T08:45:00Z',
            'impact_level': 'medium',
            'source_name': 'Bali Property News'
        }
    ]
    
    print(f"✅ Creati {len(test_articles)} articoli di test")
    return test_articles

def test_llama_filter():
    """Test completo del filtro LLAMA"""
    print("\n🚀 INIZIANDO TEST LLAMA FILTER...")
    print("=" * 60)
    
    # Crea dati di test
    test_articles = create_test_data()
    
    # Mostra articoli originali
    print(f"\n📊 ARTICOLI ORIGINALI ({len(test_articles)}):")
    for i, article in enumerate(test_articles, 1):
        print(f"  {i}. {article['title'][:50]}...")
        print(f"     Tier: {article['tier']}, Category: {article['category']}")
        print(f"     Impact: {article['impact_level']}, Length: {len(article['content'])}")
        print()
    
    # Inizializza filtro LLAMA
    print("🔧 INIZIALIZZANDO LLAMA FILTER...")
    llama_filter = LLAMAFilter()
    print(f"   Quality Threshold: {llama_filter.quality_threshold}")
    print(f"   Impact Threshold: {llama_filter.impact_threshold}")
    print(f"   Duplicate Threshold: {llama_filter.duplicate_threshold}")
    
    # Esegui filtro intelligente
    print("\n🔍 ESECUZIONE FILTRO INTELLIGENTE...")
    print("-" * 40)
    
    try:
        filtered_articles = llama_filter.intelligent_filter(test_articles)
        
        print(f"\n📈 RISULTATI FILTRO:")
        print(f"   Articoli originali: {len(test_articles)}")
        print(f"   Articoli filtrati: {len(filtered_articles)}")
        print(f"   Spam rimossi: {len(test_articles) - len(filtered_articles)}")
        print(f"   Tasso di filtraggio: {((len(test_articles) - len(filtered_articles)) / len(test_articles) * 100):.1f}%")
        
        # Mostra articoli filtrati
        print(f"\n✅ ARTICOLI PASSATI FILTRO ({len(filtered_articles)}):")
        for i, article in enumerate(filtered_articles, 1):
            print(f"  {i}. {article['title'][:50]}...")
            print(f"     Tier: {article['tier']}, Category: {article['category']}")
            print(f"     Impact: {article['impact_level']}, LLAMA Score: {article.get('llama_score', 'N/A')}")
            print(f"     Length: {len(article['content'])} chars")
            print()
        
        # Analisi dettagliata
        print("📊 ANALISI DETTAGLIATA:")
        if filtered_articles:
            scores = [a.get('llama_score', 0) for a in filtered_articles]
            print(f"   Score medio: {sum(scores) / len(scores):.3f}")
            print(f"   Score massimo: {max(scores):.3f}")
            print(f"   Score minimo: {min(scores):.3f}")
        
        # Categorie rappresentate
        categories = set(a['category'] for a in filtered_articles)
        print(f"   Categorie rappresentate: {', '.join(categories)}")
        
        # Tier distribution
        tier_dist = {}
        for article in filtered_articles:
            tier = article['tier']
            tier_dist[tier] = tier_dist.get(tier, 0) + 1
        print(f"   Distribuzione tier: {tier_dist}")
        
        return filtered_articles
        
    except Exception as e:
        print(f"❌ ERRORE DURANTE FILTRO: {e}")
        import traceback
        traceback.print_exc()
        return []

def main():
    """Funzione principale di test"""
    print("🎯 TEST SISTEMA FILTRAGGIO INTELLIGENTE LLAMA")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    try:
        # Esegui test
        filtered_articles = test_llama_filter()
        
        # Salva risultati
        if filtered_articles:
            with open('test_results.json', 'w') as f:
                json.dump(filtered_articles, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Risultati salvati in test_results.json")
        
        print("\n✅ TEST COMPLETATO CON SUCCESSO!")
        
    except Exception as e:
        print(f"\n❌ ERRORE GENERALE: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
