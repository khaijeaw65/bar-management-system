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
    const component = createRoot(<Home />);
    expect(component).toBeTruthy();
  });
});
