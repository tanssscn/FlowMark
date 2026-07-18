<template>
  <iframe class="w-full h-full border-0" :src="pdfUrl" type="application/pdf"></iframe>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { PropType } from 'vue'
import { useFileStore } from '@/stores/fileTreeStore'
import { useTabStore } from '@/stores/tabStore'
import { createFileSrc, closeImageSource } from '@/utils/pathUtil'
import type { EditorTab, OutlineItem } from '@/types/appTypes'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { fileService } from '@/services/files/fileService'
/**
 * PDF 查看器组件
 * 用于显示 PDF 文档，并提供大纲导航功能
 * mac端iframe嵌入，能够提供ocr识别功能，但无法UI交互
 */

// workerUrl 是 pdfjs-dist 提供的 worker 文件，用于处理 PDF 文档的异步操作
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const fileStore = useFileStore()
const tabStore = useTabStore()

const props = defineProps({
  tab: {
    type: Object as PropType<EditorTab>,
    required: true
  },
})
const pdfUrl = ref('')
const originalUrl = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const pageInput = ref(1)

let pdfDocument: pdfjsLib.PDFDocumentProxy | null = null
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

const loadPdf = async () => {
  const fileInfo = fileStore.get(props.tab.filePath!)
  if (!fileInfo) return

  try {
    originalUrl.value = await createFileSrc(fileInfo)
    pdfUrl.value = originalUrl.value

    await extractOutline(fileInfo)
  } catch (error) {
    console.error('Failed to load PDF:', error)
  }
}

const extractOutline = async (fileInfo: any) => {
  try {
    const arrayBuffer = await fileService.readFile(fileInfo)
    const pdfData = new Uint8Array(arrayBuffer)

    const loadingTask = pdfjsLib.getDocument({ data: pdfData })
    pdfDocument = await loadingTask.promise
    totalPages.value = pdfDocument.numPages
    currentPage.value = 1
    pageInput.value = 1

    const outline = await pdfDocument.getOutline()
    if (!outline || outline.length === 0) {
      tabStore.updateOutline(props.tab.id, [])
      return
    }
    const outlineItems = await convertOutlineToItems(outline)
    tabStore.updateOutline(props.tab.id, outlineItems)
  } catch (error) {
    console.error('Failed to extract outline:', error)
    tabStore.updateOutline(props.tab.id, [])
  }
}

const convertOutlineToItems = async (outline: any[]): Promise<OutlineItem[]> => {
  const items: OutlineItem[] = []

  const convertItem = async (item: any, level: number = 1): Promise<OutlineItem> => {
    let pageNum = 1

    if (item.dest) {
      let dest = item.dest

      if (typeof dest === 'string') {
        dest = await pdfDocument!.getDestination(dest)
      }

      if (Array.isArray(dest) && dest.length > 0) {
        const pageRef = dest[0]
        pageNum = await pdfDocument!.getPageIndex(pageRef) + 1
      }
    }

    const outlineItem: OutlineItem = {
      id: item.title || `outline-${Math.random().toString(36).substr(2, 9)}`,
      text: item.title || '',
      level: level,
      pos: pageNum
    }

    if (item.items && item.items.length > 0) {
      outlineItem.children = await Promise.all(
        item.items.map((child: any) => convertItem(child, level + 1))
      )
    }

    return outlineItem
  }

  for (const item of outline) {
    items.push(await convertItem(item))
  }

  return items
}

const scrollToDestination = (item: OutlineItem) => {
  let pageNum = item.pos
  if (typeof pageNum !== 'number' || pageNum < 1 || pageNum > totalPages.value) {
    pageNum = 1
  }

  currentPage.value = pageNum
  pageInput.value = pageNum
  pdfUrl.value = `${originalUrl.value}#page=${pageNum}`
}

const handlePdfScrollTo = (event: Event) => {
  const customEvent = event as CustomEvent<OutlineItem>
  scrollToDestination(customEvent.detail)
}

const fileChange = async () => {
  closeImageSource(pdfUrl.value)
  if (pdfDocument && pdfDocument.loadingTask) {
    pdfDocument.loadingTask.destroy()
    pdfDocument = null
  }
  await loadPdf()
}

onMounted(async () => {
  await loadPdf()
  // 大纲点击事件监听
  document.addEventListener('pdf-scroll-to', handlePdfScrollTo)
})

onUnmounted(() => {
  closeImageSource(pdfUrl.value)
  if (pdfDocument && pdfDocument.loadingTask) {
    pdfDocument.loadingTask.destroy()
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  document.removeEventListener('pdf-scroll-to', handlePdfScrollTo)
})

watch(() => props.tab.filePath, () => {
  fileChange()
})

defineExpose({
  fileChange,
  scrollToDestination
})
</script>