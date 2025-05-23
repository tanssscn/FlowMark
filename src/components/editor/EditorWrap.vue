<template>
  <div v-if="!initial"  v-loading="!initial" style="height: 100vh; display: flex; justify-content: center; align-items: center;"/>
  <SplitPane v-else class="editor-wrap"  left-absolute :show-right="showMilkdown" left-class="nonprintable" right-class="print-panel"
    :showLeft="showCodeMirror">
    <template #left>
        <el-scrollbar class="nonprintable">
      <CodeMirrorEditor  ref="codemirrorEditorRef" @updateMilkdown="updateMilkdown" :content="content" />
      </el-scrollbar>
    </template>
    <template #right>
      <MilkdownProvider>
        <MilkdownEditor ref="milkdownEditorRef" :tab-id="tab.id" :content="content" />
      </MilkdownProvider>
    </template>
  </SplitPane>
</template>
<script lang="ts" setup>
import { useEdit } from "@/composable/useEdit";
import MilkdownEditor from '@/components/editor/milkdown/MilkdownEditor.vue'
import { MilkdownProvider } from '@milkdown/vue';
import { ViewMode, type EditorTab } from '@/types/app-types.ts';
import { ref, PropType, computed, watch, onMounted } from 'vue'
import CodeMirrorEditor from "./codemirror/CodeMirrorEditor.vue";
import SplitPane from '@/components/common/splitPanel/SplitPanel.vue'

let content = ""
const milkdownEditorRef = ref()
const codemirrorEditorRef = ref()
const updateMilkdown = (content: string) => {
  console.log('content')
  milkdownEditorRef.value?.milkdownEditor.updateContent(content)
}
const updateMirrorEditor = () => {
  codemirrorEditorRef.value?.codemirrorEditor.updateContent(milkdownEditorRef.value?.milkdownEditor.getContent())
}
const showMilkdown = computed(() => {
  return props.tab.edit?.viewMode === ViewMode.WYSIWYG || props.tab.edit?.viewMode === ViewMode.SPLIT || props.tab.edit?.viewMode === ViewMode.READONLY
})
const showCodeMirror = computed(() => {
  return props.tab.edit?.viewMode === ViewMode.SOURCE || props.tab.edit?.viewMode === ViewMode.SPLIT
})
const setEditable = (preview: boolean) => {
  const proseMirrorElement = document.querySelector('.ProseMirror');
  if (proseMirrorElement) {
    proseMirrorElement.setAttribute('contenteditable', preview.toString());
  }
}

onMounted(() => {
  watch(() => props.tab.edit?.viewMode, (newVal) => {
    milkdownEditorRef.value?.milkdownEditor.onloaded(() => {
      switch (newVal) {
        case ViewMode.SOURCE:
          content = milkdownEditorRef.value?.milkdownEditor.getContent()
          codemirrorEditorRef.value.updateContent(content)
          break
        case ViewMode.READONLY:
          setEditable(false)
          break
        case ViewMode.SPLIT:
          content = milkdownEditorRef.value?.milkdownEditor.getContent()
          codemirrorEditorRef.value.updateContent(content)
          setEditable(false)
          break
        case ViewMode.WYSIWYG:
          setEditable(true)
          break
      }
    })
  })
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
})
</script>
<style>
.editor-wrap,
.editor-wrap .milkdown,
.editor-wrap.cm-editor {
  min-height: calc(100vh - 10px) !important;
}
</style>