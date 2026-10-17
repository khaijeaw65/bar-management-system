import { DomainException } from '../../../common/domain-exception.js';
import { nextTicketStatus, readyStepApplies } from './ticket-transition.js';

describe('ticket transitions', () => {
  it('allows READY only for a table when the kitchen screen is on', () => {
    expect(readyStepApplies(true, 'table')).toBe(true);
    expect(readyStepApplies(true, 'counter')).toBe(false);
    expect(readyStepApplies(false, 'table')).toBe(false);
  });

  it('accepts pending, then ready only when that step applies', () => {
    expect(nextTicketStatus('accept', 'pending', true)).toBe('accepted');
    expect(nextTicketStatus('ready', 'accepted', true)).toBe('ready');
    expect(nextTicketStatus('send', 'ready', true)).toBe('sent');
    expect(() => nextTicketStatus('ready', 'accepted', false)).toThrow(DomainException);
  });

  it('sends from accepted when READY is skipped, and refuses it when READY applies', () => {
    expect(nextTicketStatus('send', 'accepted', false)).toBe('sent');
    expect(() => nextTicketStatus('send', 'accepted', true)).toThrow(DomainException);
    expect(() => nextTicketStatus('accept', 'accepted', false)).toThrow(DomainException);
  });
});
