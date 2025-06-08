<script setup lang="ts">
import { watch, onUnmounted, onMounted } from "vue";
import { Milkdown } from "@milkdown/vue";
import { milkdownManager } from "@/services/milkdownManager";
import { handlePaste } from "@/utils/clipboardUtil";

const props = defineProps<{
  tabId: string
  content: string
}>()
const milkdownEditor = milkdownManager.createEditor(props.tabId, props.content)

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