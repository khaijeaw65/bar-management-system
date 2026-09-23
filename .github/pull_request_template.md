## Brief
<!-- One brief per PR. Title format: "<ID>: <title>" -->
- Brief: `docs/briefs/<ID>-<slug>.md` (Rev <n>)
- Handoff: `docs/handoffs/<ID>.md`
- Audit: `docs/audits/<ID>.md` · audited commit `<sha>` (implementer/Field adds the link once Cowork writes it)

## Deviations from brief
- [ ] None
- [ ] Yes — every one has an **Approved** DR: DR-___

## Gates
- [ ] G1 — lint + typecheck + unit tests pass locally (missing scripts reported as BLOCKED in handoff)
- [ ] G2 — CI green (once CI exists; until then G1 output is in the handoff)
- [ ] Every AC is mapped to a test, or to manual evidence allowed by the brief (see handoff table)
- [ ] `docs/state/<person>.md` updated

## Dependencies
- [ ] No `package.json` changes
- [ ] `package.json` changed — approved by: ☐ brief Pre-decided item `<name@range>` ☐ DR-___

## AI usage
<!-- Low · Medium · High — one line: tool + what for -->
