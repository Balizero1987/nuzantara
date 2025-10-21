import json
import requests
import logging
from typing import List, Dict, Any
from datetime import datetime
import re

class LLAMAFilter:
    def __init__(self):
        self.quality_threshold = 0.7
        self.impact_threshold = "medium"
        self.duplicate_threshold = 0.85
        self.logger = logging.getLogger(__name__)
        
    def intelligent_filter(self, articles: List[Dict]) -> List[Dict]:
        """Filtro intelligente LLAMA per eliminare spam e duplicati"""
        self.logger.info(f"🔍 LLAMA Filter: Analizzando {len(articles)} articoli")
        
        # Step 1: Filtro qualità base
        quality_filtered = self._quality_filter(articles)
        self.logger.info(f"✅ Dopo filtro qualità: {len(quality_filtered)} articoli")
        
        # Step 2: Eliminazione duplicati
        deduplicated = self._remove_duplicates(quality_filtered)
        self.logger.info(f"✅ Dopo deduplicazione: {len(deduplicated)} articoli")
        
        # Step 3: Scoring rilevanza
        scored_articles = self._relevance_scoring(deduplicated)
        self.logger.info(f"✅ Dopo scoring: {len(scored_articles)} articoli")
        
        # Step 4: Filtro finale per threshold
        final_filtered = self._final_threshold_filter(scored_articles)
        self.logger.info(f"🎯 FINALE: {len(final_filtered)} articoli di qualità")
        
        return final_filtered
    
    def _quality_filter(self, articles: List[Dict]) -> List[Dict]:
        """Filtro qualità base: lunghezza, contenuto, formato"""
        filtered = []
        
        for article in articles:
            # Controlli base
            if not article.get('title') or len(article.get('title', '')) < 10:
                continue
                
            if not article.get('content') or len(article.get('content', '')) < 100:
                continue
                
            # Controllo spam keywords
            spam_keywords = ['click here', 'read more', 'advertisement', 'sponsored']
            content_lower = article.get('content', '').lower()
            if any(keyword in content_lower for keyword in spam_keywords):
                continue
                
            # Controllo formato URL
            if not article.get('url') or not article['url'].startswith('http'):
                continue
                
            filtered.append(article)
            
        return filtered
    
    def _remove_duplicates(self, articles: List[Dict]) -> List[Dict]:
        """Eliminazione duplicati basata su similarità semantica"""
        unique_articles = []
        seen_titles = set()
        seen_urls = set()
        
        for article in articles:
            title = article.get('title', '').lower().strip()
            url = article.get('url', '').strip()
            
            # Controllo duplicati esatti
            if title in seen_titles or url in seen_urls:
                continue
                
            # Controllo similarità titoli (semplificato)
            is_duplicate = False
            for seen_title in seen_titles:
                similarity = self._calculate_similarity(title, seen_title)
                if similarity > self.duplicate_threshold:
                    is_duplicate = True
                    break
                    
            if not is_duplicate:
                unique_articles.append(article)
                seen_titles.add(title)
                seen_urls.add(url)
                
        return unique_articles
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcolo similarità semplificato"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
            
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _relevance_scoring(self, articles: List[Dict]) -> List[Dict]:
        """Scoring rilevanza per categoria e contenuto"""
        scored_articles = []
        
        for article in articles:
            score = 0.0
            
            # Score per lunghezza contenuto
            content_length = len(article.get('content', ''))
            if content_length > 1000:
                score += 0.3
            elif content_length > 500:
                score += 0.2
            else:
                score += 0.1
                
            # Score per tier source
            tier = article.get('tier', 'T3')
            if tier == 'T1':
                score += 0.4
            elif tier == 'T2':
                score += 0.3
            else:
                score += 0.1
                
            # Score per keywords rilevanti
            category = article.get('category', '')
            relevant_keywords = self._get_category_keywords(category)
            content_lower = article.get('content', '').lower()
            
            keyword_matches = sum(1 for kw in relevant_keywords if kw.lower() in content_lower)
            score += min(keyword_matches * 0.1, 0.3)
            
            # Score per data freshness
            scraped_at = article.get('scraped_at', '')
            if scraped_at:
                try:
                    scraped_date = datetime.fromisoformat(scraped_at.replace('Z', '+00:00'))
                    hours_old = (datetime.now() - scraped_date).total_seconds() / 3600
                    if hours_old < 24:
                        score += 0.2
                    elif hours_old < 48:
                        score += 0.1
                except:
                    pass
                    
            article['llama_score'] = round(score, 3)
            scored_articles.append(article)
            
        return scored_articles
    
    def _get_category_keywords(self, category: str) -> List[str]:
        """Keywords rilevanti per categoria"""
        keywords_map = {
            'immigration': ['visa', 'passport', 'immigration', 'residence', 'permit'],
            'business': ['business', 'company', 'investment', 'license', 'registration'],
            'tax': ['tax', 'taxation', 'revenue', 'duty', 'customs'],
            'property': ['property', 'real estate', 'land', 'house', 'apartment'],
            'healthcare': ['health', 'medical', 'hospital', 'clinic', 'doctor'],
            'education': ['education', 'school', 'university', 'student', 'learning'],
            'transportation': ['transport', 'vehicle', 'driving', 'license', 'road'],
            'employment': ['job', 'work', 'employment', 'salary', 'contract'],
            'banking': ['bank', 'banking', 'finance', 'loan', 'credit'],
            'legal': ['legal', 'law', 'court', 'attorney', 'justice'],
            'tourism': ['tourist', 'travel', 'hotel', 'vacation', 'trip'],
            'technology': ['tech', 'digital', 'software', 'internet', 'computer'],
            'environment': ['environment', 'climate', 'pollution', 'green', 'sustainability'],
            'culture': ['culture', 'tradition', 'heritage', 'art', 'music'],
            'sports': ['sport', 'fitness', 'gym', 'exercise', 'athletic'],
            'food': ['food', 'restaurant', 'cuisine', 'dining', 'cooking'],
            'shopping': ['shop', 'store', 'market', 'buy', 'purchase']
        }
        
        return keywords_map.get(category, [])
    
    def _final_threshold_filter(self, articles: List[Dict]) -> List[Dict]:
        """Filtro finale per threshold di qualità"""
        filtered = []
        
        for article in articles:
            score = article.get('llama_score', 0.0)
            impact = article.get('impact_level', 'low')
            
            # Threshold di qualità
            if score < self.quality_threshold:
                continue
                
            # Threshold di impatto
            impact_scores = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
            if impact_scores.get(impact, 0) < impact_scores.get(self.impact_threshold, 2):
                continue
                
            filtered.append(article)
            
        return filtered
