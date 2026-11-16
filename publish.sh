#!/usr/bin/env bash
# Build the site and push it to GitHub Pages.  Usage: ./publish.sh ["message"]
set -euo pipefail
cd "$(dirname "$0")"

python3 scripts/build.py
git add -A
if git diff --cached --quiet; then
  echo "Nothing changed, nothing to publish."
else
  git commit -q -m "${1:-Update lessons}"
  git push -q origin main
  echo "Pushed. GitHub Pages updates within about a minute."
fi

url=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)([^/]+)/([^.]+)(\.git)?#https://\2.github.io/\3/#')
echo "Site: $url"
