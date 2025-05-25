<template>
  <!-- 版本对比对话框 -->
  <el-dialog append-to-body width="100%" fullscreen class="!rounded-lg" :show-close="false" destroy-on-close>
    <template #header="{ close, titleId, titleClass }">
      <!-- 标题、恢复按钮、关闭按钮 -->
      <div class="flex justify-between items-center">
        <h4 :id="titleId" :class="titleClass">{{ t('sidebar.version.compare') }}</h4>
        <div>
          <el-button link :size="iconSize" @click="$emit('restoreVersion', comparedVersion, comparedContent)"
            :icon="RefreshLeft" class="!rounded-md" />
          <el-button link @click="closeDialog" class="!rounded-md" :size="iconSize" :icon="Close" />
        </div>
      </div>
    </template>
    <div class="flex h-[calc(100vh-100px)] border border-gray-200 dark:border-gray-700 rounded-md">
      <!-- 当前版本 -->
      <div class="flex-1 overflow-auto p-4 border-r border-gray-200 dark:border-gray-700">
        <div class="font-medium mb-2 text-gray-900 dark:text-gray-100">
          {{ t('sidebar.version.current') }}
        </div>
        <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <pre class="whitespace-pre-wrap font-mono text-sm">{{ currentContent }}</pre>
        </div>
      </div>

      <!-- 历史版本 -->
      <div class="flex-1 overflow-auto p-4">
        <div class="font-medium mb-2 text-gray-900 dark:text-gray-100">
          {{ t('sidebar.version.history') }} ({{ formatDate(comparedVersion?.createdAt, "YYYY-MM-DD HH:mm:ss") }})
        </div>
        <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <pre class="whitespace-pre-wrap font-mono text-sm">{{ comparedContent }}</pre>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/formatUtil'
import { RefreshLeft, Close } from '@element-plus/icons-vue'
import { milkdownManager } from '@/services/milkdownManager'
import { ref, PropType } from 'vue'
import { versionService } from '@/services/versions/versionService';
import { VersionInfo } from '@/types/appTypes'

const { t } = useI18n()
const iconSize = "large"
const props = defineProps({
  comparedVersion: {
    type: Object as PropType<VersionInfo>,
    required: true
  },
})
const comparedContent = ref<string>('')
const currentContent = ref<string>('')
const updateContent = (id: string, filePath: string) => {
  currentContent.value = milkdownManager.getEditor(id)?.getContent() ?? ''
  versionService.getVersion(filePath, props.comparedVersion.id).then(content => {
    comparedContent.value = content ?? ''
  })
}
const closeDialog = () => {
  emit('close')
  comparedContent.value = ''
  currentContent.value = ''
}
defineExpose({ updateContent })
const emit = defineEmits(['restoreVersion', 'close'])
</script>