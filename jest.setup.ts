import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// The Apple provider is a native module. In Jest it reports Apple Intelligence as unavailable;
// tests that need model output mock `@/services/ai/foundationModels` with a fake `OnDeviceModel`.
jest.mock('@react-native-ai/apple', () => ({
  apple: Object.assign(
    () => {
      throw new Error('Apple Intelligence is not available in Jest');
    },
    { isAvailable: () => false },
  ),
}));
