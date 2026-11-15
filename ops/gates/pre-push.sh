#!/usr/bin/env sh
# ops/gates/pre-push.sh — typecheck + affected unit tests. Any failure blocks the push (≤ 1–2 min target).
# Full suites, e2e and build run in CI. Adjust per stack.
set -e

if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ]; then PKG=pnpm; else PKG=npm; fi
  if ! command -v "$PKG" >/dev/null 2>&1; then
    echo "❌ [field-kit pre-push] $PKG not found — cannot run gates. Install it, or push with --no-verify and disclose it in the handoff."
    exit 1
  fi
  if [ -f turbo.json ]; then
    BASE=$(git merge-base HEAD origin/main 2>/dev/null || echo origin/main)
    echo "==> [field-kit pre-push] typecheck + unit tests (affected since ${BASE%"${BASE#???????}"})"
    $PKG exec turbo run typecheck test --filter="...[$BASE]"
  else
    echo "==> [field-kit pre-push] typecheck + unit tests"
    $PKG run --if-present typecheck
    $PKG run --if-present test
  fi
fi

if { [ -f build.gradle ] || [ -f build.gradle.kts ]; } && [ -x ./gradlew ]; then
  echo "==> [field-kit pre-push] gradle test"
  ./gradlew test
fi
