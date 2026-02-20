import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnityBuildApi } from "../api.js";
import { formatDuration } from "../format.js";

export function registerListBuilds(server: McpServer, api: UnityBuildApi) {
  server.registerTool(
    "list_builds",
    {
      title: "List Builds",
      description:
        "List builds for a project. Can filter by build target and status.",
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe("Project ID or name (defaults to Garnet)"),
        buildtarget: z
          .string()
          .optional()
          .default("_all")
          .describe("Build target ID (_all for all targets)"),
        per_page: z
          .number()
          .optional()
          .default(10)
          .describe("Number of results (max 25)"),
        status: z
          .string()
          .optional()
          .describe(
            "Filter by status: queued, sentToBuilder, started, restarted, success, failure, canceled, unknown"
          ),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, buildtarget, per_page, status }) => {
      const projectId = await api.resolveProjectId(project);
      const builds = await api.listBuilds(
        projectId,
        buildtarget ?? "_all",
        Math.min(per_page ?? 10, 25),
        status
      );

      if (builds.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No builds found." }],
        };
      }

      const lines = [
        `Recent Builds (${builds.length})`,
        "=".repeat(70),
        ...builds.map((b) => {
          const duration =
            b.totalTimeInSeconds != null
              ? formatDuration(b.totalTimeInSeconds)
              : "(building...)";
          const created = b.created?.substring(0, 16) || "N/A";
          return `#${b.build} | ${(b.buildtargetid ?? "").padEnd(20)} | ${(b.buildStatus ?? "").padEnd(10)} | ${created} | ${duration}`;
        }),
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
