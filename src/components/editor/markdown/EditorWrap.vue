<template>
  <div v-if="!initial" v-loading="!initial"
    style="height: 100vh; display: flex; justify-content: center; align-items: center;" />
  <el-splitter v-else class="editor-wrap" @resize-end="resizeEndEvent">
    <el-splitter-panel collapsible v-model:size="sourceWdith" :resizable>
      <el-scrollbar class="nonprintable" v-show="typeof sourceWdith === 'number' ? sourceWdith > 0 : true">
        <CodeMirrorEditor ref="codemirrorEditorRef" @updateMilkdown="updateMilkdown" :content="content" />
      </el-scrollbar>
    </el-splitter-panel>
    <el-splitter-panel collapsible v-model:size="milkdownWdith">
      <MilkdownProvider v-show="typeof milkdownWdith === 'number' ? milkdownWdith > 0 : true">
        <MilkdownEditor ref="milkdownEditorRef" :tab-id="tab.id" :content="content" />
      </MilkdownProvider>
    </el-splitter-panel>
  </el-splitter>
</template>
<script lang="ts" setup>
import { useEdit } from "@/composable/useEdit";
import MilkdownEditor from '@/components/editor/markdown/milkdown/MilkdownEditor.vue'
import { MilkdownProvider } from '@milkdown/vue';
import { ViewMode, type EditorTab } from '@/types/appTypes';
import { ref, PropType, watch, onMounted } from 'vue'
import CodeMirrorEditor from "./codemirror/CodeMirrorEditor.vue";
import { dialogService } from "@/services/dialog/dialogService";
import { useTabStore } from "@/stores/tabStore";
const tabStore = useTabStore()
const resizable = ref(true)
let content = ""
const milkdownEditorRef = ref()
const codemirrorEditorRef = ref()
const sourceWdith = ref<string | number>()
const milkdownWdith = ref<string | number>()
const updateMilkdown = (content: string) => {
  milkdownEditorRef.value?.milkdownEditor.updateContent(content)
}
const updateMirrorEditor = (content: string) => {
  codemirrorEditorRef.value?.updateContent(content)
}
const setEditable = (preview: boolean) => {
  content = milkdownEditorRef.value?.milkdownEditor.setOnlyRead(!preview)
}
const resizeEndEvent = (index: number, sizes: number[]) => {
  if (sizes[0] < 10) {
    tabStore.switchViewMode(props.tab.id, ViewMode.WYSIWYG)
    resizable.value = false
  }
  if (sizes[1] < 10) {
    tabStore.switchViewMode(props.tab.id, ViewMode.SOURCE)
    resizable.value = false
  }
}

onMounted(() => {
  watch(() => props.tab.edit?.viewMode, (newVal) => {
    switch (newVal) {
      case ViewMode.SOURCE:
        sourceWdith.value = '100%'
        milkdownWdith.value = 0
        content = milkdownEditorRef.value?.milkdownEditor.getContent()
        updateMirrorEditor(content)
        break
      case ViewMode.READONLY:
        milkdownWdith.value = '100%'
        sourceWdith.value = 0
        setEditable(false)
        break
      case ViewMode.SPLIT:
        milkdownWdith.value = '50%'
        sourceWdith.value = '50%'
        content = milkdownEditorRef.value?.milkdownEditor.getContent()
        updateMirrorEditor(content)
        setEditable(false)
        resizable.value = true
        break
      case ViewMode.WYSIWYG:
        milkdownWdith.value = '100%'
        sourceWdith.value = 0
        setEditable(true)
        break
    }
  }, { immediate: true })
})
const { readFileByTabId } = useEdit()
const props = defineProps({
  tab: {
    type: Object as PropType<EditorTab>,
    required: true
  },
})
const initial = ref(false)
readFileByTabId(props.tab.id).then((_content) => {
  content = _content
  initial.value = true
}).catch((res) => {
  dialogService.notifyError(res)
})
const fileChange = () => {
  readFileByTabId(props.tab.id).then((_content) => {
    updateMilkdown(_content)
    updateMirrorEditor(_content)
  })
}
defineExpose({
  fileChange
})
</script>
<style>
.editor-wrap,
.editor-wrap .milkdown,
.editor-wrap.cm-editor {
  min-height: calc(100vh - 10px) !important;
}
</style>