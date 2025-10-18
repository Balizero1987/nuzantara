"""
ZANTARA Collaborator Service - Identity & Sub Rosa Level Management

Manages collaborator identification, Sub Rosa access levels (0-3), and profile data.
"""

from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@dataclass
class CollaboratorProfile:
    """Collaborator profile with Sub Rosa level and preferences"""
    id: str
    email: str
    name: str
    ambaradam_name: str  # Personal name (intimate)
    role: str
    department: str
    sub_rosa_level: int  # 0=Public, 1=Curious, 2=Practitioner, 3=Initiated
    language: str  # 'en', 'id', 'it'
    expertise_level: str  # 'beginner', 'intermediate', 'advanced', 'expert'
    emotional_preferences: Dict[str, str]  # Communication preferences
    created_at: datetime

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "ambaradam_name": self.ambaradam_name,
            "role": self.role,
            "department": self.department,
            "sub_rosa_level": self.sub_rosa_level,
            "language": self.language,
            "expertise_level": self.expertise_level,
            "emotional_preferences": self.emotional_preferences,
            "created_at": self.created_at.isoformat()
        }


class CollaboratorService:
    """
    Service for collaborator identification and management.

    Uses:
    1. Hardcoded mapping (fast path) for 23 team members
    2. Firestore (slow path) for dynamic collaborators
    3. In-memory cache (5 min TTL) for performance
    """

    # Bali Zero Team Database (22 members)
    TEAM_DATABASE = {
        # C-Level & Leadership (L3 - Initiated)
        "zero@balizero.com": {
            "id": "zero",
            "name": "Antonello Siano",
            "ambaradam_name": "Zero Master",
            "role": "owner",
            "department": "tech",
            "sub_rosa_level": 3,  # Full access
            "language": "it",
            "expertise_level": "expert",
            "emotional_preferences": {
                "tone": "direct_with_depth",
                "formality": "casual",
                "humor": "sacred_semar_energy"
            }
        },
        "zainal@balizero.com": {
            "id": "zainal",
            "name": "Zainal Abidin",
            "ambaradam_name": "CEO Real",
            "role": "ceo",
            "department": "management",
            "sub_rosa_level": 3,  # Full access
            "language": "id",
            "expertise_level": "expert",
            "emotional_preferences": {
                "tone": "respectful_collaborative",
                "formality": "medium",
                "humor": "intelligent"
            }
        },

        # Setup Team Lead (L2 - Practitioner)
        "amanda@balizero.com": {
            "id": "amanda",
            "name": "Amanda",
            "ambaradam_name": "Amanda Lead",
            "role": "lead_executive",
            "department": "setup",
            "sub_rosa_level": 2,
            "language": "id",
            "expertise_level": "advanced",
            "emotional_preferences": {
                "tone": "professional_warm",
                "formality": "medium",
                "humor": "light"
            }
        },
        "anton@balizero.com": {
            "id": "anton",
            "name": "Anton",
            "ambaradam_name": "Anton Setup",
            "role": "lead_executive",
            "department": "setup",
            "sub_rosa_level": 2,
            "language": "id",
            "expertise_level": "advanced",
            "emotional_preferences": {
                "tone": "efficient_focused",
                "formality": "medium",
                "humor": "light"
            }
        },
        "krisna@balizero.com": {
            "id": "krisna",
            "name": "Krisna",
            "ambaradam_name": "Krisna Executor",
            "role": "lead_executive",
            "department": "setup",
            "sub_rosa_level": 2,
            "language": "id",
            "expertise_level": "advanced",
            "emotional_preferences": {
                "tone": "detail_oriented",
                "formality": "medium",
                "humor": "subtle"
            }
        },

        # Tax Department (L1-L2)
        "veronika@balizero.com": {
            "id": "veronika",
            "name": "Veronika",
            "ambaradam_name": "Vero Tax Lead",
            "role": "tax_manager",
            "department": "tax",
            "sub_rosa_level": 2,
            "language": "id",
            "expertise_level": "advanced",
            "emotional_preferences": {
                "tone": "precise_methodical",
                "formality": "high",
                "humor": "minimal"
            }
        },
        "angel@balizero.com": {
            "id": "angel",
            "name": "Angel",
            "ambaradam_name": "Angel Numbers",
            "role": "tax_expert",
            "department": "tax",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {
                "tone": "helpful_clear",
                "formality": "high",
                "humor": "minimal"
            }
        },

        # Setup Team Consultants (L1)
        "ari.firda@balizero.com": {
            "id": "ari",
            "name": "Ari",
            "ambaradam_name": "Ari Setup",
            "role": "specialist_consultant",
            "department": "setup",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "professional", "formality": "medium", "humor": "light"}
        },
        "vino@balizero.com": {
            "id": "vino",
            "name": "Vino",
            "ambaradam_name": "Vino Junior",
            "role": "junior_consultant",
            "department": "setup",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "beginner",
            "emotional_preferences": {"tone": "eager_learning", "formality": "medium", "humor": "light"}
        },
        "adit@balizero.com": {
            "id": "adit",
            "name": "Adit",
            "ambaradam_name": "Adit Crew",
            "role": "crew_lead",
            "department": "setup",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "collaborative", "formality": "medium", "humor": "light"}
        },
        "dea@balizero.com": {
            "id": "dea",
            "name": "Dea",
            "ambaradam_name": "Dea Exec",
            "role": "executive_consultant",
            "department": "setup",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "professional_warm", "formality": "medium", "humor": "light"}
        },
        "surya@balizero.com": {
            "id": "surya",
            "name": "Surya",
            "ambaradam_name": "Surya Specialist",
            "role": "specialist_consultant",
            "department": "setup",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "detail_oriented", "formality": "medium", "humor": "subtle"}
        },
        "damar@balizero.com": {
            "id": "damar",
            "name": "Damar",
            "ambaradam_name": "Damar Junior",
            "role": "junior_consultant",
            "department": "setup",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "beginner",
            "emotional_preferences": {"tone": "eager_learning", "formality": "medium", "humor": "light"}
        },

        # Tax Department Consultants (L1)
        "kadek@balizero.com": {
            "id": "kadek",
            "name": "Kadek",
            "ambaradam_name": "Kadek Tax",
            "role": "tax_consultant",
            "department": "tax",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "precise", "formality": "high", "humor": "minimal"}
        },
        "dewa.ayu@balizero.com": {
            "id": "dewa_ayu",
            "name": "Dewa Ayu",
            "ambaradam_name": "Dewa Tax",
            "role": "tax_consultant",
            "department": "tax",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "helpful_clear", "formality": "high", "humor": "minimal"}
        },
        "faisha@balizero.com": {
            "id": "faisha",
            "name": "Faisha",
            "ambaradam_name": "Faisha Care",
            "role": "tax_care",
            "department": "tax",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "caring_supportive", "formality": "high", "humor": "minimal"}
        },

        # External & Advisory (L1-L2)
        "ruslana@balizero.com": {
            "id": "ruslana",
            "name": "Ruslana",
            "ambaradam_name": "Ruslana Board",
            "role": "board_member",
            "department": "management",
            "sub_rosa_level": 2,
            "language": "en",
            "expertise_level": "expert",
            "emotional_preferences": {"tone": "strategic_visionary", "formality": "high", "humor": "sophisticated"}
        },
        "marta@balizero.com": {
            "id": "marta",
            "name": "Marta",
            "ambaradam_name": "Marta Advisor",
            "role": "external_advisory",
            "department": "advisory",
            "sub_rosa_level": 1,
            "language": "en",
            "expertise_level": "advanced",
            "emotional_preferences": {"tone": "advisory_professional", "formality": "high", "humor": "subtle"}
        },
        "olena@balizero.com": {
            "id": "olena",
            "name": "Olena",
            "ambaradam_name": "Olena Advisor",
            "role": "external_advisory",
            "department": "advisory",
            "sub_rosa_level": 1,
            "language": "en",
            "expertise_level": "advanced",
            "emotional_preferences": {"tone": "advisory_professional", "formality": "high", "humor": "subtle"}
        },

        # Operations & Support (L0-L1)
        "rina@balizero.com": {
            "id": "rina",
            "name": "Rina",
            "ambaradam_name": "Rina Reception",
            "role": "reception",
            "department": "operations",
            "sub_rosa_level": 0,
            "language": "id",
            "expertise_level": "beginner",
            "emotional_preferences": {"tone": "friendly_helpful", "formality": "medium", "humor": "light"}
        },
        "nina@balizero.com": {
            "id": "nina",
            "name": "Nina",
            "ambaradam_name": "Nina Marketing",
            "role": "marketing_advisory",
            "department": "marketing",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "creative_engaging", "formality": "low", "humor": "playful"}
        },
        "sahira@balizero.com": {
            "id": "sahira",
            "name": "Sahira",
            "ambaradam_name": "Sahira Specialist",
            "role": "marketing_specialist",
            "department": "marketing",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {"tone": "creative_strategic", "formality": "low", "humor": "playful"}
        },

        # Generic team members (L1 - Curious Seeker)
        "team@balizero.com": {
            "id": "team_member",
            "name": "Team Member",
            "ambaradam_name": "Bali Zero Warrior",
            "role": "team_member",
            "department": "general",
            "sub_rosa_level": 1,
            "language": "id",
            "expertise_level": "intermediate",
            "emotional_preferences": {
                "tone": "encouraging_supportive",
                "formality": "medium",
                "humor": "friendly"
            }
        },

        # Demo/Test accounts
        "demo@zantara.com": {
            "id": "demo",
            "name": "Demo User",
            "ambaradam_name": "Explorer",
            "role": "demo",
            "department": "demo",
            "sub_rosa_level": 1,
            "language": "en",
            "expertise_level": "beginner",
            "emotional_preferences": {
                "tone": "welcoming_educational",
                "formality": "low",
                "humor": "friendly"
            }
        }
    }

    def __init__(self, use_firestore: bool = False):
        """
        Initialize CollaboratorService.

        Args:
            use_firestore: Enable Firestore fallback (requires google-cloud-firestore)
        """
        self.use_firestore = use_firestore
        self.cache: Dict[str, tuple[CollaboratorProfile, datetime]] = {}
        self.cache_ttl = timedelta(minutes=5)

        if use_firestore:
            try:
                from google.cloud import firestore
                self.db = firestore.Client()
                logger.info("✅ Firestore enabled for collaborator lookup")
            except Exception as e:
                logger.warning(f"⚠️ Firestore not available: {e}")
                self.use_firestore = False

        logger.info(f"✅ CollaboratorService initialized ({len(self.TEAM_DATABASE)} team members)")

    async def identify(self, email: Optional[str]) -> CollaboratorProfile:
        """
        Identify collaborator from email.

        Lookup order:
        1. Cache (5 min TTL)
        2. Hardcoded team database
        3. Firestore (if enabled)
        4. Anonymous default (L0)

        Args:
            email: User email address

        Returns:
            CollaboratorProfile with Sub Rosa level and preferences
        """
        if not email:
            return self._get_anonymous_profile()

        email = email.lower().strip()

        # 1. Check cache
        if email in self.cache:
            profile, cached_at = self.cache[email]
            if datetime.now() - cached_at < self.cache_ttl:
                logger.debug(f"🎯 Cache hit for {email}")
                return profile

        # 2. Check hardcoded database (fast path)
        if email in self.TEAM_DATABASE:
            profile = self._build_profile(email, self.TEAM_DATABASE[email])
            self.cache[email] = (profile, datetime.now())
            logger.info(f"✅ Identified collaborator: {profile.name} ({profile.role}) - L{profile.sub_rosa_level}")
            return profile

        # 3. Check Firestore (slow path)
        if self.use_firestore:
            profile = await self._fetch_from_firestore(email)
            if profile:
                self.cache[email] = (profile, datetime.now())
                logger.info(f"✅ Loaded from Firestore: {profile.name} - L{profile.sub_rosa_level}")
                return profile

        # 4. Return anonymous (L0 - Public)
        logger.info(f"👤 Anonymous user: {email} - L0 (Public)")
        return self._get_anonymous_profile(email)

    def _build_profile(self, email: str, data: Dict) -> CollaboratorProfile:
        """Build CollaboratorProfile from dict data"""
        return CollaboratorProfile(
            id=data["id"],
            email=email,
            name=data["name"],
            ambaradam_name=data["ambaradam_name"],
            role=data["role"],
            department=data["department"],
            sub_rosa_level=data["sub_rosa_level"],
            language=data["language"],
            expertise_level=data["expertise_level"],
            emotional_preferences=data["emotional_preferences"],
            created_at=datetime.now()
        )

    async def _fetch_from_firestore(self, email: str) -> Optional[CollaboratorProfile]:
        """Fetch collaborator from Firestore"""
        try:
            doc = self.db.collection('collaborators').document(email).get()
            if doc.exists:
                data = doc.to_dict()
                return self._build_profile(email, data)
        except Exception as e:
            logger.error(f"❌ Firestore lookup failed for {email}: {e}")
        return None

    def _get_anonymous_profile(self, email: Optional[str] = None) -> CollaboratorProfile:
        """Create anonymous profile (L0 - Public access)"""
        display_name = email.split('@')[0].title() if email else "Guest"

        return CollaboratorProfile(
            id="anonymous",
            email=email or "anonymous@guest.com",
            name=display_name,
            ambaradam_name="Seeker",
            role="guest",
            department="public",
            sub_rosa_level=0,  # Public access only
            language="en",
            expertise_level="beginner",
            emotional_preferences={
                "tone": "professional_warm",
                "formality": "high",
                "humor": "light"
            },
            created_at=datetime.now()
        )

    def get_team_stats(self) -> Dict:
        """Get team statistics"""
        by_level = {0: 0, 1: 0, 2: 0, 3: 0}
        by_department = {}
        by_language = {}

        for data in self.TEAM_DATABASE.values():
            level = data["sub_rosa_level"]
            dept = data["department"]
            lang = data["language"]

            by_level[level] += 1
            by_department[dept] = by_department.get(dept, 0) + 1
            by_language[lang] = by_language.get(lang, 0) + 1

        return {
            "total": len(self.TEAM_DATABASE),
            "by_sub_rosa_level": by_level,
            "by_department": by_department,
            "by_language": by_language
        }
