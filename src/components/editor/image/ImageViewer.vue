<!-- components/ImageViewer.vue -->
<template>
  <div ref="imgRef" class="min-h-[calc(100vh-100px)] w-full">
    <el-image :src="objectUrl" class="max-w-none max-h-none select-none pointer-events-auto" :alt="tab.title"
      @click="handleClick" />
  </div>
</template>

<script lang="ts" setup>
import { ref, PropType, onMounted, onUnmounted } from 'vue'
import panzoom, { PanzoomObject } from '@panzoom/panzoom'
import type { EditorTab } from '@/types/app-types.ts';
import { useFileStore } from '@/stores/fileStore'
import { closeImageSource, createFileSrc } from '@/utils/pathUtil';
import { useEventListener } from '@vueuse/core';

const fileStore = useFileStore()

const props = defineProps({
  tab: {
    type: Object as PropType<EditorTab>,
    required: true
  },
})

const imgRef = ref<HTMLImageElement | null>(null)
let panzoomInstance: PanzoomObject | null = null
const objectUrl = ref('')
const handleClick = () => {
  // panzoomInstance?.zoomIn()
}
onMounted(async () => {
  const fileInfo = fileStore.get(props.tab.filePath!)
  if (!fileInfo) return
  objectUrl.value = await createFileSrc(fileInfo)
  if (!imgRef.value) return
  panzoomInstance = panzoom(imgRef.value, {
    animate: true,
    maxScale: 5,
    minScale: 0.2,
    step: 0.1,
    startScale: 1,
  })
  useEventListener(imgRef, 'wheel', panzoomInstance.zoomWithWheel);
})
onUnmounted(() => {
  closeImageSource(objectUrl.value)
})

</script>

<style scoped>
img {
  cursor: grab;
  user-select: none;
}
</style>
