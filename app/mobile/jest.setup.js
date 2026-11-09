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
