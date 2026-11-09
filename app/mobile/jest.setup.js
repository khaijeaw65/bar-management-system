process.env.EXPO_PUBLIC_USE_MOCKS = '1';

const mockCache = {
  set() {},
  get() {
    return null;
  },
};

jest.mock('react-native-worklets', () => ({
  createSerializable: (v) => v,
  createShareable: (v) => v,
  createSynchronizable: (v) => v,
  isShareable: () => false,
  isSynchronizable: () => false,
  isSerializableRef: () => false,
  serializableMappingCache: mockCache,
  shareableMappingCache: mockCache,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  runOnUIAsync: (fn) => fn,
  runOnUISync: (fn) => fn,
  executeOnUIRuntimeSync: (fn) => fn,
  scheduleOnRN: (fn) => fn,
  scheduleOnUI: (fn) => fn,
  isWorkletFunction: () => false,
  getDynamicFeatureFlag: () => false,
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: () => {},
  createWorkletRuntime: () => ({}),
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
  runOnRuntime: (fn) => fn,
  runOnRuntimeAsync: (fn) => fn,
  runOnRuntimeSync: (fn) => fn,
  scheduleOnRuntime: (fn) => fn,
  scheduleOnRuntimeWithId: (fn) => fn,
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  Reanimated.useReducedMotion = () => false;
  return {
    ...Reanimated,
    useReducedMotion: () => false,
  };
});

jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, String(value));
    }),
    getItemAsync: jest.fn(async (key) => {
      return store.has(key) ? store.get(key) : null;
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    __store: store,
  };
});

jest.mock('expo-crypto', () => {
  const nodeCrypto = require('node:crypto');
  return {
    CryptoDigestAlgorithm: {
      SHA1: 'SHA-1',
      SHA256: 'SHA-256',
      SHA384: 'SHA-384',
      SHA512: 'SHA-512',
      MD5: 'MD5',
    },
    CryptoEncoding: {
      HEX: 'hex',
      BASE64: 'base64',
    },
    getRandomBytes: (count) => {
      return new Uint8Array(nodeCrypto.randomBytes(count));
    },
    digestStringAsync: async (algo, str, opts) => {
      const hash = nodeCrypto.createHash('sha256').update(str).digest();
      if (opts?.encoding === 'base64') {
        return hash.toString('base64');
      }
      return hash.toString('hex');
    },
  };
});

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(async () => ({ type: 'cancel' })),
  dismissAuthSession: jest.fn(),
  WebBrowserResultType: {
    CANCEL: 'cancel',
    DISMISS: 'dismiss',
    OPENED: 'opened',
    LOCKED: 'locked',
    SUCCESS: 'success',
  },
}));

jest.mock('expo-linking', () => ({
  parse: jest.fn((url) => {
    try {
      const parsed = new URL(url);
      const queryParams = Object.fromEntries(parsed.searchParams.entries());
      return {
        scheme: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname,
        path: parsed.pathname,
        queryParams,
      };
    } catch {
      const questionIdx = url.indexOf('?');
      if (questionIdx === -1) {
        return { queryParams: {} };
      }
      const search = url.slice(questionIdx + 1);
      const params = new URLSearchParams(search);
      return { queryParams: Object.fromEntries(params.entries()) };
    }
  }),
  createURL: jest.fn((path) => `barapp://${path}`),
}));

