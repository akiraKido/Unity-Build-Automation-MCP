# Unity Build Automation MCP Server - Design Specification

## Overview

Unity Cloud Build (Build Automation) の REST API を MCP (Model Context Protocol) サーバーとしてラップし、
Claude Code から直接ビルド状況の確認・操作を可能にする。

## Architecture

```
Claude Code <--stdio--> MCP Server (Node.js/TypeScript) <--HTTPS--> Unity Build API
                                                                     https://build-api.cloud.unity3d.com/api/v1/
```

### Transport

- **Protocol**: MCP over stdio
- **Runtime**: Node.js (TypeScript)
- **SDK**: `@modelcontextprotocol/sdk`

### Authentication

- Unity Build API は Basic Authentication を使用
- API Key を環境変数 `UNITY_BUILD_API_KEY` から取得
- リクエストヘッダ: `Authorization: Basic <API_KEY>`

## API Mapping

### Unity Build API Base

```
Base URL: https://build-api.cloud.unity3d.com/api/v1
```

### Discovered Resources (star-shinya org)

| Resource | Value |
|----------|-------|
| Org ID | `458007c5-87ab-444c-0000-0e4001a7f874` |
| Org FK | `15668068481140` |
| Org Name | `star-shinya` |

#### Projects

| Project ID | Name |
|-----------|------|
| `09eeb2f5-3844-4ac2-a93a-92e65a973380` | automata |
| `1857cece-2c42-4104-a453-00f6c63e5635` | 星の王子様メッセージ |
| `26ccf8a0-59e4-4d5d-89b6-71e534432585` | unityalice |
| `3b16d4e6-474f-4d9c-a0c8-0ada6ba0eee8` | **Garnet** |
| `6f593bba-94ef-4935-a241-b7b9394d1765` | 魔女とクラフト |
| `891b473f-b41e-4000-9954-69f072cc344b` | FluoriteMock2 |
| `9c9bd1b7-73e4-4d9c-a17d-20b6dc222db3` | samegame |
| `c6d84d55-7254-484a-9f94-350b77a2ba87` | アリスと不思議なお手紙 |
| `e0050361-0f01-4977-938e-8f7c922c1082` | swipe |
| `f8840614-b18f-48a6-a13f-74a0adf6bcfa` | 2d_animation |

#### Garnet Build Targets

| Build Target ID | Name | Platform |
|----------------|------|----------|
| `android-develop` | Android develop | android |
| `ios-develop` | iOS develop | ios |
| `mac-for-editor` | Mac for Editor | standaloneosx |

## MCP Tools

### 1. `list_projects` (Read)

Organization 内のプロジェクト一覧を取得。

**Parameters:**
- なし

**API Endpoint:**
```
GET /orgs/{orgid}/projects
```

**Response Fields:**
- `projectid`: プロジェクトID
- `name`: プロジェクト名
- `created`: 作成日時
- `disabled`: 無効化フラグ

---

### 2. `list_build_targets` (Read)

指定プロジェクトのビルドターゲット一覧を取得。

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `project` | string | No | Garnet の ID | プロジェクトID or 名前 |

**API Endpoint:**
```
GET /orgs/{orgid}/projects/{projectid}/buildtargets
```

**Response Fields:**
- `buildtargetid`: ビルドターゲットID
- `name`: ビルドターゲット名
- `enabled`: 有効/無効
- `platform`: プラットフォーム (android, ios, standaloneosx)
- `settings.scm.branch`: ビルド対象ブランチ

---

### 3. `list_builds` (Read)

ビルド一覧を取得。フィルタリング可能。

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `project` | string | No | Garnet の ID | プロジェクトID or 名前 |
| `buildtarget` | string | No | `_all` | ビルドターゲットID (`_all` で全ターゲット) |
| `per_page` | number | No | `10` | 取得件数 (max 25) |
| `status` | string | No | - | フィルタ: `queued`, `sentToBuilder`, `started`, `restarted`, `success`, `failure`, `canceled`, `unknown` |

**API Endpoint:**
```
GET /orgs/{orgid}/projects/{projectid}/buildtargets/{buildtargetid}/builds?per_page={per_page}&buildStatus={status}
```

**Response Fields (per build):**
- `build`: ビルド番号
- `buildtargetid`: ビルドターゲットID
- `buildTargetName`: ビルドターゲット表示名
- `buildStatus`: ステータス (`queued`, `sentToBuilder`, `started`, `restarted`, `success`, `failure`, `canceled`, `unknown`)
- `platform`: プラットフォーム
- `scmBranch`: ブランチ名
- `created`: 作成日時
- `finished`: 完了日時 (null if in progress)
- `totalTimeInSeconds`: 総時間(秒)
- `lastBuiltRevision`: 最終ビルドコミットハッシュ
- `buildReport.errors`: エラー数
- `buildReport.warnings`: 警告数
- `changeset[]`: 含まれるコミット一覧
  - `commitId`: コミットハッシュ
  - `message`: コミットメッセージ
  - `author.fullName`: 著者名

---

### 4. `get_build` (Read)

特定のビルドの詳細情報を取得。

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `project` | string | No | Garnet の ID | プロジェクトID or 名前 |
| `buildtarget` | string | Yes | - | ビルドターゲットID |
| `build_number` | number | Yes | - | ビルド番号 |

**API Endpoint:**
```
GET /orgs/{orgid}/projects/{projectid}/buildtargets/{buildtargetid}/builds/{number}
```

**Response Fields:**
- `list_builds` の全フィールドに加え:
- `links.log.href`: ログURL
- `links.download_primary.href`: ダウンロードURL (成功時)
- `links.artifacts[]`: アーティファクト情報

---

### 5. `get_build_log` (Read)

ビルドログを取得。失敗原因の調査に使用。

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `project` | string | No | Garnet の ID | プロジェクトID or 名前 |
| `buildtarget` | string | Yes | - | ビルドターゲットID |
| `build_number` | number | Yes | - | ビルド番号 |
| `tail` | number | No | `100` | 末尾から取得する行数 |

**API Endpoint:**
```
GET /orgs/{orgid}/projects/{projectid}/buildtargets/{buildtargetid}/builds/{number}/log
```

**Note:** ログは大量になるため、レスポンスの末尾N行のみ返す。

---

### 6. `start_build` (Write - 要確認)

新しいビルドを開始する。

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `project` | string | No | Garnet の ID | プロジェクトID or 名前 |
| `buildtarget` | string | Yes | - | ビルドターゲットID |
| `branch` | string | No | - | ビルド対象ブランチ (省略時はターゲットのデフォルト) |
| `clean` | boolean | No | `false` | クリーンビルドするか |

**API Endpoint:**
```
POST /orgs/{orgid}/projects/{projectid}/buildtargets/{buildtargetid}/builds
```

**Request Body:**
```json
{
  "clean": false,
  "branch": "develop"
}
```

---

### 7. `cancel_build` (Write - 要確認)

実行中のビルドをキャンセルする。

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `project` | string | No | Garnet の ID | プロジェクトID or 名前 |
| `buildtarget` | string | Yes | - | ビルドターゲットID |
| `build_number` | number | Yes | - | ビルド番号 |

**API Endpoint:**
```
DELETE /orgs/{orgid}/projects/{projectid}/buildtargets/{buildtargetid}/builds/{number}
```

## Project Name Resolution

`project` パラメータに名前が指定された場合、`list_projects` の結果から `projectid` を解決する。
よく使うプロジェクトは内部でキャッシュする。

## Build Status Values

| Status | Description |
|--------|-------------|
| `queued` | キューに入った |
| `sentToBuilder` | ビルダーに送信された |
| `started` | ビルド開始 |
| `restarted` | 再開された |
| `success` | 成功 |
| `failure` | 失敗 |
| `canceled` | キャンセル |
| `unknown` | 不明 |

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UNITY_BUILD_API_KEY` | Yes | Unity Build Automation API Key |
| `UNITY_BUILD_ORG_ID` | No | デフォルトOrg ID (省略時は API から取得) |
| `UNITY_BUILD_DEFAULT_PROJECT` | No | デフォルトプロジェクト名 or ID |

### Claude Code MCP Settings

```json
{
  "mcpServers": {
    "unity-build": {
      "type": "stdio",
      "command": "node",
      "args": ["<path>/dist/index.js"],
      "env": {
        "UNITY_BUILD_API_KEY": "15641fb1d70b99a0852f0e89577dc3ab"
      }
    }
  }
}
```

## Project Structure

```
unity-build-automation-mcp/
  docs/
    spec.md              # This file
  src/
    index.ts             # Entry point, MCP server setup
    api.ts               # Unity Build API client
    tools/
      list-projects.ts
      list-build-targets.ts
      list-builds.ts
      get-build.ts
      get-build-log.ts
      start-build.ts
      cancel-build.ts
    types.ts             # TypeScript type definitions
    config.ts            # Configuration / env var handling
  package.json
  tsconfig.json
  .env.example
```

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "latest",
  "zod": "^3.23"
}
```

Dev dependencies:
```json
{
  "typescript": "^5.5",
  "@types/node": "^22"
}
```

## Response Formatting

MCPレスポンスはテキストフォーマットで返す。
主要なケースでのフォーマット例:

### list_builds の出力例

```
Garnet - Recent Builds (3)
===========================
#244 | ios-develop     | started  | 2026-02-19T23:34 | (building...)
#243 | ios-develop     | failure  | 2026-02-19T20:00 | 30m 0s
#243 | android-develop | success  | 2026-02-19T19:00 | 19m 36s
```

### get_build の出力例

```
Build #243 - Android develop
=============================
Status:    success
Platform:  android
Branch:    develop
Created:   2026-02-19T19:00:03Z
Finished:  2026-02-19T19:19:39Z
Duration:  19m 36s
Errors:    0
Warnings:  239
Revision:  004ac9443b

Changeset:
  - dohi-star: バグ修正：2026/2/19 (#948)
  - dohi-star: 【CLI-1349】交換所のpriority反映を修正 (#947)
  - dohi-star: 【CLI-1364】Spine調整 (#946)

Download: [APK link]
```

## Error Handling

- API Key 未設定: 起動時にエラーメッセージを出力して終了
- API 認証エラー (401/403): ツール実行時にエラーメッセージを返す
- ネットワークエラー: リトライ1回、それでもダメならエラーメッセージ
- プロジェクト名解決失敗: 利用可能なプロジェクト一覧を提示

## Security Considerations

- API Key は環境変数経由でのみ渡し、コードにハードコードしない
- `.env.example` にはプレースホルダのみ記載
- `start_build` / `cancel_build` は write 操作のため、Claude Code 側で確認プロンプトが出る
