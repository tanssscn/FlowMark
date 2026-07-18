export default {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 16,
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      mediaQuery: false,
      minPixelValue: 2,
      exclude: (file) => {
        if (!file) return true
        if (file.includes('node_modules')) return true
        if (file.includes('src/device/mobile')) return false
        if (file.includes('src/assets/css/mobile.css')) return false
        return true
      },
    },
  },
}
