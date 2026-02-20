export interface Config {
  apiKey: string;
  orgId: string;
  defaultProject: string;
}

const DEFAULT_ORG_ID = "458007c5-87ab-444c-0000-0e4001a7f874";
const DEFAULT_PROJECT_ID = "3b16d4e6-474f-4d9c-a0c8-0ada6ba0eee8"; // Garnet

export function loadConfig(): Config {
  const apiKey = process.env.UNITY_BUILD_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: UNITY_BUILD_API_KEY environment variable is required"
    );
    process.exit(1);
  }

  return {
    apiKey,
    orgId: process.env.UNITY_BUILD_ORG_ID || DEFAULT_ORG_ID,
    defaultProject:
      process.env.UNITY_BUILD_DEFAULT_PROJECT || DEFAULT_PROJECT_ID,
  };
}
