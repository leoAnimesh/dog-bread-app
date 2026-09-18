
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));

jest.mock('@expo/vector-icons/Feather', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return function FeatherMock(props: { name: string }) {
    return React.createElement(Text, { testID: `icon-${props.name}` }, props.name);
  };
});

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return function MCIMock(props: { name: string }) {
    return React.createElement(Text, { testID: `icon-${props.name}` }, props.name);
  };
});

jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Image: (props: Record<string, unknown>) => React.createElement(View, { testID: 'expo-image', ...props }),
  };
});

jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///cache/' } },
  Directory: class {
    exists = true;
    create() {}
  },
  File: class {
    uri = 'file:///cache/mock';
    exists = false;
    size = 0;
    delete() {}
    static downloadFileAsync = jest.fn();
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => () => undefined),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true, setParams: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: unknown }) => children,
  Redirect: () => null,
}));
