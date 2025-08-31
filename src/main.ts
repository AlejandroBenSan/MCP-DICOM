import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { analyzeDicomFolderTool } from "./tools/analyzeDicomFolder";
import { analyzeROITool } from "./tools/analyzeROI";

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

server.registerTool(
  analyzeROITool.name,
  analyzeROITool.config,
  analyzeROITool.handler
);

const transport = new StdioServerTransport();
server.connect(transport);
