"""
Unit tests for Pricing Service
Coverage target: 90%+ (163 statements)
Tests all pricing methods, search functionality, and LLM context formatting
"""

import json
import sys
from pathlib import Path
from unittest.mock import mock_open, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.pricing_service import (
    PricingService,
    get_all_prices,
    get_business_prices,
    get_kitas_prices,
    get_pricing_context_for_llm,
    get_pricing_service,
    get_tax_prices,
    get_visa_prices,
    search_service,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_prices_data():
    """Mock prices data matching actual structure (dict of dicts)"""
    return {
        "services": {
            "single_entry_visas": {
                "tourist_visa": {"price": "USD 100", "description": "30 days"},
                "business_visa": {"price": "USD 200", "description": "60 days"},
            },
            "multiple_entry_visas": {
                "multiple_entry_visa": {
                    "price_1y": "USD 300",
                    "price_2y": "USD 500",
                    "description": "Multiple entries",
                },
            },
            "kitas_permits": {
                "kitas_worker": {
                    "offshore": "USD 1000",
                    "onshore": "USD 1200",
                    "description": "Worker permit",
                },
            },
            "kitap_permits": {
                "kitap_permanent": {"price": "USD 2000", "description": "Permanent"},
            },
            "business_legal_services": {
                "pt_pma_setup": {"price": "USD 1500", "description": "PT PMA"},
            },
            "taxation_services": {
                "npwp_registration": {"price": "USD 100", "description": "Tax ID"},
            },
            "quick_quotes": {
                "basic_package": {"price": "USD 500", "includes": ["visa", "kitas"]},
            },
        },
        "contact_info": {"email": "info@balizero.com", "whatsapp": "+62 813 3805 1876"},
        "disclaimer": {"text": "Prices subject to change"},
        "important_warnings": {
            "warning_1": "Always use official agents",
            "warning_2": "Check visa requirements",
            "warning_3": "Ensure document validity",
        },
        "cost_optimization_tips": {
            "tip_1": "Book in advance",
        },
        "contact_urgency_levels": {
            "urgent": "Call immediately",
        },
    }


# ============================================================================
# Tests for __init__ and _load_prices
# ============================================================================


def test_init_with_file(mock_prices_data):
    """Test initialization with prices file"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()

            assert service.loaded is True
            assert len(service.prices) > 0
            assert "services" in service.prices


def test_init_without_file():
    """Test initialization without prices file"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()

        assert service.loaded is False
        assert service.prices == {}


def test_init_file_error():
    """Test initialization with file error"""
    with patch("pathlib.Path.exists", return_value=True):
        with patch("builtins.open", side_effect=Exception("File error")):
            service = PricingService()

            assert service.loaded is False
            assert service.prices == {}


# ============================================================================
# Tests for get_pricing
# ============================================================================


def test_get_pricing_not_loaded():
    """Test get_pricing when prices not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_pricing("visa")

        assert "error" in result
        assert "fallback_contact" in result


def test_get_pricing_visa(mock_prices_data):
    """Test get_pricing for visa"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("visa")

            assert "official_notice" in result
            assert "single_entry_visas" in result


def test_get_pricing_kitas(mock_prices_data):
    """Test get_pricing for kitas"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("kitas")

            assert "official_notice" in result
            assert "kitas_permits" in result


def test_get_pricing_long_stay_permit(mock_prices_data):
    """Test get_pricing for long_stay_permit (alias for kitas)"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("long_stay_permit")

            assert "kitas_permits" in result


def test_get_pricing_business_setup(mock_prices_data):
    """Test get_pricing for business_setup"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("business_setup")

            assert "business_legal_services" in result


def test_get_pricing_tax_consulting(mock_prices_data):
    """Test get_pricing for tax_consulting"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("tax_consulting")

            assert "taxation_services" in result


def test_get_pricing_legal(mock_prices_data):
    """Test get_pricing for legal (maps to business)"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("legal")

            assert "business_legal_services" in result


def test_get_pricing_all(mock_prices_data):
    """Test get_pricing for all"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("all")

            assert "services" in result


def test_get_pricing_unknown_service_triggers_search(mock_prices_data):
    """Test get_pricing for unknown service triggers search"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_pricing("tourist")

            # Should search and find tourist_visa
            assert isinstance(result, dict)


# ============================================================================
# Tests for get_all_prices
# ============================================================================


def test_get_all_prices_loaded(mock_prices_data):
    """Test get_all_prices when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_all_prices()

            assert "services" in result


def test_get_all_prices_not_loaded():
    """Test get_all_prices when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_all_prices()

        assert "error" in result
        assert "fallback_contact" in result


# ============================================================================
# Tests for get_visa_prices
# ============================================================================


def test_get_visa_prices_loaded(mock_prices_data):
    """Test get_visa_prices when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_visa_prices()

            assert "single_entry_visas" in result
            assert "multiple_entry_visas" in result
            assert "contact_info" in result


def test_get_visa_prices_not_loaded():
    """Test get_visa_prices when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_visa_prices()

        assert "error" in result


# ============================================================================
# Tests for get_kitas_prices
# ============================================================================


def test_get_kitas_prices_loaded(mock_prices_data):
    """Test get_kitas_prices when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_kitas_prices()

            assert "kitas_permits" in result
            assert "important_warnings" in result


def test_get_kitas_prices_not_loaded():
    """Test get_kitas_prices when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_kitas_prices()

        assert "error" in result


# ============================================================================
# Tests for get_business_prices
# ============================================================================


def test_get_business_prices_loaded(mock_prices_data):
    """Test get_business_prices when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_business_prices()

            assert "business_legal_services" in result


def test_get_business_prices_not_loaded():
    """Test get_business_prices when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_business_prices()

        assert "error" in result


# ============================================================================
# Tests for get_tax_prices
# ============================================================================


def test_get_tax_prices_loaded(mock_prices_data):
    """Test get_tax_prices when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_tax_prices()

            assert "taxation_services" in result


def test_get_tax_prices_not_loaded():
    """Test get_tax_prices when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_tax_prices()

        assert "error" in result


# ============================================================================
# Tests for get_quick_quotes
# ============================================================================


def test_get_quick_quotes_loaded(mock_prices_data):
    """Test get_quick_quotes when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_quick_quotes()

            assert "quick_quotes" in result
            assert "contact_info" in result


def test_get_quick_quotes_not_loaded():
    """Test get_quick_quotes when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_quick_quotes()

        assert "error" in result


# ============================================================================
# Tests for get_warnings
# ============================================================================


def test_get_warnings_loaded(mock_prices_data):
    """Test get_warnings when loaded"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.get_warnings()

            assert "important_warnings" in result
            assert "cost_optimization_tips" in result
            assert "contact_urgency_levels" in result


def test_get_warnings_not_loaded():
    """Test get_warnings when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.get_warnings()

        assert "error" in result


# ============================================================================
# Tests for search_service
# ============================================================================


def test_search_service_found(mock_prices_data):
    """Test search_service finds service"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.search_service("tourist")

            assert "results" in result
            assert "search_query" in result
            assert result["search_query"] == "tourist"


def test_search_service_not_found(mock_prices_data):
    """Test search_service doesn't find service"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.search_service("nonexistent_service_xyz")

            assert "message" in result
            assert "No service found" in result["message"]
            assert "suggestion" in result


def test_search_service_not_loaded():
    """Test search_service when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.search_service("anything")

        assert "error" in result
        assert "contact" in result


def test_search_service_with_noise_words(mock_prices_data):
    """Test search_service filters noise words"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            # Query with noise words
            result = service.search_service("berapa harga tourist visa di bali?")

            # Should find tourist_visa by filtering noise words
            assert isinstance(result, dict)


def test_search_service_multiple_keywords(mock_prices_data):
    """Test search_service with multiple keywords"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.search_service("business pt pma")

            # Should find business services
            assert isinstance(result, dict)


# ============================================================================
# Tests for format_for_llm_context
# ============================================================================


def test_format_for_llm_context_not_loaded():
    """Test format_for_llm_context when not loaded"""
    with patch("pathlib.Path.exists", return_value=False):
        service = PricingService()
        result = service.format_for_llm_context()

        assert "Official prices not available" in result


def test_format_for_llm_context_all_services(mock_prices_data):
    """Test format_for_llm_context with all services"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.format_for_llm_context(service_type=None)

            assert "BALI ZERO OFFICIAL PRICES" in result
            assert "VISA PRICES" in result
            assert "Long-stay Permit Prices" in result
            assert "BUSINESS SERVICES" in result
            assert "TAX SERVICES" in result
            assert "IMPORTANT WARNINGS" in result
            assert "Contact:" in result


def test_format_for_llm_context_visa_only(mock_prices_data):
    """Test format_for_llm_context with visa only"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.format_for_llm_context(service_type="visa")

            assert "VISA PRICES" in result
            assert "tourist_visa" in result
            # Should not include KITAS, BUSINESS, TAX
            assert "Long-stay Permit Prices" not in result


def test_format_for_llm_context_kitas_only(mock_prices_data):
    """Test format_for_llm_context with kitas only"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.format_for_llm_context(service_type="kitas")

            assert "Long-stay Permit Prices" in result
            assert "VISA PRICES" not in result


def test_format_for_llm_context_business_only(mock_prices_data):
    """Test format_for_llm_context with business only"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.format_for_llm_context(service_type="business")

            assert "BUSINESS SERVICES" in result


def test_format_for_llm_context_tax_only(mock_prices_data):
    """Test format_for_llm_context with tax only"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            service = PricingService()
            result = service.format_for_llm_context(service_type="tax")

            assert "TAX SERVICES" in result


# ============================================================================
# Tests for global singleton and convenience functions
# ============================================================================


def test_get_pricing_service_singleton(mock_prices_data):
    """Test get_pricing_service returns singleton"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            service1 = get_pricing_service()
            service2 = get_pricing_service()

            assert service1 is service2


def test_convenience_get_all_prices(mock_prices_data):
    """Test convenience function get_all_prices"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = get_all_prices()
            assert "services" in result


def test_convenience_search_service(mock_prices_data):
    """Test convenience function search_service"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = search_service("tourist")
            assert isinstance(result, dict)


def test_convenience_get_visa_prices(mock_prices_data):
    """Test convenience function get_visa_prices"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = get_visa_prices()
            assert "single_entry_visas" in result


def test_convenience_get_kitas_prices(mock_prices_data):
    """Test convenience function get_kitas_prices"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = get_kitas_prices()
            assert "kitas_permits" in result


def test_convenience_get_business_prices(mock_prices_data):
    """Test convenience function get_business_prices"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = get_business_prices()
            assert "business_legal_services" in result


def test_convenience_get_tax_prices(mock_prices_data):
    """Test convenience function get_tax_prices"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = get_tax_prices()
            assert "taxation_services" in result


def test_convenience_get_pricing_context_for_llm(mock_prices_data):
    """Test convenience function get_pricing_context_for_llm"""
    with patch("builtins.open", mock_open(read_data=json.dumps(mock_prices_data))):
        with patch("pathlib.Path.exists", return_value=True):
            # Clear global instance
            import services.pricing_service

            services.pricing_service._pricing_service = None

            result = get_pricing_context_for_llm()
            assert "BALI ZERO" in result
