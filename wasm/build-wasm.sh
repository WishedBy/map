#!/usr/bin/env bash

GOOS=js GOARCH=wasm go build -o ../frontend/app.wasm .
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ../frontend/assets/js/wasm_exec.js