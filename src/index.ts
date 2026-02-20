#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { UnityBuildApi } from "./api.js";
import { registerListProjects } from "./tools/list-projects.js";
import { registerListBuildTargets } from "./tools/list-build-targets.js";
import { registerListBuilds } from "./tools/list-builds.js";
import { registerGetBuild } from "./tools/get-build.js";
import { registerGetBuildLog } from "./tools/get-build-log.js";
import { registerStartBuild } from "./tools/start-build.js";
import { registerCancelBuild } from "./tools/cancel-build.js";

const config = loadConfig();
const api = new UnityBuildApi(config);

const server = new McpServer({
  name: "unity-build-automation-mcp",
  version: "1.0.0",
});

registerListProjects(server, api);
registerListBuildTargets(server, api);
registerListBuilds(server, api);
registerGetBuild(server, api);
registerGetBuildLog(server, api);
registerStartBuild(server, api);
registerCancelBuild(server, api);

const transport = new StdioServerTransport();
await server.connect(transport);
