import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { server } from "@/mocks/node";
import { renderCustomer } from "../_lib/test-render";
import { CallStaffButton } from "./CallStaffButton";

test("AC-5: เช็คบิล posts the reason, then locks the button", async () => {
  const bodies: unknown[] = [];
  server.use(
    http.post("*/api/customer/call-staff", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ status: 201, code: "", message: "success", data: { calledAt: new Date().toISOString() } }, { status: 201 });
    }),
  );
  const user = userEvent.setup();
  renderCustomer(<CallStaffButton />);
  await user.click(screen.getByRole("button", { name: "เรียกพนักงาน" }));
  await user.click(await screen.findByRole("button", { name: "เช็คบิล" }));
  await user.click(screen.getByRole("button", { name: "ส่ง" }));
  expect(await screen.findByText(/แจ้งพนักงานแล้ว/)).toBeInTheDocument();
  expect(bodies).toEqual([{ reason: "bill" }]);
  const locked = screen.getByRole("button", { name: /รอ \d+ วินาที/ });
  expect(locked).toBeDisabled();
});

test("AC-5: a 429 shows the server message in the locked state", async () => {
  server.use(
    http.post("*/api/customer/call-staff", () =>
      HttpResponse.json({ status: 429, code: "RATE_LIMITED", message: "เรียกบ่อยเกินไป", data: null }, { status: 429 }),
    ),
  );
  const user = userEvent.setup();
  renderCustomer(<CallStaffButton />);
  await user.click(screen.getByRole("button", { name: "เรียกพนักงาน" }));
  await user.click(await screen.findByRole("button", { name: "ส่ง" }));
  await waitFor(() => expect(screen.getByText(/เรียกบ่อยเกินไป/)).toBeInTheDocument());
  expect(screen.getByRole("button", { name: /รอ \d+ วินาที/ })).toBeDisabled();
});

test("a network failure shows an error and stays retryable", async () => {
  server.use(http.post("*/api/customer/call-staff", () => HttpResponse.error()));
  const user = userEvent.setup();
  renderCustomer(<CallStaffButton />);
  await user.click(screen.getByRole("button", { name: "เรียกพนักงาน" }));
  await user.click(await screen.findByRole("button", { name: "ส่ง" }));
  expect(await screen.findByText("แจ้งไม่สำเร็จ ลองอีกครั้ง")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ส่ง" })).toBeEnabled();
});
