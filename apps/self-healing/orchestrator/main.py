"""
🤖 ZANTARA Central Self-Healing Orchestrator

AI-powered orchestrator that coordinates all self-healing agents
Makes intelligent decisions about which fixes to apply
Learns from past successes and failures

Features:
- Receives reports from all agents (frontend + backend)
- AI-powered decision making (GPT-4)
- Coordinates fixes across services
- Learning from error patterns
- Real-time dashboard
- Alert system for critical issues
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict, field
from collections import defaultdict
import json

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='🧠 [Orchestrator] %(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="ZANTARA Self-Healing Orchestrator",
    description="AI-powered orchestrator for autonomous system healing",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')


# Models
class AgentReport(BaseModel):
    """Report from an agent"""
    agent: str  # frontend, backend
    service: Optional[str] = None  # rag, memory, etc.
    sessionId: Optional[str] = None
    userId: Optional[str] = None
    url: Optional[str] = None
    hostname: Optional[str] = None
    region: Optional[str] = None
    event: Dict[str, Any]
    timestamp: Optional[float] = None


class FixDecision(BaseModel):
    """AI decision about how to fix an issue"""
    issue_id: str
    strategy: str
    confidence: float
    reasoning: str
    auto_apply: bool
    target_agent: str
    target_service: Optional[str] = None
    estimated_impact: str
    rollback_plan: str


@dataclass
class SystemState:
    """Current state of the entire system"""
    timestamp: float
    agents_online: Dict[str, bool] = field(default_factory=dict)
    services_healthy: Dict[str, bool] = field(default_factory=dict)
    error_rate: float = 0.0
    fix_success_rate: float = 0.0
    total_errors: int = 0
    total_fixes: int = 0
    critical_issues: List[Dict] = field(default_factory=list)


class SelfHealingOrchestrator:
    """Central orchestrator for self-healing system"""

    def __init__(self):
        self.start_time = datetime.now()

        # Storage for reports and state
        self.reports: List[AgentReport] = []
        self.fix_decisions: List[FixDecision] = []
        self.error_patterns: Dict[str, int] = defaultdict(int)
        self.fix_success_rates: Dict[str, List[bool]] = defaultdict(list)

        # System state
        self.system_state = SystemState(timestamp=datetime.now().timestamp())

        # WebSocket connections for dashboard
        self.dashboard_connections: List[WebSocket] = []

        # AI learning database (in-memory for now)
        self.knowledge_base: List[Dict] = []

        logger.info("🧠 Orchestrator initialized")

    async def receive_report(self, report: AgentReport):
        """Receive and process a report from an agent"""
        try:
            logger.info(
                f"📥 Report from {report.agent}"
                f"{f'/{report.service}' if report.service else ''}: "
                f"{report.event.get('type')}"
            )

            # Store report
            self.reports.append(report)

            # Update system state
            await self.update_system_state(report)

            # Analyze if action needed
            if self.requires_action(report):
                decision = await self.make_fix_decision(report)

                if decision and decision.auto_apply:
                    await self.apply_fix(decision)
                elif decision:
                    await self.escalate_to_admin(decision)

            # Broadcast to dashboard
            await self.broadcast_to_dashboard({
                'type': 'agent_report',
                'data': report.dict()
            })

            # Learn from this event
            await self.learn_from_event(report)

        except Exception as e:
            logger.error(f"Error processing report: {e}")

    def requires_action(self, report: AgentReport) -> bool:
        """Determine if a report requires immediate action"""
        event_type = report.event.get('type', '')
        severity = report.event.get('severity', 'low')

        # Critical issues always require action
        if severity == 'critical':
            return True

        # Persistent errors require action
        if 'persistent' in event_type:
            return True

        # Auto-fix failures require escalation
        if 'auto_fix_failed' in event_type:
            return True

        # High error rates require action
        if event_type == 'health_check':
            error_rate = report.event.get('data', {}).get('errorRate', 0)
            if error_rate > 5:  # > 5 errors/min
                return True

        return False

    async def make_fix_decision(self, report: AgentReport) -> Optional[FixDecision]:
        """Use AI to decide how to fix an issue"""
        try:
            logger.info("🤔 Consulting AI for fix decision...")

            # Prepare context for AI
            context = self.prepare_ai_context(report)

            # Call GPT-4 for decision
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": self.get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this issue and recommend a fix:\n\n{json.dumps(context, indent=2)}"
                    }
                ],
                temperature=0.3,
                max_tokens=500
            )

            ai_decision = response.choices[0].message.content

            # Parse AI response into FixDecision
            decision = self.parse_ai_decision(ai_decision, report)

            if decision:
                logger.info(
                    f"🎯 AI Decision: {decision.strategy} "
                    f"(confidence: {decision.confidence:.2f}, "
                    f"auto-apply: {decision.auto_apply})"
                )

                # Store decision
                self.fix_decisions.append(decision)

            return decision

        except Exception as e:
            logger.error(f"Error making fix decision: {e}")
            return None

    def prepare_ai_context(self, report: AgentReport) -> Dict:
        """Prepare context for AI decision making"""
        # Get recent similar errors
        similar_errors = [
            r for r in self.reports[-50:]
            if r.event.get('type') == report.event.get('type')
        ]

        # Get past fix success rates for this error type
        error_type = report.event.get('type', 'unknown')
        past_successes = self.fix_success_rates.get(error_type, [])

        return {
            'current_error': {
                'agent': report.agent,
                'service': report.service,
                'type': report.event.get('type'),
                'severity': report.event.get('severity'),
                'data': report.event.get('data', {})
            },
            'similar_errors_count': len(similar_errors),
            'past_fix_success_rate': (
                sum(past_successes) / len(past_successes) * 100
                if past_successes else 0
            ),
            'system_state': asdict(self.system_state),
            'recent_patterns': dict(list(self.error_patterns.items())[-10:])
        }

    def get_system_prompt(self) -> str:
        """Get system prompt for AI"""
        return """You are an AI system administrator for ZANTARA, a multi-service web application.

Your job is to analyze errors and recommend fixes. Consider:
1. Severity and impact
2. Past fix success rates
3. Current system state
4. Risk of the fix
5. Whether it can be auto-applied safely

Respond in JSON format:
{
  "strategy": "specific fix strategy",
  "confidence": 0.0-1.0,
  "reasoning": "why this fix",
  "auto_apply": true/false,
  "estimated_impact": "low/medium/high",
  "rollback_plan": "how to undo if fails"
}

Available strategies:
- reload_page (frontend)
- restart_service (backend)
- reconnect_database
- reconnect_cache
- garbage_collection
- scale_up_instances
- rollback_deployment
- notify_admin (if no safe auto-fix)
"""

    def parse_ai_decision(
        self,
        ai_response: str,
        report: AgentReport
    ) -> Optional[FixDecision]:
        """Parse AI response into FixDecision"""
        try:
            # Try to extract JSON from response
            if '```json' in ai_response:
                json_str = ai_response.split('```json')[1].split('```')[0].strip()
            elif '```' in ai_response:
                json_str = ai_response.split('```')[1].split('```')[0].strip()
            else:
                json_str = ai_response.strip()

            data = json.loads(json_str)

            return FixDecision(
                issue_id=f"{report.agent}_{report.service}_{datetime.now().timestamp()}",
                strategy=data.get('strategy', 'notify_admin'),
                confidence=data.get('confidence', 0.5),
                reasoning=data.get('reasoning', ''),
                auto_apply=data.get('auto_apply', False),
                target_agent=report.agent,
                target_service=report.service,
                estimated_impact=data.get('estimated_impact', 'unknown'),
                rollback_plan=data.get('rollback_plan', 'manual intervention')
            )

        except Exception as e:
            logger.error(f"Error parsing AI decision: {e}")
            return None

    async def apply_fix(self, decision: FixDecision):
        """Apply an auto-approved fix"""
        logger.info(f"🔧 Applying fix: {decision.strategy}")

        try:
            # Dispatch fix command to appropriate agent
            if decision.target_agent == 'frontend':
                # Can't directly control browser, log for now
                logger.info("Frontend fix would be suggested to user")

            elif decision.target_agent == 'backend':
                # Send command to backend agent
                await self.send_fix_command(decision)

            # Track success
            error_type = decision.issue_id.split('_')[0]
            self.fix_success_rates[error_type].append(True)

            # Broadcast to dashboard
            await self.broadcast_to_dashboard({
                'type': 'fix_applied',
                'data': decision.dict()
            })

        except Exception as e:
            logger.error(f"Error applying fix: {e}")

            # Track failure
            error_type = decision.issue_id.split('_')[0]
            self.fix_success_rates[error_type].append(False)

    async def send_fix_command(self, decision: FixDecision):
        """Send fix command to a backend agent"""
        # Implementation depends on agent communication protocol
        # For now, log
        logger.info(
            f"Would send command to {decision.target_service}: "
            f"{decision.strategy}"
        )

    async def escalate_to_admin(self, decision: FixDecision):
        """Escalate issue to admin (email, Slack, etc.)"""
        logger.warning(f"⚠️ Escalating to admin: {decision.issue_id}")

        # TODO: Send email/Slack notification
        # For now, broadcast to dashboard
        await self.broadcast_to_dashboard({
            'type': 'admin_escalation',
            'data': decision.dict()
        })

    async def update_system_state(self, report: AgentReport):
        """Update overall system state"""
        # Track agent online status
        agent_key = f"{report.agent}_{report.service or 'webapp'}"
        self.system_state.agents_online[agent_key] = True

        # Update error counts
        if 'error' in report.event.get('type', ''):
            self.system_state.total_errors += 1
            self.error_patterns[report.event.get('type', 'unknown')] += 1

        # Update fix counts
        if 'fix' in report.event.get('type', ''):
            self.system_state.total_fixes += 1

        # Update rates
        self.system_state.error_rate = (
            self.system_state.total_errors /
            max((datetime.now() - self.start_time).total_seconds() / 60, 1)
        )

        self.system_state.fix_success_rate = (
            self.system_state.total_fixes /
            max(self.system_state.total_errors, 1) * 100
        )

        # Track critical issues
        if report.event.get('severity') == 'critical':
            self.system_state.critical_issues.append({
                'timestamp': datetime.now().isoformat(),
                'agent': report.agent,
                'service': report.service,
                'type': report.event.get('type')
            })

            # Keep only last 20 critical issues
            self.system_state.critical_issues = self.system_state.critical_issues[-20:]

    async def learn_from_event(self, report: AgentReport):
        """Learn from events to improve future decisions"""
        # Store in knowledge base
        self.knowledge_base.append({
            'timestamp': datetime.now().isoformat(),
            'event_type': report.event.get('type'),
            'severity': report.event.get('severity'),
            'agent': report.agent,
            'service': report.service,
            'context': report.event.get('data', {})
        })

        # Keep knowledge base manageable
        if len(self.knowledge_base) > 1000:
            self.knowledge_base = self.knowledge_base[-1000:]

    async def broadcast_to_dashboard(self, message: Dict):
        """Broadcast update to all connected dashboards"""
        if not self.dashboard_connections:
            return

        disconnected = []
        for ws in self.dashboard_connections:
            try:
                await ws.send_json(message)
            except:
                disconnected.append(ws)

        # Remove disconnected clients
        for ws in disconnected:
            self.dashboard_connections.remove(ws)

    def get_dashboard_data(self) -> Dict:
        """Get data for dashboard"""
        return {
            'system_state': asdict(self.system_state),
            'recent_reports': [r.dict() for r in self.reports[-50:]],
            'recent_decisions': [d.dict() for d in self.fix_decisions[-20:]],
            'error_patterns': dict(self.error_patterns),
            'uptime': (datetime.now() - self.start_time).total_seconds(),
            'agents_count': len(self.system_state.agents_online)
        }


# Global orchestrator instance
orchestrator = SelfHealingOrchestrator()


# API Endpoints
@app.post("/api/report")
async def receive_report(report: AgentReport):
    """Receive report from an agent"""
    await orchestrator.receive_report(report)
    return {"status": "received"}


@app.get("/api/status")
async def get_status():
    """Get orchestrator status"""
    return orchestrator.get_dashboard_data()


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "uptime": (datetime.now() - orchestrator.start_time).total_seconds(),
        "agents_online": len(orchestrator.system_state.agents_online)
    }


@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """WebSocket for real-time dashboard updates"""
    await websocket.accept()
    orchestrator.dashboard_connections.append(websocket)

    try:
        # Send initial state
        await websocket.send_json({
            'type': 'initial_state',
            'data': orchestrator.get_dashboard_data()
        })

        # Keep connection alive
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        orchestrator.dashboard_connections.remove(websocket)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ZANTARA Self-Healing Orchestrator",
        "version": "1.0.0",
        "status": "operational",
        "uptime": (datetime.now() - orchestrator.start_time).total_seconds()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
