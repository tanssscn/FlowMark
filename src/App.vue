<script setup lang="ts">
import { useWindowStore } from '@/stores/windowStore'
import SidePanel from '@/components/layout/SidePanel.vue'
import HeaderMenu from '@/components/layout/HeaderMenu.vue'
import MainArea from '@/components/layout/MainArea.vue'
import { useWindowRoute } from './composable/useWindowRoute'
import SettingsModal from '@/components/settings/index.vue'
import { ref, onMounted } from 'vue'
import { getDeviceInfo } from '@/services/deviceService';
import { initI18n } from './i18n'
import { themeManager } from './services/persistService'
import SplitPane from '@/components/common/splitPanel/SplitPanel.vue'
const isBrowser = getDeviceInfo().isBrowser;
const { restoreWindow, handleScroll, initMenu } = useWindowRoute()
const windowStore = useWindowStore()
const isInitialized = ref(false)
onMounted(async () => {
  await initI18n()
  try {
    await Promise.allSettled([
      themeManager.initTheme(),
      initMenu(),
      restoreWindow(),
      handleScroll(),
    ])
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    isInitialized.value = true
  }
})

</script>

<template>
  <div>
    <!-- 顶部导航栏 -->
    <HeaderMenu v-if="isBrowser" id="mainHeader"
      class="h-12 transform transition-transform duration-300 sticky top-0 z-50 bg-white dark:bg-black nonprintable" />
    <SplitPane leftAbsolute v-model:left-width="windowStore.state.sidebar.width" :min-left-width="200"
      :show-left="windowStore.state.sidebar.visible" left-class="nonprintable" right-class="print-panel"
      :max-right-width="600"> <!-- 左侧边栏 -->
      <template #left="{ width }">
        <SidePanel class="overflow-hidden transition-all duration-200 fixed top-0 w-full"
          :style="{ width: `${width}px` }" v-if="windowStore.state.sidebar.visible" id="sidebar" />
      </template>
      <!-- 主编辑区 -->
      <template #right="{ width }">
        <MainArea :width="width" v-if="isInitialized" class="flex-1 main-area" />
      </template>
    </SplitPane>
    <SettingsModal class="nonprintable" v-model="windowStore.state.showSettingsModal" />
  </div>
</template>