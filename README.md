# Unity Build Automation MCP Server

Unity Cloud Build (Build Automation) の REST API を [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) サーバーとしてラップし、Claude Code から直接ビルド状況の確認・操作を可能にします。

## Architecture

```
Claude Code <--stdio--> MCP Server (Node.js/TypeScript) <--HTTPS--> Unity Build API
                                                                     https://build-api.cloud.unity3d.com/api/v1/
```

## Setup

### Prerequisites

- Node.js (ES2022+)
- Unity Build Automation API Key

### Install

```bash
# npx で直接使う場合（インストール不要）
npx -y unity-build-automation-mcp

# グローバルインストール
npm install -g .

# ローカル開発
npm install
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UNITY_BUILD_API_KEY` | Yes | Unity Build Automation API Key |
| `UNITY_BUILD_ORG_ID` | No | Organization ID (default: preconfigured) |
| `UNITY_BUILD_DEFAULT_PROJECT` | No | Default project name or ID |

### Claude Code MCP Settings

Claude Code CLI で追加:

```bash
claude mcp add unity-build -- npx -y unity-build-automation-mcp
```

または `~/.claude.json` / `.mcp.json` に手動で追加:

```json
{
  "mcpServers": {
    "unity-build": {
      "command": "npx",
      "args": ["-y", "unity-build-automation-mcp"],
      "env": {
        "UNITY_BUILD_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

ローカルリポジトリから直接使う場合:

```json
{
  "mcpServers": {
    "unity-build": {
      "command": "node",
      "args": ["<path-to-repo>/dist/index.js"],
      "env": {
        "UNITY_BUILD_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Tools

### Read Operations

| Tool | Description |
|------|-------------|
| `list_projects` | Organization 内のプロジェクト一覧を取得 |
| `list_build_targets` | プロジェクトのビルドターゲット一覧を取得 |
| `list_builds` | ビルド一覧を取得（ステータスでフィルタ可） |
| `get_build` | 特定ビルドの詳細情報を取得 |
| `get_build_log` | ビルドログの末尾N行を取得 |

### Write Operations

| Tool | Description |
|------|-------------|
| `start_build` | 新しいビルドを開始 |
| `cancel_build` | 実行中のビルドをキャンセル |

> Write operations は Claude Code 側で実行前に確認プロンプトが表示されます。

## Usage Examples

**ビルド状況の確認:**
> 「最新のビルド状況を見せて」

**失敗ビルドの調査:**
> 「失敗したビルドのログを確認して」

**ビルドの開始:**
> 「Android の develop ブランチでビルドを開始して」

**ビルドターゲットの確認:**
> 「Garnet のビルドターゲット一覧を見せて」

## Parameters

ほとんどのツールで `project` パラメータは省略可能です。省略時はデフォルトプロジェクトが使用されます。プロジェクト名（例: `Garnet`）または UUID のどちらでも指定できます。

### Build Status Values

| Status | Description |
|--------|-------------|
| `queued` | キュー待ち |
| `sentToBuilder` | ビルダーに送信済み |
| `started` | ビルド中 |
| `restarted` | 再開 |
| `success` | 成功 |
| `failure` | 失敗 |
| `canceled` | キャンセル |
| `unknown` | 不明 |

## Development

```bash
npm run dev    # TypeScript watch mode
npm run build  # Build
npm start      # Run server
```

## Project Structure

```
src/
  index.ts             # Entry point, MCP server setup
  api.ts               # Unity Build API client
  config.ts            # Configuration / env var handling
  types.ts             # TypeScript type definitions
  format.ts            # Output formatting utilities
  tools/
    list-projects.ts
    list-build-targets.ts
    list-builds.ts
    get-build.ts
    get-build-log.ts
    start-build.ts
    cancel-build.ts
```

## License

Private
