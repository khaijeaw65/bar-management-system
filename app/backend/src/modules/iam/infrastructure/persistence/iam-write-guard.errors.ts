export class LockoutError extends Error {
  public constructor(message = 'lockout') {
    super(message);
  }
}

/** Carries a refusal out of the transaction callback so everything the write already did is rolled back. */
export class Refused<T> extends Error {
  public constructor(public readonly outcome: T) {
    super('refused');
  }
}
