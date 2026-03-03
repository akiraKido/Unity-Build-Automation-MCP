export interface Config {
  apiKey: string;
  orgId: string;
  defaultProject?: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.UNITY_BUILD_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: UNITY_BUILD_API_KEY environment variable is required"
    );
    process.exit(1);
  }

  const orgId = process.env.UNITY_BUILD_ORG_ID;
  if (!orgId) {
    console.error(
      "Error: UNITY_BUILD_ORG_ID environment variable is required"
    );
    process.exit(1);
  }

  return {
    apiKey,
    orgId,
    defaultProject: process.env.UNITY_BUILD_DEFAULT_PROJECT || undefined,
  };
}
