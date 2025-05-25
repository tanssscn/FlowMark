<script setup lang="ts">
import { computed, ref } from 'vue'
import Outline from '@/components/outline/Outline.vue'
import VersionHistory from '@/components/version/VersionHistory.vue'
import { useWindowStore } from '@/stores/windowStore'
import FileTree from '@/components/filetree/FileTree.vue'
import { useI18n } from 'vue-i18n'
import { SidePanel } from '@/types/appTypes'

const { t } = useI18n()
const uiStore = useWindowStore()

const activePanel = ref(uiStore.state.sidebar.activePanel)

// 监听面板切换
const handlePanelChange = (panel: SidePanel) => {
  activePanel.value = panel
  uiStore.switchSidebarPanel(panel)
}
const tabs = computed(() => {
  return [
    { name: 'fileTree', label: t('sidebar.filetree.label'), component: FileTree },
    { name: 'outline', label: t('sidebar.outline.label'), component: Outline },
    { name: 'history', label: t('sidebar.version.label'), component: VersionHistory }
  ]
})
</script>

<template>
  <!-- 面板选择标签 -->
  <el-tabs lazy v-model="activePanel" class="sidebar-tabs h-full" @tab-change="handlePanelChange">
    <el-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" :label="tab.label" class="h-full">
      <component :is="tab.component" class="h-full" />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped>
/* 自定义标签样式 */
.sidebar-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.sidebar-tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

.sidebar-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}
</style>