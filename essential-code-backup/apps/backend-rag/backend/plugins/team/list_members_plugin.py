"""
Team Members List Plugin

Migrated from: backend/services/zantara_tools.py -> _get_team_members_list
"""

from typing import Optional, Dict, Any, List
from pydantic import Field
from core.plugins import Plugin, PluginMetadata, PluginInput, PluginOutput, PluginCategory
from services.collaborator_service import CollaboratorService
import logging

logger = logging.getLogger(__name__)


class TeamListInput(PluginInput):
    """Input schema for team list"""

    department: Optional[str] = Field(
        None, description="Optional: filter by department (technology, operations, creative, etc.)"
    )


class TeamListOutput(PluginOutput):
    """Output schema for team list"""

    total_members: Optional[int] = Field(None, description="Total number of team members")
    by_department: Optional[Dict[str, List[Dict[str, Any]]]] = Field(
        None, description="Team members grouped by department"
    )
    roster: Optional[List[Dict[str, Any]]] = Field(None, description="Full team roster")
    stats: Optional[Dict[str, Any]] = Field(None, description="Team statistics")


class TeamMembersListPlugin(Plugin):
    """
    Get full Bali Zero team roster, optionally filtered by department.

    Returns complete team roster with roles, departments, expertise levels, and stats.
    """

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        self.collaborator_service = CollaboratorService()

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="team.list_members",
            version="1.0.0",
            description="Get full Bali Zero team roster, optionally filtered by department",
            category=PluginCategory.AUTH,
            tags=["team", "roster", "list", "members"],
            requires_auth=False,
            estimated_time=0.5,
            rate_limit=30,  # 30 calls per minute
            allowed_models=["haiku", "sonnet", "opus"],
            legacy_handler_key="get_team_members_list",
        )

    @property
    def input_schema(self):
        return TeamListInput

    @property
    def output_schema(self):
        return TeamListOutput

    async def execute(self, input_data: TeamListInput) -> TeamListOutput:
        """Execute team list query"""
        try:
            department = (
                input_data.department.lower().strip() if input_data.department else None
            )

            logger.info(f"👥 Team list: department={department}")

            # Build roster from TEAM_DATABASE
            roster = []
            for email, data in self.collaborator_service.TEAM_DATABASE.items():
                # Filter by department if specified
                if department and data.get("department", "").lower() != department:
                    continue

                roster.append(
                    {
                        "name": data["name"],
                        "email": email,
                        "role": data["role"],
                        "department": data["department"],
                        "expertise_level": data["expertise_level"],
                        "sub_rosa_level": data["sub_rosa_level"],
                        "language": data["language"],
                    }
                )

            # Group by department for better readability
            by_department = {}
            for member in roster:
                dept = member["department"]
                if dept not in by_department:
                    by_department[dept] = []
                by_department[dept].append(member)

            # Get team stats
            stats = self.collaborator_service.get_team_stats()

            return TeamListOutput(
                success=True,
                data={
                    "total_members": len(roster),
                    "by_department": by_department,
                    "roster": roster,
                    "stats": stats,
                },
                total_members=len(roster),
                by_department=by_department,
                roster=roster,
                stats=stats,
            )

        except Exception as e:
            logger.error(f"❌ Team list error: {e}")
            return TeamListOutput(success=False, error=f"Team list failed: {str(e)}")
