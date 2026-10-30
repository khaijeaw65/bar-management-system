/** What the order flow needs from the guest socket, so it does not depend on socket.io (implemented by `CustomerGateway`). */
export abstract class CustomerTabGateway {
  /** The session's first order bound it to a visit: its open sockets move from the seat room to the visit room. */
  public abstract bindSession(sessionId: string, visitId: string): Promise<void>;
}
