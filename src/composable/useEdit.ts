import { fileService } from '../services/files/fileService';
import type { AppFileInfo, EditorTab, ViewMode } from '@/types/appTypes';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTabStore } from '@/stores/tabStore';
import { useVersion } from '@/components/sidebar/version/composable/useVersion';
import { useFileStore } from '@/stores/fileTreeStore';
import { dialogService } from '@/services/dialog/dialogService';
import { useDebounceFn } from '@vueuse/core';
import i18n from '@/i18n';
import { milkdownManager } from '@/services/milkdownManager';
const { t } = i18n.global
import { Mutex } from 'async-mutex';
import { ErrorStatus } from '@/services/codeService';
import { statusCode } from '@/utils/statusCodes';
import { getExtname, getFilename } from '@/utils/pathUtil';
import { windowServer } from '@/services/window/windowService';
const fileLocks = new Map<string, Mutex>();

/**
 * 函数闭包中的状态不会被销毁
 * @returns 
 */
export function useEdit() {
  const settingsStore = useSettingsStore()
  const tabStore = useTabStore()
  const fileStore = useFileStore()
  // 加载最近文件列表
  const { saveVersion } = useVersion();
  function getFileLock(filePath: string): Mutex {
    if (!fileLocks.has(filePath)) {
      fileLocks.set(filePath, new Mutex());
    }
    return fileLocks.get(filePath)!;
  }
  async function openFileOnTab(
    fileInfo: AppFileInfo,
    options?: {
      pinTab?: boolean;
      viewMode?: ViewMode;
    }
  ) {
    try {
      // 如果文件已经打开
      if (tabStore.isCurrentTabByFilePath(fileInfo.path)) {
        return;
      }
      // 关闭当前文件：打开新文件前，检查当前文件是否保存
      await closeTab()
      const tab = tabStore.openInTab({
        filePath: fileInfo.path,
        isPinned: options?.pinTab,
      });
      setWindowTitle();
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }
  const _saveVersion = useDebounceFn((fileInfo: AppFileInfo, content: string, message?: string) => {
    // 创建版本记录
    saveVersion(fileInfo, content, message);
  }, 60 * 1000 * settingsStore.state.file.history.autoSaveInterval)

  async function _saveFile(
    tab: EditorTab,
    content: string,
    options?: { manual?: boolean; versionMessage?: string; }) {
    const fileInfo = fileStore.get(tab.filePath ?? '');
    if (!fileInfo) return false;
    try {
      if (settingsStore.state.file.history.autoSave) {
        _saveVersion(fileInfo, content, options?.versionMessage)
      }
      // 检查版本是否一致
      let stat = await fileService.getStat(fileInfo);
      if (stat.version !== fileInfo.version) {
        const result = await dialogService.confirm({
          title: t('dialog.versionConflict.title'),
          message: t('dialog.versionConflict.message'),
          confirmButtonText: t('dialog.button.continueSave'),
          cancelButtonText: t('common.cancel'),
        })
        if (!result) {
          return false;
        }
      }
    } catch {
    }
    try {
      await fileService.writeTextFile(fileInfo, content);
      const stat = await fileService.getStat(fileInfo)
      fileStore.set([stat])
      tabStore.save(tab.edit?.version ?? 0);
      return true;
    } catch (e: any) {
      console.error(e)
      dialogService.error(t('notify.errors.saveFailed'))
      return false;
    }
  }
  async function saveFile(
    tabId: string,
    content: string,
    options?: {
      manual?: boolean;
      versionMessage?: string;
    }) {
    const tab = tabStore.currentTab;
    if (!tab || tab.id !== tabId || !tab.edit?.unsaved || !tab.filePath) return false;
    const tabCopy = { ...tab };
    const lock = getFileLock(tab.filePath);
    return await lock.runExclusive(async () => {
      return await _saveFile(tabCopy, content, options)
    })
  }

  function saveAsFile() {
    const tab = tabStore.state!;
    if (!tab || !tab.filePath) return
    const ext = getExtname(tab.filePath)
    fileService.saveFileDialog({
      title: t('dialog.saveAs.title'),
      filters: [{ name: ext, extensions: [ext] }],
    }).then((path) => {
      if (path && tab.filePath) {
        const fileInfo: AppFileInfo = {
          path,
          name: getFilename(path),
          lastModified: 0,
          storageLocation: 'local',
          isDir: false,
        };
        fileStore.set([fileInfo])
        tabStore.updatePath(tab.filePath, path)
        milkdownManager.getEditor(tab.id)?.saveFile()
      }
    });
  }

  function usePreventUnsaveLoss() {
    addEventListener("beforeunload", (event) => {
      if (!settingsStore.state.file.save.autoSave && tabStore.currentTab?.edit?.unsaved) {
        event.preventDefault();
        event.returnValue = '';
      }
    })
  }
  async function restoreSession() {
    if (!tabStore.currentTab?.filePath) return
    try {
      const fileInfo = fileStore.get(tabStore.currentTab.filePath);
      if (!fileInfo) {
        tabStore.closeTab()
      }
    } catch {
      tabStore.closeTab()
    }
  }
  async function readFileByTabId(id: string): Promise<string> {
    const tab = tabStore.currentTab;
    if (!tab || tab.id !== id || !tab.filePath) {
      throw new ErrorStatus(statusCode.FILE_NOT_FOUND)
    }
    const fileInfo = fileStore.get(tab.filePath)
    if (!fileInfo) {
      throw new ErrorStatus(statusCode.FILE_NOT_FOUND)
    };
    try {
      const content = await fileService.readTextFile(fileInfo);
      return content;
    } catch {
      throw new ErrorStatus(statusCode.FILE_NOT_FOUND)
    }
  }
  const closeTab = async () => {
    const tab = tabStore.currentTab;
    if (!tab) return;
    if (tab.edit?.unsaved) {
      const result = await dialogService.confirm({
        title: t('dialog.unsavedChanges.title'),
        message: t('dialog.unsavedChanges.message'),
      })
      if (result) {
        await milkdownManager.getEditor(tab.id)?.saveFile()
        return
      }
    }
    tabStore.closeTab();
  }
  const setWindowTitle = async () => {
    console.log('setWindowTitle');
    await windowServer.setWindowTitle(tabStore.state?.title || '');
  }
  const setUnsavedWindowTitle = async () => {
    console.log('setUnsavedWindowTitle');
    await windowServer.setWindowTitle(tabStore.state?.title + ' *');
  }
  return {
    openFileOnTab,
    saveFile,
    usePreventUnsaveLoss,
    restoreSession,
    saveAsFile,
    readFileByTabId,
    closeTab,
    setWindowTitle,
    setUnsavedWindowTitle,
  };
}
