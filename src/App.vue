<script setup lang="ts">
import { useWindowStore } from '@/stores/windowStore'
import SidePanel from '@/components/SidePanel.vue'
import HeaderMenu from '@/components/HeaderMenu.vue'
import MainArea from '@/components/MainArea.vue'
import { useWindowRoute } from './composable/useWindowRoute'
import SettingsModal from '@/components/settings/index.vue'
import { ref, onMounted } from 'vue'
import { getDeviceInfo } from '@/services/deviceService';
import { initI18n } from './i18n'
import { themeManager } from './services/persistService'
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
    <el-splitter>
      <el-splitter-panel class="nonprintable" v-model:size="windowStore.state.sidebar.width"
        v-if="windowStore.state.sidebar.visible">
        <SidePanel class="fixed top-0 left-0" :style="{ width: `${windowStore.state.sidebar.width}px` }" />
      </el-splitter-panel>
      <!-- 主编辑区 -->
      <el-splitter-panel v-if="isInitialized">
        <MainArea />
      </el-splitter-panel>
    </el-splitter>
    <SettingsModal class="nonprintable" v-model="windowStore.state.showSettingsModal" />
  </div>
</template>