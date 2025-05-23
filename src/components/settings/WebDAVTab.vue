<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { webdavFileService } from '@/services/files/webdav/webdavFileService'
import { useI18n } from 'vue-i18n'
import { useFileTree } from '@/composable/useFileTree'
const { addFileTree } = useFileTree()
import { dialogService } from '@/services/dialog/dialogService'

const settings = useSettingsStore()
const { t } = useI18n()

const isTesting = ref(false)
const isConnecting = ref(false)
const testResult = ref<null | { success: boolean; message: string }>(null)

const connection = async (isTest: boolean) => {
  if (!settings.state.webdav.serverUrl || !settings.state.webdav.username) {
    testResult.value = {
      success: false,
      message: t('notify.errors.missingCredentials')
    }
    return
  }
  testResult.value = null
  try {
    let success: boolean
    if (isTest) {
      isTesting.value = true
      success = await webdavFileService.testConnection(
        settings.state.webdav.serverUrl,
        settings.state.webdav.username,
        settings.state.webdav.password
      )
    } else {
      isConnecting.value = true
      success = await webdavFileService.connect(
        settings.state.webdav.serverUrl,
        settings.state.webdav.username,
        settings.state.webdav.password
      )
      if (success) {
        await addFileTree({
          path: settings.state.webdav.serverUrl,
          storageLocation: 'webdav',
          isDir: true,
        })
      }
    }
    testResult.value = {
      success,
      message: success ? t('notify.success.connectionSuccess') : t('notify.errors.connectionFailed')
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: t('notify.errors.connectionError', { error: error instanceof Error ? error.message : String(error) })
    }
  } finally {
    isTesting.value = false
    isConnecting.value = false
  }
}
const resetConnection=()=>{
  dialogService.confirm({
    title: t('dialog.resetConnection.title'),
    message: t('dialog.resetConnection.message'),
  }).then((res) => {
    if(res){
      settings.resetWebdav()
      testResult.value = null
      isTesting.value = false
      isConnecting.value = false
    }})
}
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ t('settings.webdav.label') }}
    </h3>

    <el-form label-position="top" class="space-y-4">
      <el-form-item :label="t('settings.webdav.serverUrl.label')">
        <el-input v-model="settings.settings.webdav.serverUrl" :placeholder="t('settings.webdav.serverUrl.placeholder')"
          class="w-full max-w-md" />
      </el-form-item>

      <el-form-item :label="t('settings.webdav.username.label')">
        <el-input v-model="settings.settings.webdav.username" :placeholder="t('settings.webdav.username.placeholder')"
          class="w-full max-w-md" />
      </el-form-item>

      <el-form-item :label="t('settings.webdav.password.label')">
        <el-input v-model="settings.settings.webdav.password" type="password"
          :placeholder="t('settings.webdav.password.placeholder')" class="w-full max-w-md" show-password />
      </el-form-item>

      <el-form-item>
        <el-switch v-model="settings.settings.webdav.autoConnect" />
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {{ t('settings.webdav.autoConnect.label') }}
        </span>
      </el-form-item>
    </el-form>

    <div class="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4">
      <el-button type="primary" @click="connection(true)" :loading="isTesting" class="px-6">
        {{ isTesting ? t('settings.webdav.testing') : t('settings.webdav.testConnection') }}
      </el-button>
      <el-button type="primary" @click="connection(false)" class="px-6" :loading="isConnecting">
        {{ isConnecting ? t('settings.webdav.connecting') : t('settings.webdav.connect') }}
      </el-button>
      <el-button text @click="resetConnection" class="px-6">
        {{ t('settings.webdav.resetConnection') }}
      </el-button>
      <div v-if="testResult" :class="{
        'text-green-600 dark:text-green-400': testResult.success,
        'text-red-600 dark:text-red-400': !testResult.success
      }" class="text-sm px-3 py-1.5 rounded">
        {{ testResult.message }}
      </div>
    </div>
  </div>
</template>