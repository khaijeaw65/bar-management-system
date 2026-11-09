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
