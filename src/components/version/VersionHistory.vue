<template>
  <div v-show="tabStore.activeSession" class="h-full flex flex-col overflow-hidden">
    <!-- 头部标题和创建按钮 -->
    <el-button size="small" @click="createVersion">
      <el-icon>
        <Plus />
      </el-icon>
      {{ t('version.create') }}
    </el-button>

    <!-- 空状态 -->
    <div v-if="versions.length === 0" class="flex-1 flex flex-col items-center justify-center p-4">
      <el-icon>
        <Document />
      </el-icon>
      <span class="text-gray-500 dark:text-gray-400 text-center">
        {{ t('version.empty') }}
      </span>
    </div>

    <!-- 版本列表 -->
    <el-scrollbar v-else class="flex-1 !p-2">
      <el-timeline>
        <el-timeline-item v-for="version in versions.reverse()" :key="version.id"
          :timestamp="formatDate(version.createdAt, 'YYYY-MM-DD HH:mm:ss').value" placement="top">
          <el-card @contextmenu="menuHandler($event, version)"
            class="!border-gray-200 dark:!border-gray-700 hover:!border-blue-500 dark:hover:!border-blue-400 transition-colors">
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ version.message || t('version.noMessage') }}
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-scrollbar>
    <VersionMenu @restoreVersion="_restoreVersion" :contextMenu="contextMenu" @updateVersions="updateVersions"
      @close="contextMenu.visible = false" @compareWithCurrent="compareWithCurrent" />
    <version-compare ref="versionCompareRef" v-model="compareDialogVisible" @restoreVersion="_restoreVersion"
      @close="compareDialogVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatUtil'
import { useVersion, VersionContextMenuState } from '@/components/version/useVersion'
import { Plus, Document } from '@element-plus/icons-vue'
import VersionCompare from './VersionCompare.vue'
import VersionMenu from './VersionMenu.vue'
import { useI18n } from 'vue-i18n'
import { useTabStore } from '@/stores/tabStore'
import { computed, ref, reactive } from 'vue'
import { versionService } from '@/services/versions/versionService';
import { VersionInfo } from '@/types/appTypes'
import { useFileStore } from '@/stores/fileStore'
import { dialogService } from '@/services/dialog/dialogService'
import { asyncComputed } from '@vueuse/core'
import { milkdownManager } from '@/services/milkdownManager';

const fileStore = useFileStore()

const { t } = useI18n()
const tabStore = useTabStore();
const fileInfo = computed(() => {
  return fileStore.get(tabStore.activeTab?.filePath ?? '')
})
const versionCompareRef = ref<InstanceType<typeof VersionCompare> | null>(null)
// 版本数据
const contextMenu = reactive<VersionContextMenuState>({
  visible: false,
  version: {} as VersionInfo,
  path: '',
  x: 0,
  y: 0
})
const updateVersions = async (_versions: VersionInfo[]) => {
  versions.value = _versions
}
const menuHandler = (event: MouseEvent, version: VersionInfo) => {
  event.preventDefault()
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.version = version
  contextMenu.visible = true
  contextMenu.path = fileInfo.value?.path ?? ''
}
// 对比对话框
const compareDialogVisible = ref(false)
// 会根据fileInfo的变化自动更新
const versions = asyncComputed(async (): Promise<VersionInfo[]> => {
  return await versionService.listVersions(fileInfo.value?.path ?? '')
}, [])
const compareWithCurrent = async (version: VersionInfo) => {
  try {
    // 这里替换为实际的API调用
    const id = tabStore.activeTab?.id
    if (id && versionCompareRef.value) {
      console.log('update content')
      versionCompareRef.value.updateContent(tabStore.activeTab.id, fileInfo.value?.path ?? '',version)
      compareDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取版本内容失败:', error)
  }
}
// 创建新版本
const createVersion = () => {
  const info = fileInfo.value
  if (!info) return
  dialogService.prompt({
    title: t('dialog.newVersion.title'),
    message: t('dialog.newVersion.message'),
  }).then(result => {
    // 取消保存
    if (result === null) return
    saveVersion(info, milkdownManager.getContent() ?? '', result.trim())
      .then((_versions: VersionInfo[]) => {
        versions.value = _versions
      })
  })
}
const _restoreVersion = async (version: VersionInfo, content?: string) => {
  dialogService.confirm({
    title: t('dialog.restoreVersion.title'),
    message: t('dialog.restoreVersion.message', { msg: `${version.message ?? ''}-${formatDate(version.createdAt, "YYYY-MM-DD HH:mm:ss").value}` }),
    type: 'warning'
  }).then(async () => {
    if (!fileInfo.value) return
    restoreVersion(version.id, fileInfo.value, content)
  }).catch(() => {
    console.log('取消')
  }).finally(() => {
    compareDialogVisible.value = false
  })
}
const { restoreVersion, saveVersion } = useVersion()
</script>