import { useSettingsStore } from '@/stores/settingsStore';
import { useTabStore } from '@/stores/tabStore';
import { useFile } from './useFile';
import { useEdit } from './useEdit';
import { useFileStore } from '@/stores/fileTreeStore';
import { restoreApp } from '@/services/persistService';
import { initTauriMenu } from '@/components/header/composable/client/tauriMenu'
import { getDeviceInfo } from '@/services/deviceService';
import type { AppFileInfo } from '@/types/appTypes';
import { dialogService } from '@/services/dialog/dialogService';
import i18n from '@/i18n';
import { webdavFileService } from '@/services/files/webdav/webdavFileService';
import { WebDAVSettings } from '@/types/appSettings';

const { t } = i18n.global


export function useWindow() {
  const { refresh, addWebDavFileTree } = useFile()
  const { restoreSession } = useEdit()
  const settingsStore = useSettingsStore()
  const fileStore = useFileStore();
  const tabStore = useTabStore();
  const isBrowser = getDeviceInfo().isBrowser;

  async function connectWithRetry(webdav: WebDAVSettings) {
    if (webdav.showInFileTree) {
      if (webdav.url && webdav.username && webdav.password) {
        const connected = await webdavFileService.connect(webdav.url, webdav.username, webdav.password)
        if (connected) {
          addWebDavFileTree({ path: webdav.url, storageLocation: 'webdav', isDir: true, username: webdav.username, rootPath: webdav.url })
        } else {
          dialogService.confirm({
            title: t('notify.errors.connectionFailed'),
            message: t('notify.errors.checkSettingOrNetwork'),
            type: 'error',
            confirmButtonText: t('notify.actions.retry'),
            cancelButtonText: t('notify.actions.removeFromTree'),
          }).then(async (res) => {
            if (res) {
              await connectWithRetry(webdav)
            } else {
              // 从文件树中移除
              fileStore.removeRoot(webdav.url)
              settingsStore.setWebdavShowInFileTree(webdav, false)
            }
          })
        }
      }
    } else {
      fileStore.removeRoot(webdav.url)
    }
  }
  // 恢复窗口状态
  async function restoreWindow() {
    await fileStore.withAutoLoading(async () => {
      // 链接webdav
      const webdavs = settingsStore.state.webdav
      await Promise.allSettled(webdavs.map(async (webdav) => {
        await connectWithRetry(webdav)
      }))
      // 恢复上一次会话
      if (restoreApp.isRestoreLastSession()) {
        await Promise.allSettled(Object.values(fileStore.state.treeRoot).map(async (fileInfo: AppFileInfo) => {
          const res = await refresh(fileInfo, false)
          if (fileStore.get(fileInfo.path) === undefined) {
            fileStore.removeRoot(fileInfo.path)
          }
        }))
        await restoreSession()
      }
      if (!tabStore.state?.filePath) {
        tabStore.openWelcomeTab()
      }
    })
  }

  async function initMenu() {
    if ((!isBrowser)) {
      await initTauriMenu()
    }
  }
  function clearCache() {
    dialogService.confirm({
      title: t("dialog.clearCache.title"),
      message: t("dialog.clearCache.message"),
    }).then((confirm) => {
      if (confirm) {
        Object.keys(localStorage).forEach((key) => {
          if (key !== 'settings') {
            localStorage.removeItem(key)
          }
        })
        location.reload()
      }
    })
  }

  return {
    restoreWindow,
    initMenu,
    clearCache,
    connectWithRetry,
  };
}
