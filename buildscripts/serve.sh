#!/usr/bin/env bash

BUILDSCRIPTS_DIR="$(dirname "${BASH_SOURCE[0]}")"

cd "$BUILDSCRIPTS_DIR"
cd ..

deno run --unstable --allow-read --allow-write --allow-net --allow-env "$BUILDSCRIPTS_DIR/serve.ts"