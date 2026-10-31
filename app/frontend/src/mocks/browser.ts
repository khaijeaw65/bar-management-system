import { setupWorker } from "msw/browser";
import { customerMockControls } from "./customer";
import { handlers, posMockControls } from "./handlers";
import { staffMockControls } from "./staff";

export const worker = setupWorker(...handlers);

// ponytail: e2e-only handle on the in-page mock (see mocks/customer.ts).
(window as unknown as { __customerMock?: typeof customerMockControls }).__customerMock = customerMockControls;
(window as unknown as { __posMock?: typeof posMockControls }).__posMock = posMockControls;
(window as unknown as { __staffMock?: typeof staffMockControls }).__staffMock = staffMockControls;
