<script setup lang="ts">
import { useFileTree } from '@/composable/useFileTree';
import { useRecentStore } from '@/stores/recentStore';
import { AppFileInfo } from '@/types/app-types.ts';
import { getFilename } from '@/utils/pathUtil';
import IconCustomPin from "~icons/custom/pin"
import IconCustomPinFill from "~icons/custom/pin-fill"
import { Close } from "@element-plus/icons-vue"
const recentStore = useRecentStore();
const { openFolder, openFile, openRecentFile } = useFileTree()

</script>

<template>
  <div class="flex flex-col items-center justify-center h-full p-8! max-w-4xl mx-auto">
    <!-- 欢迎标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200">欢迎使用 FlowMark Markdown 编辑器</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        一款现代化的 Markdown 编辑工具，支持本地和 WebDAV 云端编辑
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-center gap-4 mb-8">
      <el-button @click="openFolder">
        <span class="i-folder-open mr-2"></span>
        打开文件夹
      </el-button>
      <el-button @click="openFile">
        <span class="i-file-text mr-2"></span>
        打开文件
      </el-button>
    </div>

    <!-- 最近文件列表 -->
    <div class="w-full mb-8">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">最近文件</h2>
      <div v-for="file in recentStore.state" :key="file.path">
        <div
          class="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center"
          @click="openRecentFile({ path: file.path, isDir: file.isDir, storageLocation: file.storageLocation } as AppFileInfo)">
          <el-button :icon="file.pinned ? IconCustomPinFill : IconCustomPin"
            @click.stop="recentStore.togglePin(file.path)" text />
          <span class="font-medium flex-1">{{ getFilename(file.path) }}</span>
          <span class="text-sm text-gray-500 truncate ml-4 max-w-xs">{{ file.path }}</span>

          <el-button text @click.stop="recentStore.removeRecentFile(file.path)" :icon="Close" />
        </div>
        <el-divider />
      </div>

      <el-button text class="w-full" @click="recentStore.clearAll">清空历史记录</el-button>
    </div>
  </div>
</template>