#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_DIR="$(/usr/bin/time -p pwd)"
PORT="${PORT:-3000}"
export PORT PROJECT_DIR
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export OPENCODE_WEB_DIR
DIST_DIR="$PROJECT_DIR/dist"
/usr/bin/time -p test -d "$PROJECT_DIR"
/usr/bin/time -p node --version
if /usr/bin/time -p test -f "$PROJECT_DIR/package-lock.json"; then
  /usr/bin/time -p npm ci --no-audit --no-fund
else
  /usr/bin/time -p npm install --no-audit --no-fund
fi
/usr/bin/time -p npm run build
/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p mkdir -p "$OPENCODE_WEB_DIR"
/usr/bin/time -p node -e 'const fs=require("fs");const path=require("path");const project=process.env.PROJECT_DIR||process.cwd();const dir=path.join(project,"dist");const out=path.join(process.env.OPENCODE_WEB_DIR,"deployment-output.json");fs.writeFileSync(out,JSON.stringify({project,directory:dir}));console.log("deployment-output:",fs.readFileSync(out,"utf8"))'
/usr/bin/time -p node -e 'console.log("serving project="+process.env.PROJECT_DIR+" dist="+process.env.PROJECT_DIR+"/dist port="+process.env.PORT)'
exec /usr/bin/time -p node "$PROJECT_DIR/server.js"
