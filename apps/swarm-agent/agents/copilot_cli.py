"""
Copilot CLI Agent - Uses gh copilot command
Leverages user's Copilot PRO+ subscription via CLI
"""

import subprocess
import asyncio
from typing import Dict, Any

class CopilotCLIAgent:
    def __init__(self):
        self.cli_available = self._check_cli()

    def _check_cli(self) -> bool:
        """Check if gh copilot is installed"""
        try:
            result = subprocess.run(
                ["gh", "copilot", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        """Execute action using gh copilot"""

        if not self.cli_available:
            return {
                "error": "gh copilot not available",
                "install": "gh extension install github/gh-copilot"
            }

        if action == "run_tests":
            return await self._run_tests(params)
        elif action == "suggest_code":
            return await self._suggest_code(params)
        elif action == "explain_code":
            return await self._explain_code(params)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _run_tests(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Run tests using Copilot suggestions"""

        query = params.get("query", "run all tests")

        # Use gh copilot suggest
        try:
            process = await asyncio.create_subprocess_exec(
                "gh", "copilot", "suggest", query,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            return {
                "status": "success",
                "suggestion": stdout.decode() if stdout else "",
                "action": "run_tests"
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def _suggest_code(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Get code suggestions from Copilot"""

        query = params.get("query", "")

        try:
            process = await asyncio.create_subprocess_exec(
                "gh", "copilot", "suggest", query,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            return {
                "status": "success",
                "suggestion": stdout.decode() if stdout else "",
                "action": "suggest_code"
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def _explain_code(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Get code explanation from Copilot"""

        code = params.get("code", "")

        try:
            process = await asyncio.create_subprocess_exec(
                "gh", "copilot", "explain", code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            return {
                "status": "success",
                "explanation": stdout.decode() if stdout else "",
                "action": "explain_code"
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
            "available": self.cli_available
        }
