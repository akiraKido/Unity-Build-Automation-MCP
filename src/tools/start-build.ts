import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { UnityBuildApi } from "../api.js";

export function registerStartBuild(server: McpServer, api: UnityBuildApi) {
  server.registerTool(
    "start_build",
    {
      title: "Start Build",
      description:
        "Start a new build for a build target. This is a write operation.",
      inputSchema: {
        project: z
          .string()
          .optional()
          .describe("Project ID or name (defaults to Garnet)"),
        buildtarget: z.string().describe("Build target ID"),
        branch: z
          .string()
          .optional()
          .describe(
            "Branch to build (defaults to the build target's configured branch)"
          ),
        clean: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether to perform a clean build"),
      },
      annotations: { readOnlyHint: false },
    },
    async ({ project, buildtarget, branch, clean }) => {
      const projectId = await api.resolveProjectId(project);
      const builds = await api.startBuild(projectId, buildtarget, {
        clean: clean ?? false,
        branch,
      });

      if (!builds || builds.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Build started but no build info returned.",
            },
          ],
        };
      }

      const build = builds[0];
      const lines = [
        `Build Started`,
        "=".repeat(30),
        `Build #${build.build}`,
        `Target:   ${build.buildtargetid}`,
        `Status:   ${build.buildStatus}`,
        `Platform: ${build.platform}`,
        `Branch:   ${build.scmBranch || "default"}`,
        `Created:  ${build.created}`,
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
