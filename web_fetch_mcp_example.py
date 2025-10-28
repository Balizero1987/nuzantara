#!/usr/bin/env python3
"""
Example of using web fetch tool with AutoGen's Model Context Protocol (MCP) support.

This example demonstrates how to:
1. Connect to a web fetch MCP server
2. List available tools
3. Call the fetch tool to retrieve content from a URL
"""

import asyncio
import os
import sys

# Add the autogen python packages to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'autogen', 'python'))

from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams


async def main() -> None:
    """Main example function demonstrating web fetch tool usage with MCP."""
    
    print("Setting up web fetch MCP tool...")
    
    # Set up the web fetch MCP server parameters
    # This requires the mcp-server-fetch package to be installed
    # You can install it with: npm install -g @modelcontextprotocol/server-fetch
    params = StdioServerParams(
        command="npx",  # Using npx to run the fetch server directly
        args=["@modelcontextprotocol/server-fetch"],
        read_timeout_seconds=60,
    )
    
    try:
        # Create MCP workbench to interact with the fetch server
        async with McpWorkbench(server_params=params) as workbench:
            # List available tools
            tools = await workbench.list_tools()
            print(f"Available tools: {[tool['name'] for tool in tools]}")
            
            if not tools:
                print("No tools found. Make sure @modelcontextprotocol/server-fetch is installed.")
                return
            
            # Get the first tool (should be the fetch tool)
            fetch_tool = tools[0]
            print(f"\nUsing tool: {fetch_tool['name']}")
            print(f"Tool description: {fetch_tool.get('description', 'No description')}")
            
            # Call the fetch tool to retrieve content from a URL
            url = "https://httpbin.org/json"  # A test URL that returns JSON
            print(f"\nFetching content from: {url}")
            
            result = await workbench.call_tool(fetch_tool['name'], {"url": url})
            
            # Print the result
            print("\nFetch result:")
            print(result)
            
    except FileNotFoundError:
        print("Error: Could not find the 'npx' command. Make sure Node.js is installed.")
        print("To run this example, you need to:")
        print("1. Install Node.js (which includes npm/npx)")
        print("2. Install the fetch server with: npm install -g @modelcontextprotocol/server-fetch")
    except Exception as e:
        print(f"Error occurred: {e}")
        print("\nThis example requires the @modelcontextprotocol/server-fetch package.")
        print("Install it with: npm install -g @modelcontextprotocol/server-fetch")


# Simple direct tool usage example
async def direct_tool_example() -> None:
    """Example of using mcp_server_tools function directly."""
    print("\n" + "="*50)
    print("Direct tool usage example")
    print("="*50)
    
    try:
        from autogen_ext.tools.mcp import mcp_server_tools
        
        # Set up the web fetch MCP server parameters
        params = StdioServerParams(
            command="npx",
            args=["@modelcontextprotocol/server-fetch"],
            read_timeout_seconds=60,
        )
        
        # Get tools directly
        tools = await mcp_server_tools(params)
        print(f"Direct tool access - Available tools: {[tool.name for tool in tools]}")
        
        if tools:
            # Use the first tool to fetch content
            fetch_tool = tools[0]
            print(f"\nUsing tool: {fetch_tool.name}")
            
            # Run the tool (this is how tools are executed in AutoGen)
            from autogen_core import CancellationToken
            cancellation_token = CancellationToken()
            
            try:
                result = await fetch_tool.run_json({"url": "https://httpbin.org/json"}, cancellation_token)
                print("\nDirect tool call result:")
                print(fetch_tool.return_value_as_string(result))
            except Exception as e:
                print(f"Error calling tool directly: {e}")
        
    except Exception as e:
        print(f"Direct tool example error: {e}")


if __name__ == "__main__":
    print("MCP Tool Usage Examples")
    print("="*30)
    
    # Run the workbench example
    asyncio.run(main())
    
    # Run the direct tool example
    asyncio.run(direct_tool_example())