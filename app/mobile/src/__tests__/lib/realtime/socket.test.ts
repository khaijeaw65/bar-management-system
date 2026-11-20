import { FakeSocket } from '../../../../test/fakeSocket';
import * as client from '../../../lib/api/client';
import { saveTokens, clearTokens } from '../../../lib/auth/token-storage';
import {
  connectStaffSocket,
  disconnectStaffSocket,
  onSocketStatus,
  staffSocketUrl,
  subscribeStaffEvents,
} from '../../../lib/realtime/socket';

const sockets: FakeSocket[] = [];
jest.mock('socket.io-client', () => ({
  io: jest.fn((url: string, opts: { auth: Record<string, unknown> }) => {
    const { FakeSocket: Fake } = jest.requireActual<typeof import('../../../../test/fakeSocket')>('../../../../test/fakeSocket');
    const s = new Fake(url, opts);
    sockets.push(s);
    return s;
  }),
}));

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

function lastSocket(): FakeSocket {
  const s = sockets[sockets.length - 1];
  if (!s) throw new Error('no socket created');
  return s;
}

describe('staff realtime socket (AC-7, AC-8)', () => {
  beforeEach(async () => {
    sockets.length = 0;
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  });

  afterEach(async () => {
    disconnectStaffSocket();
    await clearTokens();
    jest.restoreAllMocks();
  });

  it('connects once to the /staff namespace at the API origin with the access token', async () => {
    await connectStaffSocket();
    await connectStaffSocket();
    expect(sockets).toHaveLength(1);
    expect(staffSocketUrl()).toBe('http://localhost:3011/staff');
    expect(lastSocket().url).toBe('http://localhost:3011/staff');
    expect(lastSocket().auth).toEqual({ token: 'access-1' });
  });

  it('does not connect when signed out', async () => {
    await clearTokens();
    await connectStaffSocket();
    expect(sockets).toHaveLength(0);
  });

  it('forwards order.created and ticket.status_changed to subscribers', async () => {
    const handlers = { onOrderCreated: jest.fn(), onTicketStatusChanged: jest.fn(), onReconnect: jest.fn() };
    const off = subscribeStaffEvents(handlers);
    await connectStaffSocket();
    lastSocket().fire('order.created', { id: 'o1' });
    lastSocket().fire('ticket.status_changed', { ticketId: 't1' });
    expect(handlers.onOrderCreated).toHaveBeenCalledWith({ id: 'o1' });
    expect(handlers.onTicketStatusChanged).toHaveBeenCalledWith({ ticketId: 't1' });
    off();
  });

  it('reports status and calls onReconnect only for a connect that follows a drop', async () => {
    const statuses: boolean[] = [];
    const offStatus = onSocketStatus((c) => statuses.push(c));
    const handlers = { onOrderCreated: jest.fn(), onTicketStatusChanged: jest.fn(), onReconnect: jest.fn() };
    const off = subscribeStaffEvents(handlers);
    await connectStaffSocket();
    lastSocket().fire('connect');
    expect(handlers.onReconnect).not.toHaveBeenCalled();
    lastSocket().fire('disconnect', 'transport close');
    lastSocket().fire('connect');
    expect(handlers.onReconnect).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual([true, false, true]);
    off();
    offStatus();
  });

  it('AC-8: connect_error "unauthorized" refreshes exactly once and reconnects with the new token', async () => {
    const refresh = jest.spyOn(client, 'refreshAccessToken').mockResolvedValue('access-2');
    await connectStaffSocket();
    const live = lastSocket();

    live.fire('connect_error', new Error('unauthorized'));
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(live.auth).toEqual({ token: 'access-2' });
    expect(live.connect).toHaveBeenCalledTimes(1);

    live.fire('connect_error', new Error('unauthorized'));
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(live.connect).toHaveBeenCalledTimes(1);
  });

  it('a failed refresh does not reconnect', async () => {
    jest.spyOn(client, 'refreshAccessToken').mockRejectedValue(new client.ApiError(401, 'UNAUTHORIZED', 'x'));
    await connectStaffSocket();
    lastSocket().fire('connect_error', new Error('unauthorized'));
    await flush();
    expect(lastSocket().connect).not.toHaveBeenCalled();
  });

  it('logout disconnects and a later connect builds a fresh socket', async () => {
    await connectStaffSocket();
    const first = lastSocket();
    disconnectStaffSocket();
    expect(first.disconnect).toHaveBeenCalled();
    await connectStaffSocket();
    expect(sockets).toHaveLength(2);
  });
});
