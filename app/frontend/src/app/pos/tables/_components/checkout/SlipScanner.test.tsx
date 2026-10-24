import type { Payment } from "@bar/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { PaymentResult } from "./PaymentResult";
import { SlipScanner } from "./SlipScanner";
import { SLIP_COPY } from "./slip-copy";

const wasmUrls: string[] = [];
const stops: Array<ReturnType<typeof vi.fn>> = [];
const detected = { codes: [] as Array<{ rawValue: string }>, fail: false };

vi.mock("barcode-detector/ponyfill", () => ({
  prepareZXingModule: async (options: { overrides: { locateFile: (path: string, prefix: string) => string } }) => {
    wasmUrls.push(options.overrides.locateFile("zxing_reader.wasm", "https://cdn.jsdelivr.net/npm/"));
  },
  BarcodeDetector: class {
    detect() {
      return detected.fail ? Promise.reject(new Error("decode")) : Promise.resolve(detected.codes);
    }
  },
}));

vi.mock("./resize-slip-image", () => ({
  resizeSlipImage: vi.fn(async () => "SU1BR0U="),
}));

const paymentId = "70000000-0000-4000-8000-0000000000b1";

function payment(extra: Partial<Payment> = {}): Payment {
  return {
    id: paymentId,
    attemptId: "71000000-0000-4000-8000-0000000000b1",
    visitId: "20000000-0000-4000-8000-0000000000b1",
    partNo: 1,
    partCount: 1,
    amount: "1305.00",
    method: "promptpay",
    status: "pending",
    confirmedVia: null,
    slipTransRef: null,
    slipAmount: null,
    statusReason: null,
    statusNote: null,
    qrPayload: "payload",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    paidAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

function reply(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json(apiEnvelope(data, status, code, message), { status });
}

function allowCamera() {
  const stop = vi.fn();
  stops.push(stop);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })) },
  });
  HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve());
}

function denyCamera() {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => Promise.reject(new Error("denied"))) },
  });
}

function renderScanner(onManual = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const verified: Payment[] = [];
  render(
    <SlipScanner
      payment={payment()}
      onVerified={(next) => {
        verified.push(next);
        render(<PaymentResult payment={next} onSummary={() => undefined} />, { wrapper: Wrap });
      }}
      onManual={onManual}
    />,
    { wrapper: Wrap },
  );
  return { onManual, verified };
}

test("a failed decode keeps the photo buttons and says the scan did not work", async () => {
  detected.codes = [];
  detected.fail = true;
  allowCamera();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SlipScanner payment={payment()} onVerified={() => undefined} onManual={() => undefined} />
    </QueryClientProvider>,
  );
  expect(await screen.findByText("สแกนไม่ได้ — ถ่ายรูปหรือเลือกรูปแทน")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ถ่ายรูปแทน" })).toBeEnabled();
  expect(screen.getByLabelText("เลือกรูป")).toBeInTheDocument();
  detected.fail = false;
});

test("a decoded QR is sent once, the camera stops, and the wasm url stays on our origin", async () => {
  detected.fail = false;
  detected.codes = [{ rawValue: "QR-1" }];
  allowCamera();
  const bodies: unknown[] = [];
  server.use(
    http.post("*/api/payments/:id/verify-slip", async ({ request }) => {
      bodies.push(await request.json());
      return reply(payment({
        status: "completed",
        confirmedVia: "slip_verify",
        slipTransRef: "REF-1",
        slipAmount: "1400.00",
        paidAt: new Date().toISOString(),
      }));
    }),
  );
  renderScanner();
  await waitFor(() => expect(bodies).toEqual([{ payload: "QR-1" }]));
  expect(stops.at(-1)).toHaveBeenCalled();
  expect(wasmUrls.at(-1)).toBe("/zxing/zxing_reader.wasm");
  expect(wasmUrls.at(-1)).not.toContain("jsdelivr");
  expect(await screen.findByText("ยืนยันสลิปแล้ว")).toBeInTheDocument();
  expect(screen.getByText("REF-1")).toBeInTheDocument();
  expect(screen.getByText(/โอนเกิน/)).toBeInTheDocument();
});

test("photo buttons send a resized image, and a denied camera hides the live view", async () => {
  const user = userEvent.setup();
  detected.codes = [];
  allowCamera();
  const bodies: unknown[] = [];
  server.use(
    http.post("*/api/payments/:id/verify-slip", async ({ request }) => {
      bodies.push(await request.json());
      return reply(payment({ status: "completed", confirmedVia: "slip_verify", slipAmount: "1305.00", slipTransRef: "REF-2" }));
    }),
  );
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { configurable: true, get: () => 640 });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { configurable: true, get: () => 480 });
  const { unmount } = render(
    <QueryClientProvider client={new QueryClient()}>
      <SlipScanner payment={payment()} onVerified={() => undefined} onManual={() => undefined} />
    </QueryClientProvider>,
  );
  const shoot = await screen.findByRole("button", { name: "ถ่ายรูปแทน" });
  await waitFor(() => expect(shoot).toBeEnabled());
  await user.click(shoot);
  await waitFor(() => expect(bodies).toContainEqual({ image: "SU1BR0U=" }));
  unmount();

  bodies.length = 0;
  denyCamera();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SlipScanner payment={payment()} onVerified={() => undefined} onManual={() => undefined} />
    </QueryClientProvider>,
  );
  expect(await screen.findByText("ใช้กล้องไม่ได้ — ถ่ายรูปหรือเลือกรูปแทน")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ถ่ายรูปแทน" })).toBeDisabled();
  const input = screen.getByLabelText("เลือกรูป");
  expect(input).not.toHaveAttribute("capture");
  await user.upload(input, new File(["slip"], "slip.jpg", { type: "image/jpeg" }));
  await waitFor(() => expect(bodies).toEqual([{ image: "SU1BR0U=" }]));
});

test("each slip error offers a rescan and manual confirm", async () => {
  const user = userEvent.setup();
  detected.codes = [];
  denyCamera();
  const onManual = vi.fn();
  renderScanner(onManual);
  expect(await screen.findByLabelText("เลือกรูป")).toBeInTheDocument();
  for (const [code, copy] of Object.entries(SLIP_COPY)) {
    const status = code === "SLIP_PENDING" || code === "SLIP_ALREADY_USED" ? 409 : code === "SLIP_SERVICE_UNAVAILABLE" ? 503 : code === "VALIDATION_ERROR" ? 400 : 422;
    server.use(http.post("*/api/payments/:id/verify-slip", () => reply(null, status, code, copy)));
    const input = screen.getByLabelText("เลือกรูป");
    await user.upload(input, new File(["slip"], "slip.jpg", { type: "image/jpeg" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy);
    expect(screen.getByRole("button", { name: "สแกนใหม่" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ยืนยันด้วยตนเอง" }));
    await user.click(screen.getByRole("button", { name: "สแกนใหม่" }));
    expect(await screen.findByLabelText("เลือกรูป")).toBeInTheDocument();
  }
  expect(onManual).toHaveBeenCalledTimes(Object.keys(SLIP_COPY).length);
});
