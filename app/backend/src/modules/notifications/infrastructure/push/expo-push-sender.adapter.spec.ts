import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { ExpoPushMessage } from 'expo-server-sdk';
import type { PushMessage } from '../../application/ports/push-sender.port.js';
import type { ExpoConfigService } from '../../../../providers/config/expo/config.service.js';

const sdk = vi.hoisted(() => ({
  send: vi.fn(),
  receipts: vi.fn(),
  options: vi.fn(),
}));

vi.mock('expo-server-sdk', () => {
  class Expo {
    public constructor(options: unknown) {
      sdk.options(options);
    }
    public static isExpoPushToken(token: string): boolean {
      return token.startsWith('ExponentPushToken[');
    }
    public chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
      return chunk(messages, 100);
    }
    public chunkPushNotificationReceiptIds(ids: string[]): string[][] {
      return chunk(ids, 1000);
    }
    public sendPushNotificationsAsync = sdk.send;
    public getPushNotificationReceiptsAsync = sdk.receipts;
  }
  const chunk = <T>(items: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
  return { Expo };
});

const { ExpoPushSenderAdapter } = await import('./expo-push-sender.adapter.js');

const message = (n: number): PushMessage => ({
  to: `ExponentPushToken[${n}]`,
  title: 'ออเดอร์ใหม่ · T1',
  body: '2 รายการ',
  data: { notificationId: `n${n}`, type: 'order_new', refType: 'order', refId: 'o1' },
});

const createAdapter = (accessToken?: string) =>
  new ExpoPushSenderAdapter({ accessToken } as ExpoConfigService);

describe('ExpoPushSenderAdapter', () => {
  beforeEach(() => {
    sdk.send.mockReset();
    sdk.receipts.mockReset();
  });

  it('validates Expo token format', () => {
    const adapter = createAdapter();
    expect(adapter.isValidToken('ExponentPushToken[abc]')).toBe(true);
    expect(adapter.isValidToken('not-a-token')).toBe(false);
  });

  it('sends 150 messages in 2 chunks and returns tickets in message order', async () => {
    sdk.send.mockImplementation(async (chunk: ExpoPushMessage[]) =>
      chunk.map((m) => ({ status: 'ok', id: `r-${String(m.to)}` })),
    );
    const messages = Array.from({ length: 150 }, (_, i) => message(i));

    const tickets = await createAdapter().send(messages);

    expect(sdk.send).toHaveBeenCalledTimes(2);
    expect(tickets).toHaveLength(150);
    expect(tickets[0]).toEqual({ status: 'ok', receiptId: 'r-ExponentPushToken[0]' });
    expect(tickets[149]).toEqual({ status: 'ok', receiptId: 'r-ExponentPushToken[149]' });
  });

  it('adds the Expo delivery fields and keeps the data payload', async () => {
    sdk.send.mockResolvedValue([{ status: 'ok', id: 'r1' }]);

    await createAdapter().send([message(1)]);

    expect(sdk.send.mock.calls[0]?.[0]).toEqual([
      {
        to: 'ExponentPushToken[1]',
        title: 'ออเดอร์ใหม่ · T1',
        body: '2 รายการ',
        data: { notificationId: 'n1', type: 'order_new', refType: 'order', refId: 'o1' },
        sound: 'default',
        priority: 'high',
        channelId: 'orders',
      },
    ]);
  });

  it('maps error tickets, flagging DeviceNotRegistered', async () => {
    sdk.send.mockResolvedValue([
      { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
      { status: 'error', message: 'too big', details: { error: 'MessageTooBig' } },
    ]);

    const tickets = await createAdapter().send([message(1), message(2)]);

    expect(tickets).toEqual([
      { status: 'error', failure: 'device_not_registered', message: 'gone' },
      { status: 'error', failure: 'other', message: 'too big' },
    ]);
  });

  it('maps receipts by id', async () => {
    sdk.receipts.mockResolvedValue({
      a: { status: 'ok' },
      b: { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
    });

    const receipts = await createAdapter().receipts(['a', 'b']);

    expect(receipts.get('a')).toEqual({ status: 'ok' });
    expect(receipts.get('b')).toEqual({ status: 'error', failure: 'device_not_registered', message: 'gone' });
  });

  it('passes the access token to the client', () => {
    createAdapter('secret');

    expect(sdk.options).toHaveBeenCalledWith({ accessToken: 'secret' });
  });
});

describe('expo-server-sdk import boundary', () => {
  it('is imported by the adapter only', () => {
    const importers = listSourceFiles(join(__dirname, '../../../..'))
      .filter((file) => !file.endsWith('.spec.ts'))
      .filter((file) => readFileSync(file, 'utf8').includes("'expo-server-sdk'"));

    expect(importers.map((file) => file.split('/').at(-1))).toEqual(['expo-push-sender.adapter.ts']);
  });
});

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}
