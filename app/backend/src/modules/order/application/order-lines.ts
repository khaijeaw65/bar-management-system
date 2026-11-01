import type { MenuModifierGroup, UnavailableLine, UnavailableReason } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import type {
  OrderableLookup,
  OrderableVariant,
} from '../../menu/application/menu-catalog.types.js';
import type { ChosenModifier, PricedLine, TicketBucket } from '../domain/order.types.js';
import type { RequestedLine } from './order.types.js';

const INVALID = new DomainException('VALIDATION_ERROR', 'ตัวเลือกไม่ถูกต้อง', 400);

export function priceLines(
  requested: readonly RequestedLine[],
  lookup: OrderableLookup,
): PricedLine[] {
  assertKnown(requested, lookup);
  const blocked = blockedLines(requested, lookup);
  if (blocked.length > 0) throw unavailable(blocked);
  return requested.map((line, index) => priceOne(line, index + 1, variantOf(lookup, line.variantId)));
}

export function bucketFor(
  line: PricedLine,
  kitchenOn: boolean,
): TicketBucket {
  if (line.itemType === 'charge') return 'charge';
  if (!kitchenOn || line.kitchenTag !== 'food') return 'bar';
  return 'food';
}

function assertKnown(requested: readonly RequestedLine[], lookup: OrderableLookup): void {
  const missing = new Set(lookup.missing);
  if (requested.some((line) => missing.has(line.variantId))) {
    throw new DomainException('VALIDATION_ERROR', 'ไม่พบรายการในเมนู', 400);
  }
}

function blockedLines(
  requested: readonly RequestedLine[],
  lookup: OrderableLookup,
): UnavailableLine[] {
  return requested.flatMap((line) => {
    const reason = blockReason(line, variantOf(lookup, line.variantId));
    return reason ? [{ variantId: line.variantId, reason }] : [];
  });
}

function blockReason(line: RequestedLine, variant: OrderableVariant): UnavailableReason | null {
  if (!variant.availableNow) return variant.unavailableReason ?? 'sold_out';
  const chosen = findChoices(line.modifierOptionIds, variant.modifierGroups);
  if (chosen.some((choice) => !choice.available)) return 'sold_out';
  return null;
}

function priceOne(line: RequestedLine, lineNo: number, variant: OrderableVariant): PricedLine {
  const modifiers = requireChoices(line.modifierOptionIds, variant.modifierGroups);
  return {
    lineNo,
    variantId: line.variantId,
    quantity: line.quantity,
    itemName: variant.itemName,
    variantName: variant.variantName,
    itemType: variant.itemType,
    kitchenTag: variant.kitchenTag,
    unitPrice: variant.price,
    orderedByName: line.orderedByName,
    notes: line.notes,
    modifiers,
  };
}

function requireChoices(
  optionIds: readonly string[],
  groups: readonly MenuModifierGroup[],
): ChosenModifier[] {
  const found = findChoices(optionIds, groups);
  if (found.length !== optionIds.length) throw INVALID;
  assertCounts(found, groups);
  return found.map((choice) => ({
    optionId: choice.optionId,
    name: choice.name,
    priceDelta: choice.priceDelta,
  }));
}

interface FoundChoice extends ChosenModifier {
  groupId: string;
  available: boolean;
}

function findChoices(
  optionIds: readonly string[],
  groups: readonly MenuModifierGroup[],
): FoundChoice[] {
  if (new Set(optionIds).size !== optionIds.length) throw INVALID;
  return optionIds.flatMap((optionId) => locate(optionId, groups));
}

function locate(optionId: string, groups: readonly MenuModifierGroup[]): FoundChoice[] {
  for (const group of groups) {
    const option = group.options.find((item) => item.id === optionId);
    if (!option) continue;
    return [toChoice(group.id, option)];
  }
  return [];
}

function toChoice(
  groupId: string,
  option: MenuModifierGroup['options'][number],
): FoundChoice {
  return {
    groupId,
    optionId: option.id,
    name: option.name,
    priceDelta: option.priceDelta,
    available: option.isAvailable,
  };
}

function assertCounts(chosen: readonly FoundChoice[], groups: readonly MenuModifierGroup[]): void {
  for (const group of groups) {
    const count = chosen.filter((choice) => choice.groupId === group.id).length;
    const minimum = group.isRequired ? Math.max(group.minSelect, 1) : group.minSelect;
    if (count < minimum || count > group.maxSelect) throw INVALID;
  }
}

function variantOf(lookup: OrderableLookup, variantId: string): OrderableVariant {
  const found = lookup.found.find((item) => item.variantId === variantId);
  if (!found) throw new DomainException('VALIDATION_ERROR', 'ไม่พบรายการในเมนู', 400);
  return found;
}

function unavailable(details: UnavailableLine[]): DomainException {
  return new DomainException(
    'ITEM_UNAVAILABLE',
    'รายการนี้หมดหรือยังไม่เปิดขาย',
    409,
    { details },
  );
}
