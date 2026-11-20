import type { Ticket } from '@bar/contracts';
import { nextAction } from '../../../lib/tickets/next-action';

const seat = (kind: 'table' | 'counter') => ({ id: 'e0000001-0000-4000-8000-000000000001', label: 'T1', kind });
const t = (status: Ticket['status'], kind: 'table' | 'counter' = 'table') => ({ status, seat: seat(kind) });

describe('nextAction', () => {
  it('pending → accept, whatever the venue mode', () => {
    expect(nextAction(t('pending'), false)).toBe('accept');
    expect(nextAction(t('pending'), true)).toBe('accept');
  });

  it('AC-2: kitchen off → accepted goes straight to send, never ready', () => {
    expect(nextAction(t('accepted', 'table'), false)).toBe('send');
    expect(nextAction(t('accepted', 'counter'), false)).toBe('send');
  });

  it('AC-3: kitchen on → accepted table = ready, accepted counter = send, ready = send', () => {
    expect(nextAction(t('accepted', 'table'), true)).toBe('ready');
    expect(nextAction(t('accepted', 'counter'), true)).toBe('send');
    expect(nextAction(t('ready', 'table'), true)).toBe('send');
  });

  it('AC-9: issue, sent and cancelled have no action', () => {
    for (const status of ['issue', 'sent', 'cancelled'] as const) {
      expect(nextAction(t(status), false)).toBeNull();
      expect(nextAction(t(status), true)).toBeNull();
    }
  });
});
