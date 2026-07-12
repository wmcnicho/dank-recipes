#!/bin/bash
# Build the site and publish dist/ to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$HOME/.local/gh/bin:$PATH"

cd dank_recipes_site
npm run build

cd dist
git init -q -b gh-pages
git config user.name "Hunter"
git config user.email "wmcnichols@umass.edu"
git add -A
git commit -q -m "Deploy $(git -C ../.. rev-parse --short HEAD)"
git push -f https://github.com/wmcnicho/dank-recipes.git gh-pages
rm -rf .git
echo "Deployed."
