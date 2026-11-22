#!/usr/bin/env bash
# field-kit: vague-wording check for a Draft brief (run by the planner before Ready; workflow §3.2).
# A brief is read by an executor who cannot ask back: a hedge word leaves a decision open.
# Usage: bash scripts/field-kit/check-brief.sh docs/briefs/BRIEF-###-<slug>.md
# Exit 1 with the lines to fix. A real need for the word → rewrite it as an exact rule or a Builder's choice with a bound.
set -euo pipefail
F="${1:?usage: check-brief.sh <brief.md>}"
[ -f "$F" ] || { echo "brief: no such file $F"; exit 2; }
EN='\b(maybe|perhaps|probably|possibly|might|should probably|if needed|if necessary|as needed|as appropriate|where appropriate|etc\.?|and so on|TBD|TBC|TODO|to be decided|some kind of|something like|roughly|approximately|or similar|e\.g\. any)\b'
TH='(อาจจะ|น่าจะ|ประมาณ|ตามความเหมาะสม|ถ้าจำเป็น|หรืออะไรก็ได้|อะไรทำนองนี้|ไว้ค่อยคิด|ยังไม่แน่ใจ)'
# skip HTML comments and the Changelog table
HITS=$(sed -e '/<!--/,/-->/d' -e '/^## Changelog/,$d' "$F" | grep -nEi "$EN|$TH" || true)
if [ -n "$HITS" ]; then
  echo "brief: vague wording in $F — make each an exact rule, a Pre-decided item or a bounded Builder's choice:"
  printf '%s\n' "$HITS"
  exit 1
fi
echo "brief: pass — no vague wording in $F"
