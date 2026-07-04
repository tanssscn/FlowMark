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
import type { UnwatchFn } from '@tauri-apps/plugin-fs';
import { TabType } from '@/types/appTypes';

const windowStore = useWindowStore()
const tabStore = useTabStore()
const fileStore = useFileStore()
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

onMounted(() => {
  if (!tabStore.state?.id) return
  tabChange(tabStore.state.id)
})

const tabChange = (id: string) => {
  nextTick(async () => {
    const childRef = childRefs[id]
    milkdownManager.setActiveEditor(id)
    let fileInfo = fileStore.get(tabStore.state?.filePath ?? '')
    if (fileInfo) {
      if (unwatch) {
        if (typeof unwatch === 'function') {
          unwatch()
        }
      }
      if (typeof childRef.fileChange !== 'function') return;
      const session = tabStore.activeSession
      unwatch = await fileService.watchFileChange(fileInfo, async () => {
        if (session && session?.unsaved) return;
        try {
          fileInfo = fileStore.get(tabStore.state?.filePath ?? '')
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
  <div class="editor-container">
    <!-- 直接显示当前活动的编辑器组件 -->
    <component v-if="tabStore.state?.id" :is="conponentMap[tabStore.state.type]" :tab="tabStore.state"
      :ref="(el: any) => setChildRef(el, tabStore.state?.id || '')" />
    <!-- 如果没有打开的 tab，显示欢迎页面 -->
    <WelcomePanel v-else />

    <!-- 查找替换组件 -->
    <SearchReplace />
    <TableSelector v-model="windowStore.windowState.showTableSelect"
      @close="windowStore.windowState.showTableSelect = false" />
  </div>
</template>
<style scoped>
.editor-container {
  height: 100%;
  position: relative;
}
</style>