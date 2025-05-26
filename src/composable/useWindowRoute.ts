import { useSettingsStore } from '@/stores/settingsStore';
import { useTabStore } from '@/stores/tabStore';
import { useFileTree } from './useFileTree';
import { useEdit } from './useEdit';
import { useFileStore } from '@/stores/fileStore';
import { restoreApp } from '@/services/persistService';
import { initTauriMenu } from '@/components/header/client/tauriMenu'
import { getDeviceInfo } from '@/services/deviceService';
import { nextTick } from 'vue';
import type { AppFileInfo } from '@/types/appTypes';
import { useEventListener, useThrottleFn } from '@vueuse/core';
import { dialogService } from '@/services/dialog/dialogService';
import i18n from '@/i18n';
import { webdavFileService } from '@/services/files/webdav/webdavFileService';

const { t } = i18n.global


export function useWindowRoute() {
  const { refresh, addFileTree } = useFileTree()
  const { restoreSession } = useEdit()
  const settingsStore = useSettingsStore()
  const fileStore = useFileStore();
  const tabStore = useTabStore();
  const isBrowser = getDeviceInfo().isBrowser;

  // 恢复窗口状态
  async function restoreWindow() {
    await fileStore.withAutoLoading(async () => {
      // 链接webdav
      const webdav = settingsStore.state.webdav
      let connected = false
      if (webdav.serverUrl && webdav.username && webdav.password) {
        connected = await webdavFileService.connect(webdav.serverUrl, webdav.username, webdav.password)
        // 如果没有链接成功则清除 上次打开的数据
        if (!connected && fileStore.state.fileTree.get(webdav.serverUrl)) {
          fileStore.removeRoot(webdav.serverUrl)
        }
      }
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
      if (!tabStore.activeId) {
        tabStore.openWelcomeTab()
      }
      // 恢复窗口状态
      // if (settingsStore.state.webdav.autoConnect && (!restoreApp.isNewWindow)) {
      if (settingsStore.state.webdav.autoConnect && connected) {
        addFileTree({ path: settingsStore.state.webdav.serverUrl, storageLocation: 'webdav', isDir: true })
      }
    })
  }
  function handleScroll() {
    if (!isBrowser) return;
    // 智能头部隐藏逻辑
    let lastScroll = 0;
    const mainHeaderHeight = '46px'
    // 防抖处理滚动逻辑（默认 16ms，接近一帧的时间）
    const handleScroll = useThrottleFn(() => {
      const mainHeader = document.getElementById('mainHeader') as HTMLElement;
      const sidebar = document.getElementById('sidebar') as HTMLElement;
      const contentHeader = document.querySelector('.tabs-container .el-tabs__header') as HTMLElement;
      const currentScroll = window.scrollY;
      const mainHeaderVisible = mainHeader?.classList.contains('-translate-y-full');
      if (mainHeaderVisible && currentScroll >= lastScroll) {
        lastScroll = currentScroll;
        return
      } else if (!mainHeaderVisible && currentScroll <= lastScroll) {
        lastScroll = currentScroll;
        return
      }
      requestAnimationFrame(() => {
        // currentScroll > lastScroll : 向下滚动
        if (currentScroll >= lastScroll) {
          mainHeader?.classList.add('-translate-y-full');
          contentHeader.style.top = '0';
          sidebar.style.top = '0';
        } else {
          mainHeader?.classList.remove('-translate-y-full');
          contentHeader.style.top = mainHeaderHeight;
          sidebar.style.top = mainHeaderHeight;
          console.log(mainHeaderHeight)
        }
        lastScroll = currentScroll;
        console.log('scroll', currentScroll)
      });
    }, 200)

    // 自动注册和清理事件
    useEventListener(window, 'scroll', handleScroll);
  }
  async function initMenu() {
    if ((!isBrowser)) {
      await initTauriMenu()
    } else {
      await nextTick(() => {
        handleScroll()
      })
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
    handleScroll,
    initMenu,
    clearCache,
  };
}
