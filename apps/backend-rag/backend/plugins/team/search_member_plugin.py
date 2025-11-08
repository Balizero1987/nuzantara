"""
Team Member Search Plugin

Migrated from: backend/services/zantara_tools.py -> _search_team_member
"""

from typing import Optional, List, Dict, Any
from pydantic import Field
from core.plugins import Plugin, PluginMetadata, PluginInput, PluginOutput, PluginCategory
from services.collaborator_service import CollaboratorService
import logging

logger = logging.getLogger(__name__)


class TeamSearchInput(PluginInput):
    """Input schema for team member search"""

    query: str = Field(..., description="Name to search for (e.g. 'Dea', 'Zero', 'Krisna')")


class TeamSearchOutput(PluginOutput):
    """Output schema for team member search"""

    count: Optional[int] = Field(None, description="Number of results found")
    results: Optional[List[Dict[str, Any]]] = Field(None, description="List of matching team members")
    message: Optional[str] = Field(None, description="Message if no results found")
    suggestion: Optional[str] = Field(None, description="Suggestion if no results found")


class TeamMemberSearchPlugin(Plugin):
    """
    Search for Bali Zero team members by name.

    Returns contact info, role, department, expertise level, and language.
    """

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        self.collaborator_service = CollaboratorService()

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="team.search_member",
            version="1.0.0",
            description="Search for a Bali Zero team member by name",
            category=PluginCategory.AUTH,
            tags=["team", "search", "member", "contact"],
            requires_auth=False,
            estimated_time=0.3,
            rate_limit=60,  # 60 calls per minute
            allowed_models=["haiku", "sonnet", "opus"],
            legacy_handler_key="search_team_member",
        )

    @property
    def input_schema(self):
        return TeamSearchInput

    @property
    def output_schema(self):
        return TeamSearchOutput

    async def validate(self, input_data: TeamSearchInput) -> bool:
        """Validate input"""
        if not input_data.query or not input_data.query.strip():
            return False
        return True

    async def execute(self, input_data: TeamSearchInput) -> TeamSearchOutput:
        """Execute team member search"""
        try:
            query = input_data.query.lower().strip()

            logger.info(f"👥 Team search: query={query}")

            # Search in TEAM_DATABASE by name only
            results = []
            for email, data in self.collaborator_service.TEAM_DATABASE.items():
                name = data.get("name", "").lower()

                # Match by full name or partial match
                if query in name or name.startswith(query):
                    results.append(
                        {
                            "name": data["name"],
                            "email": email,
                            "role": data["role"],
                            "department": data["department"],
                            "expertise_level": data["expertise_level"],
                            "language": data["language"],
                        }
                    )

            if not results:
                return TeamSearchOutput(
                    success=True,
                    data={
                        "message": f"No team member found matching '{query}'",
                        "suggestion": "Try searching by first name or department",
                    },
                    message=f"No team member found matching '{query}'",
                    suggestion="Try searching by first name or department",
                )

            return TeamSearchOutput(
                success=True,
                data={"count": len(results), "results": results},
                count=len(results),
                results=results,
            )

        except Exception as e:
            logger.error(f"❌ Team search error: {e}")
            return TeamSearchOutput(success=False, error=f"Team search failed: {str(e)}")
