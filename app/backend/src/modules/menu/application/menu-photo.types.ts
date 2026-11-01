export interface AttachedPhoto {
  /** The permanent `menu/<itemId>/<uuid>.<ext>` key, already copied. */
  key: string;
  /** The upload slot to delete once the item row is committed. */
  tmpKey: string;
}
