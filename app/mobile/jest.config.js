module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^react-test-renderer$': 'test-renderer'
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@react-native|expo|@expo|heroui-native|lucide-react-native|@unimodules|sentry-expo|native-base))'
  ],
};
