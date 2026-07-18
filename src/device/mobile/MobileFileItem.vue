<script setup lang="ts">
import { computed } from 'vue'
import type { FileEntry } from '@/types/appTypes'
import { TabType } from '@/types/appTypes'
import { getTabType } from '@/utils/fileUtil'
import { formatDate } from '@/utils/formatUtil'
import { getExtname } from '@/utils/pathUtil'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  file: FileEntry
  isSelectMode: boolean
  isSelected: boolean
}>()

const emit = defineEmits<{
  click: []
  longPress: []
  remove: []
}>()

const { t } = useI18n()

const fileType = computed(() => getTabType(props.file.name))
const fileIconName = computed(() => {
  switch (fileType.value) {
    case TabType.Image: return 'photo-o'
    case TabType.PDF: return 'description'
    default: return 'document'
  }
})

const fileExt = computed(() => getExtname(props.file.name).toUpperCase().replace('.', '') || 'FILE')

const formattedDate = computed(() => {
  const d = formatDate(props.file.lastModified, 'YYYY-MM-DD HH:mm')
  return d.value
})

const fileMeta = computed(() => {
  if (props.file.size !== undefined) {
    const sizeStr = formatFileSize(props.file.size)
    return `${fileExt.value} · ${sizeStr} · ${formattedDate.value}`
  }
  return `${fileExt.value} · ${formattedDate.value}`
})

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="px-4">
    <!-- 选择模式下，自定义选择框 + 单元格 -->
    <div v-if="isSelectMode" class="flex items-center gap-3 py-3" :class="{ 'bg-blue-50 dark:bg-blue-900/20': isSelected }" @click="emit('click')">
      <van-icon :name="isSelected ? 'checked' : 'circle'" :size="24" :class="isSelected ? 'text-blue-500' : 'text-gray-300'" />
      <van-icon :name="fileIconName" size="24" class="text-blue-500 shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-base text-gray-800 dark:text-gray-100 font-medium truncate">{{ file.name }}</div>
        <div class="text-xs text-gray-500 mt-1 truncate">{{ fileMeta }}</div>
      </div>
      <span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
        {{ file.storageLocation === 'local' ? t('mobile.fileTree.local') : 'WebDAV' }}
      </span>
    </div>

    <!-- 非选择模式：使用 Vant SwipeCell 左滑删除 -->
    <van-swipe-cell v-else>
      <template #left />
      <van-cell-group inset>
        <van-cell
          :title="file.name"
          :label="fileMeta"
          :icon="fileIconName"
          size="large"
          @click="emit('click')"
        >
          <template #right-icon>
            <span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
              {{ file.storageLocation === 'local' ? t('mobile.fileTree.local') : 'WebDAV' }}
            </span>
          </template>
        </van-cell>
      </van-cell-group>
      <template #right>
        <van-button square text="删除" type="danger" class="h-full" @click="emit('remove')" />
      </template>
    </van-swipe-cell>
  </div>
</template>
