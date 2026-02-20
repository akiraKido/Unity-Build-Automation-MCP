import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnityBuildApi } from "../api.js";

export function registerGetBuildLog(server: McpServer, api: UnityBuildApi) {
  server.registerTool(
    "get_build_log",
    {
      title: "Get Build Log",
      description:
        "Get the build log for a specific build. Returns the last N lines to help investigate failures.",
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe("Project ID or name (defaults to Garnet)"),
        buildtarget: z.string().describe("Build target ID"),
        build_number: z.number().describe("Build number"),
        tail: z
          .number()
          .optional()
          .default(100)
          .describe("Number of lines from the end to return (default 100)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, buildtarget, build_number, tail }) => {
      const projectId = await api.resolveProjectId(project);
      const log = await api.getBuildLog(projectId, buildtarget, build_number);

      const tailLines = tail ?? 100;
      const allLines = String(log).split("\n");
      const outputLines =
        allLines.length > tailLines
          ? allLines.slice(-tailLines)
          : allLines;

      const header = [
        `Build Log #${build_number} (${buildtarget}) - last ${outputLines.length} lines`,
        "=".repeat(60),
      ];

      return {
        content: [
          {
            type: "text" as const,
            text: [...header, ...outputLines].join("\n"),
          },
        ],
      };
    }
  );
}
