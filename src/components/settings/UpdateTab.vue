<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateService } from '@/services/update/updateService'
import { dialogService } from '@/services/dialog/dialogService'
import { Download, Refresh, CircleCheck } from '@element-plus/icons-vue'

const { t } = useI18n()

const currentVersion = ref('')
const isChecking = ref(false)
const hasUpdate = ref(false)
const latestVersion = ref('')
const downloadProgress = ref(0)
const isDownloading = ref(false)

onMounted(async () => {
  currentVersion.value = await updateService.getCurrentVersion()
})
const checkUpdates = async () => {
  isChecking.value = true
  try {
    const result = await updateService.checkForUpdates()
    console.log(result)
    hasUpdate.value = result.hasUpdate
    latestVersion.value = result.latestVersion
    if (!result.hasUpdate) {
      dialogService.success(t('settings.update.noUpdate'))
    }
  } catch (error) {
    console.log(error)
    dialogService.error(t('settings.update.checkFailed'))
  } finally {
    isChecking.value = false
  }
}

const downloadUpdate = async () => {
  isDownloading.value = true
  downloadProgress.value = 0
  try {
    await updateService.downloadAndInstall((progress) => {
      downloadProgress.value = progress
    })
  } catch (error) {
    dialogService.error(t('settings.update.downloadFailed'))
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('settings.update.currentVersion') }}</p>
          <p class="text-lg font-medium">{{ currentVersion }}</p>
        </div>
        <div v-if="hasUpdate" class="text-right">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('settings.update.latestVersion') }}</p>
          <p class="text-lg font-medium text-green-600 dark:text-green-400">{{ latestVersion }}</p>
        </div>
      </div>
    </div>

    <div>
      <el-button @click="checkUpdates" :loading="isChecking" :disabled="isDownloading">
        <el-icon>
          <Refresh />
        </el-icon>
        {{ isChecking ? t('settings.update.checking') : t('settings.update.check') }}
      </el-button>

      <el-button v-if="hasUpdate" @click="downloadUpdate" :loading="isDownloading">
        <el-icon>
          <Download />
        </el-icon>
        {{ isDownloading ? t('settings.update.downloading') : t('settings.update.download') }}
      </el-button>
    </div>

    <div v-if="isDownloading" class="space-y-2">
      <div class="flex justify-between text-sm">
        <span>{{ t('settings.update.downloadProgress') }}</span>
        <span>{{ downloadProgress }}%</span>
      </div>
      <el-progress :percentage="downloadProgress" :stroke-width="20" />
    </div>

    <div v-if="!hasUpdate && !isChecking" class="flex items-center text-green-600 dark:text-green-400">
      <el-icon>
        <CircleCheck />
      </el-icon>
      <span class="ml-2">{{ t('settings.update.upToDate') }}</span>
    </div>

    <div class="text-sm text-gray-500 dark:text-gray-400 mt-6">
      <p>{{ t('settings.update.info') }}</p>
      <ul class="list-disc list-inside mt-2 space-y-1">
        <li>{{ t('settings.update.info1') }}</li>
        <li>{{ t('settings.update.info2') }}</li>
        <li>{{ t('settings.update.info3') }}</li>
      </ul>
    </div>
  </div>
</template>
