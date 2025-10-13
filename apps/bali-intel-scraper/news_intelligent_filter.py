import json
import logging
from typing import List, Dict, Any
from datetime import datetime
import re

class NewsIntelligentFilter:
    def __init__(self):
        self.quality_threshold = 0.8
        self.news_threshold = 0.7
        self.breaking_threshold = 0.9
        self.logger = logging.getLogger(__name__)
        
    def filter_real_news(self, articles: List[Dict]) -> List[Dict]:
        """Filtro intelligente per NOTIZIE VERE, non procedure"""
        self.logger.info(f"🔍 News Filter: Analizzando {len(articles)} articoli")
        
        # Step 1: Filtro per NOTIZIE (non procedure)
        news_filtered = self._filter_news_only(articles)
        self.logger.info(f"✅ Dopo filtro notizie: {len(news_filtered)} articoli")
        
        # Step 2: Filtro per BREAKING NEWS
        breaking_filtered = self._filter_breaking_news(news_filtered)
        self.logger.info(f"✅ Dopo filtro breaking: {len(breaking_filtered)} articoli")
        
        # Step 3: Scoring per IMPATTO REALE
        scored_articles = self._score_news_impact(breaking_filtered)
        self.logger.info(f"✅ Dopo scoring impatto: {len(scored_articles)} articoli")
        
        # Step 4: Filtro finale per QUALITÀ NOTIZIA
        final_filtered = self._final_news_filter(scored_articles)
        self.logger.info(f"🎯 FINALE: {len(final_filtered)} NOTIZIE VERE")
        
        return final_filtered
    
    def _filter_news_only(self, articles: List[Dict]) -> List[Dict]:
        """Filtro per NOTIZIE VERE, esclude procedure e descrizioni"""
        news_articles = []
        
        for article in articles:
            title = article.get('title', '').lower()
            content = article.get('content', '').lower()
            
            # Esclude procedure burocratiche
            procedure_keywords = [
                'process', 'procedure', 'steps', 'requirements', 
                'registration', 'application', 'documentation',
                'how to', 'guide', 'tutorial', 'instructions'
            ]
            
            if any(keyword in title or keyword in content for keyword in procedure_keywords):
                continue
            
            # Esclude descrizioni generiche
            generic_keywords = [
                'overview', 'introduction', 'about', 'general',
                'basic', 'fundamental', 'principles'
            ]
            
            if any(keyword in title or keyword in content for keyword in generic_keywords):
                continue
            
            # Deve contenere elementi di NOTIZIA
            news_indicators = [
                'announced', 'reported', 'confirmed', 'revealed',
                'breaking', 'latest', 'update', 'new', 'recent',
                'yesterday', 'today', 'this week', 'this month'
            ]
            
            if any(indicator in title or indicator in content for indicator in news_indicators):
                news_articles.append(article)
                
        return news_articles
    
    def _filter_breaking_news(self, articles: List[Dict]) -> List[Dict]:
        """Filtro per BREAKING NEWS e notizie importanti"""
        breaking_articles = []
        
        for article in articles:
            title = article.get('title', '').lower()
            content = article.get('content', '').lower()
            
            # Breaking news indicators
            breaking_keywords = [
                'breaking', 'urgent', 'alert', 'emergency',
                'crisis', 'scandal', 'investigation', 'exclusive',
                'just announced', 'immediately', 'asap'
            ]
            
            # Impact keywords
            impact_keywords = [
                'major', 'significant', 'important', 'critical',
                'historic', 'unprecedented', 'first time',
                'revolutionary', 'game-changing'
            ]
            
            # Date indicators (notizie recenti)
            date_indicators = [
                'today', 'yesterday', 'this week', 'this month',
                'january', 'february', 'march', 'april', 'may',
                'june', 'july', 'august', 'september', 'october',
                'november', 'december', '2024', '2025'
            ]
            
            breaking_score = 0
            
            # Conta breaking keywords
            breaking_score += sum(1 for kw in breaking_keywords if kw in title or kw in content)
            
            # Conta impact keywords
            breaking_score += sum(1 for kw in impact_keywords if kw in title or kw in content)
            
            # Conta date indicators
            breaking_score += sum(1 for kw in date_indicators if kw in title or kw in content)
            
            # Score per tier
            tier = article.get('tier', 'T3')
            if tier == 'T1':
                breaking_score += 3
            elif tier == 'T2':
                breaking_score += 2
            else:
                breaking_score += 1
            
            # Solo articoli con score alto
            if breaking_score >= 3:
                article['breaking_score'] = breaking_score
                breaking_articles.append(article)
                
        return breaking_articles
    
    def _score_news_impact(self, articles: List[Dict]) -> List[Dict]:
        """Scoring per IMPATTO REALE delle notizie"""
        scored_articles = []
        
        for article in articles:
            score = 0.0
            
            # Score per lunghezza contenuto (notizie complete)
            content_length = len(article.get('content', ''))
            if content_length > 500:
                score += 0.2
            elif content_length > 300:
                score += 0.1
            
            # Score per tier source
            tier = article.get('tier', 'T3')
            if tier == 'T1':
                score += 0.3
            elif tier == 'T2':
                score += 0.2
            else:
                score += 0.1
            
            # Score per breaking score
            breaking_score = article.get('breaking_score', 0)
            score += min(breaking_score * 0.1, 0.3)
            
            # Score per keywords di notizia
            news_keywords = self._get_news_keywords(article.get('category', ''))
            content_lower = article.get('content', '').lower()
            title_lower = article.get('title', '').lower()
            
            keyword_matches = sum(1 for kw in news_keywords if kw.lower() in content_lower or kw.lower() in title_lower)
            score += min(keyword_matches * 0.1, 0.2)
            
            # Score per data freshness
            scraped_at = article.get('scraped_at', '')
            if scraped_at:
                try:
                    scraped_date = datetime.fromisoformat(scraped_at.replace('Z', '+00:00'))
                    hours_old = (datetime.now() - scraped_date).total_seconds() / 3600
                    if hours_old < 6:
                        score += 0.3
                    elif hours_old < 24:
                        score += 0.2
                    elif hours_old < 48:
                        score += 0.1
                except:
                    pass
            
            article['news_score'] = round(score, 3)
            scored_articles.append(article)
            
        return scored_articles
    
    def _get_news_keywords(self, category: str) -> List[str]:
        """Keywords per NOTIZIE per categoria"""
        news_keywords_map = {
            'immigration': ['visa changes', 'immigration policy', 'passport requirements', 'residence permit', 'citizenship'],
            'business': ['business news', 'investment', 'company registration', 'business license', 'economic'],
            'tax': ['tax changes', 'tax policy', 'revenue', 'taxation', 'fiscal'],
            'property': ['property news', 'real estate', 'land prices', 'property market', 'housing'],
            'healthcare': ['health news', 'medical', 'hospital', 'health policy', 'healthcare'],
            'education': ['education news', 'school', 'university', 'education policy', 'academic'],
            'transportation': ['transport news', 'vehicle', 'traffic', 'transport policy', 'infrastructure'],
            'employment': ['job news', 'employment', 'salary', 'work policy', 'labor'],
            'banking': ['banking news', 'finance', 'banking policy', 'financial', 'economy'],
            'legal': ['legal news', 'law', 'court', 'legal policy', 'legislation'],
            'tourism': ['tourism news', 'travel', 'tourist', 'tourism policy', 'destination'],
            'technology': ['tech news', 'digital', 'technology', 'innovation', 'digital policy'],
            'environment': ['environment news', 'climate', 'environmental policy', 'sustainability', 'green'],
            'culture': ['culture news', 'cultural', 'heritage', 'cultural policy', 'tradition'],
            'sports': ['sports news', 'sport', 'athletic', 'sports policy', 'competition'],
            'food': ['food news', 'restaurant', 'culinary', 'food policy', 'dining'],
            'shopping': ['shopping news', 'retail', 'market', 'shopping policy', 'commerce']
        }
        
        return news_keywords_map.get(category, [])
    
    def _final_news_filter(self, articles: List[Dict]) -> List[Dict]:
        """Filtro finale per QUALITÀ NOTIZIA"""
        filtered = []
        
        for article in articles:
            score = article.get('news_score', 0.0)
            breaking_score = article.get('breaking_score', 0)
            
            # Threshold di qualità notizia
            if score < self.news_threshold:
                continue
            
            # Deve essere breaking news o notizia importante
            if breaking_score < 2:
                continue
            
            filtered.append(article)
            
        return filtered
