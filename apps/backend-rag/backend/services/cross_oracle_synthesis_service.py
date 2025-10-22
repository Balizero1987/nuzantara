"""
Cross-Oracle Synthesis Agent - Phase 3 (Core Agent #1)

Orchestrates queries across multiple Oracle collections and synthesizes
integrated recommendations using Claude Sonnet.

Example Scenario: "I want to open a restaurant in Canggu"
→ Queries: kbli_eye, legal_architect, tax_genius, visa_oracle, property_knowledge, bali_zero_pricing
→ Synthesizes: Integrated plan with KBLI code, legal structure, tax obligations,
               staff visa requirements, location requirements, timeline, and total investment

This is the "magic" agent that makes complex business queries feel effortless.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class OracleQuery:
    """Query specification for a single Oracle collection"""
    collection: str
    query: str
    priority: int = 1  # 1=critical, 2=important, 3=optional
    rationale: str = ""  # Why this Oracle is needed


@dataclass
class SynthesisResult:
    """Result of cross-oracle synthesis"""
    query: str
    scenario_type: str  # e.g., "business_setup", "visa_application", "property_investment"
    oracles_consulted: List[str]
    synthesis: str  # Main synthesized answer
    timeline: Optional[str]  # Estimated timeline
    investment: Optional[str]  # Estimated costs
    key_requirements: List[str]  # Key action items
    risks: List[str]  # Identified risks
    sources: Dict[str, Any]  # Raw data from each Oracle
    confidence: float  # Overall confidence (0.0-1.0)
    cached: bool = False  # Whether from cache


class CrossOracleSynthesisService:
    """
    Orchestrates multi-Oracle queries and synthesizes integrated responses.

    The "conductor" of the Oracle system - knows when to consult which Oracles
    and how to combine their knowledge into actionable business plans.
    """

    # Scenario patterns and their Oracle requirements
    SCENARIO_PATTERNS = {
        "business_setup": {
            "keywords": [
                "open", "start", "setup", "launch", "business", "company",
                "restaurant", "cafe", "shop", "store", "hotel", "villa"
            ],
            "required_oracles": ["kbli_eye", "legal_architect", "tax_genius"],
            "optional_oracles": ["visa_oracle", "property_knowledge", "bali_zero_pricing"]
        },
        "visa_application": {
            "keywords": [
                "visa", "kitas", "kitap", "work permit", "stay permit",
                "immigration", "expat", "foreigner"
            ],
            "required_oracles": ["visa_oracle"],
            "optional_oracles": ["legal_architect", "tax_genius", "bali_zero_pricing"]
        },
        "property_investment": {
            "keywords": [
                "buy", "purchase", "invest", "property", "land", "villa",
                "real estate", "ownership", "leasehold", "freehold"
            ],
            "required_oracles": ["property_knowledge", "legal_architect"],
            "optional_oracles": ["tax_genius", "visa_oracle", "property_listings", "bali_zero_pricing"]
        },
        "tax_optimization": {
            "keywords": [
                "tax", "pajak", "npwp", "pph", "ppn", "tax planning",
                "tax obligation", "fiscal"
            ],
            "required_oracles": ["tax_genius"],
            "optional_oracles": ["legal_architect", "kbli_eye", "tax_updates"]
        },
        "compliance_check": {
            "keywords": [
                "compliance", "requirement", "regulation", "legal",
                "permit", "license", "izin"
            ],
            "required_oracles": ["legal_architect", "kbli_eye"],
            "optional_oracles": ["tax_genius", "visa_oracle", "legal_updates", "tax_updates"]
        }
    }

    def __init__(
        self,
        search_service,
        claude_sonnet_service,
        golden_answer_service=None
    ):
        """
        Initialize Cross-Oracle Synthesis Agent.

        Args:
            search_service: SearchService for collection queries
            claude_sonnet_service: Claude Sonnet for synthesis
            golden_answer_service: Optional cache for common scenarios
        """
        self.search = search_service
        self.claude = claude_sonnet_service
        self.golden_answers = golden_answer_service

        self.synthesis_stats = {
            "total_syntheses": 0,
            "cache_hits": 0,
            "avg_oracles_consulted": 0.0,
            "scenario_counts": {}
        }

        logger.info("✅ CrossOracleSynthesisService initialized")
        logger.info(f"   Scenario patterns: {len(self.SCENARIO_PATTERNS)}")
        logger.info(f"   Golden answer cache: {'✅' if golden_answer_service else '❌'}")

    def classify_scenario(self, query: str) -> Tuple[str, float]:
        """
        Classify user query into scenario type.

        Args:
            query: User query

        Returns:
            Tuple of (scenario_type, confidence)
        """
        query_lower = query.lower()
        scenario_scores = {}

        for scenario_type, pattern in self.SCENARIO_PATTERNS.items():
            score = sum(
                1 for keyword in pattern["keywords"]
                if keyword in query_lower
            )
            if score > 0:
                scenario_scores[scenario_type] = score

        if not scenario_scores:
            return "general", 0.0

        best_scenario = max(scenario_scores, key=scenario_scores.get)
        max_score = scenario_scores[best_scenario]

        # Normalize confidence (0.0-1.0)
        pattern_keywords = len(self.SCENARIO_PATTERNS[best_scenario]["keywords"])
        confidence = min(max_score / 5.0, 1.0)  # Cap at 1.0

        logger.info(f"🎯 Scenario classified: {best_scenario} (confidence={confidence:.2f})")
        return best_scenario, confidence

    def determine_oracles(
        self,
        query: str,
        scenario_type: str
    ) -> List[OracleQuery]:
        """
        Determine which Oracles to consult for a scenario.

        Args:
            query: User query
            scenario_type: Classified scenario type

        Returns:
            List of OracleQuery specs
        """
        if scenario_type not in self.SCENARIO_PATTERNS:
            # Default: use query router's fallback logic
            return [
                OracleQuery(
                    collection="visa_oracle",
                    query=query,
                    priority=1,
                    rationale="Default Oracle"
                )
            ]

        pattern = self.SCENARIO_PATTERNS[scenario_type]
        oracle_queries = []

        # Add required Oracles
        for oracle in pattern["required_oracles"]:
            oracle_queries.append(
                OracleQuery(
                    collection=oracle,
                    query=query,  # Same query for all
                    priority=1,
                    rationale=f"Required for {scenario_type}"
                )
            )

        # Add optional Oracles
        for oracle in pattern["optional_oracles"]:
            oracle_queries.append(
                OracleQuery(
                    collection=oracle,
                    query=query,
                    priority=2,
                    rationale=f"Enhances {scenario_type} analysis"
                )
            )

        logger.info(
            f"📋 Oracles to consult: {len(oracle_queries)} "
            f"(required={len(pattern['required_oracles'])}, "
            f"optional={len(pattern['optional_oracles'])})"
        )

        return oracle_queries

    async def query_oracle(
        self,
        oracle_query: OracleQuery,
        user_level: int = 3
    ) -> Dict[str, Any]:
        """
        Query a single Oracle collection.

        Args:
            oracle_query: Oracle query specification
            user_level: User access level

        Returns:
            Dict with results and metadata
        """
        try:
            logger.info(f"   Querying {oracle_query.collection}...")

            # Use search_service directly
            results = await self.search.search(
                query=oracle_query.query,
                user_level=user_level,
                limit=3,  # Top 3 results per Oracle
                collection_override=oracle_query.collection
            )

            return {
                "collection": oracle_query.collection,
                "priority": oracle_query.priority,
                "rationale": oracle_query.rationale,
                "results": results.get("results", []),
                "result_count": len(results.get("results", [])),
                "success": len(results.get("results", [])) > 0
            }

        except Exception as e:
            logger.error(f"❌ Error querying {oracle_query.collection}: {e}")
            return {
                "collection": oracle_query.collection,
                "priority": oracle_query.priority,
                "rationale": oracle_query.rationale,
                "results": [],
                "result_count": 0,
                "success": False,
                "error": str(e)
            }

    async def query_all_oracles(
        self,
        oracle_queries: List[OracleQuery],
        user_level: int = 3
    ) -> Dict[str, Any]:
        """
        Query all Oracles in parallel.

        Args:
            oracle_queries: List of Oracle query specs
            user_level: User access level

        Returns:
            Dict mapping collection_name -> results
        """
        logger.info(f"🔄 Querying {len(oracle_queries)} Oracles in parallel...")

        # Query all in parallel
        tasks = [
            self.query_oracle(oq, user_level)
            for oq in oracle_queries
        ]

        oracle_results = await asyncio.gather(*tasks)

        # Convert to dict
        results_dict = {
            result["collection"]: result
            for result in oracle_results
        }

        # Log summary
        successful = sum(1 for r in oracle_results if r["success"])
        total_results = sum(r["result_count"] for r in oracle_results)

        logger.info(
            f"✅ Oracle queries complete: {successful}/{len(oracle_queries)} successful, "
            f"{total_results} total results"
        )

        return results_dict

    async def synthesize_with_claude(
        self,
        query: str,
        scenario_type: str,
        oracle_results: Dict[str, Any]
    ) -> str:
        """
        Use Claude Sonnet to synthesize Oracle results into integrated answer.

        Args:
            query: Original user query
            scenario_type: Classified scenario type
            oracle_results: Results from all Oracles

        Returns:
            Synthesized answer string
        """
        # Build context from Oracle results
        context_parts = []

        for collection, result in oracle_results.items():
            if result["success"] and result["results"]:
                context_parts.append(f"\n=== {collection.upper().replace('_', ' ')} ===")
                for i, res in enumerate(result["results"][:3], 1):
                    context_parts.append(f"\n[{i}] {res['text'][:500]}")  # First 500 chars

        context = "\n".join(context_parts)

        # Synthesis prompt
        synthesis_prompt = f"""You are synthesizing information from multiple specialized Oracle knowledge bases to answer a complex business query.

Scenario Type: {scenario_type}
User Query: {query}

Oracle Results:
{context}

Task: Create an integrated, actionable answer that:
1. Synthesizes information from ALL relevant Oracles
2. Provides a clear recommendation or plan
3. Includes timeline estimate (if applicable)
4. Includes investment/cost estimate (if applicable)
5. Lists key requirements and action items
6. Identifies potential risks or challenges

Format your response as:

## Integrated Recommendation
[Your synthesized answer]

## Timeline
[Estimated timeline if applicable]

## Investment Required
[Estimated costs if applicable]

## Key Requirements
- [Requirement 1]
- [Requirement 2]
...

## Potential Risks
- [Risk 1]
- [Risk 2]
...

Be specific, actionable, and reference which Oracle provided which information when relevant.
Keep the response comprehensive but concise (max 800 words).
"""

        logger.info("🧠 Synthesizing with Claude Sonnet...")

        try:
            # Call Claude Sonnet (assuming it has a simple text completion method)
            response = await self.claude.conversational(
                message=synthesis_prompt,
                user_id="cross_oracle_synthesis",
                context=None,
                conversation_history=[],
                max_tokens=1500
            )

            synthesis_text = response.get("text", "")
            logger.info(f"✅ Synthesis complete ({len(synthesis_text)} chars)")

            return synthesis_text

        except Exception as e:
            logger.error(f"❌ Synthesis error: {e}")
            # Fallback: simple concatenation
            return self._simple_synthesis(query, oracle_results)

    def _simple_synthesis(
        self,
        query: str,
        oracle_results: Dict[str, Any]
    ) -> str:
        """Fallback synthesis without AI (simple concatenation)"""
        parts = [f"## Results for: {query}\n"]

        for collection, result in oracle_results.items():
            if result["success"] and result["results"]:
                parts.append(f"\n### {collection.replace('_', ' ').title()}")
                for i, res in enumerate(result["results"][:2], 1):
                    parts.append(f"{i}. {res['text'][:300]}...")

        return "\n".join(parts)

    def _parse_synthesis(self, synthesis_text: str) -> Dict[str, Any]:
        """
        Parse synthesized text to extract structured data.

        Returns:
            Dict with timeline, investment, requirements, risks
        """
        import re

        parsed = {
            "timeline": None,
            "investment": None,
            "key_requirements": [],
            "risks": []
        }

        # Extract timeline
        timeline_match = re.search(r"## Timeline\s*\n(.*?)(?=\n##|\Z)", synthesis_text, re.DOTALL)
        if timeline_match:
            parsed["timeline"] = timeline_match.group(1).strip()

        # Extract investment
        investment_match = re.search(r"## Investment Required\s*\n(.*?)(?=\n##|\Z)", synthesis_text, re.DOTALL)
        if investment_match:
            parsed["investment"] = investment_match.group(1).strip()

        # Extract key requirements
        req_match = re.search(r"## Key Requirements\s*\n(.*?)(?=\n##|\Z)", synthesis_text, re.DOTALL)
        if req_match:
            req_text = req_match.group(1).strip()
            parsed["key_requirements"] = [
                line.strip().lstrip("-•*").strip()
                for line in req_text.split("\n")
                if line.strip() and line.strip().startswith(("-", "•", "*"))
            ]

        # Extract risks
        risk_match = re.search(r"## Potential Risks\s*\n(.*?)(?=\n##|\Z)", synthesis_text, re.DOTALL)
        if risk_match:
            risk_text = risk_match.group(1).strip()
            parsed["risks"] = [
                line.strip().lstrip("-•*").strip()
                for line in risk_text.split("\n")
                if line.strip() and line.strip().startswith(("-", "•", "*"))
            ]

        return parsed

    async def synthesize(
        self,
        query: str,
        user_level: int = 3,
        use_cache: bool = True
    ) -> SynthesisResult:
        """
        Main synthesis method - orchestrates full cross-Oracle synthesis.

        Args:
            query: User query
            user_level: User access level
            use_cache: Whether to check golden answer cache

        Returns:
            SynthesisResult with integrated answer
        """
        self.synthesis_stats["total_syntheses"] += 1

        logger.info(f"🎯 Starting cross-Oracle synthesis for: '{query}'")

        # Step 1: Check cache (if enabled)
        if use_cache and self.golden_answers:
            # TODO: Implement golden answer cache check
            pass

        # Step 2: Classify scenario
        scenario_type, confidence = self.classify_scenario(query)

        # Update stats
        self.synthesis_stats["scenario_counts"][scenario_type] = \
            self.synthesis_stats["scenario_counts"].get(scenario_type, 0) + 1

        # Step 3: Determine which Oracles to consult
        oracle_queries = self.determine_oracles(query, scenario_type)

        # Step 4: Query all Oracles in parallel
        oracle_results = await self.query_all_oracles(oracle_queries, user_level)

        # Update stats
        oracles_consulted = [k for k, v in oracle_results.items() if v["success"]]
        self.synthesis_stats["avg_oracles_consulted"] = (
            (self.synthesis_stats["avg_oracles_consulted"] * (self.synthesis_stats["total_syntheses"] - 1)
             + len(oracles_consulted))
            / self.synthesis_stats["total_syntheses"]
        )

        # Step 5: Synthesize with Claude Sonnet
        synthesis_text = await self.synthesize_with_claude(
            query,
            scenario_type,
            oracle_results
        )

        # Step 6: Parse structured data from synthesis
        parsed = self._parse_synthesis(synthesis_text)

        # Step 7: Build result
        result = SynthesisResult(
            query=query,
            scenario_type=scenario_type,
            oracles_consulted=oracles_consulted,
            synthesis=synthesis_text,
            timeline=parsed["timeline"],
            investment=parsed["investment"],
            key_requirements=parsed["key_requirements"],
            risks=parsed["risks"],
            sources=oracle_results,
            confidence=confidence,
            cached=False
        )

        logger.info(
            f"✅ Synthesis complete: {scenario_type}, "
            f"{len(oracles_consulted)} Oracles, "
            f"confidence={confidence:.2f}"
        )

        return result

    def get_synthesis_stats(self) -> Dict:
        """Get synthesis statistics"""
        return {
            **self.synthesis_stats,
            "scenario_distribution": self.synthesis_stats["scenario_counts"]
        }
