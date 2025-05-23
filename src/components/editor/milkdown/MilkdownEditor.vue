<script setup lang="ts">
import { watch, onUnmounted, ref } from "vue";
import { Milkdown } from "@milkdown/vue";
import { MilkdownEditorInstance } from "@/components/editor/composable/milkdownEditor";
import { milkdownManager } from "@/services/milkdownManager";
import {handlePaste} from "@/utils/clipboardUtil";

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
</script>

<template>
  <Milkdown @paste="handlePaste($event,milkdownEditor)"/>
</template>
<style scoped>
:deep(.ProseMirror) {
  height: 100% !important;
}
</style>