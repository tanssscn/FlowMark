import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// Import Tailwind CSS
import './assets/css/tailwind.css'
import './assets/css/base.css'
import './assets/css/print.css'
import './assets/css/milkdown/dark.css'
import './assets/css/milkdown/light.css'
// Import Milkdown styles
// https://milkdown.dev/docs/guide/using-crepe#theme
import "@milkdown/crepe/theme/common/style.css";
// First base Element Plus styles
import 'element-plus/theme-chalk/base.css'
// Import Element Plus dark theme before component styles
import 'element-plus/theme-chalk/dark/css-vars.css'
// Import entire Element Plus CSS since we're using the component registration
import 'element-plus/dist/index.css'

import i18n from './i18n'
// 创建应用实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.mount('#app') 