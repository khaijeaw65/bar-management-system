type Listener = (...args: unknown[]) => void;

/** Minimal stand-in for a socket.io-client Socket: records handlers, lets tests fire events. */
export class FakeSocket {
  public connected = false;
  public auth: Record<string, unknown>;
  public connect = jest.fn(() => this);
  public disconnect = jest.fn(() => {
    this.connected = false;
    return this;
  });
  private listeners = new Map<string, Set<Listener>>();

  public constructor(public readonly url: string, opts: { auth: Record<string, unknown> }) {
    this.auth = opts.auth;
  }

  public on(event: string, listener: Listener): this {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  public removeAllListeners(): this {
    this.listeners.clear();
    return this;
  }

  public fire(event: string, ...args: unknown[]): void {
    if (event === 'connect') this.connected = true;
    if (event === 'disconnect') this.connected = false;
    this.listeners.get(event)?.forEach((l) => l(...args));
  }
}
