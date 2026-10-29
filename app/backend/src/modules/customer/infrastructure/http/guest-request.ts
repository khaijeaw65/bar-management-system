import type { Request } from 'express';
import type { GuestSessionView } from '../../domain/guest-session.types.js';

export type GuestRequest = Request & { guestSession: GuestSessionView };
