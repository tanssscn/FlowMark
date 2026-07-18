<script setup lang="ts">
import { ref } from 'vue'
import MobileFileItem from './MobileFileItem.vue'
import MobileFileActionSheet from './MobileFileActionSheet.vue'
import { useMobileFile } from './composable/useMobileFile'
import { useMobileNav } from './composable/useMobileNav'
import type { FileEntry } from '@/types/appTypes'
import i18n from '@/i18n';
const { t } = i18n.global
const refreshing = ref(false)

const { navigateTo } = useMobileNav()
const {
  mobileFiles,
  isSelectMode,
  selectedPaths,
  selectedCount,
  isAllSelected,
  addFiles,
  openFile,
  removeFromTree,
  toggleSelectMode,
  toggleSelect,
  toggleSelectAll,
  batchRemove,
  batchDelete,
  copyPath,
  revealInFinder,
} = useMobileFile()

const actionSheetVisible = ref(false)
const actionSheetFile = ref<FileEntry | null>(null)

function handleLongPress(file: FileEntry) {
  actionSheetFile.value = file
  actionSheetVisible.value = true
}

function handleFileClick(file: FileEntry) {
  if (isSelectMode.value) {
    toggleSelect(file.path)
  } else {
    openFile(file.path)
    navigateTo('editor')
  }
}

function handleActionRemove(file: FileEntry) {
  removeFromTree(file.path)
}

function handleItemRemove(file: FileEntry) {
  removeFromTree(file.path)
}

async function handleShare(file: FileEntry) {
  try {
    if (navigator.share) {
      await navigator.share({ title: file.name, text: file.name })
    } else {
      await copyPath(file.path)
    }
  } catch (error) {
    console.error('分享失败:', error)
  }
}
</script>

<template>
  <div class="flex flex-col h-full relative dark:bg-gray-900">
    <!-- 操作栏 -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
      <div
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-blue-500 font-medium cursor-pointer active:bg-gray-50 dark:active:bg-gray-800"
        @click="addFiles">
        <van-icon name="plus" size="18" />
        <span class="text-sm">{{ t('mobile.fileTree.addFile') }}</span>
      </div>
      <div
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800"
        @click="toggleSelectMode">
        <van-icon :name="isSelectMode ? 'cross' : 'passed'" size="18" />
        <span class="text-sm">{{ isSelectMode ? t('mobile.fileTree.cancelSelect') : t('mobile.fileTree.select')
        }}</span>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="flex-1 overflow-hidden">
      <van-pull-refresh v-model="refreshing" :disabled="true">
        <!-- 空状态 -->
        <div v-if="mobileFiles.length === 0" class="flex flex-col items-center justify-center py-20 px-8 text-center">
          <van-icon name="orders-o" size="48" class="text-gray-300 mb-4" />
          <div class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">{{ t('mobile.fileTree.emptyTitle')
          }}</div>
          <div class="text-sm text-gray-500 mb-1">{{ t('mobile.fileTree.emptyDesc') }}</div>
          <div class="text-xs text-gray-400">{{ t('mobile.fileTree.emptyFormats') }}</div>
        </div>

        <!-- 文件列表 -->
        <div v-else class="flex flex-col gap-1 py-2 pb-20">
          <!-- 全选按钮（选择模式下） -->
          <div v-if="isSelectMode"
            class="flex items-center gap-3 px-4 py-3 mx-4 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 cursor-pointer"
            @click="toggleSelectAll">
            <van-icon :name="isAllSelected ? 'checked' : 'circle'" :size="24"
              :class="isAllSelected ? 'text-blue-500' : 'text-gray-300'" />
            <span>{{ t('mobile.fileTree.selectAll') }}</span>
          </div>

          <MobileFileItem v-for="file in mobileFiles" :key="file.path" :file="file" :is-select-mode="isSelectMode"
            :is-selected="selectedPaths.has(file.path)" @click="handleFileClick(file)"
            @long-press="handleLongPress(file)" @remove="handleItemRemove(file)" />
        </div>
      </van-pull-refresh>
    </div>

    <!-- 底部选择操作栏 -->
    <transition name="bottom-bar">
      <div v-if="isSelectMode"
        class="absolute bottom-0 left-0 right-0 flex items-center px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 gap-4 z-10">
        <div
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-red-500 cursor-pointer active:bg-gray-100"
          @click="batchDelete">
          <van-icon name="delete-o" size="16" />
          <span class="text-sm">{{ t('mobile.fileTree.delete') }}</span>
        </div>
        <div
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700"
          @click="batchRemove">
          <van-icon name="clear" size="16" />
          <span class="text-sm">{{ t('mobile.fileTree.remove') }}</span>
        </div>
        <div class="ml-auto text-sm text-gray-500">
          {{ t('mobile.fileTree.selectedCount', { count: selectedCount }) }}
        </div>
      </div>
    </transition>

    <!-- 长按菜单 -->
    <MobileFileActionSheet v-model:visible="actionSheetVisible" :file="actionSheetFile"
      @open="(f) => { handleFileClick(f) }" @copy-path="(f) => copyPath(f.path)" @share="handleShare"
      @reveal="(f) => revealInFinder(f.path)" @remove="handleActionRemove" />
  </div>
</template>

<style scoped>
.bottom-bar-enter-active,
.bottom-bar-leave-active {
  transition: transform 0.25s ease-out;
}

.bottom-bar-enter-from,
.bottom-bar-leave-to {
  transform: translateY(100%);
}
</style>
