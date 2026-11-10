/**
 * The MCP server: three tools over stdio (list_suggestions, suggest, upvote). Agents never resolve (docs/adr/0003).
 * Each tool's description carries the rules an agent needs: post friction with the process, never product bugs;
 * read the box first; one suggestion per post; keep fields to a line or two. `source` defaults to
 * SUGGESTION_BOX_SOURCE from the environment.
 */

// TODO(v0.1): startServer(store) using @modelcontextprotocol/sdk's McpServer and StdioServerTransport.
export {};
