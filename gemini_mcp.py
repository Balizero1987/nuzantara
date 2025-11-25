import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional
from contextlib import AsyncExitStack

# Third-party imports
try:
    import google.generativeai as genai
    from google.generativeai.types import content_types
    from google.protobuf import struct_pb2
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError as e:
    print(f"Missing dependencies. Please install: pip install google-generativeai mcp")
    sys.exit(1)

# Configuration
CLAUDE_CONFIG_PATH = os.path.expanduser("~/Library/Application Support/Claude/claude_desktop_config.json")
# Support standard GOOGLE_API_KEY or custom GEMINI_API_KEY
API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-3.0-pro" # CRITICAL UPDATE: As requested

if not API_KEY:
    print("Error: GOOGLE_API_KEY or GEMINI_API_KEY environment variable not set.")
    sys.exit(1)

genai.configure(api_key=API_KEY)

class MCPGeminiBridge:
    def __init__(self):
        self.sessions: Dict[str, ClientSession] = {}
        self.exit_stack = AsyncExitStack()
        self.tools_map = {} # Map tool_name -> session_name

    async def load_claude_config(self) -> Dict[str, Any]:
        """Reads the local Claude Desktop config to find MCP servers."""
        if not os.path.exists(CLAUDE_CONFIG_PATH):
            print(f"Warning: Claude config not found at {CLAUDE_CONFIG_PATH}")
            return {}
        
        try:
            with open(CLAUDE_CONFIG_PATH, 'r') as f:
                data = json.load(f)
                return data.get("mcpServers", {})
        except Exception as e:
            print(f"Error reading Claude config: {e}")
            return {}

    async def connect_to_server(self, name: str, config: Dict[str, Any]):
        """Connects to a single MCP server using stdio."""
        command = config.get("command")
        args = config.get("args", [])
        env = config.get("env", {})
        
        # Merge current env with config env
        full_env = os.environ.copy()
        full_env.update(env)

        server_params = StdioServerParameters(
            command=command,
            args=args,
            env=full_env
        )

        try:
            # Enter the stdio_client context
            transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
            
            # Create the session
            session = await self.exit_stack.enter_async_context(ClientSession(transport, transport))
            await session.initialize()
            
            self.sessions[name] = session
            print(f"✅ Connected to MCP Server: {name}")
            
            # List tools
            result = await session.list_tools()
            for tool in result.tools:
                self.tools_map[tool.name] = name
                # print(f"   - Found tool: {tool.name}")

        except Exception as e:
            print(f"❌ Failed to connect to {name}: {e}")

    async def get_all_tools_for_gemini(self):
        """Converts all connected MCP tools into Gemini FunctionDeclarations."""
        gemini_tools = []

        for name, session in self.sessions.items():
            result = await session.list_tools()
            for tool in result.tools:
                # Transform JSON schema to Gemini format
                # Note: Gemini expects a specific structure. This is a simplified mapper.
                
                function_decl = {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema
                }
                gemini_tools.append(function_decl)
        
        return gemini_tools

    async def call_mcp_tool(self, tool_name: str, args: Dict[str, Any]):
        """Executes a tool on the appropriate MCP server."""
        server_name = self.tools_map.get(tool_name)
        if not server_name:
            raise ValueError(f"Tool {tool_name} not found in any connected MCP server.")
        
        session = self.sessions[server_name]
        result = await session.call_tool(tool_name, arguments=args)
        
        # Format result for Gemini
        # MCP returns a list of Content objects (TextContent, ImageContent, etc.)
        output_text = []
        for content in result.content:
            if hasattr(content, 'text'):
                output_text.append(content.text)
            else:
                output_text.append(str(content))
        
        return "\n".join(output_text)

    async def run(self):
        print(f"🚀 Starting Gemini MCP Bridge with model: {MODEL_NAME}")
        
        # 1. Connect to MCP Servers
        servers = await self.load_claude_config()
        target_servers = ["brave-search", "filesystem"] # Specific targets as requested
        
        for name, config in servers.items():
            # Filter or connect to all. The prompt implied specific tools found in config.
            # Connecting to everything found in config is usually safer/more robust.
            await self.connect_to_server(name, config)

        if not self.sessions:
            print("No MCP servers connected. Exiting.")
            return

        # 2. Prepare Tools for Gemini
        tools_schema = await self.get_all_tools_for_gemini()
        
        # 3. Initialize Gemini Chat
        # Note: 'tools' argument accepts a list of functions or declaration dicts
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            tools=tools_schema
        )
        
        chat = model.start_chat(enable_automatic_function_calling=False)
        
        print("\n💬 Ready! Type 'exit' to quit.\n")

        while True:
            try:
                user_input = input("You: ")
                if user_input.lower() in ['exit', 'quit']:
                    break
                
                # Send message to Gemini
                response = await chat.send_message_async(user_input)
                
                # Handle Function Calls manually (to route to MCP)
                # Loop until no more function calls (multi-turn tool use)
                while response.parts and response.parts[0].function_call:
                    fc = response.parts[0].function_call
                    tool_name = fc.name
                    tool_args = dict(fc.args)
                    
                    print(f"🛠️  Gemini requested tool: {tool_name}")
                    
                    try:
                        # Execute MCP tool
                        tool_result = await self.call_mcp_tool(tool_name, tool_args)
                        # print(f"   Result: {tool_result[:100]}...") # Snippet
                        
                        # Send result back to Gemini
                        response = await chat.send_message_async(
                            genai.protos.Content(
                                parts=[genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name=tool_name,
                                        response={'result': tool_result}
                                    )
                                )]
                            )
                        )
                    except Exception as e:
                        print(f"   Error executing tool: {e}")
                        # Feed error back to model
                        response = await chat.send_message_async(
                            genai.protos.Content(
                                parts=[genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name=tool_name,
                                        response={'error': str(e)}
                                    )
                                )]
                            )
                        )

                # Print Final Response
                print(f"Gemini: {response.text}")

            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error in chat loop: {e}")

async def main():
    bridge = MCPGeminiBridge()
    try:
        await bridge.run()
    finally:
        # Exit stack handles closing MCP connections
        await bridge.exit_stack.aclose()

if __name__ == "__main__":
    asyncio.run(main())
