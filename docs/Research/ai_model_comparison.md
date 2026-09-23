# AI Model Comparison — Bar Management System

> เหตุผลในการเลือก OpenAI gpt-4o-mini สำหรับ Guest Intelligence feature  
> วันที่อัปเดต: ก.ย. 2569

---

## Use Case ที่ต้องการ

ระบบต้องการ AI สำหรับ **Guest Intelligence** — สรุป drink preference ของลูกค้าจาก order history เป็น JSON  
โดยต้องเป็น **preference summary เท่านั้น** (PDPA-safe: ไม่วิเคราะห์พฤติกรรม ไม่วิเคราะห์ personality)

Input: order history ของลูกค้า (list of drinks ordered)  
Output: `{ "summary": string, "top_drinks": string[], "avoid": string[] }`

**ข้อกำหนดหลัก:**
- JSON output ที่เชื่อถือได้ (ไม่มี hallucinated structure)
- Cost ต่ำ — เรียกใช้ per-customer, บ่อยในช่วง peak hour
- SDK ที่ใช้งานง่าย (Node.js / TypeScript)
- Thai language support

---

## เปรียบเทียบ 3 ตัวเลือก

| เกณฑ์ | OpenAI gpt-4o-mini ✅ | Google Gemini 1.5 Flash | Anthropic Claude 3 Haiku |
|---|---|---|---|
| **JSON reliability** | ⭐⭐⭐ (response_format: json_object) | ⭐⭐ (มี JSON mode แต่ inconsistent กว่า) | ⭐⭐⭐ (tool use / json mode ดี) |
| **ราคา (input/output per 1M tokens)** | $0.15 / $0.60 | $0.075 / $0.30 | $0.25 / $1.25 |
| **Thai language quality** | ดีมาก | ดีมาก (multilingual strong) | ดี |
| **Node.js SDK maturity** | ⭐⭐⭐ (openai v4 — industry standard) | ⭐⭐ (google-generativeai — ยังเปลี่ยนบ่อย) | ⭐⭐ (anthropic SDK ดีแต่ smaller community) |
| **Documentation / community** | ⭐⭐⭐ (มาก, Stack Overflow เยอะ) | ⭐⭐ (กำลังโต) | ⭐⭐ (ดีแต่น้อยกว่า OpenAI) |
| **Context window** | 128k tokens | 1M tokens | 200k tokens |
| **Function calling / Tools** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Rate limits (free tier)** | จำกัด แต่ predictable | ค่อนข้างใจกว้าง | จำกัด |
| **Streaming support** | ✅ | ✅ | ✅ |
| **Latency (avg)** | ~800ms | ~600ms | ~900ms |

---

## ทำไมถึงเลือก OpenAI gpt-4o-mini

### 1. JSON reliability สูงสุด

`response_format: { type: "json_object" }` บน OpenAI รับประกันว่า output จะเป็น valid JSON เสมอ  
ไม่ต้องทำ retry logic หรือ regex parsing เพิ่มเติม — ลดความซับซ้อนของ production code

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  response_format: { type: 'json_object' },  // ← hard guarantee
  messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: orderHistory }],
  max_tokens: 300,
});
const result: GuestSummary = JSON.parse(response.choices[0].message.content!);
```

### 2. SDK ที่ stable และ mature ที่สุด

openai npm package เป็น de facto standard — TypeScript types ครบ, error handling ชัดเจน, community ใหญ่  
ลดเวลา debug และ onboarding สำหรับทีมที่ต้องการ velocity

### 3. Cost vs Quality trade-off ที่ดีที่สุดสำหรับ use case นี้

- **Gemini Flash ถูกกว่า** แต่ JSON mode ยัง inconsistent กว่าในช่วงที่ตัดสินใจ และ SDK เปลี่ยน breaking change บ่อย
- **Claude Haiku มีคุณภาพดี** แต่แพงกว่า gpt-4o-mini ~2x และ community เล็กกว่ามาก
- **gpt-4o-mini** = จุด sweet spot ระหว่าง cost, reliability, และ ecosystem

### 4. Predictable behavior สำหรับ PDPA compliance

System prompt ชัดเจน + JSON schema บังคับ = output ที่ predictable  
ลด risk ที่ model จะ "extrapolate" ข้อมูลที่ไม่ควรเก็บ

---

## System Prompt ที่ใช้

```
You are a bar assistant summarizing guest drink preferences.
Given the guest order history below, produce a JSON object with:
  { "summary": string, "top_drinks": string[], "avoid": string[] }

Focus ONLY on drink preferences (what they order, what they seem to avoid).
Do NOT analyze behavior, frequency, spending patterns, or make personality judgments.
Do NOT make assumptions beyond the order data provided.
```

---

## เมื่อไหร่ที่ควร Migrate

| สถานการณ์ | Action |
|---|---|
| ต้องการ context window ใหญ่กว่า 128k (เช่น order history หลายปี) | → migrate ไป Gemini 1.5 Pro |
| ต้องการ reasoning ที่ซับซ้อนขึ้น (เช่น menu recommendation) | → upgrade ไป gpt-4o หรือ Claude 3.5 Sonnet |
| cost กลายเป็น bottleneck หลัง scale | → evaluate Gemini Flash อีกครั้ง หรือ self-host Llama |
| ต้องการ multimodal (เช่น analyze รูปภาพ menu) | → gpt-4o หรือ Gemini Pro Vision |

---

## สรุป

> ใช้ **OpenAI gpt-4o-mini** เพราะ: JSON reliability สูงสุด + SDK mature สุด + cost/quality sweet spot  
> ไม่ใช้ Gemini เพราะ SDK unstable ในช่วงนี้  
> ไม่ใช้ Claude เพราะแพงกว่าสำหรับ use case ที่ไม่ต้องการ reasoning ซับซ้อน
