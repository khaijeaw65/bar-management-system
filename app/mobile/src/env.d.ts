/// <reference types="jest" />
import 'react-native';

declare module '*.css' {
  const content: any;
  export default content;
}

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
}
