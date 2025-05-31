<template>
  <iframe class="min-h-[calc(100vh-100px)] w-full" :src="pdfUrl" type="application/pdf"></iframe>
</template>

<script lang="ts" setup>
import { ref, onMounted, PropType, onUnmounted } from 'vue'
import { useFileStore } from '@/stores/fileStore'
import { closeImageSource, createFileSrc } from '@/utils/pathUtil'
import { EditorTab } from '@/types/appTypes'
const fileStore = useFileStore()

const props = defineProps({
  tab: {
    type: Object as PropType<EditorTab>,
    required: true
  },
})
const pdfUrl = ref('')
onMounted(async () => {
  await loadPdf()
})

// 加载 PDF 文档
const loadPdf = async () => {
  const fileInfo = fileStore.get(props.tab.filePath!)
  if (!fileInfo) return
  pdfUrl.value = await createFileSrc(fileInfo)
}
const fileChange = async () => {
  closeImageSource(pdfUrl.value)
  loadPdf()
}

onUnmounted(() => {
  closeImageSource(pdfUrl.value)
})
defineExpose({
  fileChange,
})

</script>
