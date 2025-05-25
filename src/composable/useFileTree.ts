import { useFileStore } from '@/stores/fileStore';
import { fileService } from '../services/files/fileService';
import type { AppFileInfo, FileEntry } from '@/types/app-types.ts';
import { useRecentStore } from '@/stores/recentStore';
import { localFileService } from '@/services/files/local/localFileService';
import { CodeError } from '@/services/codeService';
import { isUserError, statusCode } from '@/utils/statusCodes';
import { useTabStore } from '@/stores/tabStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getDeviceInfo } from '@/services/deviceService';
import { getDirname, getFilename, getJoin } from '@/utils/pathUtil';
import { dialogService } from '@/services/dialog/dialogService';

/**
 * 文件树操作相关
 * 
 */
export function useFileTree() {
  const fileStore = useFileStore();
  const recentStore = useRecentStore();
  const tabStore = useTabStore()
  const settingsStore = useSettingsStore()
  const isBrowser = getDeviceInfo().isBrowser

  async function loadFiletreeAndRecent(fileEntry: FileEntry) {
    fileStore.loadFileTree(fileEntry)
    recentStore.addRecentFile(fileEntry)
  }
  async function openRecentFile(
    fileInfo: Pick<AppFileInfo, 'path' | 'isDir' | 'storageLocation'>,
  ) {
    if (isBrowser && fileInfo.storageLocation === 'local') {
      return
    }
    const _fileInfo = fileStore.get(fileInfo.path)
    if (_fileInfo) {
      return
    }
    let fileEntry
    try {
      if (fileInfo.isDir) {
        fileEntry = await fileService.readDirectory(fileInfo);
      } else {
        fileEntry = await fileService.getStat(fileInfo);
      }
    } catch (error) {
      if (isUserError(error)) {
        dialogService.notifyError(error)
        return
      }
    }
    if (fileEntry) {
      loadFiletreeAndRecent(fileEntry)
    }
  }
  /**
   * 打开文件夹，有弹窗
   */
  async function openFolder() {
    localFileService.openLocalFile({
      title: 'open folder',
      directory: true,
      multiple: false,
    }).then((fileEntry) => {
      if (fileEntry) {
        const _fileInfo = fileStore.get(fileEntry.path)
        if (_fileInfo) {
          return
        }
        loadFiletreeAndRecent(fileEntry)
      } else {
        console.log('取消选择')
      }
    });
  }
  /**
   * 打开文件，有弹窗
   */
  async function openFile() {
    localFileService.openLocalFile({
      title: 'open file',
      filters: [
        { name: 'Markdown', extensions: ['md', 'MD'] },
        { name: 'Text', extensions: ['txt', 'TXT'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      multiple: false,
      directory: false,
    }).then((fileEntry) => {
      if (fileEntry) {
        const _fileInfo = fileStore.get(fileEntry.path)
        if (_fileInfo) {
          return
        }
        loadFiletreeAndRecent(fileEntry)
      } else {
        console.log('取消选择')
      }
    });
  }
  /**
   * 刷新已经打开的文件树
   * @param fileInfo
   * @param isParent fileInfo 是否是父节点
   */
  async function refresh(fileInfo: Pick<AppFileInfo, 'path' | 'isDir' | 'storageLocation'>, useParentRefresh: boolean = true) {
    let path = fileInfo.path
    let fileEntry
    if (useParentRefresh || fileInfo.isDir) {
      if (useParentRefresh) {
        path = getDirname(fileInfo.path)
      }
      fileEntry = await fileService.readDirectory({ path: path, storageLocation: fileInfo.storageLocation })
    } else {
      fileEntry = await fileService.getStat({ path: path, storageLocation: fileInfo.storageLocation, isDir: false })
    }
    fileStore.refresh(fileEntry)
  }

  /**
   * 重命名
   * @param fileEntry 
   * @param newName 
   */
  async function rename(fileEntry: AppFileInfo, newName: string) {
    const dirPath = getDirname(fileEntry.path)
    const newPath = getJoin(dirPath, newName)
    const newFileInfo = { ...fileEntry, path: newPath, name: getFilename(newPath) }
    const isExists = await fileService.exists(newFileInfo)
    if (isExists) {
      throw new CodeError(statusCode.FILE_EXITS)
    }
    await fileService.rename(fileEntry, newPath);
    refresh(fileEntry)
    tabStore.updatePath(fileEntry.path, newPath)
  }
  /**
   * 删除文件或文件夹（包括文件树和真实文件）
   * @param fileEntry 
   */
  async function remove(fileEntry: AppFileInfo) {
    await fileService.delete(fileEntry);
    if(fileEntry.isRoot){
      removeFromTree(fileEntry)
    }else{
      refresh(fileEntry)
    }
    tabStore.updatePath(fileEntry.path, null)
  }
  /**
   * 加载不存在的文件树，无弹窗
   * @param fileInfo 
   */
  async function addFileTree(fileInfo: Pick<FileEntry, 'path' | 'storageLocation' | 'isDir'>) {
    const _fileInfo = fileStore.get(fileInfo.path)
    if (_fileInfo) {
      return
    }
    const stat = await fileService.getStat(fileInfo)
    if (stat.isDir) {
      console.log('isDir')
      fileService.readDirectory(fileInfo).then((fileEntry) => {
        loadFiletreeAndRecent(fileEntry)
      })
    } else {
      loadFiletreeAndRecent(stat)
    }
  }
  async function create(fileInfo: Pick<FileEntry, 'path' | 'storageLocation' | 'isDir'>) {
    fileService.create(fileInfo)
    refresh(fileInfo, true)
  }
  async function move(
    oldFileInfo: Pick<FileEntry, 'path' | 'storageLocation' | 'isDir'>,
    newFileInfo: Pick<FileEntry, 'path' | 'storageLocation'>) {
    await fileService.copyAcrossStorage(oldFileInfo, newFileInfo)
    const fileInfo = { ...newFileInfo, isDir: oldFileInfo.isDir }
    refresh(fileInfo, true)
    refresh(oldFileInfo, true)
    tabStore.updatePath(oldFileInfo.path, newFileInfo.path)
  }
  function removeFromTree(fileEntry: Pick<FileEntry, 'path' | 'children'>) {
    const removeFileEntry = fileStore.removeRoot(fileEntry.path)
    if (removeFileEntry) {
      tabStore.updatePath(fileEntry.path, null)
    }
  }
  return {
    openFolder,
    openFile,
    rename,
    remove,
    refresh,
    addFileTree,
    openRecentFile,
    create,
    move,
    removeFromTree
  };
}
