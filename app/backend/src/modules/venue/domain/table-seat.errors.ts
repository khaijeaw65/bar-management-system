export class DuplicateSeatLabelError extends Error {
  public constructor(message = 'Duplicate active seat label') {
    super(message);
    this.name = 'DuplicateSeatLabelError';
  }
}
