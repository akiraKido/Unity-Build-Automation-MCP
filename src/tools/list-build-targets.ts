import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnityBuildApi } from "../api.js";

export function registerListBuildTargets(
  server: McpServer,
  api: UnityBuildApi
) {
  server.registerTool(
    "list_build_targets",
    {
      title: "List Build Targets",
      description:
        "List build targets for a project. Defaults to the configured default project (Garnet).",
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe("Project ID or name (defaults to Garnet)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project }) => {
      const projectId = await api.resolveProjectId(project);
      const targets = await api.listBuildTargets(projectId);

      const lines = [
        `Build Targets (${targets.length})`,
        "=".repeat(50),
        ...targets.map((t) => {
          const status = t.enabled ? "enabled" : "disabled";
          const branch = t.settings?.scm?.branch || "N/A";
          return `${t.buildtargetid} | ${t.name} | ${t.platform} | ${status} | branch: ${branch}`;
        }),
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
