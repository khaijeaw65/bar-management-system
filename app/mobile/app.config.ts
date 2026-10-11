import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Bar Staff',
  slug: 'bar-staff',
  scheme: 'barapp',
  userInterfaceStyle: 'automatic',
  android: {
    ...config.android,
    package: 'com.barmanagement.staff',
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.barmanagement.staff',
  },
  plugins: ['expo-router', 'expo-font'],
  experiments: {
    ...config.experiments,
    typedRoutes: true,
  },
});
