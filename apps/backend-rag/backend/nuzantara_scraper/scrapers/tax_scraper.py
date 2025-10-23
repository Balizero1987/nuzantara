"""
Tax Intelligence Scraper (Tax Genius)
Scrapes Indonesian tax updates, regulations, and deadlines
"""

from typing import List, Optional
from bs4 import BeautifulSoup
from loguru import logger

from ..core.base_scraper import BaseScraper
from ..models.scraped_content import Source, ScrapedContent, SourceTier, ContentType


class TaxScraper(BaseScraper):
    """
    Tax Intelligence Scraper for Indonesia

    Migrated from legacy TaxGenius (581 lines → ~150 lines)
    Scrapes DJP, Kemenkeu for tax updates
    """

    def get_sources(self) -> List[Source]:
        """Define official tax sources"""

        return [
            Source(
                name="DJP (Directorate General of Taxation)",
                url="https://www.pajak.go.id/id/berita",
                tier=SourceTier.OFFICIAL,
                category=ContentType.TAX,
                selectors=["article", "div.news-item"],
                requires_js=False
            ),
            Source(
                name="DJP Regulations",
                url="https://www.pajak.go.id/id/peraturan",
                tier=SourceTier.OFFICIAL,
                category=ContentType.TAX,
                selectors=["div.regulation-item", "article"],
                requires_js=False
            ),
            Source(
                name="Kemenkeu (Ministry of Finance)",
                url="https://www.kemenkeu.go.id/informasi-publik/publikasi/berita-pajak",
                tier=SourceTier.OFFICIAL,
                category=ContentType.TAX,
                selectors=["div.content-item", "article"],
                requires_js=False
            ),
        ]

    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        """Extract tax updates from HTML"""

        soup = BeautifulSoup(raw_html, 'html.parser')
        items = []

        # Try each selector
        for selector in source.selectors:
            elements = soup.select(selector)

            for elem in elements[:10]:  # Top 10 recent
                try:
                    # Extract title
                    title_elem = elem.find(['h2', 'h3', 'h4', 'a'])
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)

                    # Extract content
                    content_elem = elem.find(['p', 'div.summary', 'div.content'])
                    content = content_elem.get_text(strip=True) if content_elem else title

                    # Extract link
                    link_elem = elem.find('a')
                    link = link_elem.get('href', str(source.url)) if link_elem else str(source.url)
                    if link.startswith('/'):
                        from urllib.parse import urljoin
                        link = urljoin(str(source.url), link)

                    # Extract date
                    date_elem = elem.find(['time', 'span.date', 'div.date'])
                    date_text = date_elem.get_text(strip=True) if date_elem else None

                    # Minimum length
                    if len(content) < 50:
                        continue

                    # Classify update type
                    update_type = self._classify_update_type(title + " " + content)
                    impact_level = self._determine_impact(title + " " + content)
                    affected_entities = self._extract_affected_entities(title + " " + content)

                    # Create item
                    item = ScrapedContent(
                        content_id=self.cache.content_hash(title + content),
                        title=title,
                        content=content,
                        url=link,
                        source_name=source.name,
                        source_tier=source.tier,
                        category=source.category,
                        extracted_data={
                            "update_type": update_type,
                            "impact_level": impact_level,
                            "affected_entities": affected_entities,
                            "published_date": date_text,
                        }
                    )

                    items.append(item)

                except Exception as e:
                    logger.debug(f"Error extracting tax content: {e}")
                    continue

        logger.info(f"Parsed {len(items)} tax items from {source.name}")
        return items

    def _classify_update_type(self, text: str) -> str:
        """Classify type of tax update"""
        text_lower = text.lower()

        if 'peraturan' in text_lower or 'regulation' in text_lower:
            return 'regulation'
        elif 'deadline' in text_lower or 'batas waktu' in text_lower:
            return 'deadline'
        elif 'tarif' in text_lower or 'rate' in text_lower:
            return 'rate_change'
        elif 'amnesti' in text_lower or 'amnesty' in text_lower:
            return 'amnesty'
        elif 'audit' in text_lower or 'pemeriksaan' in text_lower:
            return 'audit_focus'
        return 'general'

    def _determine_impact(self, text: str) -> str:
        """Determine impact level"""
        text_lower = text.lower()

        if 'urgent' in text_lower or 'segera' in text_lower or 'immediate' in text_lower:
            return 'critical'
        elif 'penting' in text_lower or 'important' in text_lower or 'wajib' in text_lower:
            return 'high'
        elif 'update' in text_lower or 'change' in text_lower or 'perubahan' in text_lower:
            return 'medium'
        return 'low'

    def _extract_affected_entities(self, text: str) -> List[str]:
        """Extract affected business entities"""
        text_lower = text.lower()
        affected = []

        if 'pma' in text_lower:
            affected.append('PT PMA')
        if 'pt' in text_lower or 'badan' in text_lower:
            affected.append('PT')
        if 'umkm' in text_lower or 'small business' in text_lower:
            affected.append('Small Business')
        if 'individual' in text_lower or 'pribadi' in text_lower:
            affected.append('Individual')

        return affected if affected else ['All entities']

    def analyze_with_ai(self, items: List[ScrapedContent]) -> List[ScrapedContent]:
        """Analyze tax content with LLAMA/Zantara"""
        if not self.config.filter.enable_ai_filtering:
            return items

        from ..processors.ai_analyzer import AIAnalyzer

        analyzer = AIAnalyzer(
            ollama_url=self.config.ai.ollama_url,
            llama_model=self.config.ai.llama_model,
            zantara_url=getattr(self.config.ai, 'zantara_url', 'http://localhost:8000'),
            provider_order=self.config.ai.provider_order
        )

        analyzed_items = []
        prompt = analyzer.get_default_prompt("tax")

        for item in items:
            analysis = analyzer.analyze(item.content, prompt)

            if analysis:
                item.ai_summary = analysis.summary_en
                item.ai_analysis = analysis.raw_response
                item.quality_score = analysis.quality_score
                item.relevance_score = analysis.relevance_score

                # Update extracted data
                item.extracted_data.update({
                    "tax_types": analysis.topics,
                    "requirements": analysis.requirements,
                    "deadlines": analysis.deadlines,
                })

            analyzed_items.append(item)

        return analyzed_items

    def format_document(self, item: ScrapedContent) -> str:
        """Format tax item for ChromaDB"""

        doc = f"""
TAX UPDATE: {item.title}

Source: {item.source_name} ({item.source_tier.value.upper()})
Type: {item.extracted_data.get('update_type', 'Unknown')}
Impact: {item.extracted_data.get('impact_level', 'Unknown')}
Date: {item.extracted_data.get('published_date', 'Unknown')}

Content:
{item.content}

Affected: {', '.join(item.extracted_data.get('affected_entities', []))}
URL: {item.url}
"""

        if item.ai_summary:
            doc += f"\n\nAI Summary:\n{item.ai_summary}"

        return doc.strip()


# Example usage
if __name__ == "__main__":
    from ..core import ScraperConfig

    config = ScraperConfig(
        scraper_name="tax_intel",
        category=ContentType.TAX,
    )

    scraper = TaxScraper(config)
    result = scraper.run_cycle()

    print(f"\n✅ Tax Scraper Complete!")
    print(f"   Sources: {result.sources_successful}/{result.sources_attempted}")
    print(f"   Items saved: {result.items_saved}")
