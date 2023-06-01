#!/usr/bin/env bash

set -euo pipefail
shopt -s extglob
IFS=$'\n\t'

# Build frontend
pushd blastbot-bridge/frontend
npm install
npm run build
popd

# Clean old assets and copy build to backend public folder
pushd blastbot-bridge
pushd server/public
rm -rfv !("favicon.ico")
popd
cp -r frontend/www/* server/public/
popd