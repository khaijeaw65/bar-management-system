import { createRoot } from 'test-renderer';
import Home from '../app/index';

jest.mock('heroui-native', () => {
  const { Text } = require('react-native');
  return {
    Button: ({ children }: any) => <Text>{children}</Text>,
  };
});
jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    Beer: () => <Text>Beer</Text>,
  };
});

describe('Home Screen', () => {
  it('renders without crashing', () => {
    // test-renderer 1.3 types take options; this call still renders the element.
    const component = createRoot(<Home /> as never);
    expect(component).toBeTruthy();
  });
});
