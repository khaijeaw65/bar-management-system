#!/usr/bin/env bash
# field-kit: acceptance-lock check (CI job `lock`; also runnable locally).
# docs/rules/workflow.md 3.3:
#   - the brief's "Sections on" is read from the seed commit (or a later owner-approved revision);
#   - brief has `e2e` or `repro` → the first `test(BRIEF-###): acceptance (red)` commit after the seed is the lock;
#   - the lock commit contains test files only, and at least one;
#   - locked = the lock commit's files + the test-runner configs present at the lock;
#   - each locked file must equal its last approved version (the lock, or the newest commit touching it with
#     `Approved-by: <owner> (e2e-change)`); reverts are fine, history is never rewritten;
#   - no `.only` / `.skip` in test files changed on the branch.
# Skips: main, auto/** or docs/** branches without a BRIEF id, and IDs in $LEGACY_BRIEFS (space-separated,
# set in ci.yml — briefs seeded before the lock existed). Any other branch naming BRIEF-### is checked.
set -euo pipefail

BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"
BASE_REF="${LOCK_BASE_REF:-origin/main}"
ID=$(printf '%s' "$BRANCH" | grep -oE 'BRIEF-[0-9]+' | head -n1 || true)
if [ "$BRANCH" = main ] || [ -z "$ID" ]; then echo "lock: skip ($BRANCH)"; exit 0; fi
# Briefs seeded under an older kit line have no seed / lock commits to check (history is never rewritten).
case " ${LEGACY_BRIEFS:-} " in *" $ID "*) echo "lock: skip — $ID is listed in LEGACY_BRIEFS"; exit 0;; esac

fail() { echo "lock: FAIL — $*"; exit 1; }
TEST_RE='(\.(e2e-)?spec\.[cm]?[jt]sx?|\.test\.[cm]?[jt]sx?)$|(^|/)(test|tests|e2e|__tests__)/'
CONFIG_RE='(^|/)(jest[^/]*\.json|jest\.config\.[cm]?[jt]s|vitest[^/]*\.config\.[cm]?[jt]s|playwright\.config\.[cm]?[jt]s)$'

BASE=$(git merge-base "$BASE_REF" HEAD)
first_commit() { git log --reverse --format='%H %s' "$BASE..HEAD" | grep -E "^[0-9a-f]+ $1" | head -n1 | cut -d' ' -f1 || true; }

# --- brief: sections come from the seed (or an owner-approved revision), never from an unapproved edit
SEED=$(first_commit "docs\($ID\): Ready")
[ -z "$SEED" ] && fail "no 'docs($ID): Ready — Rev n' seed commit on $BRANCH"
BRIEF=$(git diff-tree --no-commit-id --name-only -r "$SEED" | grep -E "^docs/briefs/$ID-.*\.md$" | head -n1 || true)
[ -z "$BRIEF" ] && fail "seed commit ${SEED:0:7} does not contain docs/briefs/$ID-*.md"
SOURCE="$SEED"
for C in $(git rev-list --reverse "$SEED..HEAD" -- "$BRIEF"); do
  if git log -1 --format=%B "$C" | grep -qE '^Approved-by: .+ \(session\)$'; then SOURCE="$C"
  else fail "${C:0:7} edits $BRIEF without 'Approved-by: <owner> (session)' — briefs are owner-only"; fi
done
SECTIONS=$(git show "$SOURCE:$BRIEF" | grep -m1 -E '^\| \*\*Sections on\*\*' || true)
if ! printf '%s' "$SECTIONS" | grep -qE '`(e2e|repro)`'; then echo "lock: pass — $ID has no e2e/repro section (brief @ ${SOURCE:0:7})"; exit 0; fi

# --- lock commit
LOCK=$(first_commit "test\($ID\): acceptance \(red\)")
[ -z "$LOCK" ] && fail "no 'test($ID): acceptance (red)' commit on $BRANCH"
LOCK_FILES=$(git diff-tree --no-commit-id --name-only -r "$LOCK")
[ -z "$LOCK_FILES" ] && fail "lock commit ${LOCK:0:7} is empty — it must add the acceptance tests"
BAD=$(printf '%s\n' "$LOCK_FILES" | grep -vE "$TEST_RE" || true)
[ -n "$BAD" ] && fail "lock commit ${LOCK:0:7} touches non-test files: $(echo $BAD)"
printf '%s\n' "$LOCK_FILES" | grep -qE '\.(e2e-)?spec\.|\.test\.' || fail "lock commit ${LOCK:0:7} has no spec/test file"

CONFIGS=$(git ls-tree -r --name-only "$LOCK" | grep -E "$CONFIG_RE" || true)
LOCKED=$(printf '%s\n%s\n' "$LOCK_FILES" "$CONFIGS" | sed '/^$/d' | sort -u)

# --- net change to locked files since the lock
# each locked file must equal its last approved version: the lock, or the latest (e2e-change) commit touching it
CHANGED=$(git diff --name-only "$LOCK" HEAD -- $LOCKED || true)
for F in $CHANGED; do
  REF="$LOCK"
  for C in $(git rev-list "$LOCK..HEAD" -- "$F"); do                       # newest first
    if git log -1 --format=%B "$C" | grep -qE '^Approved-by: .+ \(e2e-change\)$'; then REF="$C"; break; fi
  done
  if [ -n "$(git diff --name-only "$REF" HEAD -- "$F")" ]; then
    fail "$F differs from its last approved version ${REF:0:7} — revert the change, or commit it with the owner's 'Approved-by: <owner> (e2e-change)'"
  fi
  echo "lock: $F matches approved ${REF:0:7} — the auditor reviews the net diff from the lock"
done

# --- focused / skipped tests anywhere the branch touched
TOUCHED=$(git diff --name-only --diff-filter=AM "$BASE" HEAD | grep -E "$TEST_RE" || true)
if [ -n "$TOUCHED" ]; then
  HITS=$(printf '%s\n' "$TOUCHED" | while read -r f; do [ -f "$f" ] && grep -nHE '\b(it|test|describe|context)\.(only|skip)\(|\bx(it|describe)\(|\bf(it|describe)\(' "$f" || true; done)
  [ -n "$HITS" ] && fail "focused/skipped tests on the branch:"$'\n'"$HITS"
fi

echo "lock: pass — $ID locked at ${LOCK:0:7} ($(printf '%s\n' "$LOCKED" | grep -c .) files incl. runner config)"
