import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { analyzeDicomFolderTool } from "./tools/analyzeDicomFolder";

const server = new McpServer({
  name: "MCP for DICOM files analysis",
  version: "1.0.0",
});

// Registrar herramientas
server.registerTool(
  analyzeDicomFolderTool.name,
  analyzeDicomFolderTool.config,
  analyzeDicomFolderTool.handler
);

const transport = new StdioServerTransport();
server.connect(transport);
