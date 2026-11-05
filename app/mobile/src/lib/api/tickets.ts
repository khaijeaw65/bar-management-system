import type { TicketList } from '@bar/contracts';
import { mockTickets } from '../../mocks/tickets';

let mockError = false;

export function setMockTicketsError(error: boolean): void {
  mockError = error;
}

export async function getTicketQueue(): Promise<TicketList> {
  const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === '1';

  if (useMocks) {
    const delay = process.env.NODE_ENV === 'test' ? 0 : 300;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (mockError) {
      throw new Error('โหลดออเดอร์ไม่สำเร็จ');
    }
    return mockTickets;
  }

  throw new Error('API not wired — M3');
}
