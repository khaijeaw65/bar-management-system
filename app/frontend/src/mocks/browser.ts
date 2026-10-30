import { setupWorker } from "msw/browser";
import { customerMockControls } from "./customer";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// ponytail: e2e-only handle on the in-page mock (see mocks/customer.ts).
(window as unknown as { __customerMock?: typeof customerMockControls }).__customerMock = customerMockControls;
