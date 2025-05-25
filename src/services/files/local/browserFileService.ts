import { CodeError } from '@/services/codeService';
import type { FileEntry } from '@/types/appTypes';
import { statusCode } from '@/utils/statusCodes';

/**
 * 浏览器环境下的文件操作适配器
 * 注意：浏览器环境下文件操作有诸多限制
 */
export class BrowserFileService {
  private fileHandles = new Map<string, FileSystemFileHandle>();
  private dirHandles = new Map<string, FileSystemDirectoryHandle>();
  /**
   * 读取文件内容
   */
  async readFile(fileInfo: Pick<FileEntry, 'path'>): Promise<ArrayBuffer> {
    try {
      const handle = this.fileHandles.get(fileInfo.path);
      if (!handle) {
        throw new CodeError(statusCode.FILE_HANDLE_NOT_FOUND);
      }
      const file = await handle.getFile();
      return await file.arrayBuffer();
    } catch (error) {
      throw new CodeError(statusCode.BROWSER_FILE_SYSTEM_ERROR);
    }
  }
  async readTextFile(fileInfo: Pick<FileEntry, 'path'>): Promise<string> {
    try {
      const handle = this.fileHandles.get(fileInfo.path);
      if (!handle) {
        throw new CodeError(statusCode.FILE_HANDLE_NOT_FOUND);
      }
      const file = await handle.getFile();
      return await file.text();
    } catch (error) {
      throw new CodeError(statusCode.BROWSER_FILE_SYSTEM_ERROR);
    }
  }
  /**
   * 写入文件内容
   */
  async writeTextFile(fileInfo: Pick<FileEntry, 'path'>, content: string): Promise<void> {
    try {
      const handle = this.fileHandles.get(fileInfo.path);
      if (!handle) {
        throw new CodeError(statusCode.FILE_HANDLE_NOT_FOUND);
      }
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      throw new CodeError(statusCode.BROWSER_FILE_SYSTEM_ERROR);
    }
  }

  /**
   * 通过文件选择器打开文件
   */
  async openFile(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
  }): Promise<FileEntry | null> {
    if (options?.directory) {
      return await this.openFolderFromPicker();
    } else {
      return await this.openFileFromPicker();
    }

  }
  private async openFolderFromPicker(): Promise<FileEntry | null> {
    try {
      // @ts-ignore - 实验性API
      const dirHandle = await window.showDirectoryPicker();
      return this._scanDirectoryRecursive(dirHandle, dirHandle.name);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null; // 用户取消
      }
      throw new CodeError(statusCode.BROWSER_FILE_SYSTEM_ERROR);
    }
  }
  private async openFileFromPicker(): Promise<FileEntry | null> {
    try {
      // @ts-ignore - 实验性API
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown Files',
          accept: {
            'text/markdown': ['.md', '.markdown']
          }
        }],
        multiple: false
      });

      const file = await handle.getFile();
      const path = file.name; // 浏览器环境下只能用文件名作为路径标识

      this.fileHandles.set(path, handle);

      return this.mapToAppFileInfo(path, file);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null; // 用户取消了选择
      }
      throw new CodeError(statusCode.BROWSER_FILE_SYSTEM_ERROR);
    }
  }
  private async _scanDirectoryRecursive(
    dirHandle: FileSystemDirectoryHandle | any,
    currentPath: string
  ): Promise<FileEntry> {
    const entry: FileEntry = {
      path: currentPath,
      name: dirHandle.name,
      lastModified: Date.now(), // 目录没有lastModified属性，使用当前时间
      storageLocation: 'local',
      isDir: true,
      size: 0,
      readonly: false,
      hidden: false,
      children: []
    };

    this.dirHandles.set(currentPath, dirHandle);

    for await (const handle of dirHandle.values()) {
      const childPath = `${currentPath}/${handle.name}`;

      if (handle.kind === 'directory') {
        entry.children!.push(await this._scanDirectoryRecursive(
          handle as FileSystemDirectoryHandle,
          childPath
        ));
      } else {
        const fileHandle = handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();

        this.fileHandles.set(childPath, fileHandle);

        entry.children!.push(this.mapToAppFileInfo(childPath, file));
      }
    }

    return entry;
  }
  private mapToAppFileInfo(
    path: string,
    file: File,
    isDir = false,
  ): FileEntry {
    return {
      path: path,
      name: file.name,
      lastModified: file.lastModified,
      storageLocation: 'local',
      isDir: isDir,
      size: file.size,
      readonly: false,
      hidden: false
    }
  }
  /**
   * 通过文件选择器保存文件
   */
  async saveFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string | null> {
    const types: any[] = []
    if (options?.filters) {
      options.filters.forEach(filter => {
        types.push({
          description: filter.name,
          accept: {
            'text/plain': filter.extensions
          }
        })
      })
    }
    try {
      // @ts-ignore - 实验性API
      const handle = await window.showSaveFilePicker({
        suggestedName: options?.defaultPath,
        types: types
        //   {
        //   description: 'Markdown Files',
        //   accept: {
        //     'text/markdown': ['.md', '.markdown']
        //   }
        // }

      });

      const writable = await handle.createWritable();
      await writable.write('');
      await writable.close();

      const file = await handle.getFile();
      const path = file.name; // 浏览器环境下只能用文件名作为路径标识

      this.fileHandles.set(path, handle);
      return path;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null; // 用户取消了选择
      }
      throw new CodeError(statusCode.BROWSER_FILE_SYSTEM_ERROR);
    }
  }

  /**
   * 浏览器环境下无法实现的功能
   */
  private unsupported(): never {
    throw new CodeError(statusCode.UNSUPPORTED_OPERATION)
  }

  // 以下方法在浏览器环境下不支持
  createFile = this.unsupported;
  delete = this.unsupported;
  rename = this.unsupported;
  copyFile = this.unsupported;
  exists = this.unsupported;
  getFileInfo = this.unsupported;
  readDirectory = this.unsupported;
  createDirectory = this.unsupported;
  writeFile = this.unsupported;
  getStat = this.unsupported;
  openPathInFinder = this.unsupported;
  watchFileChange = this.unsupported;
}

export const browserFileService = new BrowserFileService();