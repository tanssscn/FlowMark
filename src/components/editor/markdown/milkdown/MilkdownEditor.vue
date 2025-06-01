<script setup lang="ts">
import { watch, onUnmounted, ref, onMounted, onBeforeMount } from "vue";
import { Milkdown } from "@milkdown/vue";
import { milkdownManager } from "@/services/milkdownManager";
import { handlePaste } from "@/utils/clipboardUtil";
import { MilkdownEditorInstance } from "./composable/milkdownEditor";

const props = defineProps<{
  tabId: string
  content: string
}>()
const milkdownEditor = new MilkdownEditorInstance(props.tabId, props.content)
milkdownManager.setEditor(props.tabId, milkdownEditor)
watch(() => props.tabId, async (newId) => {
  milkdownEditor.updateId(newId)
})
onUnmounted(() => {
  milkdownManager.removeEditor(props.tabId)
})
defineExpose({
  milkdownEditor
})
onMounted(() => {
  document.getElementById('milkdown')?.addEventListener('paste', (event: ClipboardEvent) => {
    handlePaste(event, milkdownEditor)
  }, true);
})
</script>

<template>
  <Milkdown id="milkdown" />
</template>
<style scoped>
:deep(.ProseMirror) {
  height: 100% !important;
}
</style>