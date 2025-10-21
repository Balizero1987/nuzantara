#!/usr/bin/env python3
"""
TEST IN DIRETTA: Sistema di Filtraggio per NOTIZIE VERE
Mostra ogni riga di codice in esecuzione
"""

import json
import logging
from datetime import datetime
from news_intelligent_filter import NewsIntelligentFilter

# Setup logging per vedere tutto
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_news_filter.log')
    ]
)

def create_real_news_test_data():
    """Crea dati di test con NOTIZIE VERE"""
    print("🔧 CREANDO DATI DI TEST CON NOTIZIE VERE...")
    
    test_articles = [
        {
            'title': 'BREAKING: New Visa Requirements Announced by Indonesian Government',
            'content': 'The Indonesian government has just announced new visa requirements for foreign nationals. The new regulations will take effect from January 1, 2024. All applicants must provide additional documentation including health certificates and proof of financial stability. The processing time has been extended to 14 business days. This is a major change that will affect thousands of foreign workers in Indonesia.',
            'url': 'https://immigration.go.id/breaking-visa-requirements-2024',
            'tier': 'T1',
            'category': 'immigration',
            'scraped_at': '2024-01-15T10:00:00Z',
            'impact_level': 'high',
            'source_name': 'Indonesian Immigration Office'
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
            'title': 'URGENT: Major Tax Policy Changes Announced Today',
            'content': 'The Indonesian government has announced major changes to tax policy that will take effect immediately. The new tax rates will affect all businesses operating in Indonesia. This is a critical update that requires immediate attention from all business owners.',
            'url': 'https://tax.go.id/urgent-tax-changes-2024',
            'tier': 'T1',
            'category': 'tax',
            'scraped_at': '2024-01-15T08:45:00Z',
            'impact_level': 'critical',
            'source_name': 'Indonesian Tax Office'
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
        },
        {
            'title': 'EXCLUSIVE: New Healthcare Policy Revealed',
            'content': 'An exclusive report reveals that the Indonesian government is planning major healthcare policy changes. The new policy will affect all residents and foreign workers. This is a significant development that will impact millions of people.',
            'url': 'https://health.go.id/exclusive-healthcare-policy',
            'tier': 'T1',
            'category': 'healthcare',
            'scraped_at': '2024-01-15T07:30:00Z',
            'impact_level': 'high',
            'source_name': 'Indonesian Health Ministry'
        },
        {
            'title': 'How to Apply for Business License',
            'content': 'This guide explains the step-by-step process for applying for a business license in Indonesia. You need to gather the required documents, fill out the application form, and submit it to the relevant authorities.',
            'url': 'https://guide.com/how-to-apply-business-license',
            'tier': 'T3',
            'category': 'business',
            'scraped_at': '2024-01-15T06:00:00Z',
            'impact_level': 'low',
            'source_name': 'Business Guide'
        }
    ]
    
    print(f"✅ Creati {len(test_articles)} articoli di test")
    return test_articles

def test_news_filter():
    """Test completo del filtro per NOTIZIE VERE"""
    print("\n🚀 INIZIANDO TEST NEWS FILTER...")
    print("=" * 60)
    
    # Crea dati di test
    test_articles = create_real_news_test_data()
    
    # Mostra articoli originali
    print(f"\n📊 ARTICOLI ORIGINALI ({len(test_articles)}):")
    for i, article in enumerate(test_articles, 1):
        print(f"  {i}. {article['title'][:50]}...")
        print(f"     Tier: {article['tier']}, Category: {article['category']}")
        print(f"     Impact: {article['impact_level']}, Length: {len(article['content'])}")
        print()
    
    # Inizializza filtro NOTIZIE
    print("🔧 INIZIALIZZANDO NEWS FILTER...")
    news_filter = NewsIntelligentFilter()
    print(f"   Quality Threshold: {news_filter.quality_threshold}")
    print(f"   News Threshold: {news_filter.news_threshold}")
    print(f"   Breaking Threshold: {news_filter.breaking_threshold}")
    
    # Esegui filtro per NOTIZIE VERE
    print("\n🔍 ESECUZIONE FILTRO NOTIZIE VERE...")
    print("-" * 40)
    
    try:
        filtered_articles = news_filter.filter_real_news(test_articles)
        
        print(f"\n📈 RISULTATI FILTRO NOTIZIE:")
        print(f"   Articoli originali: {len(test_articles)}")
        print(f"   Notizie vere: {len(filtered_articles)}")
        print(f"   Procedure/Guide rimosse: {len(test_articles) - len(filtered_articles)}")
        print(f"   Tasso di filtraggio: {((len(test_articles) - len(filtered_articles)) / len(test_articles) * 100):.1f}%")
        
        # Mostra NOTIZIE VERE
        print(f"\n✅ NOTIZIE VERE TROVATE ({len(filtered_articles)}):")
        for i, article in enumerate(filtered_articles, 1):
            print(f"  {i}. {article['title'][:50]}...")
            print(f"     Tier: {article['tier']}, Category: {article['category']}")
            print(f"     Impact: {article['impact_level']}, News Score: {article.get('news_score', 'N/A')}")
            print(f"     Breaking Score: {article.get('breaking_score', 'N/A')}")
            print(f"     Length: {len(article['content'])} chars")
            print()
        
        # Analisi dettagliata
        print("📊 ANALISI DETTAGLIATA:")
        if filtered_articles:
            scores = [a.get('news_score', 0) for a in filtered_articles]
            breaking_scores = [a.get('breaking_score', 0) for a in filtered_articles]
            print(f"   News Score medio: {sum(scores) / len(scores):.3f}")
            print(f"   Breaking Score medio: {sum(breaking_scores) / len(breaking_scores):.3f}")
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
    print("🎯 TEST SISTEMA FILTRAGGIO NOTIZIE VERE")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    try:
        # Esegui test
        filtered_articles = test_news_filter()
        
        # Salva risultati
        if filtered_articles:
            with open('test_news_results.json', 'w') as f:
                json.dump(filtered_articles, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Risultati salvati in test_news_results.json")
        
        print("\n✅ TEST COMPLETATO CON SUCCESSO!")
        
    except Exception as e:
        print(f"\n❌ ERRORE GENERALE: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
