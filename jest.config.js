module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    // Native audio engine isn't available under Jest; use the library's mock.
    '^react-native-audio-api$': '<rootDir>/node_modules/react-native-audio-api/lib/commonjs/mock/index',
  },
};
