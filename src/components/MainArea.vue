<script setup lang="ts">
import EditorWrap from '@/components/editor/markdown/EditorWrap.vue'
import WelcomePanel from '@/components/editor/welcome/WelcomePanel.vue'
import ImageViewer from '@/components/editor/image/ImageViewer.vue'
import PdfViewer from '@/components/editor/pdf/PdfViewer.vue'
import { useTabStore } from '@/stores/tabStore';
import { nextTick, onMounted, reactive } from 'vue';
import { fileService } from '@/services/files/fileService';
import { milkdownManager } from '@/services/milkdownManager';
import SearchReplace from "@/components/editor/markdown/plugins/find/SearchReplace.vue"
import { useWindowStore } from '@/stores/windowStore';
import TableSelector from './editor/markdown/plugins/table/TableSelector.vue';
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
const childRefs = reactive<Record<string, any>>({})
const setChildRef = (el: any, id: string) => {
  if (el) {
    childRefs[id] = el
  }
}
let unwatch: UnwatchFn | void = undefined;
const conponentMap = {
  [TabType.Image]: ImageViewer,
  [TabType.Markdown]: EditorWrap,
  [TabType.Welcome]: WelcomePanel,
  [TabType.PDF]: PdfViewer,
  [TabType.Unknown]: EditorWrap,
};
const handleTabChange = (tabName: string) => {
  tabChange(tabName)
}
onMounted(() => {
  if (!tabStore.activeId) return
  tabChange(tabStore.activeId)
})
const tabChange = (id: string) => {
  nextTick(async () => {
    milkdownManager.setActiveEditor(id)
    let fileInfo = fileStore.get(tabStore.activeTab?.filePath ?? '')
    if (fileInfo) {
      if (unwatch) {
        if (typeof unwatch === 'function') {
          unwatch()
        }
      }
      const childRef = childRefs[id]
      if (typeof childRef.fileChange !== 'function') return;
      const session = tabStore.activeSession
      unwatch = await fileService.watchFileChange(fileInfo, async () => {
        if (session && session?.unsaved) return;
        try {
          fileInfo = fileStore.get(tabStore.activeTab?.filePath ?? '')
          if (!fileInfo) return
          const newFileInfo = await fileService.getStat(fileInfo)
          console.log(newFileInfo.version, fileInfo?.version)
          if (fileInfo?.version !== newFileInfo.version) {
            fileStore.set([newFileInfo])
            childRef.fileChange();
          }
        } catch (e) {
          console.log(e)
        }
      })
    }
  })
}
</script>

<template>
  <div>
    <el-tabs @tab-change="handleTabChange" v-model="tabStore.activeId" type="card" closable
      class="tabs-container flex flex-col" @tab-remove="closeTab">
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
        <component :is="conponentMap[tab.type]" :tab="tab" :ref="(el: any) => setChildRef(el, id)" />
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