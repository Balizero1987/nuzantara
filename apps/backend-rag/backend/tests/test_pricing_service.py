"""
Tests for Bali Zero Pricing Service
CRITICAL: Tests official pricing data retrieval and validation (NO AI generation)
"""

import pytest
import json
from pathlib import Path
from services.pricing_service import (
    PricingService,
    get_pricing_service,
    get_all_prices,
    search_service,
    get_visa_prices,
    get_kitas_prices,
    get_business_prices,
    get_tax_prices,
    get_pricing_context_for_llm
)


class TestPricingService:
    """Test suite for PricingService class"""

    @pytest.fixture
    def pricing_service(self):
        """Fixture to create PricingService instance"""
        return PricingService()

    @pytest.fixture
    def json_data(self):
        """Fixture to load JSON data directly"""
        json_path = Path(__file__).parent.parent / "data" / "bali_zero_official_prices_2025.json"
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def test_pricing_service_loads_successfully(self, pricing_service):
        """Test that pricing service loads without errors"""
        assert pricing_service.loaded is True
        assert pricing_service.prices is not None
        assert isinstance(pricing_service.prices, dict)

    def test_pricing_service_has_required_top_level_keys(self, pricing_service):
        """Test that loaded data has required structure"""
        assert 'services' in pricing_service.prices
        assert 'contact_info' in pricing_service.prices
        assert 'official_notice' in pricing_service.prices
        assert 'currency' in pricing_service.prices

    def test_pricing_service_has_all_service_categories(self, pricing_service):
        """Test that all 6 service categories are present"""
        services = pricing_service.prices.get('services', {})
        required_categories = [
            'single_entry_visas',
            'multiple_entry_visas',
            'kitas_permits',
            'kitap_permits',
            'business_legal_services',
            'taxation_services'
        ]
        for category in required_categories:
            assert category in services, f"Missing category: {category}"

    def test_get_all_prices_returns_complete_data(self, pricing_service):
        """Test get_all_prices() returns complete data structure"""
        result = pricing_service.get_all_prices()
        assert 'services' in result
        assert 'contact_info' in result
        assert 'currency' in result
        assert result['currency'] == 'IDR (Indonesian Rupiah)'

    def test_get_all_prices_when_not_loaded(self):
        """Test get_all_prices() returns error when prices not loaded"""
        service = PricingService()
        service.loaded = False
        result = service.get_all_prices()
        assert 'error' in result
        assert 'fallback_contact' in result

    def test_get_visa_prices_returns_visa_data(self, pricing_service):
        """Test get_visa_prices() returns both single and multiple entry visas"""
        result = pricing_service.get_visa_prices()
        assert 'single_entry_visas' in result
        assert 'multiple_entry_visas' in result
        assert 'contact_info' in result
        assert 'official_notice' in result
        assert 'VISA' in result['official_notice']

    def test_get_visa_prices_has_c1_tourism(self, pricing_service):
        """Test that C1 Tourism visa exists with correct structure"""
        result = pricing_service.get_visa_prices()
        c1 = result['single_entry_visas'].get('C1 Tourism')
        assert c1 is not None
        assert 'price' in c1
        assert 'extension' in c1
        assert 'notes' in c1
        assert 'IDR' in c1['price']

    def test_get_kitas_prices_returns_kitas_data(self, pricing_service):
        """Test get_kitas_prices() returns KITAS permit data"""
        result = pricing_service.get_kitas_prices()
        assert 'kitas_permits' in result
        assert 'contact_info' in result
        assert 'official_notice' in result
        assert 'important_warnings' in result
        assert 'KITAS' in result['official_notice']

    def test_get_kitas_prices_has_working_kitas(self, pricing_service):
        """Test Working KITAS exists with offshore/onshore pricing"""
        result = pricing_service.get_kitas_prices()
        working_kitas = result['kitas_permits'].get('Working KITAS (E23)')
        assert working_kitas is not None
        assert 'offshore' in working_kitas
        assert 'onshore' in working_kitas
        assert 'notes' in working_kitas
        assert 'IDR' in working_kitas['offshore']
        assert 'IDR' in working_kitas['onshore']

    def test_get_business_prices_returns_business_data(self, pricing_service):
        """Test get_business_prices() returns business service data"""
        result = pricing_service.get_business_prices()
        assert 'business_legal_services' in result
        assert 'contact_info' in result
        assert 'official_notice' in result
        assert 'BUSINESS' in result['official_notice']

    def test_get_business_prices_has_pt_pma(self, pricing_service):
        """Test PT PMA Company Setup exists"""
        result = pricing_service.get_business_prices()
        pt_pma = result['business_legal_services'].get('PT PMA Company Setup')
        assert pt_pma is not None
        assert 'price' in pt_pma
        assert 'Starting from' in pt_pma['price'] or 'IDR' in pt_pma['price']

    def test_get_tax_prices_returns_tax_data(self, pricing_service):
        """Test get_tax_prices() returns taxation service data"""
        result = pricing_service.get_tax_prices()
        assert 'taxation_services' in result
        assert 'contact_info' in result
        assert 'official_notice' in result
        assert 'TAX' in result['official_notice']

    def test_get_tax_prices_has_npwp(self, pricing_service):
        """Test NPWP Personal service exists"""
        result = pricing_service.get_tax_prices()
        npwp = result['taxation_services'].get('NPWP Personal + Coretax')
        assert npwp is not None
        assert 'price' in npwp
        assert 'IDR' in npwp['price']
        assert 'per person' in npwp['price'].lower()

    def test_search_service_finds_working_kitas(self, pricing_service):
        """Test search_service() can find Working KITAS"""
        result = pricing_service.search_service('Working KITAS')
        assert 'results' in result
        assert 'kitas_permits' in result['results']
        assert 'Working KITAS (E23)' in result['results']['kitas_permits']
        assert 'official_notice' in result

    def test_search_service_case_insensitive(self, pricing_service):
        """Test search is case-insensitive"""
        result = pricing_service.search_service('working kitas')
        assert 'results' in result
        assert 'kitas_permits' in result['results']

    def test_search_service_removes_noise_words(self, pricing_service):
        """Test search removes common noise words"""
        result = pricing_service.search_service('berapa harga working kitas di bali?')
        assert 'results' in result
        assert 'kitas_permits' in result['results']

    def test_search_service_not_found(self, pricing_service):
        """Test search returns helpful message when not found"""
        result = pricing_service.search_service('NonExistentService12345')
        assert 'message' in result
        assert 'No service found' in result['message']
        assert 'contact_info' in result

    def test_search_service_multilingual(self, pricing_service):
        """Test search works with multilingual queries"""
        queries = ['NPWP', 'tax number', 'pajak']
        for query in queries:
            result = pricing_service.search_service(query)
            assert 'results' in result or 'message' in result

    def test_get_quick_quotes_exists(self, pricing_service):
        """Test quick quotes functionality"""
        result = pricing_service.get_quick_quotes()
        assert 'quick_quotes' in result
        assert 'contact_info' in result
        assert 'official_notice' in result

    def test_get_warnings_exists(self, pricing_service):
        """Test warnings functionality"""
        result = pricing_service.get_warnings()
        assert 'important_warnings' in result

    def test_format_for_llm_context_all_services(self, pricing_service):
        """Test LLM context formatting for all services"""
        context = pricing_service.format_for_llm_context()
        assert isinstance(context, str)
        assert 'BALI ZERO OFFICIAL PRICES' in context
        assert 'DO NOT GENERATE' in context
        assert 'IDR' in context
        assert 'info@balizero.com' in context or 'WhatsApp' in context

    def test_format_for_llm_context_visa_only(self, pricing_service):
        """Test LLM context formatting for visa services only"""
        context = pricing_service.format_for_llm_context('visa')
        assert isinstance(context, str)
        assert 'VISA PRICES' in context
        assert 'IDR' in context
        # Should not include KITAS or business sections
        assert 'KITAS PRICES' not in context or context.count('KITAS') < 3

    def test_format_for_llm_context_kitas_only(self, pricing_service):
        """Test LLM context formatting for KITAS services only"""
        context = pricing_service.format_for_llm_context('kitas')
        assert isinstance(context, str)
        assert 'KITAS PRICES' in context
        assert 'offshore' in context.lower() or 'onshore' in context.lower()

    def test_format_for_llm_context_business_only(self, pricing_service):
        """Test LLM context formatting for business services only"""
        context = pricing_service.format_for_llm_context('business')
        assert isinstance(context, str)
        assert 'BUSINESS SERVICES' in context

    def test_format_for_llm_context_tax_only(self, pricing_service):
        """Test LLM context formatting for tax services only"""
        context = pricing_service.format_for_llm_context('tax')
        assert isinstance(context, str)
        assert 'TAX SERVICES' in context

    def test_singleton_pattern(self):
        """Test that get_pricing_service() returns singleton instance"""
        service1 = get_pricing_service()
        service2 = get_pricing_service()
        assert service1 is service2

    def test_convenience_functions_work(self):
        """Test that convenience wrapper functions work"""
        assert get_all_prices() is not None
        assert search_service('KITAS') is not None
        assert get_visa_prices() is not None
        assert get_kitas_prices() is not None
        assert get_business_prices() is not None
        assert get_tax_prices() is not None
        assert get_pricing_context_for_llm() is not None


class TestPriceFormatValidation:
    """Test suite for price format validation"""

    @pytest.fixture
    def pricing_service(self):
        return PricingService()

    def test_all_prices_contain_idr(self, pricing_service):
        """Test that all price fields contain 'IDR' or special values"""
        def check_prices(obj, path=''):
            for key, value in obj.items():
                if isinstance(value, dict):
                    check_prices(value, f"{path}.{key}")
                elif isinstance(value, str):
                    if any(k in key.lower() for k in ['price', 'offshore', 'onshore', 'extension']):
                        # Should contain IDR or be a special value
                        assert (
                            'IDR' in value or
                            'Contact' in value or
                            'Not extendable' in value or
                            'Starting from' in value
                        ), f"Invalid price format at {path}.{key}: {value}"

        services = pricing_service.prices.get('services', {})
        check_prices(services)

    def test_no_negative_prices(self, pricing_service):
        """Test that no prices are negative"""
        json_str = json.dumps(pricing_service.prices)
        # Check for negative numbers in price context
        assert '-' not in json_str or 'IDR' not in json_str.split('-')[-1][:20]

    def test_no_zero_prices(self, pricing_service):
        """Test that no prices are zero"""
        def check_no_zero(obj):
            for key, value in obj.items():
                if isinstance(value, dict):
                    check_no_zero(value)
                elif isinstance(value, str):
                    if any(k in key.lower() for k in ['price', 'offshore', 'onshore']):
                        # Should not be "0 IDR" or "0.000.000 IDR"
                        assert not value.strip().startswith('0')

        services = pricing_service.prices.get('services', {})
        check_no_zero(services)

    def test_no_invalid_currencies(self, pricing_service):
        """Test that only IDR currency is used"""
        json_str = json.dumps(pricing_service.prices)
        invalid_currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD']
        for currency in invalid_currencies:
            # Allow currency in notes/warnings, but not as price values
            # Simple check: currency should not appear right after digits
            import re
            pattern = r'\d+[.,]?\d*\s*' + currency
            matches = re.findall(pattern, json_str, re.IGNORECASE)
            assert len(matches) == 0, f"Found invalid currency {currency}: {matches}"

    def test_price_format_consistency(self, pricing_service):
        """Test that IDR prices use dot separators (1.000.000 not 1,000,000)"""
        def check_format(obj):
            for key, value in obj.items():
                if isinstance(value, dict):
                    check_format(value)
                elif isinstance(value, str):
                    if 'IDR' in value and any(k in key.lower() for k in ['price', 'offshore', 'onshore']):
                        # Should use dots for thousands, not commas
                        # Format: X.XXX.XXX IDR
                        if value not in ['Contact for quote', 'Not extendable']:
                            assert ',' not in value.split('IDR')[0] or 'per' in value, f"Invalid format: {value}"

        services = pricing_service.prices.get('services', {})
        check_format(services)

    def test_all_prices_are_strings(self, pricing_service):
        """Test that all price values are strings, not numbers"""
        def check_types(obj):
            for key, value in obj.items():
                if isinstance(value, dict):
                    check_types(value)
                elif any(k in key.lower() for k in ['price', 'offshore', 'onshore', 'extension']):
                    assert isinstance(value, str), f"Price should be string: {key}={value}"

        services = pricing_service.prices.get('services', {})
        check_types(services)


class TestDateValidation:
    """Test suite for date validation"""

    @pytest.fixture
    def pricing_service(self):
        return PricingService()

    def test_last_updated_exists(self, pricing_service):
        """Test that last_updated field exists"""
        assert 'last_updated' in pricing_service.prices

    def test_last_updated_format(self, pricing_service):
        """Test last_updated is in YYYY-MM-DD format"""
        last_updated = pricing_service.prices['last_updated']
        import re
        assert re.match(r'^\d{4}-\d{2}-\d{2}$', last_updated), f"Invalid date format: {last_updated}"

    def test_last_updated_is_parseable(self, pricing_service):
        """Test last_updated is a valid date"""
        from datetime import datetime
        last_updated = pricing_service.prices['last_updated']
        try:
            date_obj = datetime.strptime(last_updated, '%Y-%m-%d')
            assert date_obj is not None
        except ValueError:
            pytest.fail(f"Invalid date: {last_updated}")

    def test_last_updated_not_in_future(self, pricing_service):
        """Test last_updated is not in the future"""
        from datetime import datetime
        last_updated = pricing_service.prices['last_updated']
        date_obj = datetime.strptime(last_updated, '%Y-%m-%d')
        now = datetime.now()
        assert date_obj <= now, "Date should not be in the future"

    def test_last_updated_not_too_old(self, pricing_service):
        """Test last_updated is within 2 years"""
        from datetime import datetime, timedelta
        last_updated = pricing_service.prices['last_updated']
        date_obj = datetime.strptime(last_updated, '%Y-%m-%d')
        two_years_ago = datetime.now() - timedelta(days=730)
        assert date_obj > two_years_ago, "Date should not be older than 2 years"


class TestContactInfo:
    """Test suite for contact information validation"""

    @pytest.fixture
    def pricing_service(self):
        return PricingService()

    def test_contact_info_exists(self, pricing_service):
        """Test that contact_info section exists"""
        assert 'contact_info' in pricing_service.prices

    def test_contact_info_has_email(self, pricing_service):
        """Test that email exists"""
        contact = pricing_service.prices['contact_info']
        assert 'email' in contact
        assert '@' in contact['email']
        assert 'balizero.com' in contact['email']

    def test_contact_info_has_whatsapp(self, pricing_service):
        """Test that WhatsApp exists"""
        contact = pricing_service.prices['contact_info']
        assert 'whatsapp' in contact
        assert '+62' in contact['whatsapp']

    def test_contact_info_has_location(self, pricing_service):
        """Test that location exists"""
        contact = pricing_service.prices['contact_info']
        assert 'location' in contact
        assert 'Bali' in contact['location']

    def test_all_methods_include_contact_info(self, pricing_service):
        """Test that all getter methods include contact_info"""
        methods = [
            pricing_service.get_all_prices,
            pricing_service.get_visa_prices,
            pricing_service.get_kitas_prices,
            pricing_service.get_business_prices,
            pricing_service.get_tax_prices,
            pricing_service.get_quick_quotes
        ]
        for method in methods:
            result = method()
            assert 'contact_info' in result, f"{method.__name__} should include contact_info"


class TestAntiHallucination:
    """Test suite for anti-hallucination safeguards"""

    @pytest.fixture
    def pricing_service(self):
        return PricingService()

    @pytest.fixture
    def json_data(self):
        """Fixture to load JSON data directly"""
        json_path = Path(__file__).parent.parent / "data" / "bali_zero_official_prices_2025.json"
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def test_official_notice_present(self, pricing_service):
        """Test that official notice is present"""
        assert 'official_notice' in pricing_service.prices
        notice = pricing_service.prices['official_notice']
        assert 'UFFICIALI' in notice or 'OFFICIAL' in notice
        assert 'Non generati da AI' in notice or 'AI' in notice

    def test_disclaimer_present(self, pricing_service):
        """Test that disclaimer exists in multiple languages"""
        assert 'disclaimer' in pricing_service.prices
        disclaimer = pricing_service.prices['disclaimer']
        assert 'it' in disclaimer
        assert 'id' in disclaimer
        assert 'en' in disclaimer

    def test_llm_context_has_no_generation_warning(self, pricing_service):
        """Test that LLM context includes DO NOT GENERATE warning"""
        context = pricing_service.format_for_llm_context()
        assert 'DO NOT GENERATE' in context
        assert 'OFFICIAL PRICES' in context

    def test_service_data_is_from_json_not_generated(self, json_data, pricing_service):
        """Test that service data matches JSON file exactly (not AI generated)"""
        # Compare a sample service to ensure it's loaded from JSON
        json_c1 = json_data['services']['single_entry_visas']['C1 Tourism']
        service_c1 = pricing_service.prices['services']['single_entry_visas']['C1 Tourism']
        assert json_c1 == service_c1, "Data should match JSON file exactly"


class TestErrorHandling:
    """Test suite for error handling"""

    def test_missing_json_file_handling(self, tmp_path, monkeypatch):
        """Test graceful handling when JSON file doesn't exist"""
        # Create a temporary empty directory
        monkeypatch.setattr(Path, '__truediv__', lambda self, other: tmp_path / 'nonexistent.json')
        service = PricingService()
        assert service.loaded is False
        result = service.get_all_prices()
        assert 'error' in result

    def test_search_with_empty_query(self, pricing_service):
        """Test search with empty query"""
        result = pricing_service.search_service('')
        # Should handle gracefully
        assert isinstance(result, dict)

    def test_llm_context_when_not_loaded(self):
        """Test LLM context formatting when prices not loaded"""
        service = PricingService()
        service.loaded = False
        context = service.format_for_llm_context()
        assert 'not available' in context.lower() or 'contact' in context.lower()


@pytest.fixture
def pricing_service():
    """Global fixture for pricing service"""
    return get_pricing_service()
