# Payment Gateway Comparison — Bar Management System

> เอกสารนี้สรุปเหตุผลในการเลือก GB Prime Pay สำหรับโปรเจกต์  
> วันที่อัปเดต: ก.ย. 2569

---

## ภาพรวม

ระบบต้องรองรับการชำระเงินผ่าน PromptPay QR ซึ่งเป็น payment method หลักในบาร์ไทยขนาดเล็ก-กลาง และต้องการ webhook ที่เชื่อถือได้เพื่อแก้ปัญหา fake slip

---

## เปรียบเทียบ 3 ตัวเลือก

| เกณฑ์ | GB Prime Pay ✅ | Omise (Opn Payments) | SCB Easy Pay / KBank |
|---|---|---|---|
| **PromptPay QR** | รองรับ native | รองรับ | รองรับ (ผ่าน bank API) |
| **Webhook reliability** | ดีมาก (เป็น core feature) | ดี | ขึ้นอยู่กับธนาคาร |
| **ความซับซ้อน integration** | ต่ำ — เหมาะ SME | กลาง-สูง | สูงมาก (KYC + MOU กับธนาคาร) |
| **เวลา onboarding** | 3–5 วัน | 1–2 สัปดาห์ | 2–4 สัปดาห์ + เอกสารมาก |
| **เอกสาร/SDK ภาษาไทย** | ✅ ครบถ้วน | อังกฤษเป็นหลัก | ขึ้นอยู่กับธนาคาร |
| **ค่าธรรมเนียม** | ~2.5% + 10 THB | ~2.65% | ต้องต่อรองกับธนาคาร |
| **Sandbox / test env** | มี | มี | จำกัด |
| **รองรับ business ขนาดเล็ก** | ✅ ใช่ | บางส่วน | ❌ มักต้องมี registered business |
| **Community / Stack Overflow** | พอมี (Thai dev) | ดี (regional) | น้อย |
| **Idempotency support** | `gateway_tx_id` unique | `idempotency_key` header | ขึ้นอยู่กับ implementation |

---

## ทำไมถึงเลือก GB Prime Pay

### 1. PromptPay-first design
GB Prime Pay ถูกสร้างมาเพื่อตลาดไทยโดยตรง — PromptPay QR ไม่ใช่ feature ที่ต่อเพิ่มทีหลัง แต่เป็น core product ทำให้ API, webhook, และ error handling ออกแบบมาสำหรับ use case นี้โดยเฉพาะ

### 2. Webhook-first แก้ปัญหา fake slip
- ลูกค้าสแกน QR จากระบบ → โอนจริง → GB Prime Pay ส่ง `PAYMENT_SUCCESS` webhook ทันที
- Order status อัปเดตผ่าน webhook เท่านั้น — staff ไม่มีปุ่ม "mark as paid" เอง
- ทำให้ไม่มีช่องให้ส่งสลิปปลอม

```
[Customer scans QR] → [PromptPay transfer] → [GB Prime Pay webhook]
       → [NestJS /webhook/payment] → [idempotency check] → [Order: PAID]
```

### 3. Integration ง่ายสำหรับทีมขนาดเล็ก
- REST API ตรงไปตรงมา — ไม่ต้อง learn proprietary SDK
- เอกสารภาษาไทย + ตัวอย่าง NestJS/Node.js มีใน community
- Sandbox พร้อมใช้ทันที

### 4. Barrier to entry ต่ำ
- สมัครได้โดยไม่ต้องมี registered company ขนาดใหญ่
- เหมาะกับ proof-of-concept และ scale ได้ถ้าธุรกิจโต

---

## ทำไมไม่เลือก Omise

- Feature ครบกว่า (card, promptpay, truemoney, etc.) แต่ complexity สูงกว่า
- ราคาใกล้กัน แต่ onboarding นานกว่า
- ถ้า scope ขยายในอนาคต (เช่น รับ credit card) → migrate ได้ไม่ยาก

## ทำไมไม่เลือก Bank API โดยตรง

- ต้องเซ็น MOU กับธนาคาร + KYC ระดับ corporate
- Integration ซับซ้อน, latency webhook สูงกว่า
- ไม่เหมาะสำหรับ rapid development ในบริบท senior project + small bar

---

## Security Implementation

```typescript
// webhook handler — idempotency + pessimistic lock
@Post('/webhook/payment')
async handlePayment(@Body() dto: GBPrimeWebhookDto) {
  // 1. Verify HMAC signature from GB Prime Pay
  this.verifySignature(dto, process.env.GB_SECRET_KEY);

  // 2. Idempotency check via DB constraint
  //    UNIQUE(gateway_tx_id) — ถ้า duplicate → return 200 early
  const existing = await this.paymentRepo.findOne({ gateway_tx_id: dto.txnRefNo });
  if (existing) return { status: 'already_processed' };

  // 3. Pessimistic lock on order
  await this.em.transactional(async (em) => {
    const order = await em.findOne(Order, { id: dto.referenceNo }, { lockMode: LockMode.PESSIMISTIC_WRITE });
    order.status = 'PAID';
    await em.persist(order);
    await em.persist(new Payment({ ...dto, order }));
  });
}
```

---

## สรุป

> ใช้ **GB Prime Pay** เพราะ: PromptPay native + webhook-first + integration ง่าย + เหมาะกับ scale ของโปรเจกต์นี้  
> ถ้าในอนาคตต้องการ card payment หรือ international currency → migrate ไป Omise ได้ไม่ยาก
