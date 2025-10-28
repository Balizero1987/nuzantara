# Using MCP Tools with AutoGen

This guide explains how to use Model Context Protocol (MCP) tools with AutoGen and provides examples.

## What are MCP Tools?

MCP (Model Context Protocol) tools are standardized tools that follow the [Model Context Protocol](https://modelcontextprotocol.io) specification. They allow AI systems to interact with various services and tools in a standardized way.

AutoGen supports MCP tools through the `McpWorkbench` class, which provides a bridge between MCP servers and AutoGen agents.

## Prerequisites

Before running the examples, you'll need:

1. Python 3.8+
2. Node.js and npm (for some examples)
3. Required Python packages:
   ```bash
   pip install "autogen-ext[mcp]"
   ```

## Examples

### 1. Web Fetch Tool Example

This example demonstrates how to use a simple web fetch tool:

1. Install the fetch server:
   ```bash
   npm install -g @modelcontextprotocol/server-fetch
   ```

2. Run the example:
   ```bash
   python web_fetch_mcp_example.py
   ```

This example shows:
- How to connect to an MCP server
- How to list available tools
- How to call a tool with parameters
- Two different ways to use MCP tools (via workbench and directly)

### 2. GitHub Tool Example

This example shows how to use GitHub-specific tools:

1. You'll need a GitHub personal access token
2. Set it as an environment variable:
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   ```
   
3. Run the example:
   ```bash
   python github_mcp_example.py
   ```

Note: This example requires Docker to be installed and running.

## Available MCP Servers

There are several MCP servers you can use:

1. **Filesystem Server**: Access local files
   ```bash
   npm install -g @modelcontextprotocol/server-filesystem
   ```

2. **Git Server**: Git operations
   ```bash
   npm install -g @modelcontextprotocol/server-git
   ```

3. **Everything Server**: Test server with multiple capabilities
   ```bash
   npm install -g @modelcontextprotocol/server-everything
   ```

4. **Fetch Server**: Web content fetching
   ```bash
   npm install -g @modelcontextprotocol/server-fetch
   ```

## Creating Your Own MCP Tools

You can create your own MCP tools using the [MCP SDKs](https://modelcontextprotocol.io):

1. Python SDK: [mcp python-sdk](https://github.com/modelcontextprotocol/python-sdk)
2. JavaScript/TypeScript SDK: [mcp js-sdk](https://github.com/modelcontextprotocol/js-sdk)

## Key Concepts

1. **McpWorkbench**: Main interface for working with MCP servers in AutoGen
2. **StdioServerParams**: Configuration for MCP servers that run as subprocesses
3. **SseServerParams**: Configuration for MCP servers that communicate via Server-Sent Events
4. **Tool Adapters**: Bridge between MCP tools and AutoGen tool interface

## Security Warning

> **Warning**: Only connect to trusted MCP servers, especially when using `StdioServerParams` as they execute commands in your local environment.

## Further Reading

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [AutoGen Documentation](https://microsoft.github.io/autogen/)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)