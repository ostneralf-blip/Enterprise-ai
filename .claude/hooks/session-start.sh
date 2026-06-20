#!/bin/bash
set -euo pipefail

# Only run in remote (cloud) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 180000}'

# Install npm dependencies
npm install --prefer-offline 2>&1

# Install headroom for context compression (60-95% token reduction)
pip install "headroom-ai[mcp,proxy]" \
  --break-system-packages \
  --ignore-installed PyJWT \
  --quiet 2>&1

# Register headroom MCP server (idempotent)
headroom mcp install --agent claude 2>&1 || true

# Start headroom proxy in background for transparent API compression
headroom proxy --port 8787 &>/tmp/headroom-proxy.log &

# Give proxy time to start
sleep 2

# Route Claude Code API calls through headroom proxy
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export ANTHROPIC_BASE_URL=http://localhost:8787" >> "$CLAUDE_ENV_FILE"
fi
