<script setup lang="ts">
import { AppFileInfo } from '@/types/appTypes'
import { InfoFilled } from '@element-plus/icons-vue'
import { formatDate, formatFileSize } from '@/utils/formatUtil'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  file: {
    type: [null, Object as () => AppFileInfo], // 如果是null，default会覆盖
    required: true,
    default: () => ({
      name: '',
      path: '',
      isDir: false,
      storageLocation: '',
      size: 0,
    }),
  },
})

const emit = defineEmits(['close'])
const width = "310px"
</script>

<template>
  <el-dialog :modal="false" draggable append-to-body :width="width">
    <template #header>
      <div class="flex items-center gap-2 text-primary">
        <el-icon>
          <InfoFilled />
        </el-icon>
        <span class="font-medium">{{ t('fileTree.properties') }}</span>
      </div>
    </template>
    <div class="max-h-[70vh] overflow-y-auto pr-2">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item :label="t('fileTree.name')" label-class-name="!w-20 !text-gray-500 !font-medium">
          <el-tooltip :content="file?.name" placement="top">
            <span class="inline-block max-w-[200px] truncate">{{ file?.name }}</span>
          </el-tooltip>
        </el-descriptions-item>

        <el-descriptions-item :label="t('fileTree.path')" label-class-name="!w-20 !text-gray-500 !font-medium">
          <el-tooltip :content="file?.path" placement="top">
            <span class="inline-block max-w-[200px] truncate">{{ file?.path }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item :label="t('fileTree.storageLocation')"
          label-class-name="!w-20 !text-gray-500 !font-medium">
          {{ file?.storageLocation }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('fileTree.fileType')" label-class-name="!w-20 !text-gray-500 !font-medium">
          {{ file?.isDir ? t('fileTree.directory') : t('fileTree.file') }}
        </el-descriptions-item>

        <el-descriptions-item v-if="!file?.isDir" :label="t('fileTree.size')"
          label-class-name="!w-20 !text-gray-500 !font-medium">
          {{ file?.size ? formatFileSize(file.size) : '-' }}
        </el-descriptions-item>

        <el-descriptions-item :label="t('fileTree.modifiedTime')" label-class-name="!w-20 !text-gray-500 !font-medium">
          {{ file?.lastModified ? formatDate(file.lastModified, 'YYYY-MM-DD HH:mm:ss') : '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>