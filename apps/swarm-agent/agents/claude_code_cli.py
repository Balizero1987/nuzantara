"""
Claude Code CLI Agent - Uses your Claude Code subscription
Zero API costs - uses your existing subscription credits
"""

import subprocess
import asyncio
import json
from typing import Dict, Any

class ClaudeCodeCLIAgent:
    def __init__(self):
        self.cli_available = self._check_cli()

    def _check_cli(self) -> bool:
        """Check if claude CLI is available"""
        try:
            result = subprocess.run(
                ["which", "claude"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        """Execute action using Claude Code CLI"""

        if not self.cli_available:
            return {
                "error": "Claude Code CLI not available",
                "install": "Already installed - check PATH"
            }

        if action == "parse_command":
            return await self._parse_command(params)
        elif action == "generate_documentation":
            return await self._generate_docs(params)
        elif action == "optimize_code":
            return await self._optimize_code(params)
        elif action == "analyze_architecture":
            return await self._analyze(params)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _parse_command(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Parse natural language command using Claude Code"""

        message = params.get("query", "")

        prompt = f"""Parse this command into JSON task list:
"{message}"

Available agents: cursor, claude, copilot, chatgpt, flyio
Available actions:
- cursor: create_code, fix_bugs, refactor_code
- claude: generate_documentation, optimize_code, analyze_architecture
- copilot: run_tests, suggest_code
- chatgpt: research_topic
- flyio: deploy_to_production

Return ONLY JSON array:
[{{"agent":"cursor","action":"create_code","params":{{}},"priority":1}}]
"""

        try:
            # Use Claude Code CLI with Haiku 4.5 (fast + included in subscription)
            process = await asyncio.create_subprocess_exec(
                "claude",
                "--print",
                "--model", "haiku",
                "--dangerously-skip-permissions",  # Skip permission dialogs
                prompt,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                response = stdout.decode()
                # Extract JSON from response
                import re
                json_match = re.search(r'\[[\s\S]*\]', response)
                if json_match:
                    tasks = json.loads(json_match.group(0))
                    return {
                        "status": "success",
                        "tasks": tasks,
                        "model": "claude-3-5-haiku (via subscription)"
                    }

            return {
                "status": "error",
                "error": stderr.decode() if stderr else "Parse failed"
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def _generate_docs(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate documentation using Claude Code"""

        query = params.get("query", "")

        try:
            process = await asyncio.create_subprocess_exec(
                "claude",
                "--print",
                "--model", "haiku",
                "--dangerously-skip-permissions",  # Skip permission dialogs
                f"Generate comprehensive documentation for: {query}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            return {
                "status": "success",
                "documentation": stdout.decode() if stdout else "",
                "action": "generate_documentation"
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def _optimize_code(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize code using Claude Code"""

        code = params.get("code", "")

        try:
            process = await asyncio.create_subprocess_exec(
                "claude",
                "--print",
                "--model", "haiku",
                "--dangerously-skip-permissions",  # Skip permission dialogs
                f"Optimize this code:\n\n{code}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            return {
                "status": "success",
                "optimized_code": stdout.decode() if stdout else "",
                "action": "optimize_code"
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def _analyze(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze architecture using Claude Code"""

        query = params.get("query", "")

        try:
            process = await asyncio.create_subprocess_exec(
                "claude",
                "--print",
                "--model", "haiku",
                "--dangerously-skip-permissions",  # Skip permission dialogs
                f"Analyze architecture: {query}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            return {
                "status": "success",
                "analysis": stdout.decode() if stdout else "",
                "action": "analyze_architecture"
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "cli_available": self.cli_available,
            "available": self.cli_available,
            "model": "haiku-4.5 (latest)",
            "subscription": "Claude Code (credits included)"
        }
