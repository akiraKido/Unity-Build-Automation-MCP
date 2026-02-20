import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnityBuildApi } from "../api.js";
import { formatDuration } from "../format.js";

export function registerGetBuild(server: McpServer, api: UnityBuildApi) {
  server.registerTool(
    "get_build",
    {
      title: "Get Build Details",
      description: "Get detailed information about a specific build.",
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe("Project ID or name (defaults to Garnet)"),
        buildtarget: z.string().describe("Build target ID"),
        build_number: z.number().describe("Build number"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ project, buildtarget, build_number }) => {
      const projectId = await api.resolveProjectId(project);
      const build = await api.getBuild(projectId, buildtarget, build_number);

      const lines = [
        `Build #${build.build} - ${build.buildTargetName || build.buildtargetid}`,
        "=".repeat(40),
        `Status:    ${build.buildStatus}`,
        `Platform:  ${build.platform}`,
        `Branch:    ${build.scmBranch || "N/A"}`,
        `Created:   ${build.created}`,
        `Finished:  ${build.finished || "(in progress)"}`,
      ];

      if (build.totalTimeInSeconds != null) {
        lines.push(`Duration:  ${formatDuration(build.totalTimeInSeconds)}`);
      }

      if (build.buildReport) {
        lines.push(`Errors:    ${build.buildReport.errors ?? 0}`);
        lines.push(`Warnings:  ${build.buildReport.warnings ?? 0}`);
      }

      if (build.lastBuiltRevision) {
        lines.push(`Revision:  ${build.lastBuiltRevision.substring(0, 10)}`);
      }

      if (build.changeset && build.changeset.length > 0) {
        lines.push("", "Changeset:");
        for (const c of build.changeset) {
          const author = c.author?.fullName || "unknown";
          lines.push(`  - ${author}: ${c.message}`);
        }
      }

      if (build.links?.download_primary?.href) {
        lines.push("", `Download: ${build.links.download_primary.href}`);
      }

      if (build.links?.log?.href) {
        lines.push(`Log: ${build.links.log.href}`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
