import { DomainException } from '../../../common/domain-exception.js';
import { issueStatus } from './ticket-transition.js';

describe('issue transitions', () => {
  it('flags pending, accepted, and ready', () => {
    expect(issueStatus('flag', 'pending', false)).toBe('issue');
    expect(issueStatus('flag', 'accepted', false)).toBe('issue');
    expect(issueStatus('flag', 'ready', false)).toBe('issue');
  });

  it('refuses a flag from sent, cancelled, or issue', () => {
    expect(() => issueStatus('flag', 'sent', false)).toThrow(DomainException);
    expect(() => issueStatus('flag', 'cancelled', false)).toThrow(DomainException);
    expect(() => issueStatus('flag', 'issue', false)).toThrow(DomainException);
  });

  it('substitutes back to accepted and escalates only once', () => {
    expect(issueStatus('substitute', 'issue', false)).toBe('accepted');
    expect(issueStatus('substitute', 'issue', true)).toBe('accepted');
    expect(issueStatus('escalate', 'issue', false)).toBe('issue');
    expect(() => issueStatus('escalate', 'issue', true)).toThrow('ใบงานนี้ส่งให้ POS แล้ว');
    expect(() => issueStatus('substitute', 'accepted', false)).toThrow(DomainException);
  });
});
