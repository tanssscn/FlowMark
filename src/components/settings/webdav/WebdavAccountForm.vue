<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { webdavFileService } from '@/services/files/webdav/webdavFileService'
import { useI18n } from 'vue-i18n'
import { useFile } from '@/composable/useFile'
import { dialogService } from '@/services/dialog/dialogService'
import type { WebDAVSettings } from '@/types/appSettings'
const { addWebDavFileTree, removeFromTree } = useFile()
import { isEqual } from 'es-toolkit/predicate';

const settings = useSettingsStore()
const { t } = useI18n()
const props = defineProps<{
  mode: 'add' | 'edit'
  account?: WebDAVSettings | null
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()


// 表单数据
const formData = reactive({
  title: '',
  url: '',
  username: '',
  password: '',
  showInFileTree: true,
})

// 状态
const isTesting = ref(false)
const isConnecting = ref(false)
const testResult = ref<null | { success: boolean; message: string }>(null)

// 编辑时回填数据
watch(() => props.account, (account) => {
  if (account && props.mode === 'edit') {
    formData.title = account.title || ''
    formData.url = account.url
    formData.username = account.username
    formData.password = account.password || ''
    formData.showInFileTree = account.showInFileTree !== undefined ? account.showInFileTree : true
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  formData.title = ''
  formData.url = ''
  formData.username = ''
  formData.password = ''
  formData.showInFileTree = true
  testResult.value = null
}

// 测试连接
const testConnection = async () => {
  if (!formData.url || !formData.username) {
    testResult.value = {
      success: false,
      message: t('notify.errors.missingCredentials')
    }
    return
  }
  testResult.value = null
  isTesting.value = true
  try {
    const success = await webdavFileService.testConnection(
      formData.url,
      formData.username,
      formData.password
    )
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
  }
}

// 保存账号
const saveAccount = async () => {
  if (!formData.url || !formData.username) {
    dialogService.warning(t('settings.webdav.errors.fillRequired'))
    return
  }

  isConnecting.value = true
  try {
    // 先测试连接
    const success = await webdavFileService.testConnection(
      formData.url,
      formData.username,
      formData.password
    )

    if (!success) {
      dialogService.error(t('settings.webdav.errors.connectionFailed'))
      return
    }

    // 构建账号对象
    const accountData: WebDAVSettings = {
      title: formData.title || undefined,
      url: formData.url,
      username: formData.username,
      password: formData.password,
      showInFileTree: formData.showInFileTree,
    }

    if (props.mode === 'add') {
      // 添加新账号
      if (settings.isExistedWebdavAccount(accountData)) {
        dialogService.error(t('notify.errors.accountAlreadyExists'))
        return; // 返回，不保存账号
      }
      const account = settings.addWebdavAccount(accountData)
      if (formData.showInFileTree) {
        addWebdavToFileTree(account)
      }
    } else {
      // 更新账号
      if (!props.account) {
        return
      }
      if (isEqual(props.account, accountData)) {
        emit('success')
        return;
      }
      // 更新账号
      const account = settings.updateWebdavAccount(props.account, accountData)
      if (account === props.account) {
        dialogService.error(t('notify.errors.accountAlreadyExists'))
        return;
      }
      // 如果修改了 URL，需要更新文件树
      if (props.account.url !== formData.url) {
        removeFromTree({ path: props.account.url, children: [] })
        addWebdavToFileTree(account)
      }
    }

    emit('success')
    resetForm()
  } catch (error) {
    console.log('保存账号失败:', error); // 打印错误信息到控制台
    dialogService.error(t('settings.webdav.errors.saveFailed'))
  } finally {
    isConnecting.value = false
  }
}

const addWebdavToFileTree = (formData: WebDAVSettings) => {
  webdavFileService.connect(formData.url, formData.username, formData.password).then((connected) => { // 连接成功后
    if (connected) { // 如果连接成功，更新文件树
      addWebDavFileTree({
        path: formData.url,
        storageLocation: 'webdav',
        isDir: true,
        username: formData.username,
        rootPath: formData.url, // 更新根路径
      })
    }
  })
}

// 取消
const handleCancel = () => {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <div class="space-y-4">
    <el-form label-width="auto">
      <!-- 服务器地址 -->
      <el-form-item :label="t('settings.webdav.url.label')" required>
        <el-input v-model="formData.url" :placeholder="t('settings.webdav.url.placeholder')" />
      </el-form-item>

      <!-- 用户名 -->
      <el-form-item :label="t('settings.webdav.username.label')" required>
        <el-input v-model="formData.username" :placeholder="t('settings.webdav.username.placeholder')" />
      </el-form-item>

      <!-- 密码 -->
      <el-form-item :label="t('settings.webdav.password.label')">
        <el-input v-model="formData.password" type="password" :placeholder="t('settings.webdav.password.placeholder')"
          show-password />
      </el-form-item>
      <!-- 自定义标题 -->
      <el-form-item :label="t('settings.webdav.title.label')">
        <el-input v-model="formData.title" :placeholder="t('settings.webdav.title.placeholder')" maxlength="50"
          show-word-limit />
      </el-form-item>
      <!-- 选项 -->
      <div class="space-y-2">
        <el-form-item>
          <el-switch v-model="formData.showInFileTree" />
          <span class="ml-2 text-sm">
            {{ t('settings.webdav.showInFileTree.label') }}
          </span>
        </el-form-item>
      </div>
    </el-form>
    <!-- 测试结果 -->
    <div v-if="testResult" class="text-sm p-2 rounded" :class="{
      'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400': testResult.success,
      'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400': !testResult.success
    }">
      {{ testResult.message }}
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center gap-3 pt-4 border-t">
      <el-button @click="testConnection" :loading="isTesting">
        {{ isTesting ? t('settings.webdav.testing') : t('settings.webdav.testConnection') }}
      </el-button>
      <el-button type="primary" @click="saveAccount" :loading="isConnecting">
        {{ isConnecting ? t('settings.webdav.saving') : t('common.save') }}
      </el-button>
      <el-button @click="handleCancel">
        {{ t('common.cancel') }}
      </el-button>
    </div>
  </div>
</template>