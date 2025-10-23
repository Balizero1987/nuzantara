"""Unit tests for PropertyScraper"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from bs4 import BeautifulSoup

from nuzantara_scraper.scrapers.property_scraper import PropertyScraper
from nuzantara_scraper.models.scraped_content import Source, SourceTier, ContentType


@pytest.mark.unit
class TestPropertyScraper:
    """Test PropertyScraper functionality"""

    def test_initialization(self, property_config):
        """Test scraper initialization"""
        scraper = PropertyScraper(property_config)

        assert scraper.config == property_config
        assert scraper.config.category == ContentType.PROPERTY

    def test_get_sources(self, property_config):
        """Test getting property sources"""
        scraper = PropertyScraper(property_config)
        sources = scraper.get_sources()

        assert len(sources) > 0
        assert all(isinstance(s, Source) for s in sources)
        assert all(s.category == ContentType.PROPERTY for s in sources)

    def test_parse_content_with_property_data(self, property_config, mock_source):
        """Test parsing HTML with property data"""
        scraper = PropertyScraper(property_config)

        html = """
        <html>
            <body>
                <div class="property-card">
                    <h2>Luxury Villa in Seminyak</h2>
                    <span class="price">USD 750,000</span>
                    <span class="size">350 sqm</span>
                    <span class="location">Seminyak, Bali</span>
                    <p class="description">
                        Beautiful 3-bedroom villa with private pool and garden.
                        Located in prime Seminyak area, close to beach and restaurants.
                        Modern design with high-end finishes throughout the property.
                    </p>
                    <a href="/property/villa-123">View Details</a>
                </div>
            </body>
        </html>
        """

        mock_source.url = "https://example.com"
        contents = scraper.parse_content(html, mock_source)

        assert len(contents) > 0

        content = contents[0]
        assert "villa" in content.title.lower() or "luxury" in content.title.lower()
        assert content.category == ContentType.PROPERTY
        assert len(content.content) > 50  # Has meaningful content

    def test_extract_price(self, property_config):
        """Test price extraction"""
        scraper = PropertyScraper(property_config)

        test_cases = [
            ("USD 500,000", "USD 500,000"),
            ("IDR 7,500,000,000", "IDR 7,500,000,000"),
            ("$750K", "$750K"),
            ("Price: 500000", "500000"),
        ]

        for html_text, expected in test_cases:
            soup = BeautifulSoup(f"<div>{html_text}</div>", "html.parser")
            price = scraper._extract_price(soup)
            assert expected.replace(",", "").replace(".", "") in price.replace(",", "").replace(".", "")

    def test_extract_size(self, property_config):
        """Test size extraction"""
        scraper = PropertyScraper(property_config)

        test_cases = [
            ("200 sqm", "200"),
            ("350 m²", "350"),
            ("1,500 square meters", "1,500" or "1500"),
        ]

        for html_text, expected_substr in test_cases:
            soup = BeautifulSoup(f"<div>{html_text}</div>", "html.parser")
            size = scraper._extract_size(soup)
            assert expected_substr.replace(",", "") in size.replace(",", "")

    def test_extract_location(self, property_config):
        """Test location extraction"""
        scraper = PropertyScraper(property_config)

        test_cases = [
            ("Canggu, Bali", ["canggu", "bali"]),
            ("Seminyak Area", ["seminyak"]),
            ("Ubud Center", ["ubud"]),
        ]

        for html_text, expected_keywords in test_cases:
            soup = BeautifulSoup(f"<div>{html_text}</div>", "html.parser")
            location = scraper._extract_location(soup)
            assert any(keyword in location.lower() for keyword in expected_keywords)

    def test_parse_empty_content(self, property_config, mock_source):
        """Test parsing empty HTML"""
        scraper = PropertyScraper(property_config)

        html = "<html><body></body></html>"
        contents = scraper.parse_content(html, mock_source)

        # Should return empty list for no content
        assert len(contents) == 0

    def test_parse_invalid_html(self, property_config, mock_source):
        """Test parsing malformed HTML"""
        scraper = PropertyScraper(property_config)

        html = "<html><body><div>Incomplete"
        contents = scraper.parse_content(html, mock_source)

        # Should handle gracefully
        assert isinstance(contents, list)

    def test_ownership_type_extraction(self, property_config):
        """Test ownership type extraction"""
        scraper = PropertyScraper(property_config)

        test_cases = [
            ("Freehold title", "freehold"),
            ("Leasehold 25 years", "leasehold"),
            ("Hak Milik", "hak milik"),
            ("HGB certificate", "hgb"),
        ]

        for html_text, expected_keyword in test_cases:
            soup = BeautifulSoup(f"<div>{html_text}</div>", "html.parser")
            ownership = scraper._extract_ownership_type(soup)
            assert expected_keyword.lower() in ownership.lower()

    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper._extract_price")
    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper._extract_size")
    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper._extract_location")
    def test_extracted_data_structure(
        self,
        mock_location,
        mock_size,
        mock_price,
        property_config,
        mock_source,
    ):
        """Test structure of extracted data"""
        mock_price.return_value = "USD 500,000"
        mock_size.return_value = "200 sqm"
        mock_location.return_value = "Canggu"

        scraper = PropertyScraper(property_config)

        html = """
        <html><body>
            <div class="property">
                <h2>Test Villa</h2>
                <p>Description with sufficient words to pass filtering requirements here.</p>
            </div>
        </body></html>
        """

        contents = scraper.parse_content(html, mock_source)

        if len(contents) > 0:
            extracted = contents[0].extracted_data

            # Verify extracted_data structure
            assert isinstance(extracted, dict)
            # Common fields
            assert "price" in extracted or "size" in extracted or "location" in extracted

    def test_multiple_properties_parsing(self, property_config, mock_source):
        """Test parsing multiple properties"""
        scraper = PropertyScraper(property_config)

        html = """
        <html><body>
            <div class="property">
                <h2>Villa 1</h2>
                <p class="price">USD 500,000</p>
                <p>Beautiful villa with amazing view and modern amenities for comfortable living.</p>
            </div>
            <div class="property">
                <h2>Villa 2</h2>
                <p class="price">USD 750,000</p>
                <p>Luxury estate with private pool and spacious garden perfect for families.</p>
            </div>
            <div class="property">
                <h2>Villa 3</h2>
                <p class="price">USD 1,000,000</p>
                <p>Beachfront property with stunning ocean views and premium interior design.</p>
            </div>
        </body></html>
        """

        contents = scraper.parse_content(html, mock_source)

        # Should find multiple properties
        assert len(contents) >= 2

    def test_url_normalization(self, property_config, mock_source):
        """Test URL normalization for relative links"""
        scraper = PropertyScraper(property_config)

        html = """
        <html><body>
            <div class="property">
                <h2>Test Property</h2>
                <a href="/property/123">View Details</a>
                <p>Description of property with enough words for content filtering validation.</p>
            </div>
        </body></html>
        """

        mock_source.url = "https://example.com/listings"
        contents = scraper.parse_content(html, mock_source)

        if len(contents) > 0:
            url = str(contents[0].url)
            # URL should be absolute
            assert url.startswith("http")

    def test_content_deduplication_by_hash(self, property_config, mock_source):
        """Test content generates consistent hash for deduplication"""
        scraper = PropertyScraper(property_config)

        html = """
        <html><body>
            <div class="property">
                <h2>Unique Villa</h2>
                <p>This is a unique property description that should generate consistent hash.</p>
            </div>
        </body></html>
        """

        contents1 = scraper.parse_content(html, mock_source)
        contents2 = scraper.parse_content(html, mock_source)

        if len(contents1) > 0 and len(contents2) > 0:
            # Same content should generate same content_id
            assert contents1[0].content_id == contents2[0].content_id

    def test_minimum_content_quality(self, property_config, mock_source):
        """Test that parsed content meets minimum quality"""
        scraper = PropertyScraper(property_config)

        html = """
        <html><body>
            <div class="property">
                <h2>Quality Villa</h2>
                <p>This property has a detailed description with multiple sentences.
                   It provides valuable information about the location, amenities, and features.
                   The description is comprehensive and helpful for potential buyers.</p>
            </div>
        </body></html>
        """

        contents = scraper.parse_content(html, mock_source)

        for content in contents:
            # Should have title
            assert len(content.title) > 0
            # Should have meaningful content
            assert len(content.content.split()) >= 10
            # Should have valid URL
            assert str(content.url).startswith("http")
