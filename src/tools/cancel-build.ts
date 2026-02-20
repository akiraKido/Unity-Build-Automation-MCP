import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnityBuildApi } from "../api.js";

export function registerCancelBuild(server: McpServer, api: UnityBuildApi) {
  server.registerTool(
    "cancel_build",
    {
      title: "Cancel Build",
      description:
        "Cancel a running build. This is a write operation.",
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe("Project ID or name (defaults to Garnet)"),
        buildtarget: z.string().describe("Build target ID"),
        build_number: z.number().describe("Build number to cancel"),
      },
      annotations: { readOnlyHint: false },
    },
    async ({ project, buildtarget, build_number }) => {
      const projectId = await api.resolveProjectId(project);
      await api.cancelBuild(projectId, buildtarget, build_number);

      return {
        content: [
          {
            type: "text" as const,
            text: `Build #${build_number} (${buildtarget}) has been cancelled.`,
          },
        ],
      };
    }
  );
}
