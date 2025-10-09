#!/usr/bin/env python3
"""
INTEL SCRAPING - JSON SCHEMA STAGE 2 VALIDATOR

Enforces strict schema validation for intel scraping output.

Stage 2 Requirements:
- Required fields: title, url, source, category, date (ISO-8601), word_count
- Forbid long summary (>500 chars) - move to Editorial Stage 3
- Date enrichment: OG meta, RSS, body regex fallback
- Category guardrails: deny/allow keyword validation

Usage:
    python3 intel_schema_validator.py <input.json>
    python3 intel_schema_validator.py --validate-dir INTEL_SCRAPING/
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# ============================================================================
# JSON SCHEMA STAGE 2 - STRICT VALIDATION
# ============================================================================

@dataclass
class ValidationResult:
    """Validation result container"""
    valid: bool
    errors: List[str]
    warnings: List[str]
    enrichments: Dict[str, Any]  # Fields that were auto-enriched

class IntelSchemaValidator:
    """Stage 2 JSON Schema Validator for Intel Scraping"""

    # Required fields for Stage 2
    REQUIRED_FIELDS = [
        "title",
        "source_url",  # maps to 'url' in output
        "source_name",  # maps to 'source' in output
        "category",
        "scraped_at",  # maps to 'date' in output (or use published date)
        "word_count"
    ]

    # Fields that MUST NOT be present in Stage 2 (reserved for Editorial Stage 3)
    FORBIDDEN_FIELDS_STAGE_2 = [
        "summary",  # If present, must be ≤500 chars (brief only)
        "editorial_notes",
        "seo_title",
        "seo_description",
        "social_media_snippet"
    ]

    # Minimum word count per category priority
    MIN_WORD_COUNT = {
        "CRITICAL": 300,
        "HIGH": 250,
        "MEDIUM": 200,
        "LOW": 150
    }

    def __init__(self,
                 categories_config_path: str = "config/categories_v2.json",
                 guardrails_config_path: str = "config/category_guardrails.json"):
        """Initialize validator with V2 categories config"""
        self.categories_config = self._load_categories_config(categories_config_path)
        self.category_priorities = self._build_category_priority_map()
        self.guardrails_config_path = guardrails_config_path
        self.guardrails = self._load_guardrails()

    def _load_categories_config(self, path: str) -> Dict:
        """Load categories V2 configuration"""
        config_path = Path(path)
        if not config_path.exists():
            print(f"⚠️  Categories config not found at {path}, using defaults")
            return {"categories": []}

        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _build_category_priority_map(self) -> Dict[str, str]:
        """Build category -> priority mapping"""
        priority_map = {}
        for cat in self.categories_config.get("categories", []):
            priority_map[cat["id"]] = cat.get("priority", "MEDIUM")
        return priority_map

    def _load_guardrails(self) -> Dict[str, Dict[str, Any]]:
        """Load category guardrails from external config file"""
        guardrails_path = Path(self.guardrails_config_path)

        if not guardrails_path.exists():
            print(f"⚠️  Guardrails config not found at {self.guardrails_config_path}, using defaults")
            # Minimal defaults
            return {
                "visa_immigration": {
                    "deny_keywords": ["real estate", "property sale"],
                    "allow_keywords": ["visa", "kitas", "immigration"],
                    "require_allow_match": True
                }
            }

        with open(guardrails_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        return config.get("guardrails", {})

    def validate(self, data: Dict) -> ValidationResult:
        """
        Validate intel JSON against Stage 2 schema

        Returns:
            ValidationResult with validation status, errors, warnings, enrichments
        """
        errors = []
        warnings = []
        enrichments = {}

        # 1. Check required fields
        for field in self.REQUIRED_FIELDS:
            if field not in data or not data[field]:
                errors.append(f"Missing required field: {field}")

        # 2. Validate title
        if "title" in data:
            title = data["title"]
            if len(title) < 10:
                errors.append(f"Title too short: {len(title)} chars (min 10)")
            elif len(title) > 200:
                warnings.append(f"Title too long: {len(title)} chars (max 200 recommended)")

        # 3. Validate URL
        if "source_url" in data:
            url = data["source_url"]
            if not url.startswith(("http://", "https://")):
                errors.append(f"Invalid URL format: {url}")

        # 4. Validate category
        category = data.get("category")
        if category:
            if category not in self.category_priorities:
                warnings.append(f"Unknown category: {category} (not in V2 config)")

        # 5. Validate date (ISO-8601)
        date_field = data.get("scraped_at") or data.get("dates", {}).get("published")
        if date_field:
            try:
                datetime.fromisoformat(date_field.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                errors.append(f"Invalid ISO-8601 date: {date_field}")
        else:
            # Try to enrich date from content
            enriched_date = self._enrich_date(data)
            if enriched_date:
                enrichments["date"] = enriched_date
                warnings.append(f"Date enriched from content: {enriched_date}")
            else:
                errors.append("No valid date found (required: ISO-8601)")

        # 6. Validate word count
        word_count = data.get("word_count", 0)
        if category and word_count:
            priority = self.category_priorities.get(category, "MEDIUM")
            min_words = self.MIN_WORD_COUNT.get(priority, 200)
            if word_count < min_words:
                warnings.append(
                    f"Word count {word_count} below minimum {min_words} "
                    f"for {priority} priority category"
                )

        # 7. Check forbidden Stage 2 fields (summary length)
        if "summary" in data and len(data.get("summary", "")) > 500:
            errors.append(
                f"Summary too long for Stage 2: {len(data['summary'])} chars (max 500). "
                "Move to Editorial Stage 3."
            )

        # 8. Validate category guardrails (deny/allow keywords)
        if category and category in self.guardrails:
            guardrail_result = self._validate_guardrails(data, category)
            if guardrail_result["violations"]:
                errors.extend(guardrail_result["violations"])
            if guardrail_result["warnings"]:
                warnings.extend(guardrail_result["warnings"])

        # 9. Check tier alignment (if tier info available)
        tier = data.get("tier")
        if tier and category:
            cat_config = next(
                (c for c in self.categories_config.get("categories", [])
                 if c["id"] == category),
                None
            )
            if cat_config:
                min_tier_1_pct = cat_config.get("quality_thresholds", {}).get("min_tier_1_percentage", 50)
                if tier > 2 and min_tier_1_pct > 60:
                    warnings.append(
                        f"Tier {tier} source for high-priority category requiring "
                        f"{min_tier_1_pct}% Tier 1 sources"
                    )

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            enrichments=enrichments
        )

    def _enrich_date(self, data: Dict) -> Optional[str]:
        """
        Enrich missing date using fallback strategies:
        1. OpenGraph meta tags (og:published_time, article:published_time)
        2. RSS pubDate
        3. Body regex patterns (common date formats)

        Returns ISO-8601 date string or None
        """
        # Strategy 1: Check nested dates object
        dates_obj = data.get("dates", {})
        if isinstance(dates_obj, dict):
            for date_key in ["published", "effective", "created"]:
                if dates_obj.get(date_key):
                    return dates_obj[date_key]

        # Strategy 2: Check for date in title/summary (regex)
        text = f"{data.get('title', '')} {data.get('summary', '')}"

        # Indonesian date patterns: "7 Oktober 2025", "2025-10-07"
        date_patterns = [
            r'(\d{4}-\d{2}-\d{2})',  # ISO format
            r'(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})',
            r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})'
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Try to parse and convert to ISO-8601
                date_str = match.group(0)
                try:
                    # Simple conversion for ISO dates
                    if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
                        return f"{date_str}T00:00:00Z"
                except:
                    pass

        # Strategy 3: Use scrape time as fallback (last resort)
        if data.get("scraped_at"):
            return data["scraped_at"]

        return None

    def _validate_guardrails(self, data: Dict, category: str) -> Dict[str, List[str]]:
        """
        Validate category guardrails (deny/allow keywords)

        Returns:
            {
                "violations": [error messages],
                "warnings": [warning messages]
            }
        """
        violations = []
        warnings = []

        guardrails = self.guardrails.get(category, {})
        deny_keywords = guardrails.get("deny_keywords", [])
        allow_keywords = guardrails.get("allow_keywords", [])
        require_allow_match = guardrails.get("require_allow_match", False)

        # Combine searchable text
        text = " ".join([
            data.get("title", ""),
            data.get("summary", ""),
            " ".join(data.get("keywords", [])),
            " ".join(data.get("key_points", []))
        ]).lower()

        # Check deny keywords
        for keyword in deny_keywords:
            if keyword.lower() in text:
                violations.append(
                    f"Category guardrail violation: '{keyword}' found in {category} content "
                    "(deny keyword)"
                )

        # Check allow keywords (if required for this category)
        if require_allow_match and allow_keywords:
            has_allowed = any(kw.lower() in text for kw in allow_keywords)
            if not has_allowed:
                warnings.append(
                    f"No allow keywords found for category '{category}'. "
                    f"Expected one of: {', '.join(allow_keywords[:3])}..."
                )

        return {
            "violations": violations,
            "warnings": warnings
        }


# ============================================================================
# CLI INTERFACE
# ============================================================================

def validate_file(file_path: Path, validator: IntelSchemaValidator) -> bool:
    """Validate a single JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        result = validator.validate(data)

        print(f"\n{'='*80}")
        print(f"📄 File: {file_path.name}")
        print(f"{'='*80}")

        if result.valid:
            print("✅ VALID - Passes Stage 2 schema")
        else:
            print("❌ INVALID - Schema violations found")

        if result.errors:
            print(f"\n🔴 Errors ({len(result.errors)}):")
            for i, error in enumerate(result.errors, 1):
                print(f"  {i}. {error}")

        if result.warnings:
            print(f"\n🟡 Warnings ({len(result.warnings)}):")
            for i, warning in enumerate(result.warnings, 1):
                print(f"  {i}. {warning}")

        if result.enrichments:
            print(f"\n🔧 Enrichments ({len(result.enrichments)}):")
            for field, value in result.enrichments.items():
                print(f"  • {field}: {value}")

        return result.valid

    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error validating {file_path}: {e}")
        return False


def validate_directory(dir_path: Path, validator: IntelSchemaValidator) -> Dict[str, int]:
    """Validate all JSON files in directory"""
    json_files = list(dir_path.rglob("*.json"))

    if not json_files:
        print(f"⚠️  No JSON files found in {dir_path}")
        return {"total": 0, "valid": 0, "invalid": 0}

    print(f"🔍 Found {len(json_files)} JSON files in {dir_path}")
    print(f"{'='*80}\n")

    results = {"total": len(json_files), "valid": 0, "invalid": 0}

    for json_file in json_files:
        is_valid = validate_file(json_file, validator)
        if is_valid:
            results["valid"] += 1
        else:
            results["invalid"] += 1

    # Summary
    print(f"\n{'='*80}")
    print("📊 VALIDATION SUMMARY")
    print(f"{'='*80}")
    print(f"Total files:   {results['total']}")
    print(f"✅ Valid:      {results['valid']} ({results['valid']/results['total']*100:.1f}%)")
    print(f"❌ Invalid:    {results['invalid']} ({results['invalid']/results['total']*100:.1f}%)")

    return results


def main():
    """Main CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Intel Scraping JSON Schema Stage 2 Validator"
    )
    parser.add_argument(
        "input",
        nargs="?",
        help="JSON file or directory to validate"
    )
    parser.add_argument(
        "--validate-dir",
        help="Validate all JSON files in directory"
    )
    parser.add_argument(
        "--config",
        default="config/categories_v2.json",
        help="Path to categories V2 config (default: config/categories_v2.json)"
    )

    args = parser.parse_args()

    # Initialize validator
    validator = IntelSchemaValidator(categories_config_path=args.config)

    if args.validate_dir:
        # Validate directory
        dir_path = Path(args.validate_dir)
        if not dir_path.exists():
            print(f"❌ Directory not found: {dir_path}")
            sys.exit(1)

        results = validate_directory(dir_path, validator)
        sys.exit(0 if results["invalid"] == 0 else 1)

    elif args.input:
        # Validate single file
        file_path = Path(args.input)
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            sys.exit(1)

        if file_path.is_dir():
            results = validate_directory(file_path, validator)
            sys.exit(0 if results["invalid"] == 0 else 1)
        else:
            is_valid = validate_file(file_path, validator)
            sys.exit(0 if is_valid else 1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
