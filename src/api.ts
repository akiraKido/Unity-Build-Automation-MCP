import { Config } from "./config.js";
import type { Project, BuildTarget, Build } from "./types.js";

export class UnityBuildApi {
  private baseUrl = "https://build-api.cloud.unity3d.com/api/v1";
  private config: Config;
  private projectCache: Map<string, string> = new Map();

  constructor(config: Config) {
    this.config = config;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Basic ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: { ...headers, ...(options?.headers as Record<string, string>) },
        });

        if (!response.ok) {
          const body = await response.text();
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              `Authentication error (${response.status}): Check your UNITY_BUILD_API_KEY`
            );
          }
          throw new Error(`API error ${response.status}: ${body}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return (await response.json()) as T;
        }
        return (await response.text()) as unknown as T;
      } catch (error) {
        if (attempt === 0 && error instanceof TypeError) {
          continue;
        }
        throw error;
      }
    }
    throw new Error("Request failed after retry");
  }

  private orgPath(): string {
    return `/orgs/${this.config.orgId}`;
  }

  async resolveProjectId(projectInput?: string): Promise<string> {
    const input = projectInput || this.config.defaultProject;

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input
      )
    ) {
      return input;
    }

    if (this.projectCache.has(input)) {
      return this.projectCache.get(input)!;
    }

    const projects = await this.listProjects();
    const match = projects.find(
      (p) => p.name.toLowerCase() === input.toLowerCase()
    );
    if (!match) {
      const available = projects.map((p) => `  - ${p.name} (${p.projectid})`).join("\n");
      throw new Error(
        `Project "${input}" not found. Available projects:\n${available}`
      );
    }

    this.projectCache.set(input, match.projectid);
    return match.projectid;
  }

  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>(`${this.orgPath()}/projects`);
  }

  async listBuildTargets(projectId: string): Promise<BuildTarget[]> {
    return this.request<BuildTarget[]>(
      `${this.orgPath()}/projects/${projectId}/buildtargets`
    );
  }

  async listBuilds(
    projectId: string,
    buildTargetId: string,
    perPage: number,
    status?: string
  ): Promise<Build[]> {
    const params = new URLSearchParams({ per_page: String(perPage) });
    if (status) {
      params.set("buildStatus", status);
    }
    return this.request<Build[]>(
      `${this.orgPath()}/projects/${projectId}/buildtargets/${buildTargetId}/builds?${params}`
    );
  }

  async getBuild(
    projectId: string,
    buildTargetId: string,
    buildNumber: number
  ): Promise<Build> {
    return this.request<Build>(
      `${this.orgPath()}/projects/${projectId}/buildtargets/${buildTargetId}/builds/${buildNumber}`
    );
  }

  async getBuildLog(
    projectId: string,
    buildTargetId: string,
    buildNumber: number
  ): Promise<string> {
    return this.request<string>(
      `${this.orgPath()}/projects/${projectId}/buildtargets/${buildTargetId}/builds/${buildNumber}/log`
    );
  }

  async startBuild(
    projectId: string,
    buildTargetId: string,
    options?: { clean?: boolean; branch?: string }
  ): Promise<Build[]> {
    const body: Record<string, unknown> = {};
    if (options?.clean !== undefined) body.clean = options.clean;
    if (options?.branch) body.branch = options.branch;

    return this.request<Build[]>(
      `${this.orgPath()}/projects/${projectId}/buildtargets/${buildTargetId}/builds`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }

  async cancelBuild(
    projectId: string,
    buildTargetId: string,
    buildNumber: number
  ): Promise<string> {
    return this.request<string>(
      `${this.orgPath()}/projects/${projectId}/buildtargets/${buildTargetId}/builds/${buildNumber}`,
      { method: "DELETE" }
    );
  }
}
