<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useI18n } from 'vue-i18n'
import { useFileTree } from '@/composable/useFileTree'
import { dialogService } from '@/services/dialog/dialogService'
import type { WebDAVSettings } from 'src/types/appSettings'
import IconCustomMore from "~icons/custom/more"
import IconCustomEdit from "~icons/custom/edit"
import IconCustomDelete from "~icons/custom/delete"
import { webdavFileService } from '@/services/files/webdav/webdavFileService'

const { addFileTree, removeFromTree } = useFileTree()
const settings = useSettingsStore()
const { t } = useI18n()

// 状态
const showForm = ref(false)
const editingAccount = ref<WebDAVSettings | null>(null)
const formMode = ref<'add' | 'edit'>('add')

// 计算属性：获取所有账号
const accounts = computed(() => {
  return settings.state.webdav
})

// 判断是否达到最大数量 (10个)
const isMaxAccounts = computed(() => {
  return accounts.value.length >= 10
})

// 打开添加表单
const handleAdd = () => {
  if (isMaxAccounts.value) {
    dialogService.warning(t('settings.webdav.maxAccountsReached'))
    return
  }
  formMode.value = 'add'
  editingAccount.value = null
  showForm.value = true
}

// 打开编辑表单
const handleEdit = (account: WebDAVSettings) => {
  formMode.value = 'edit'
  editingAccount.value = { ...account }
  showForm.value = true
}

// 删除账号
const handleDelete = async (account: WebDAVSettings) => {
  try {
    dialogService.confirm({
      message: t('notify.warning.deleteConfirm', { title: account.title || account.url }),
      title: t('notify.warning.label'),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }).then(res => {
      if (!res) return
      settings.removeWebdavAccount(account)
      dialogService.success()
    })
  } catch {
    // 用户取消
  }
}

// 切换文件树显示状态
const toggleShowInTree = (account: WebDAVSettings) => {
  const newAccount = settings.updateWebdavAccount(account, {
    showInFileTree: !account.showInFileTree
  })
  if (newAccount.showInFileTree) {
    webdavFileService.connect(newAccount.url, newAccount.username, newAccount.password).then((res) => {
      if (res) { // 连接成功
        addFileTree({
          path: newAccount.url,
          storageLocation: 'webdav',
          isDir: true,
          username: newAccount.username,
          rootPath: newAccount.url,
        })
      }
    })
  } else {
    removeFromTree({ path: account.url, children: [] })
  }
}

// 表单提交成功
const onFormSuccess = () => {
  showForm.value = false
  editingAccount.value = null
  dialogService.success()
}

</script>

<template>
  <div class="space-y-4">
    <!-- 标题和添加按钮 -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium">
        {{ t('settings.webdav.accounts.label') }}
        <span class="text-sm font-normal text-gray-500">
          ({{ accounts.length }}/10)
        </span>
      </h3>
      <el-button type="primary" size="small" :disabled="isMaxAccounts" @click="handleAdd">
        {{ t('settings.webdav.accounts.add') }}
      </el-button>
    </div>

    <!-- 账号列表 -->
    <div v-if="accounts.length > 0" class="space-y-2">
      <div v-for="account in accounts" :key="account.url + account.username"
        class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- 开关和标签垂直排列 -->
          <div class="flex flex-col items-center gap-0.5 flex-shrink-0">
            <el-switch :model-value="account.showInFileTree" @change="toggleShowInTree(account)" size="small" />
            <span class="text-[10px] text-gray-400 dark:text-gray-500 leading-none">
              {{ t('settings.webdav.showInFileTree.label') }}
            </span>
          </div>
          <!-- 显示信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium truncate" v-if="account.title">
                {{ account.title }}
              </span>
              <span class="font-medium truncate" v-else>
                {{ account.username }}-{{ account.url }}
              </span>
            </div>
          </div>
        </div>

        <!-- 溢出菜单 -->
        <el-dropdown @command="(cmd: string) => {
          if (cmd === 'edit') handleEdit(account)
          else if (cmd === 'delete') handleDelete(account)
        }">
          <el-icon :size="24">
            <IconCustomMore />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <el-icon>
                  <IconCustomEdit />
                </el-icon>
                {{ t('common.edit') }}
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <el-icon>
                  <IconCustomDelete />
                </el-icon>
                {{ t('common.delete') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-8 text-gray-400">
      {{ t('settings.webdav.accounts.empty') }}
    </div>

    <!-- 添加/编辑表单弹窗 -->
    <el-dialog v-model="showForm"
      :title="formMode === 'add' ? t('settings.webdav.accounts.add') : t('settings.webdav.accounts.edit')" width="500px"
      destroy-on-close>
      <WebdavAccountForm :mode="formMode" :account="editingAccount" @success="onFormSuccess"
        @cancel="showForm = false" />
    </el-dialog>
  </div>
</template>

<style scoped>
.el-dropdown {
  flex-shrink: 0;
}
</style>