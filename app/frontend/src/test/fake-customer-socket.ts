import type { CustomerSocketHandlers } from "../lib/socket/customer-socket";

// Stands in for the guest socket in unit tests: a test fires the handlers itself.
export const fakeCustomerSocket: { handlers: CustomerSocketHandlers | null; connect: (h: CustomerSocketHandlers) => () => void } = {
  handlers: null,
  connect(handlers) {
    fakeCustomerSocket.handlers = handlers;
    handlers.onConnected();
    return () => {
      fakeCustomerSocket.handlers = null;
    };
  },
};
