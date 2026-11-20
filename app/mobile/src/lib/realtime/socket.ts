import { io, type Socket } from 'socket.io-client';
import { ORDER_CREATED, TICKET_STATUS_CHANGED } from '@bar/contracts';
import { getApiBaseUrl, refreshAccessToken } from '../api/client';
import { readTokens } from '../auth/token-storage';

type StatusListener = (connected: boolean) => void;

export interface StaffEventHandlers {
  onOrderCreated: (payload: unknown) => void;
  onTicketStatusChanged: (payload: unknown) => void;
  /** A connect that follows a drop — the cache may have missed events. */
  onReconnect: () => void;
}

let socket: Socket | null = null;
let authRetried = false;
let everConnected = false;
const statusListeners = new Set<StatusListener>();
const handlerSets = new Set<StaffEventHandlers>();

/** The staff namespace lives at the API origin, not under `/api` (gateway namespace `/staff`). */
export function staffSocketUrl(): string {
  const origin = /^https?:\/\/[^/]+/.exec(getApiBaseUrl())?.[0];
  if (!origin) {
    throw new Error('EXPO_PUBLIC_API_URL must be an absolute http(s) URL for the realtime socket');
  }
  return `${origin}/staff`;
}

function emitStatus(connected: boolean): void {
  statusListeners.forEach((listener) => listener(connected));
}

/** connect_error "unauthorized": refresh once through the REST client, then retry with the new token. */
function recoverAuth(live: Socket): void {
  if (authRetried) return;
  authRetried = true;
  refreshAccessToken()
    .then((token) => {
      live.auth = { token };
      live.connect();
    })
    // A failed refresh already signs the user out (client → login·5); otherwise stay offline with the banner.
    .catch(() => emitStatus(false));
}

function wire(live: Socket): void {
  live.on('connect', () => {
    authRetried = false;
    emitStatus(true);
    if (everConnected) handlerSets.forEach((h) => h.onReconnect());
    everConnected = true;
  });
  live.on('disconnect', (reason) => {
    emitStatus(false);
    if (reason === 'io server disconnect') live.connect();
  });
  live.on('connect_error', (error: Error) => {
    emitStatus(false);
    if (error.message === 'unauthorized') recoverAuth(live);
  });
  live.on(ORDER_CREATED, (payload: unknown) => handlerSets.forEach((h) => h.onOrderCreated(payload)));
  live.on(TICKET_STATUS_CHANGED, (payload: unknown) =>
    handlerSets.forEach((h) => h.onTicketStatusChanged(payload)),
  );
}

/** Opens the one staff socket with the current access token. Call only while signed in. */
export async function connectStaffSocket(): Promise<void> {
  if (socket) return;
  const tokens = await readTokens();
  if (!tokens?.accessToken) return;
  socket = io(staffSocketUrl(), { auth: { token: tokens.accessToken } });
  wire(socket);
}

/** App back in the foreground: reconnect if the OS dropped the socket. */
export function ensureStaffSocketConnected(): void {
  if (socket && !socket.connected) socket.connect();
}

export function disconnectStaffSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  authRetried = false;
  everConnected = false;
  emitStatus(false);
}

export function isStaffSocketConnected(): boolean {
  return socket?.connected === true;
}

export function onSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function subscribeStaffEvents(handlers: StaffEventHandlers): () => void {
  handlerSets.add(handlers);
  return () => {
    handlerSets.delete(handlers);
  };
}
