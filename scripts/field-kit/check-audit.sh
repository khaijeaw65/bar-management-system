#!/usr/bin/env bash
# field-kit: audit-independence check (CI job `lock`; also runnable locally and by pr-review).
# docs/rules/workflow.md §6 · AGENTS.md hard rule 2: nobody audits work they implemented or fixed.
#   - runs only when the branch carries docs/audits/BRIEF-###.md (i.e. at H, after the audit landed);
#   - every tool that implemented or fixed the brief is read from the handoff:
#       `| **Implementer** | <id> (<tool>) ...`  and each fix round's  `- Implementer: <id> (<tool>)`;
#   - every tool that audited is read from the report:
#       `| **Auditor** | <tool> (...)`  and each re-audit's  `Auditor: <tool>`;
#   - a tool on both lists passes only when every auditor line naming it says `subagent` or `fresh session`
#     (a clean context of the same tool — the kit's rule when only the builder tool is available); otherwise FAIL.
#   - A missing (or still-placeholder) tool line → FAIL (the evidence is the point).
# Names are compared case-, space- and hyphen-insensitively ("Claude Code" = "claude-code").
set -euo pipefail

BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"
ID=$(printf '%s' "$BRANCH" | grep -oE 'BRIEF-[0-9]+' | head -n1 || true)
[ -z "$ID" ] && { echo "audit-check: skip ($BRANCH)"; exit 0; }
AUDIT="docs/audits/$ID.md"; HANDOFF="docs/handoffs/$ID.md"
[ -f "$AUDIT" ] || { echo "audit-check: skip — no $AUDIT yet"; exit 0; }
fail() { echo "audit-check: FAIL — $*"; exit 1; }
[ -f "$HANDOFF" ] || fail "$AUDIT exists but $HANDOFF does not"

# template placeholders (<tool>, e.g. the fix-round example inside the handoff's HTML comment) are ignored
norm() { grep -v '<' | tr '[:upper:]' '[:lower:]' | tr -d ' _-' | sed '/^$/d' | sort -u || true; }

BUILDERS=$( {
  grep -E '^\| \*\*Implementer\*\* \|' "$HANDOFF" | sed -E 's/^\| \*\*Implementer\*\* \|[^(]*\(([^)]*)\).*/\1/' || true
  grep -E '^- Implementer: ' "$HANDOFF" | sed -E 's/^- Implementer: [^(]*\(([^)]*)\).*/\1/' || true
} | norm )
AUDITORS=$( {
  grep -E '^\| \*\*Auditor\*\* \|' "$AUDIT" | sed -E 's/^\| \*\*Auditor\*\* \| *([^(·|]*).*/\1/' || true
  grep -E '^Auditor: ' "$AUDIT" | sed -E 's/^Auditor: *([^(·|]*).*/\1/' || true
} | norm )

[ -z "$BUILDERS" ] && fail "$HANDOFF has no 'Implementer … (<tool>)' line"
[ -z "$AUDITORS" ] && fail "$AUDIT has no 'Auditor | <tool>' line"

BOTH=$(comm -12 <(printf '%s\n' "$BUILDERS") <(printf '%s\n' "$AUDITORS"))
for T in $BOTH; do
  # every auditor line for this tool must declare a clean context
  LINES=$( { grep -E '^\| \*\*Auditor\*\* \|' "$AUDIT"; grep -E '^Auditor: ' "$AUDIT"; } || true )
  while IFS= read -r L; do
    [ -z "$L" ] && continue
    NAME=$(printf '%s' "$L" | sed -E 's/^(\| \*\*Auditor\*\* \||Auditor:) *([^(·|]*).*/\2/' | norm)
    [ "$NAME" = "$T" ] || continue
    [ "$(printf '%s' "$L" | grep -oiE 'subagent|fresh session' | tr '[:upper:]' '[:lower:]' | sort -u | wc -l)" -eq 1 ] \
      || fail "$T built and audited $ID without naming exactly one clean context — audit in another tool, or in a subagent OR a fresh session of $T and say which on the Auditor line"
  done <<< "$LINES"
  echo "audit-check: NOTE — $T built and audited $ID in a clean context (subagent / fresh session)"
done

echo "audit-check: pass — built by [$(echo $BUILDERS)], audited by [$(echo $AUDITORS)]"
