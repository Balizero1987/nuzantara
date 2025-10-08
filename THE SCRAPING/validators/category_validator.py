"""
Category Validation Rules
Validates content belongs to correct category and meets quality standards
"""

import re
from typing import Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ValidationResult:
    valid: bool
    confidence: float
    reason: str = ""
    suggested_category: str = ""
    issues: List[str] = None

    def __post_init__(self):
        if self.issues is None:
            self.issues = []

class CategoryValidator:
    """Validates articles match their declared category"""

    def __init__(self):
        # Positive keywords (content SHOULD contain these)
        self.category_keywords = {
            'regulatory_changes': [
                'perpres', 'uu ', 'pmk', 'permen', 'regulation', 'peraturan',
                'berlaku', 'effective', 'nomor', 'tahun', 'ministry', 'kementerian'
            ],
            'visa_immigration': [
                'visa', 'kitas', 'kitap', 'b211', 'e33', 'immigration',
                'imigrasi', 'permit', 'stay permit', 'sponsor', 'passport'
            ],
            'tax_compliance': [
                'pajak', 'tax', 'pph', 'ppn', 'djp', 'npwp', 'spt',
                'filing', 'deadline', 'rate', 'tarif', 'kemenkeu'
            ],
            'business_setup': [
                'pt pma', 'pt ', 'cv', 'investment', 'bkpm', 'oss', 'nib',
                'incorporation', 'company', 'perusahaan', 'modal', 'capital'
            ],
            'real_estate_law': [
                'property', 'land', 'tanah', 'hak milik', 'hgb', 'hak pakai',
                'building', 'imb', 'bpn', 'real estate', 'properti'
            ],
            'banking_finance': [
                'bank', 'account', 'transfer', 'forex', 'rekening', 'bi rate',
                'lhdn', 'ojk', 'financial', 'keuangan', 'valas'
            ],
            'employment_law': [
                'employment', 'labor', 'tenaga kerja', 'minimum wage', 'umk', 'ump',
                'bpjs', 'severance', 'phk', 'contract', 'pkwt', 'pkwtt', 'imta'
            ],
            'coworking_ecosystem': [
                'coworking', 'networking', 'event', 'community', 'digital nomad',
                'space', 'workspace', 'meetup', 'bali', 'canggu', 'ubud'
            ],
            'competitor_intel': [
                'price', 'service', 'package', 'harga', 'pricing', 'offer',
                'competitor', 'company', 'setup', 'visa service'
            ],
            'macro_policy': [
                'inflation', 'gdp', 'growth', 'interest rate', 'bi rate',
                'economy', 'ekonomi', 'monetary', 'fiscal', 'subsidy'
            ]
        }

        # Negative keywords (content should NOT contain these for category)
        self.category_blacklist = {
            'real_estate_law': [
                'machinery', 'alat berat', 'equipment', 'mesin',
                'shipping', 'logistics', 'tug boat', 'kapal',
                'pupuk', 'irigasi', 'pertanian', 'agricultural'
            ],
            'visa_immigration': [
                'hotel', 'resort', 'tourism package', 'tour', 'restaurant',
                'property for sale', 'villa rental'
            ],
            'tax_compliance': [
                'visa application', 'passport', 'flight ticket'
            ],
            'coworking_ecosystem': [
                'jakarta', 'surabaya', 'bandung', 'yogyakarta'  # Must be Bali
            ]
        }

        # Regulation number patterns
        self.regulation_patterns = {
            'regulatory_changes': [
                r'(UU|PP|Perpres|PMK|Permen|Permenkumham)\s+No\.?\s*\d+\s+Tahun\s+\d{4}',
                r'(UU|PP|Perpres|PMK|Permen)\s+\d+/\d{4}',
            ],
            'tax_compliance': [
                r'PMK\s+No\.?\s*\d+',
                r'SE[-\s]DJP[-\s]\d+',
            ]
        }

    def validate(self, article: Dict, declared_category: str) -> ValidationResult:
        """Validate article matches declared category"""

        content = article.get('content', '').lower()
        title = article.get('title', '').lower()
        combined = f"{title} {content}"

        # Check 1: Positive keywords
        keyword_score = self._check_keywords(combined, declared_category)

        # Check 2: Blacklist terms
        blacklist_issues = self._check_blacklist(combined, declared_category)

        # Check 3: Regulation patterns (for regulatory categories)
        regulation_score = self._check_regulations(content, declared_category)

        # Calculate total confidence
        confidence = keyword_score
        if regulation_score > 0:
            confidence = (keyword_score + regulation_score) / 2

        # Determine if valid
        valid = confidence >= 0.4 and len(blacklist_issues) == 0

        # Suggest category if wrong
        suggested = ""
        if not valid:
            suggested = self._suggest_category(combined)

        return ValidationResult(
            valid=valid,
            confidence=confidence,
            reason=self._build_reason(keyword_score, blacklist_issues, regulation_score),
            suggested_category=suggested,
            issues=blacklist_issues
        )

    def _check_keywords(self, content: str, category: str) -> float:
        """Check how many category keywords are present"""
        keywords = self.category_keywords.get(category, [])
        if not keywords:
            return 0.5  # Neutral if no keywords defined

        matches = sum(1 for kw in keywords if kw in content)
        score = min(matches / 5.0, 1.0)  # Max score at 5 keywords
        return score

    def _check_blacklist(self, content: str, category: str) -> List[str]:
        """Check for blacklisted terms"""
        blacklist = self.category_blacklist.get(category, [])
        issues = []

        for term in blacklist:
            if term in content:
                issues.append(f"Blacklisted term found: '{term}'")

        return issues

    def _check_regulations(self, content: str, category: str) -> float:
        """Check for regulation number patterns"""
        patterns = self.regulation_patterns.get(category, [])
        if not patterns:
            return 0  # Not applicable for this category

        for pattern in patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return 1.0  # Strong signal if regulation found

        return 0

    def _suggest_category(self, content: str) -> str:
        """Suggest correct category based on content analysis"""
        scores = {}

        for cat, keywords in self.category_keywords.items():
            score = sum(1 for kw in keywords if kw in content)
            scores[cat] = score

        if not scores or max(scores.values()) == 0:
            return "uncategorized"

        return max(scores, key=scores.get)

    def _build_reason(self, keyword_score: float, blacklist_issues: List[str], regulation_score: float) -> str:
        """Build human-readable validation reason"""
        reasons = []

        if keyword_score < 0.4:
            reasons.append(f"Low keyword match ({keyword_score:.1%})")

        if blacklist_issues:
            reasons.append(f"{len(blacklist_issues)} blacklisted terms")

        if regulation_score == 0 and keyword_score < 0.6:
            reasons.append("No regulation number found")

        return "; ".join(reasons) if reasons else "Valid"


class MetadataValidator:
    """Validates metadata completeness and quality"""

    REQUIRED_FIELDS = {
        'regulatory_changes': ['regulation_number', 'effective_date', 'what_changed', 'impact_on'],
        'visa_immigration': ['visa_type', 'change_type', 'effective_date'],
        'tax_compliance': ['tax_type', 'change_type', 'effective_date', 'who_affected'],
        'business_setup': ['entity_type', 'change_type', 'effective_date'],
        'real_estate_law': ['property_type', 'change_type', 'effective_date'],
        'banking_finance': ['regulation_type', 'change_type', 'effective_date'],
        'employment_law': ['regulation_type', 'location', 'effective_date'],
        'coworking_ecosystem': ['item_type', 'location', 'name'],
        'competitor_intel': ['competitor_name', 'service_type', 'observation_date'],
        'macro_policy': ['indicator_type', 'value', 'date'],
    }

    def validate_completeness(self, article: Dict, category: str) -> Tuple[bool, float, List[str]]:
        """Check if article has minimum required metadata"""
        required = self.REQUIRED_FIELDS.get(category, [])
        if not required:
            return True, 1.0, []

        metadata = article.get('metadata', {})

        present_fields = []
        missing_fields = []

        for field in required:
            if field in metadata and metadata[field]:
                present_fields.append(field)
            else:
                missing_fields.append(field)

        completeness = len(present_fields) / len(required) if required else 0

        # Require 60% completeness
        is_complete = completeness >= 0.6

        return is_complete, completeness, missing_fields

    def validate_field_formats(self, article: Dict, category: str) -> List[str]:
        """Validate field formats (dates, numbers, etc.)"""
        issues = []
        metadata = article.get('metadata', {})

        # Date format validation
        date_fields = ['effective_date', 'date', 'observation_date', 'deadline']
        for field in date_fields:
            if field in metadata:
                if not self._is_valid_date(metadata[field]):
                    issues.append(f"Invalid date format: {field}={metadata[field]}")

        # Regulation number format
        if category == 'regulatory_changes' and 'regulation_number' in metadata:
            if not self._is_valid_regulation(metadata['regulation_number']):
                issues.append(f"Invalid regulation format: {metadata['regulation_number']}")

        # Numeric validations
        if category == 'tax_compliance':
            if 'new_rate' in metadata:
                if not self._is_valid_percentage(metadata['new_rate']):
                    issues.append(f"Invalid tax rate: {metadata['new_rate']}")

        if category == 'employment_law':
            if 'minimum_wage_idr' in metadata:
                if not self._is_valid_idr(metadata['minimum_wage_idr']):
                    issues.append(f"Invalid wage amount: {metadata['minimum_wage_idr']}")

        return issues

    def _is_valid_date(self, date_str: str) -> bool:
        """Check if date is in valid format"""
        if not date_str:
            return False

        # Try DD/MM/YYYY
        if re.match(r'^\d{2}/\d{2}/\d{4}$', date_str):
            return True

        # Try YYYY-MM-DD
        if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
            return True

        # Try parsing with datetime
        try:
            datetime.strptime(date_str, '%d/%m/%Y')
            return True
        except:
            pass

        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return True
        except:
            pass

        return False

    def _is_valid_regulation(self, reg_str: str) -> bool:
        """Check if regulation number is valid format"""
        pattern = r'(UU|PP|Perpres|PMK|Permen|Permenkumham|SE)\s+(No\.?\s*)?\d+\s+(Tahun\s+)?\d{4}'
        return bool(re.search(pattern, reg_str, re.IGNORECASE))

    def _is_valid_percentage(self, value: str) -> bool:
        """Check if percentage is valid"""
        if isinstance(value, (int, float)):
            return True
        if isinstance(value, str):
            # Strip % sign if present
            val = value.replace('%', '').strip()
            try:
                float(val)
                return True
            except:
                return False
        return False

    def _is_valid_idr(self, value) -> bool:
        """Check if IDR amount is valid"""
        if isinstance(value, int):
            return value > 0
        if isinstance(value, str):
            # Remove common formatting
            val = value.replace('IDR', '').replace(',', '').replace('.', '').strip()
            try:
                return int(val) > 0
            except:
                return False
        return False


class QualityScorer:
    """Scores article quality on 0-10 scale"""

    def score_article(self, article: Dict, category: str) -> Tuple[float, List[str]]:
        """Score extracted article quality"""
        score = 0.0
        feedback = []

        metadata = article.get('metadata', {})
        content = article.get('content', '')
        source_tier = article.get('source', {}).get('tier', 'tier_3')

        # 1. Actionability (0-3 points)
        actionable_fields = ['cost', 'cost_idr', 'processing_time', 'processing_days',
                            'requirements', 'deadline', 'rate', 'new_rate',
                            'effective_date', 'compliance_deadline']
        present_data = sum(1 for field in actionable_fields if field in metadata and metadata[field])
        actionability_score = min(3.0, present_data * 0.75)
        score += actionability_score

        if actionability_score < 2.0:
            feedback.append(f"Low actionability: only {present_data} data fields")

        # 2. Specificity (0-3 points)
        has_numbers = bool(re.search(r'\d+', str(metadata)))
        has_dates = bool(metadata.get('effective_date') or metadata.get('date'))
        has_regulations = bool(re.search(r'(UU|PP|Perpres|PMK)\s+\d+', content))

        specificity_count = sum([has_numbers, has_dates, has_regulations])
        specificity_score = specificity_count * 1.0
        score += specificity_score

        if not has_numbers:
            feedback.append("Missing numerical data")
        if not has_dates:
            feedback.append("Missing dates")
        if not has_regulations and category in ['regulatory_changes', 'tax_compliance']:
            feedback.append("No regulation reference")

        # 3. Source credibility (0-2 points)
        tier_scores = {'tier_1': 2.0, 'tier_2': 1.0, 'tier_3': 0.5, 'tier_0': 0}
        credibility_score = tier_scores.get(source_tier, 0)
        score += credibility_score

        if source_tier == 'tier_3':
            feedback.append("Low-credibility source (Tier 3)")

        # 4. Freshness (0-2 points)
        date_str = metadata.get('effective_date') or metadata.get('date') or metadata.get('observation_date')
        if date_str:
            try:
                if '/' in date_str:
                    date = datetime.strptime(date_str, '%d/%m/%Y')
                else:
                    date = datetime.strptime(date_str, '%Y-%m-%d')

                days_old = (datetime.now() - date).days
                if days_old < 90:
                    freshness_score = 2.0
                elif days_old < 365:
                    freshness_score = 1.0
                else:
                    freshness_score = 0.5
                    feedback.append(f"Outdated: {days_old} days old")
            except:
                freshness_score = 0.0
                feedback.append("Invalid date format")
        else:
            freshness_score = 0.0
            feedback.append("No date extracted")

        score += freshness_score

        return score, feedback


def validate_article_pipeline(article: Dict, category: str) -> Dict:
    """Complete validation pipeline"""

    # Category validation
    cat_validator = CategoryValidator()
    cat_result = cat_validator.validate(article, category)

    # Metadata validation
    meta_validator = MetadataValidator()
    is_complete, completeness, missing_fields = meta_validator.validate_completeness(article, category)
    format_issues = meta_validator.validate_field_formats(article, category)

    # Quality scoring
    scorer = QualityScorer()
    quality_score, quality_feedback = scorer.score_article(article, category)

    # Combined result
    return {
        'category_valid': cat_result.valid,
        'category_confidence': cat_result.confidence,
        'category_issues': cat_result.issues,
        'suggested_category': cat_result.suggested_category,
        'metadata_complete': is_complete,
        'metadata_completeness': completeness,
        'missing_fields': missing_fields,
        'format_issues': format_issues,
        'quality_score': quality_score,
        'quality_feedback': quality_feedback,
        'overall_valid': cat_result.valid and is_complete and quality_score >= 5.0
    }
