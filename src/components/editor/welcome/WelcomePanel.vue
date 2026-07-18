<script setup lang="ts">
import { useFile } from '@/composable/useFile';
import { useRecentStore } from '@/stores/recentFileStore';
import type { AppFileInfo } from '@/types/appTypes';
import { getFilename } from '@/utils/pathUtil';
import IconCustomPin from "~icons/custom/pin"
import IconCustomPinFill from "~icons/custom/pin-fill"
import { Close } from "@element-plus/icons-vue"
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const recentStore = useRecentStore();
const { openFolder, openFile, openRecentFile, clearAllRecent } = useFile()

</script>

<template>
  <div class="flex flex-col items-center justify-center h-full p-8! max-w-4xl mx-auto">
    <!-- 欢迎标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200">{{ t('welcome.title') }}</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('welcome.description') }}
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-center gap-4 mb-8">
      <el-button @click="openFolder">
        <span class="i-folder-open mr-2"></span>
        {{ t('menu.FileMenu.openFolder') }}
      </el-button>
      <el-button @click="openFile">
        <span class="i-file-text mr-2"></span>
        {{ t('menu.FileMenu.openFile') }}
      </el-button>
    </div>

    <!-- 最近文件列表 -->
    <div v-if="recentStore.state.length > 0" class="w-full mb-8">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ t('welcome.recentFiles') }}</h2>
      <div v-for="file in recentStore.state" :key="file.path">
        <div class="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center"
          @click="openRecentFile({ path: file.path, isDir: file.isDir, storageLocation: file.storageLocation } as AppFileInfo)">
          <el-button :icon="file.pinned ? IconCustomPinFill : IconCustomPin"
            @click.stop="recentStore.togglePin(file.path)" text />
          <span class="font-medium flex-1">{{ getFilename(file.path) }}</span>
          <span class="text-sm text-gray-500 truncate ml-4 max-w-xs">{{ file.path }}</span>

          <el-button text @click.stop="recentStore.removeRecentFile(file.path)" :icon="Close" />
        </div>
        <el-divider />
      </div>

      <el-button text class="w-full" @click="clearAllRecent">{{ t('welcome.clearHistory') }}</el-button>
    </div>
  </div>
</template>