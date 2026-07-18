<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { initI18n } from '@/i18n'
import { themeManager } from '@/services/persistService'
import { useMobileNav } from './composable/useMobileNav'
import { useWindow } from '@/composable/useWindow'
import MobileHome from './MobileHome.vue'
import MobileEditor from './MobileEditor.vue'
import MobileSettings from './MobileSettings.vue'
import MobileSidePanel from './MobileSidePanel.vue'

const { currentPage, activePanel } = useMobileNav()
const { restoreWindow } = useWindow()
const isInitialized = ref(false)

// 同步 Vant 暗黑模式：监听 html class 变化
const isDark = ref(false)
const vantTheme = computed(() => isDark.value ? 'dark' : 'light')

let observer: MutationObserver | null = null
function syncTheme() {
  isDark.value = document.documentElement.classList.contains('dark')
  document.documentElement.classList.toggle('van-theme-dark', isDark.value)
}

function checkThemeWithTimeout() {
  setTimeout(() => {
    syncTheme()
  }, 100)
  setTimeout(() => {
    syncTheme()
  }, 500)
}

function checkThemeDirectly() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const htmlDark = document.documentElement.classList.contains('dark')
  const dataTheme = document.documentElement.getAttribute('data-theme')

  if (prefersDark || htmlDark || dataTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('van-theme-dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('van-theme-dark')
  }
}

onMounted(async () => {
  await initI18n()
  syncTheme()
  checkThemeDirectly()
  try {
    await Promise.allSettled([
      themeManager.initTheme(),
      restoreWindow(),
    ])
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    syncTheme()
    checkThemeDirectly()
    checkThemeWithTimeout()
    observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    isInitialized.value = true
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const pageMap = {
  home: MobileHome,
  editor: MobileEditor,
  settings: MobileSettings,
}
</script>

<template>
  <van-config-provider :theme="vantTheme" class="h-full">
    <div v-if="isInitialized" class="relative h-full overflow-hidden">
      <transition name="slide" mode="out-in">
        <component :is="pageMap[currentPage]" :key="currentPage" />
      </transition>

      <transition name="panel-slide">
        <MobileSidePanel v-if="activePanel" />
      </transition>
    </div>
    <div v-else class="flex items-center justify-center h-full">
      <van-loading size="32px" />
    </div>
  </van-config-provider>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-30%);
  opacity: 0;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.25s ease-out;
}

.panel-slide-enter-from {
  transform: translateX(100%);
}

.panel-slide-leave-to {
  transform: translateX(100%);
}
</style>
