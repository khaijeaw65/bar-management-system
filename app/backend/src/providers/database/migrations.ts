import { AuditLog1762300000000 } from './migrations/1762300000000-AuditLog.js';
import { InitExtensions1758662400000 } from './migrations/1758662400000-InitExtensions.js';
import { StaffIdentity1760659200000 } from './migrations/1760659200000-StaffIdentity.js';
import { ModifierGroupArchive1762600000000 } from './migrations/1762600000000-ModifierGroupArchive.js';
import { AuditRejectAction1762800000000 } from './migrations/1762800000000-AuditRejectAction.js';
import { CategoryNameUnique1762700000000 } from './migrations/1762700000000-CategoryNameUnique.js';
import { OrderLineSnapshots1762400000000 } from './migrations/1762400000000-OrderLineSnapshots.js';
import { GuestSession1762900000000 } from './migrations/1762900000000-GuestSession.js';
import { CustomerOrderCallStaff1763000000000 } from './migrations/1763000000000-CustomerOrderCallStaff.js';
import { CustomerPayment1763100000000 } from './migrations/1763100000000-CustomerPayment.js';
import { Orders1762100000000 } from './migrations/1762100000000-Orders.js';
import { UpdatedAtTrigger1762500000000 } from './migrations/1762500000000-UpdatedAtTrigger.js';
import { Payments1762200000000 } from './migrations/1762200000000-Payments.js';
import { VenueAndMenu1762000000000 } from './migrations/1762000000000-VenueAndMenu.js';
import { VenueTables1761187200000 } from './migrations/1761187200000-VenueTables.js';

export const migrations = [
  InitExtensions1758662400000,
  StaffIdentity1760659200000,
  VenueTables1761187200000,
  VenueAndMenu1762000000000,
  Orders1762100000000,
  Payments1762200000000,
  AuditLog1762300000000,
  OrderLineSnapshots1762400000000,
  UpdatedAtTrigger1762500000000,
  ModifierGroupArchive1762600000000,
  CategoryNameUnique1762700000000,
  AuditRejectAction1762800000000,
  GuestSession1762900000000,
  CustomerOrderCallStaff1763000000000,
  CustomerPayment1763100000000,
];

