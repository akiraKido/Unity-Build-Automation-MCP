import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { UnityBuildApi } from "../api.js";

export function registerListProjects(server: McpServer, api: UnityBuildApi) {
  server.registerTool(
    "list_projects",
    {
      title: "List Projects",
      description:
        "List all projects in the Unity Build Automation organization.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const projects = await api.listProjects();

      const lines = [
        `Projects (${projects.length})`,
        "=".repeat(40),
        ...projects.map((p) => {
          const status = p.disabled ? " [disabled]" : "";
          return `${p.name}${status} | ${p.projectid}`;
        }),
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
