#!/usr/bin/env python3
"""
Example of using GitHub tools with AutoGen's Model Context Protocol (MCP) support.

This example demonstrates how to:
1. Connect to a GitHub MCP server
2. List available tools
3. Call a tool to interact with GitHub
"""

import asyncio
import os
from typing import Optional

from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams


async def main() -> None:
    """Main example function demonstrating GitHub tool usage with MCP."""
    
    # Check for GitHub personal access token
    github_token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
    if not github_token:
        print("Warning: GITHUB_PERSONAL_ACCESS_TOKEN not set in environment variables.")
        print("You can still run this example, but some GitHub operations may be limited.")
        github_token = "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"  # Placeholder
    
    # Set up the GitHub MCP server parameters
    server_params = StdioServerParams(
        command="docker",
        args=[
            "run",
            "-i",
            "--rm",
            "-e",
            "GITHUB_PERSONAL_ACCESS_TOKEN",
            "ghcr.io/github/github-mcp-server",
        ],
        env={
            "GITHUB_PERSONAL_ACCESS_TOKEN": github_token,
        },
    )
    
    print("Connecting to GitHub MCP server...")
    
    try:
        # Create MCP workbench to interact with the GitHub server
        async with McpWorkbench(server_params=server_params) as workbench:
            # List available tools
            tools = await workbench.list_tools()
            print(f"Available GitHub tools: {[tool['name'] for tool in tools]}")
            
            # Create an assistant agent that can use the GitHub tools
            model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")
            agent = AssistantAgent(
                "github_assistant",
                model_client=model_client,
                workbench=workbench,
                reflect_on_tool_use=True,
                model_client_stream=True,
            )
            
            # Example task: Check if a repository exists
            task = "Check if the microsoft/autogen repository exists on GitHub"
            print(f"\nExecuting task: {task}")
            
            # Run the agent with the task
            result = await agent.run(task=task)
            
            # Print the final result
            print("\nFinal Result:")
            print(result.messages[-1].content)
            
    except Exception as e:
        print(f"Error occurred: {e}")
        print("\nNote: This example requires:")
        print("1. Docker to be installed and running")
        print("2. A valid GITHUB_PERSONAL_ACCESS_TOKEN environment variable")
        print("3. Access to the GitHub MCP server image")


if __name__ == "__main__":
    asyncio.run(main())