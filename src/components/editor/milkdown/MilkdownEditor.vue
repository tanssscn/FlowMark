<script setup lang="ts">
import { watch, onUnmounted, ref, onMounted, onBeforeMount } from "vue";
import { Milkdown } from "@milkdown/vue";
import { MilkdownEditorInstance } from "@/components/editor/milkdown/composable/milkdownEditor";
import { milkdownManager } from "@/services/milkdownManager";
import { handlePaste } from "@/utils/clipboardUtil";

const props = defineProps<{
  tabId: string
  content: string
}>()
const initial = ref(false)
const milkdownEditor = new MilkdownEditorInstance(props.tabId, props.content)
initial.value = true
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
  document.getElementById('milkdownPaste')?.addEventListener('paste', (event: ClipboardEvent) => {
    handlePaste(event, milkdownEditor)
  }, true);
})
</script>

<template>
  <Milkdown id="milkdownPaste" />
</template>
<style scoped>
:deep(.ProseMirror) {
  height: 100% !important;
}
</style>