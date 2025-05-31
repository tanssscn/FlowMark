<template>
  <div v-show="windowStore.state.findReplace.show"
    class="fixed top-10 right-4 bg-white dark:bg-gray-800 shadow-xl rounded-md border border-gray-200 dark:border-gray-700 z-50 w-96 overflow-hidden">
    <!-- 查找行 -->
    <div class="flex items-center pl-1!">
      <!-- 折叠/展开按钮 -->
      <el-button :icon="windowStore.state.findReplace.showReplace ? ArrowDown : ArrowRight" link :size="iconSize"
        class="!mr-1"
        @click="windowStore.setFindReplace({ showReplace: !windowStore.state.findReplace.showReplace })" />
      <div>
        <div class="flex items-center gap-2">
          <!-- 查找输入框 -->
          <div class="relative flex-1">
            <el-input autofocus v-model="searchText" placeholder="查找" size="small" class="flex-1 w-60!"
              ref="searchInputRef" @keydown.enter="handleFind('next')" @keydown.shift.enter="handleFind('previous')"
              @keydown.esc="onClose">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>

            <!-- 查找计数 -->
            <div v-show="searchText && matchCount >= 0"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1">
              {{ currentMatchIndex + 1 }}/{{ matchCount }}
            </div>
          </div>
          <!-- 查找导航按钮 -->
          <el-button :disabled="!searchText || matchCount === 0" :size="iconSize" @click="handleFind('previous')" link
            :icon="ArrowUp" />
          <el-button :disabled="!searchText || matchCount === 0" :size="iconSize" @click="handleFind('next')" link
            :icon="ArrowDown" />
        </div>
        <!-- 替换行 (可折叠) -->
        <div v-show="windowStore.state.findReplace.showReplace" class="flex items-center gap-2">
          <el-input v-model="replaceText" placeholder="替换" size="small" class="flex-1 w-60!"
            @keydown.enter="handleReplace" @keydown.esc="onClose">
            <template #prefix>
              <el-icon>
                <Edit />
              </el-icon>
            </template>
          </el-input>
          <el-button :disabled="!searchText || !replaceText || matchCount === 0" :size="iconSize" @click="handleReplace"
            link :icon="IconCustomReplace" />
          <el-button :disabled="!searchText || !replaceText || matchCount === 0" :size="iconSize"
            @click="handleReplaceAll" link :icon="IconCustomReplaceAll" />
        </div>
        <!-- 选项 -->
        <div class="flex items-center justify-between mt-2 px-1">
          <div class="flex space-x-3">
            <el-checkbox v-model="options.matchCase" size="small" label="Aa" title="区分大小写" />
            <el-checkbox v-model="options.wholeWord" size="small" label="ab" title="全字匹配" />
            <el-checkbox v-model="options.regex" size="small" label=".*" title="正则表达式" />
          </div>
        </div>
      </div>
      <!-- 关闭按钮 -->
      <el-button :icon="Close" link :size="iconSize" @click="onClose" class="absolute top-1 right-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import {
  Search,
  Edit,
  Close,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from '@element-plus/icons-vue'
import IconCustomReplace from "~icons/custom/replace"
import IconCustomReplaceAll from "~icons/custom/replace-all"
import { milkdownManager } from '@/services/milkdownManager'
import type { FindOptions } from '../../types'
import { useWindowStore } from '@/stores/windowStore'
import { useDebounceFn, watchPausable } from '@vueuse/core'
const windowStore = useWindowStore()
const searchInputRef = ref<HTMLInputElement>()
const iconSize = "large"
const searchText = ref('')
const replaceText = ref('')
const options = ref<FindOptions>({
  matchCase: false,
  wholeWord: false,
  regex: false
})
const matchCount = ref(0)
const currentMatchIndex = ref(-1)

const { pause, resume } = watchPausable(
  [options, searchText],
  ([newOptions, newSearchText]) => {
    debouncedFind(newSearchText, newOptions)
  }
);
const debouncedFind = useDebounceFn((text: string, options: FindOptions) => {
  nextTick(() => {
    const matches = milkdownManager.find(text, options)
    matchCount.value = matches?.count ?? 0
    currentMatchIndex.value = matches?.currentIndex ?? -1
  })
}, 500)
// 弹窗关闭时暂停监听，打开时恢复
watch(() => windowStore.state.findReplace.show, (isVisible) => {
  if (isVisible) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
    resume()
  } else {
    pause()
  }
});
const handleFind = (direction: 'next' | 'previous') => {
  if (!searchText.value) return
  // 实现 Milkdown 查找逻辑
  const newIndex = milkdownManager.scrollToMatch(direction)
  if (newIndex) {
    currentMatchIndex.value = newIndex
  }
}

const handleReplace = () => {
  const matches = milkdownManager.replace(replaceText.value)
  matchCount.value = matches?.count ?? 0
  currentMatchIndex.value = matches?.currentIndex ?? -1
}

const handleReplaceAll = () => {
  const matches = milkdownManager.replaceAllMatches(replaceText.value)
  matchCount.value = matches?.count ?? 0
  currentMatchIndex.value = matches?.currentIndex ?? -1
}

const onClose = () => {
  windowStore.setFindReplace({ show: false })
}
</script>