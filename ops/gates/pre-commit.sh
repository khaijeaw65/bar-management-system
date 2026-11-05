#!/usr/bin/env sh
# ops/gates/pre-commit.sh — fast staged linter & style checker
# Inferred by /adopt or /bootstrap-project per stack
set -e

# Node / TypeScript stack default
if [ -f "package.json" ]; then
  # Prefer oxlint if installed, fallback to eslint or package script
  if command -v oxlint >/dev/null 2>&1; then
    STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
    if [ -n "$STAGED" ]; then
      oxlint $STAGED
    fi
  elif npm run | grep -q "lint:staged"; then
    npm run lint:staged
  fi
fi

# Kotlin / Gradle stack default
if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  if [ -x "./gradlew" ]; then
    ./gradlew ktlintCheck --daemon || true
  fi
fi

exit 0
