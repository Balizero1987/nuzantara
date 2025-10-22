"""
Client Journey Orchestrator - Phase 3 (Orchestration Agent #1)

Manages multi-step business workflows with automatic progress tracking,
document collection, and timeline management.

Example Journey: "PT PMA Setup"
→ Steps:
  1. Company name approval (KEMENKUMHAM) - Prerequisites: None
  2. Notary deed preparation - Prerequisites: Step 1 complete
  3. NIB application (OSS) - Prerequisites: Step 2 complete
  4. NPWP registration - Prerequisites: Step 3 complete
  5. Bank account opening - Prerequisites: Step 4 complete
  6. Virtual office setup - Prerequisites: Step 5 complete
  7. Director KITAS application - Prerequisites: Step 1-6 complete

Each step tracks:
- Status (pending/in_progress/completed/blocked)
- Required documents
- Estimated timeline
- Actual completion date
- Blocking issues
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
import json

logger = logging.getLogger(__name__)


class StepStatus(str, Enum):
    """Status of a journey step"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"


class JourneyStatus(str, Enum):
    """Overall journey status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


@dataclass
class JourneyStep:
    """Single step in a client journey"""
    step_id: str
    step_number: int
    title: str
    description: str
    prerequisites: List[str]  # List of step_ids that must complete first
    required_documents: List[str]
    estimated_duration_days: int
    status: StepStatus = StepStatus.PENDING
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    blocked_reason: Optional[str] = None
    notes: List[str] = field(default_factory=list)


@dataclass
class ClientJourney:
    """Complete client journey"""
    journey_id: str
    journey_type: str  # e.g., "pt_pma_setup", "visa_application", etc.
    client_id: str
    title: str
    description: str
    steps: List[JourneyStep]
    status: JourneyStatus = JourneyStatus.NOT_STARTED
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    estimated_completion: Optional[str] = None
    actual_completion: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class ClientJourneyOrchestrator:
    """
    Orchestrates multi-step client journeys with automatic workflow management.

    Features:
    - Journey templates for common scenarios
    - Automatic prerequisite checking
    - Progress tracking and timeline estimation
    - Document requirement tracking
    - Automatic notifications (via integration)
    - Analytics and reporting
    """

    # Journey templates
    JOURNEY_TEMPLATES = {
        "pt_pma_setup": {
            "title": "PT PMA Company Setup",
            "description": "Complete incorporation of Foreign Investment Company (PT PMA)",
            "steps": [
                {
                    "step_id": "name_approval",
                    "title": "Company Name Approval",
                    "description": "Submit company name to KEMENKUMHAM for approval",
                    "prerequisites": [],
                    "required_documents": ["Proposed company names (3 options)", "Business plan summary"],
                    "estimated_duration_days": 3
                },
                {
                    "step_id": "notary_deed",
                    "title": "Notary Deed Preparation",
                    "description": "Prepare Articles of Association (Akta Pendirian) with notary",
                    "prerequisites": ["name_approval"],
                    "required_documents": ["Approved company name", "Shareholder passports", "Shareholder KTP/KITAS", "Company address proof"],
                    "estimated_duration_days": 5
                },
                {
                    "step_id": "nib_application",
                    "title": "NIB Application (OSS)",
                    "description": "Apply for Business Identification Number via OSS system",
                    "prerequisites": ["notary_deed"],
                    "required_documents": ["Notarized deed", "KBLI codes", "Investment plan"],
                    "estimated_duration_days": 7
                },
                {
                    "step_id": "npwp_registration",
                    "title": "NPWP Tax Registration",
                    "description": "Register company for Tax ID (NPWP) and VAT (PKP if required)",
                    "prerequisites": ["nib_application"],
                    "required_documents": ["NIB", "Company deed", "Domicile letter"],
                    "estimated_duration_days": 14
                },
                {
                    "step_id": "bank_account",
                    "title": "Corporate Bank Account",
                    "description": "Open corporate bank account and deposit minimum capital",
                    "prerequisites": ["npwp_registration"],
                    "required_documents": ["NIB", "NPWP", "Company deed", "Director ID", "Domicile letter"],
                    "estimated_duration_days": 7
                },
                {
                    "step_id": "virtual_office",
                    "title": "Virtual Office Setup",
                    "description": "Establish registered office address (can be virtual)",
                    "prerequisites": ["bank_account"],
                    "required_documents": ["Lease agreement or virtual office contract"],
                    "estimated_duration_days": 3
                },
                {
                    "step_id": "director_kitas",
                    "title": "Director KITAS Application",
                    "description": "Apply for work permit and KITAS for foreign director(s)",
                    "prerequisites": ["nib_application", "bank_account"],
                    "required_documents": ["Passport", "Company NIB", "IMTA", "Sponsor letter", "Health certificate"],
                    "estimated_duration_days": 30
                }
            ]
        },
        "kitas_application": {
            "title": "KITAS Work Permit Application",
            "description": "Complete process for obtaining KITAS (Limited Stay Permit) for work",
            "steps": [
                {
                    "step_id": "sponsor_letter",
                    "title": "Obtain Sponsor Letter",
                    "description": "Get sponsor letter from Indonesian company",
                    "prerequisites": [],
                    "required_documents": ["Company NIB", "NPWP", "Domicile letter"],
                    "estimated_duration_days": 3
                },
                {
                    "step_id": "imta_application",
                    "title": "IMTA Application",
                    "description": "Apply for Foreign Worker Employment Permit (IMTA)",
                    "prerequisites": ["sponsor_letter"],
                    "required_documents": ["Sponsor letter", "Passport copy", "CV", "Educational certificates"],
                    "estimated_duration_days": 14
                },
                {
                    "step_id": "visa_approval",
                    "title": "Visa Approval (VITAS)",
                    "description": "Obtain visa approval from immigration",
                    "prerequisites": ["imta_application"],
                    "required_documents": ["IMTA", "Passport copy", "Sponsor documents"],
                    "estimated_duration_days": 7
                },
                {
                    "step_id": "visa_sticker",
                    "title": "Visa Sticker at Embassy",
                    "description": "Get visa sticker at Indonesian embassy in home country",
                    "prerequisites": ["visa_approval"],
                    "required_documents": ["Passport", "VITAS approval", "Telex visa"],
                    "estimated_duration_days": 3
                },
                {
                    "step_id": "entry_indonesia",
                    "title": "Enter Indonesia",
                    "description": "Travel to Indonesia with work visa",
                    "prerequisites": ["visa_sticker"],
                    "required_documents": ["Passport with visa sticker"],
                    "estimated_duration_days": 1
                },
                {
                    "step_id": "kitas_card",
                    "title": "KITAS Card Issuance",
                    "description": "Complete biometrics and receive KITAS card",
                    "prerequisites": ["entry_indonesia"],
                    "required_documents": ["Passport", "Immigration form", "Photos", "Health certificate"],
                    "estimated_duration_days": 14
                }
            ]
        },
        "property_purchase": {
            "title": "Property Purchase (Leasehold)",
            "description": "Complete process for purchasing leasehold property in Indonesia",
            "steps": [
                {
                    "step_id": "property_selection",
                    "title": "Property Selection & LOI",
                    "description": "Select property and submit Letter of Intent",
                    "prerequisites": [],
                    "required_documents": ["LOI", "Passport copy", "Deposit payment proof"],
                    "estimated_duration_days": 7
                },
                {
                    "step_id": "due_diligence",
                    "title": "Legal Due Diligence",
                    "description": "Verify land certificates, zoning, and legal compliance",
                    "prerequisites": ["property_selection"],
                    "required_documents": ["Land certificate (SHM/HGB)", "IMB", "PBB receipts", "Owner ID"],
                    "estimated_duration_days": 14
                },
                {
                    "step_id": "lease_agreement",
                    "title": "Lease Agreement Drafting",
                    "description": "Draft and negotiate lease agreement (max 30 years)",
                    "prerequisites": ["due_diligence"],
                    "required_documents": ["Due diligence report", "Buyer/Seller IDs", "Property documents"],
                    "estimated_duration_days": 7
                },
                {
                    "step_id": "notary_signing",
                    "title": "Notary Signing",
                    "description": "Sign lease agreement at notary office",
                    "prerequisites": ["lease_agreement"],
                    "required_documents": ["Lease agreement", "All parties present with ID", "Payment proof"],
                    "estimated_duration_days": 1
                },
                {
                    "step_id": "registration",
                    "title": "Land Office Registration",
                    "description": "Register lease at BPN (Land Office)",
                    "prerequisites": ["notary_signing"],
                    "required_documents": ["Notarized lease", "Land certificate", "Registration fees"],
                    "estimated_duration_days": 30
                }
            ]
        }
    }

    def __init__(self):
        """Initialize Client Journey Orchestrator"""
        self.active_journeys: Dict[str, ClientJourney] = {}

        self.orchestrator_stats = {
            "total_journeys_created": 0,
            "active_journeys": 0,
            "completed_journeys": 0,
            "avg_completion_days": 0.0,
            "journey_type_distribution": {}
        }

        logger.info("✅ ClientJourneyOrchestrator initialized")
        logger.info(f"   Templates available: {len(self.JOURNEY_TEMPLATES)}")

    def create_journey(
        self,
        journey_type: str,
        client_id: str,
        custom_metadata: Optional[Dict] = None
    ) -> ClientJourney:
        """
        Create a new client journey from template.

        Args:
            journey_type: Journey template key
            client_id: Client identifier
            custom_metadata: Optional custom data

        Returns:
            ClientJourney instance
        """
        if journey_type not in self.JOURNEY_TEMPLATES:
            raise ValueError(f"Unknown journey type: {journey_type}")

        template = self.JOURNEY_TEMPLATES[journey_type]

        # Generate journey ID
        journey_id = f"{journey_type}_{client_id}_{int(datetime.now().timestamp())}"

        # Create steps from template
        steps = []
        for i, step_template in enumerate(template["steps"], 1):
            step = JourneyStep(
                step_id=step_template["step_id"],
                step_number=i,
                title=step_template["title"],
                description=step_template["description"],
                prerequisites=step_template["prerequisites"],
                required_documents=step_template["required_documents"],
                estimated_duration_days=step_template["estimated_duration_days"]
            )
            steps.append(step)

        # Calculate estimated completion
        total_days = sum(s.estimated_duration_days for s in steps)
        estimated_completion = (datetime.now() + timedelta(days=total_days)).isoformat()

        # Create journey
        journey = ClientJourney(
            journey_id=journey_id,
            journey_type=journey_type,
            client_id=client_id,
            title=template["title"],
            description=template["description"],
            steps=steps,
            estimated_completion=estimated_completion,
            metadata=custom_metadata or {}
        )

        # Store journey
        self.active_journeys[journey_id] = journey

        # Update stats
        self.orchestrator_stats["total_journeys_created"] += 1
        self.orchestrator_stats["active_journeys"] += 1
        self.orchestrator_stats["journey_type_distribution"][journey_type] = \
            self.orchestrator_stats["journey_type_distribution"].get(journey_type, 0) + 1

        logger.info(
            f"✅ Created journey: {journey_id} ({journey_type}) - "
            f"{len(steps)} steps, estimated {total_days} days"
        )

        return journey

    def get_journey(self, journey_id: str) -> Optional[ClientJourney]:
        """Get journey by ID"""
        return self.active_journeys.get(journey_id)

    def check_prerequisites(
        self,
        journey: ClientJourney,
        step_id: str
    ) -> tuple[bool, List[str]]:
        """
        Check if prerequisites for a step are met.

        Args:
            journey: ClientJourney instance
            step_id: Step to check

        Returns:
            Tuple of (prerequisites_met, missing_prerequisites)
        """
        step = next((s for s in journey.steps if s.step_id == step_id), None)
        if not step:
            return False, ["Step not found"]

        missing = []
        for prereq_id in step.prerequisites:
            prereq_step = next((s for s in journey.steps if s.step_id == prereq_id), None)
            if not prereq_step or prereq_step.status != StepStatus.COMPLETED:
                missing.append(prereq_id)

        return len(missing) == 0, missing

    def start_step(
        self,
        journey_id: str,
        step_id: str
    ) -> bool:
        """
        Start a journey step if prerequisites are met.

        Args:
            journey_id: Journey identifier
            step_id: Step to start

        Returns:
            True if step started successfully
        """
        journey = self.get_journey(journey_id)
        if not journey:
            logger.error(f"Journey not found: {journey_id}")
            return False

        # Check prerequisites
        prereqs_met, missing = self.check_prerequisites(journey, step_id)
        if not prereqs_met:
            logger.warning(
                f"Cannot start step {step_id}: missing prerequisites {missing}"
            )
            return False

        # Update step status
        step = next((s for s in journey.steps if s.step_id == step_id), None)
        if not step:
            return False

        step.status = StepStatus.IN_PROGRESS
        step.started_at = datetime.now().isoformat()

        # Update journey status if first step
        if journey.status == JourneyStatus.NOT_STARTED:
            journey.status = JourneyStatus.IN_PROGRESS
            journey.started_at = datetime.now().isoformat()

        logger.info(f"▶️ Started step: {step_id} in journey {journey_id}")
        return True

    def complete_step(
        self,
        journey_id: str,
        step_id: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Mark a step as completed.

        Args:
            journey_id: Journey identifier
            step_id: Step to complete
            notes: Optional completion notes

        Returns:
            True if step completed successfully
        """
        journey = self.get_journey(journey_id)
        if not journey:
            return False

        step = next((s for s in journey.steps if s.step_id == step_id), None)
        if not step:
            return False

        step.status = StepStatus.COMPLETED
        step.completed_at = datetime.now().isoformat()
        if notes:
            step.notes.append(f"{datetime.now().isoformat()}: {notes}")

        # Check if journey is complete
        all_completed = all(
            s.status in [StepStatus.COMPLETED, StepStatus.SKIPPED]
            for s in journey.steps
        )

        if all_completed:
            journey.status = JourneyStatus.COMPLETED
            journey.completed_at = datetime.now().isoformat()
            journey.actual_completion = datetime.now().isoformat()

            # Update stats
            self.orchestrator_stats["completed_journeys"] += 1
            self.orchestrator_stats["active_journeys"] -= 1

            # Calculate actual duration
            if journey.started_at:
                started = datetime.fromisoformat(journey.started_at)
                completed = datetime.now()
                duration_days = (completed - started).days

                # Update avg completion days
                total_completed = self.orchestrator_stats["completed_journeys"]
                current_avg = self.orchestrator_stats["avg_completion_days"]
                self.orchestrator_stats["avg_completion_days"] = (
                    (current_avg * (total_completed - 1) + duration_days) / total_completed
                )

            logger.info(f"✅ Journey COMPLETED: {journey_id}")

        logger.info(f"✅ Completed step: {step_id} in journey {journey_id}")
        return True

    def block_step(
        self,
        journey_id: str,
        step_id: str,
        reason: str
    ) -> bool:
        """
        Mark a step as blocked.

        Args:
            journey_id: Journey identifier
            step_id: Step to block
            reason: Blocking reason

        Returns:
            True if step blocked successfully
        """
        journey = self.get_journey(journey_id)
        if not journey:
            return False

        step = next((s for s in journey.steps if s.step_id == step_id), None)
        if not step:
            return False

        step.status = StepStatus.BLOCKED
        step.blocked_reason = reason
        step.notes.append(f"{datetime.now().isoformat()}: BLOCKED - {reason}")

        # Update journey status
        journey.status = JourneyStatus.BLOCKED

        logger.warning(f"🚫 Blocked step: {step_id} in journey {journey_id} - {reason}")
        return True

    def get_next_steps(
        self,
        journey_id: str
    ) -> List[JourneyStep]:
        """
        Get next actionable steps (prerequisites met, not started).

        Args:
            journey_id: Journey identifier

        Returns:
            List of steps that can be started
        """
        journey = self.get_journey(journey_id)
        if not journey:
            return []

        next_steps = []
        for step in journey.steps:
            if step.status == StepStatus.PENDING:
                prereqs_met, _ = self.check_prerequisites(journey, step.step_id)
                if prereqs_met:
                    next_steps.append(step)

        return next_steps

    def get_progress(
        self,
        journey_id: str
    ) -> Dict[str, Any]:
        """
        Get journey progress summary.

        Args:
            journey_id: Journey identifier

        Returns:
            Progress dictionary
        """
        journey = self.get_journey(journey_id)
        if not journey:
            return {}

        total_steps = len(journey.steps)
        completed_steps = sum(1 for s in journey.steps if s.status == StepStatus.COMPLETED)
        in_progress_steps = sum(1 for s in journey.steps if s.status == StepStatus.IN_PROGRESS)
        blocked_steps = sum(1 for s in journey.steps if s.status == StepStatus.BLOCKED)

        progress_percentage = (completed_steps / total_steps * 100) if total_steps > 0 else 0

        # Calculate time estimates
        remaining_days = sum(
            s.estimated_duration_days
            for s in journey.steps
            if s.status in [StepStatus.PENDING, StepStatus.IN_PROGRESS]
        )

        return {
            "journey_id": journey_id,
            "status": journey.status.value,
            "progress_percentage": round(progress_percentage, 1),
            "completed_steps": completed_steps,
            "in_progress_steps": in_progress_steps,
            "blocked_steps": blocked_steps,
            "total_steps": total_steps,
            "estimated_days_remaining": remaining_days,
            "started_at": journey.started_at,
            "estimated_completion": journey.estimated_completion,
            "next_steps": [s.step_id for s in self.get_next_steps(journey_id)]
        }

    def get_orchestrator_stats(self) -> Dict:
        """Get orchestrator statistics"""
        return {
            **self.orchestrator_stats,
            "templates_available": list(self.JOURNEY_TEMPLATES.keys())
        }
