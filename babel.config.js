module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // <--- ده المهم لمشروعك بدل metro-react-native-babel-preset
    plugins: [
      // أي إضافات تانية هنا
      'react-native-reanimated/plugin', // <--- لازم يكون الأخير
    ],
  };
};