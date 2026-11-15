# DEF-04 — Customer Screen Does Not Update When Staff Acknowledges Call

| | |
|---|---|
| **Status** | Fixed (merged) |
| **Fixed by** | BRIEF-071 (PR #123) |
| **Surface** | Customer Web (`app/frontend/src/app/customer`) · **Severity** High (Feedback Loop) |
| **Found** | 2026-11-01 · hands-on test for demo |
| **Should have been caught at** | — not assessed (logged before workflow Rev 24; fill when the defect is next touched) |

---

## 1. Summary
When staff acknowledges a customer call by tapping "รับทราบ" on the POS, the customer mobile screen remains in the *"กำลังเรียกพนักงาน..."* state and does not provide feedback that someone is coming.

## 2. Current Behavior
- Staff taps "รับทราบ" on POS.
- Backend records acknowledgment, but customer screen shows no visible confirmation.

## 3. Expected Behavior
- Real-time WebSocket event received on the customer session should immediately transition the status banner to:  
  🟢 **"พนักงานรับทราบแล้ว กำลังมาที่โต๊ะของคุณ"**
- Auto-dismiss after 6–8 seconds or provide a clear close button.

## 4. Suggested Fix
- Ensure customer WebSocket listener handles the call acknowledgment payload and updates local customer state/banner.
