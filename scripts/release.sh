#!/bin/bash
set -euo pipefail

# Usage: ./scripts/release.sh [patch|minor|major]

BUMP="${1:-patch}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

# Ensure working directory is clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

# Bump version, create commit and tag
VERSION=$(npm version "$BUMP" --no-git-tag-version)
git add package.json package-lock.json
git commit -m "release: ${VERSION}"
git tag "$VERSION"

echo ""
echo "Created ${VERSION}"
echo ""

# Publish to npm
npm publish --userconfig .npmrc --access public

echo ""
echo "Published ${VERSION} to npm"
echo ""

# Push commit and tag
git push && git push --tags

echo "Done! ${VERSION} released."
