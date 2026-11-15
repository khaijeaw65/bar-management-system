# Invariants — index

> Rules the whole project must never break. **Read when planning, or when a diff touches anything in *Touches*.** This file holds only names and links — the rule, its *why* and *Source* live in the owning feature's `requirements.md` (*Invariants*); how it is enforced lives in that feature's `design.md`.
> A diff that touches anything in *Touches* → open the owner spec first. No enforcing test or DB constraint = not an invariant.

| ID | Name | Owner spec | Touches (tables / fields / modules) |
|---|---|---|---|
| INV-01 | Order line price and names never change after placement | [ordering](ordering/requirements.md) I-1 | `order_item` snapshots · menu price / name edits |
| INV-02 | A retried send never creates a second order | [ordering](ordering/requirements.md) I-2 | `POST /visits/:visitId/orders` · `common/idempotency/` |
| INV-03 | Order number unique per business day; one ticket per station per order | [ordering](ordering/requirements.md) I-3 | `order_record`, `order_ticket` |
| INV-04 | A void / comp always records kind, reason and approver (or flagged self-approval) | [ordering](ordering/requirements.md) I-4 | `order_item.cancel_*`, `approved_by` · `order-adjustment.service.ts` |
| INV-05 | A gateway transaction is applied once | [payments](payments/requirements.md) I-1 | `payment.gateway_tx_id` · payment webhooks |
| INV-06 | A transfer slip confirms only one payment | [payments](payments/requirements.md) I-2 | `payment.slip_trans_ref` · `verify-slip` |
| INV-07 | No void / comp while a payment on the bill is pending | [payments](payments/requirements.md) I-3 | `payment-guard.ts` · `order-adjustment.service.ts` |
| INV-08 | A seat has at most one live visit | [tables-visits](tables-visits/requirements.md) I-1 | `visit` · `POST /visits` · guest order open |
| INV-09 | Active seat labels are unique | [tables-visits](tables-visits/requirements.md) I-2 | `table_seat.label` |
| INV-10 | Menu category names are unique | [menu](menu/requirements.md) I-1 | `menu_category.name` |
| INV-11 | A guest session token is stored only as a hash | [guest-qr](guest-qr/requirements.md) I-1 | `guest_session.token_hash` |
| INV-12 | The audit log is append-only | [staff-access](staff-access/requirements.md) I-1 | `audit_log` · `common/audit/` · `AuditSubscriber` |
| INV-13 | Permission checks happen only in `PermissionsGuard` | [staff-access](staff-access/requirements.md) I-2 | every staff controller |

Planned features list their invariants in their own `requirements.md`; each gets a row here once its `design.md` names the enforcing test or constraint and it ships.
