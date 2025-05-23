import { fileService } from '../services/files/fileService';
import type { AppFileInfo, EditorTab, ViewMode } from '@/types/app-types.ts';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTabStore } from '@/stores/tabStore';
import { TabBehavior } from '@/types/app-settings';
import { useVersion } from '@/components/version/useVersion';
import { useFileStore } from '@/stores/fileStore';
import { dialogService } from '@/services/dialog/dialogService';
import { useDebounceFn } from '@vueuse/core';
import i18n from '@/i18n';
import { milkdownManager } from '@/services/milkdownManager';
const { t } = i18n.global
import { Mutex } from 'async-mutex';
import { CodeError } from '@/services/codeService';
import { statusCode } from '@/utils/statusCodes';
import { getExtname, getFilename } from '@/utils/pathUtil';

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
      tabBehavior?: TabBehavior;
      pinTab?: boolean;
      viewMode?: ViewMode;
    }
  ) {
    try {
      // 如果文件已经打开，则激活当前文件
      const tab = tabStore.getByFilePath(fileInfo.path)
      if (tab) {
        tabStore.switchTab(tab.id)
      }
      tabStore.openInTab({
        tabBehavior: options?.tabBehavior ? options?.tabBehavior : settingsStore.state.appearance.tabBehavior,
        title: fileInfo.name,
        filePath: fileInfo.path,
        isPinned: options?.pinTab,
      });
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }
  const _saveVersion = useDebounceFn((fileInfo: AppFileInfo, content: string, message?: string) => {
    // 创建版本记录
    saveVersion(fileInfo,content, message);
  }, 60 * 1000 * settingsStore.state.file.history.autoSaveInterval)
  async function _saveFile(
    tab: EditorTab,
    content: string,
    options?: { manual?: boolean; versionMessage?: string; }) {
    const fileInfo = fileStore.get(tab.filePath ?? '');
    if (!fileInfo) return false;
    try {
      if (settingsStore.state.file.history.autoSave) {
        _saveVersion(fileInfo,content, options?.versionMessage)
      }
      // 检查版本是否一致
      let stat = await fileService.getStat(fileInfo);
      if (stat.version !== fileInfo.version) {
        const result = await dialogService.confirm({
          title: t('dialog.versionConflict.title'),
          message: t('dialog.versionConflict.message'),
          confirmButtonText: t('dialog.button.continueSave'),
          cancelButtonText: t('dialog.button.cancel'),
        })
        if (result) {
          return false;
        }
      }
    } catch (e) {
      console.log(e)
    }
    try {
      // 写入文件：如果是空文件fetch报错，则用空格代替
      await fileService.writeTextFile(fileInfo, content || ' ');
      const stat = await fileService.getStat(fileInfo)
      fileStore.set([stat])
      tabStore.save(tab.id, tab.edit?.version ?? 0);
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
    const tab = tabStore.state[tabId];
    if (!tab.edit?.unsaved || !tab.filePath) return false;
    // 保存session快照
    const tabCopy = Object.assign({}, tabStore.state[tabId]);
    const lock = getFileLock(tab.filePath);
    await lock.runExclusive(async () => {
      await _saveFile(tabCopy, content, options)
    })
  }
  function saveAsFile() {
    const tab = tabStore.activeTab
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
      if (!settingsStore.state.file.save.autoSave) {
        for (const session of Object.values(tabStore.state)) {
          if (session.edit?.unsaved) {
            event.preventDefault();
            break;
          }
        }
      } else {
        dialogService.alert({
          title: t('dialog.unsavedChanges.title'),
          message: t('dialog.unsavedChanges.message'),
        })
      }
    });
  }
  async function restoreSession() {
    await Promise.all(Object.values(tabStore.state).map(async (tab) => {
      if (!tab.filePath) return
      try {
        const fileInfo = fileStore.get(tab.filePath);
        if (!fileInfo) {
          tabStore.closeTab(tab.id)
          return
        }
      } catch (e) {
        // 删除tab和session
        tabStore.closeTab(tab.id)
        return
      }
    }))
  }
  async function readFileByTabId(id: string): Promise<string> {
    if (!tabStore.state[id].filePath) {
      throw new CodeError(statusCode.FILE_NOT_FOUND)
    }
    const fileInfo = fileStore.get(tabStore.state[id].filePath)
    if (!fileInfo) {
      throw new CodeError(statusCode.FILE_NOT_FOUND)
    };
    const content = await fileService.readTextFile(fileInfo);
    return content;
  }
  const closeTab = async (tabId: string) => {
    const tab = tabStore.state[tabId];
    if (!tab) return;
    if (tab.edit?.unsaved) {
      const result = await dialogService.confirm({
        title: t('dialog.unsavedChanges.title'),
        message: t('dialog.unsavedChanges.message'),
      })
      if (result) {
        return
      }
    }
    tabStore.closeTab(tabId);
  }
  return {
    openFileOnTab,
    saveFile,
    usePreventUnsaveLoss,
    restoreSession,
    saveAsFile,
    readFileByTabId, closeTab
  };
}
