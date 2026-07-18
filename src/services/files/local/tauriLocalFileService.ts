import {
  readTextFile,
  writeTextFile,
  readFile,
  remove,
  rename,
  copyFile as tauriCopyFile,
  exists,
  stat,
  readDir,
  mkdir,
  BaseDirectory,
  type FileInfo,
  writeFile,
  create,
  type WatchEvent,
  watch,
} from '@tauri-apps/plugin-fs';
import { join, basename } from '@tauri-apps/api/path';
import type { AppFileInfo, FileEntry } from '@/types/appTypes';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { save } from '@tauri-apps/plugin-dialog';
import { filterFileEntries } from '@/utils/fileUtil';
import { normalize } from 'pathe';

/**
 * 本地文件系统服务
 */
export class TauriLocalFileService {
  /**
   * 读取文件内容
   */
  async readFile(fileInfo: Pick<FileEntry, 'path'>): Promise<ArrayBuffer> {
    const res = await readFile(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    })
    return res.buffer
  }
  async readTextFile(fileInfo: Pick<FileEntry, 'path'>): Promise<string> {
    return await readTextFile(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    });
  }
  /**
   * 写入文件内容
   */
  async writeTextFile(fileInfo: Pick<FileEntry, 'path'>, content: string): Promise<void> {
    await writeTextFile(fileInfo.path, content, {
      baseDir: BaseDirectory.AppData,
    });
  }

  /**
   * 创建新文件
   */
  async createFile(fileInfo: Pick<FileEntry, 'path'>): Promise<void> {
    await create(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    });
  }

  /**
   * 删除文件或目录
   */
  async delete(fileInfo: Pick<FileEntry, 'path' | 'isDir'>): Promise<void> {
    await remove(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
      recursive: fileInfo.isDir,
    });
  }

  /**
   * 重命名文件或目录
   */
  async rename(oldFileInfo: Pick<FileEntry, 'path'>, newPath: string): Promise<void> {
    await rename(
      oldFileInfo.path,
      newPath,
      {
        oldPathBaseDir: BaseDirectory.AppData,
        newPathBaseDir: BaseDirectory.AppData,
      }
    );
  }

  /**
   * 复制文件
   */
  async copyFile(source: Pick<FileEntry, 'path'>, destination: string): Promise<void> {
    await tauriCopyFile(
      source.path,
      destination,
      {
        fromPathBaseDir: BaseDirectory.AppData,
        toPathBaseDir: BaseDirectory.AppData,
      }
    );
  }

  /**
   * 检查文件或目录是否存在
   */
  async exists(fileInfo: Pick<FileEntry, 'path'>): Promise<boolean> {
    return await exists(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    });
  }

  /**
   * 读取目录内容：过滤隐藏文件
   */
  private async readLevel1Directory(fileInfo: Pick<FileEntry, 'path'>): Promise<FileEntry> {
    // 首先获取当前目录的信息
    const currentDirStats = await stat(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    });

    // 创建基础FileEntry对象
    const baseEntry: FileEntry = {
      ...await this.mapToAppFileInfo(fileInfo.path, currentDirStats),
      children: []
    };

    // 读取当前目录的直接子项
    const entries = await readDir(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    });

    const filteredEntries = await filterFileEntries(entries);

    // 只处理当前目录的直接子项，不递归
    baseEntry.children = await Promise.all(
      filteredEntries.map(async (entry) => {
        const fullPath = await join(fileInfo.path, entry.name);
        const stats = await stat(fullPath, {
          baseDir: BaseDirectory.AppData,
        });
        return await this.mapToAppFileInfo(fullPath, stats);
      })
    );

    return baseEntry;
  }

  async readDirectory(fileInfo: Pick<FileEntry, 'path'>, recursive = true): Promise<FileEntry> {
    // 首先获取当前目录的基本信息
    const baseEntry = await this.readLevel1Directory(fileInfo);
    if (!recursive) {
      return baseEntry;
    }
    // 递归处理所有子目录
    if (baseEntry.children && baseEntry.children.length > 0) {
      baseEntry.children = await Promise.all(
        baseEntry.children.map(async (child) => {
          if (child.isDir) {
            // 如果是目录，递归读取
            return await this.readDirectory({ path: child.path });
          }
          // 如果是文件，直接返回
          return child;
        })
      );
    }

    return baseEntry;
  }
  /**
   * 创建目录
   */
  async createDirectory(fileInfo: Pick<FileEntry, 'path'>, recursive: boolean = false): Promise<void> {
    await mkdir(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
      recursive: recursive,
    });
  }

  /**
   * 打开单个文件选择对话框
   */
  async openFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string | null> {
    const { open } = await import('@tauri-apps/plugin-dialog');
    return await open({
      title: options?.title || 'Select File',
      filters: options?.filters,
      defaultPath: options?.defaultPath,
      multiple: false,
      directory: false,
    });
  }

  /**
   * 打开多文件选择对话框
   */
  async openFileDialogMultiple(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string[] | null> {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const result = await open({
      title: options?.title || 'Select Files',
      filters: options?.filters,
      defaultPath: options?.defaultPath,
      multiple: true,
      directory: false,
    });
    if (result === null) return null;
    return Array.isArray(result) ? result : [result];
  }

  /**
   * 打开文件夹选择对话框
   */
  async openFolderDialog(options?: {
    title?: string;
    defaultPath?: string;
  }): Promise<string | null> {
    const { open } = await import('@tauri-apps/plugin-dialog');
    return await open({
      title: options?.title || 'Select Folder',
      defaultPath: options?.defaultPath,
      multiple: false,
      directory: true,
    })
  }

  /**
   * 打开单个文件并返回 FileEntry
   */
  async openFile(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<FileEntry | null> {
    const path = await this.openFileDialog(options)
    if (path) {
      const stats = await stat(path)
      return await this.mapToAppFileInfo(path, stats)
    }
    return null
  }

  /**
   * 打开多个文件并返回 FileEntry[]
   */
  async openFiles(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<FileEntry[] | null> {
    const paths = await this.openFileDialogMultiple(options)
    if (paths && paths.length > 0) {
      const results: FileEntry[] = []
      for (const p of paths) {
        const stats = await stat(p)
        results.push(await this.mapToAppFileInfo(p, stats))
      }
      return results
    }
    return null
  }

  /**
   * 打开文件夹并返回 FileEntry
   */
  async openFolder(options?: {
    title?: string;
    defaultPath?: string;
  }): Promise<FileEntry | null> {
    const path = await this.openFolderDialog(options)
    if (path) {
      return await this.readDirectory({ path: path })
    }
    return null
  }
  /**
   * 打开文件保存对话框
   */
  async saveFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string | null> {
    return await save({
      title: options?.title,
      filters: options?.filters,
      defaultPath: options?.defaultPath,
    });
  }
  async getStat(fileInfo: Pick<AppFileInfo, 'path'>): Promise<AppFileInfo> {
    const stats = await stat(fileInfo.path, {
      baseDir: BaseDirectory.AppData,
    })
    return await this.mapToAppFileInfo(fileInfo.path, stats);
  }
  /**
   * 将 Tauri 的 AppFileInfo 映射到应用的 AppFileInfo 类型
   */
  private decodeFilename(name: string): string {
    try {
      const decoded = decodeURIComponent(name);
      if (decoded !== name && /%[0-9A-Fa-f]{2}/.test(name)) {
        return decoded;
      }
    } catch {
    }
    return name;
  }

  private async mapToAppFileInfo(
    path: string,
    stats: FileInfo
  ): Promise<FileEntry> {
    path = normalize(path)
    const name = await basename(path);
    return {
      path,
      name: this.decodeFilename(name),
      lastModified: stats.mtime?.getTime() ?? 0,
      storageLocation: 'local',
      isDir: stats.isDirectory,
      size: stats.size,
      readonly: stats.readonly,
      hidden: false,
      children: stats.isDirectory ? [] : undefined,
      version: this.getVersion(stats.mtime?.getTime() ?? 0, stats.size)
    };
  }
  async writeFile(fileInfo: Pick<FileEntry, 'path'>, file: File | Blob | ArrayBuffer): Promise<void> {
    let uint8Array: Uint8Array;
    if (file instanceof File || file instanceof Blob) {
      uint8Array = new Uint8Array(await file.arrayBuffer());
    } else {
      uint8Array = new Uint8Array(file);
    }
    await writeFile(fileInfo.path, uint8Array);
  }
  async openPathInFinder(path: string) {
    await revealItemInDir(path)
  }
  getVersion(mtime: number, size: number) {
    return `${mtime}-${size}`
  }
  async watchFileChange(fileInfo: Pick<FileEntry, 'path'>, callback: () => void) {
    return await watch(fileInfo.path, (event: WatchEvent) => {
      callback()
    })
  }
}

export const tauriLocalFileService = new TauriLocalFileService();