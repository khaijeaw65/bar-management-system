#!/usr/bin/env sh
# ops/gates/pre-commit.sh — project linter on staged files. Adjust per stack.
set -e

STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|mjs|cjs)$' | grep -v '^\.worktrees/' || true)

if [ -f package.json ] && [ -n "$STAGED" ]; then
  if [ -f pnpm-lock.yaml ]; then PKG=pnpm; else PKG=npm; fi
  if grep -q '"lint:staged"' package.json; then
    $PKG run lint:staged
  elif command -v oxlint >/dev/null 2>&1 || [ -x node_modules/.bin/oxlint ]; then
    printf '%s\n' "$STAGED" | tr '\n' '\0' | xargs -0 $PKG exec oxlint
  elif ls eslint.config.* >/dev/null 2>&1; then
    printf '%s\n' "$STAGED" | tr '\n' '\0' | xargs -0 $PKG exec eslint --no-warn-ignored
  fi
fi

if { [ -f build.gradle ] || [ -f build.gradle.kts ]; } && [ -x ./gradlew ]; then
  ./gradlew ktlintCheck --daemon
fi

# --- project gate (kept from Rev 23): frontend / mobile lint does not ban these yet, so grep staged sources.
SRC=$(printf '%s\n' "$STAGED" | grep -E '\.(ts|tsx)$' | grep -vE '(\.d\.ts|\.spec\.tsx?|\.e2e-spec\.ts|\.test\.tsx?)$' || true)
if [ -n "$SRC" ]; then
  HITS=$(printf '%s\n' "$SRC" | tr '\n' '\0' | xargs -0 grep -nHE 'as any|@ts-ignore|@ts-expect-error' 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "❌ [field-kit] type cheats in staged files (CORE-01):"; echo "$HITS"; exit 1
  fi
  TYPES=$(printf '%s\n' "$SRC" | grep -E '\.(types|dto|port)\.ts$' || true)
  if [ -n "$TYPES" ]; then
    CLS=$(printf '%s\n' "$TYPES" | tr '\n' '\0' | xargs -0 grep -nHE '^\s*(export\s+)?class\s+' 2>/dev/null || true)
    if [ -n "$CLS" ]; then
      echo "❌ [field-kit] classes in .types.ts / .dto.ts / .port.ts (CORE-05):"; echo "$CLS"; exit 1
    fi
  fi
fi
