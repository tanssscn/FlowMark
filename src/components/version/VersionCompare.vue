<template>
  <!-- 版本对比对话框 -->
  <el-dialog append-to-body width="100%" fullscreen class="!rounded-lg" :show-close="false" destroy-on-close>
    <template #header="{ close, titleId, titleClass }">
      <!-- 标题、恢复按钮、关闭按钮 -->
      <div class="flex justify-between items-center">
        <h4 :id="titleId" :class="titleClass">{{ t('version.compare') }}</h4>
        <div>
          <el-button link :size="iconSize" @click="toggleView" :icon="View" />
          <el-button link :size="iconSize" @click="$emit('restoreVersion', version, comparedContent)"
            :icon="RefreshLeft" />
          <el-button link @click="closeDialog" :size="iconSize" :icon="Close" />
        </div>
      </div>
    </template>
    <el-splitter>
    <el-splitter-panel>
      <div class="font-medium mb-2 text-gray-900 dark:text-gray-100">
        {{ t('version.current') }}
      </div>
      <div v-if="renderMd">
        <MilkdownProvider>
          <MarkdownPreview :value="currentContent" />
        </MilkdownProvider>
      </div>
      <div v-else class="p-2 bg-gray-50 dark:bg-gray-900 rounded">
        <pre class="whitespace-pre-wrap font-mono text-sm">{{ currentContent }}</pre>
      </div>
    </el-splitter-panel>
    <el-splitter-panel>
      <div class="font-medium mb-2 text-gray-900 dark:text-gray-100">
        {{ t('version.history') }} ({{ formatDate(version?.createdAt!, "YYYY-MM-DD HH:mm:ss") }})
      </div>
      <div>
        <MilkdownProvider v-if="renderMd">
          <MarkdownPreview :value="comparedContent" />
        </MilkdownProvider>
        <div v-else class="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <pre class="whitespace-pre-wrap font-mono text-sm">{{ comparedContent }}</pre>
        </div>
      </div>
      </el-splitter-panel>
    </el-splitter>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/formatUtil'
import { RefreshLeft, View, Close } from '@element-plus/icons-vue'
import { milkdownManager } from '@/services/milkdownManager'
import { ref } from 'vue'
import { versionService } from '@/services/versions/versionService';
import { VersionInfo } from '@/types/appTypes'
import SplitPane from '@/components/common/splitPanel/SplitPanel.vue'
import MarkdownPreview from '@/components/common/markdown/MarkdownPreview.vue'
import { MilkdownProvider } from '@milkdown/vue';

const { t } = useI18n()
const renderMd = ref(false)
const toggleView = () => {
  renderMd.value = !renderMd.value
}
const iconSize = "large"
const comparedContent = ref<string>('')
const currentContent = ref<string>('')
const version = ref<VersionInfo>()
const updateContent = (id: string, filePath: string, _version: VersionInfo) => {
  version.value = _version
  currentContent.value = milkdownManager.getEditor(id)?.getContent() ?? ''
  versionService.getVersion(filePath, _version.id).then(content => {
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