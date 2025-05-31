<script setup lang="ts">
import EditorWrap from '@/components/editor/EditorWrap.vue'
import WelcomePanel from '@/components/editor/welcome/WelcomePanel.vue'
import ImageViewer from '@/components/editor/image/ImageViewer.vue'
import PdfViewer from '@/components/editor/pdf/PdfViewer.vue'
import { useTabStore } from '@/stores/tabStore';
import { watch, nextTick } from 'vue';
import { fileService } from '@/services/files/fileService';
import { milkdownManager } from '@/services/milkdownManager';
import SearchReplace from "@/components/editor/plugins/find/SearchReplace.vue"
import { useWindowStore } from '@/stores/windowStore';
import TableSelector from './editor/table/TableSelector.vue';
import { useFileStore } from '@/stores/fileStore';
import { UnwatchFn } from '@tauri-apps/plugin-fs';
import { TabType } from '@/types/appTypes';
import { useEdit } from "@/composable/useEdit";
import { useSettingsStore } from '@/stores/settingsStore';
const { closeTab } = useEdit()
const windowStore = useWindowStore()
const tabStore = useTabStore()
const fileStore = useFileStore()
const settingsStore = useSettingsStore();

let unwatch: UnwatchFn | void = undefined;
watch(() => tabStore.activeTab, (newVal) => {
  nextTick(async () => {
    milkdownManager.setActiveEditor(newVal?.id)
    const fileInfo = fileStore.get(tabStore.activeTab?.filePath ?? '')
    if (newVal && fileInfo) {
      if (unwatch) {
        if (typeof unwatch === 'function') {
          unwatch()
        }
      }
      unwatch = await fileService.watchFileChange(fileInfo, async () => {
        const session = tabStore.activeSession
        if (session) {
          if (session?.unsaved) {
            return
          }
          const newFileInfo = await fileService.getStat(fileInfo)
          if (fileInfo.version !== newFileInfo.version) {
            if (!session.unsaved) {
              fileStore.set([newFileInfo])
              milkdownManager.getEditor(newVal.id)?.updateContent(await fileService.readTextFile(fileInfo))
            }
          }
        }
      })
    }
  })
}, { immediate: true })


const conponentMap = {
  [TabType.Image]: ImageViewer,
  [TabType.Markdown]: EditorWrap,
  [TabType.Welcome]: WelcomePanel,
  [TabType.PDF]: PdfViewer,
  [TabType.Unknown]: EditorWrap,
};
</script>

<template>
  <div>
    <el-tabs v-model="tabStore.activeId" type="card" closable class="tabs-container flex flex-col"
      @tab-remove="closeTab">
      <el-tab-pane lazy v-for="(tab, id) in tabStore.state" :key="id" :label="tab.title" :name="id">
        <!-- 自定义标签标题 -->
        <template #label>
          <span class="flex items-center">
            {{ tab.title }}
            <el-icon v-if="!settingsStore.state.file.save.autoSave && tab.edit?.unsaved" class="ml-1 text-red-500">
              <svg viewBox="0 0 128 128">
                <circle cx="80" cy="64" r="48" />
              </svg>
            </el-icon>
          </span>
        </template>
        <component :is="conponentMap[tab.type]" :tab="tab" />
      </el-tab-pane>
    </el-tabs>
    <!-- 查找替换组件 -->
    <SearchReplace />
    <TableSelector v-model="windowStore.windowState.showTableSelect"
      @close="windowStore.windowState.showTableSelect = false" />
  </div>
</template>
<style scoped>
.tabs-container :deep(.el-tabs__header) {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(5px);
}
</style>