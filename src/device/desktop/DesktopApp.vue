<script setup lang="ts">
import { useWindowStore } from '@/stores/windowStore'
import SidePanel from '@/components/SidePanel.vue'
import HeaderMenu from '@/components/HeaderMenu.vue'
import MainArea from '@/components/MainArea.vue'
import { useWindow } from '@/composable/useWindow'
import SettingsModal from '@/components/settings/index.vue'
import DragDropIndicator from '@/components/DragDropIndicator.vue'
import { ref, onMounted } from 'vue'
import { getDeviceInfo } from '@/services/deviceService';
import { initI18n } from '@/i18n'
import { themeManager } from '@/services/persistService'
const isBrowser = getDeviceInfo().isBrowser;
const { restoreWindow, initMenu } = useWindow()
const windowStore = useWindowStore()
const isInitialized = ref(false)

onMounted(async () => {
  await initI18n()
  try {
    await Promise.allSettled([
      themeManager.initTheme(),
      initMenu(),
      restoreWindow(),
    ])
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    isInitialized.value = true
  }
})
</script>

<template>
  <div class="app-container">
    <el-splitter class="app-splitter">
      <el-splitter-panel class="nonprintable" v-model:size="windowStore.state.sidebar.width" min="200"
        v-if="windowStore.state.sidebar.visible">
        <SidePanel class="fixed top-0 left-0" :style="{ width: `${windowStore.state.sidebar.width}px` }" />
      </el-splitter-panel>
      <el-splitter-panel v-if="isInitialized" min="200">
        <HeaderMenu v-if="isBrowser" class="top-0 z-50 bg-white dark:bg-black nonprintable" />
        <MainArea />
      </el-splitter-panel>
    </el-splitter>
    <SettingsModal class="nonprintable" v-model="windowStore.state.showSettingsModal" />
    <DragDropIndicator />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-splitter {
  flex: 1;
  min-height: 0;
}

.app-splitter :deep(.el-splitter),
.app-splitter :deep(.el-splitter__panel),
.app-splitter :deep(.el-splitter__trigger),
.app-splitter :deep(.el-scrollbar__view) {
  height: 100%;
}
</style>
