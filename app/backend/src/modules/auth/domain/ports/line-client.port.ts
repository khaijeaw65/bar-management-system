import type {
  LineAuthorizeInput,
  LineProfile,
  LineTokenExchange,
} from '../line-client.types.js';

export abstract class LineClient {
  public abstract authorizeUrl(input: LineAuthorizeInput): string;
  public abstract exchangeCode(code: string): Promise<LineTokenExchange>;
  public abstract verifyIdToken(idToken: string, nonce: string): Promise<LineProfile>;
}
