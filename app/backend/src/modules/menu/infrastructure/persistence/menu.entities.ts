import { MenuCategory } from './menu-category.entity.js';
import { MenuItem } from './menu-item.entity.js';
import { MenuItemAvailability } from './menu-item-availability.entity.js';
import { MenuItemVariant } from './menu-item-variant.entity.js';
import { MenuVariantModifierGroup } from './menu-variant-modifier-group.entity.js';
import { ModifierGroup } from './modifier-group.entity.js';
import { ModifierOption } from './modifier-option.entity.js';

export const menuEntities = [
  MenuCategory,
  MenuItem,
  MenuItemAvailability,
  MenuItemVariant,
  ModifierGroup,
  ModifierOption,
  MenuVariantModifierGroup,
];
