import type { AppFileInfo, FileEntry } from '@/types/appTypes';
import { fetch } from '@tauri-apps/plugin-http';
import { getDeviceInfo } from '@/services/deviceService';
import WebDAVClient, { createClient } from './webdav';
import type { FileStat } from './type';
import { httpJoin } from '@/utils/pathUtil';
import { CodeError } from '@/services/codeService';
import { statusCode } from '@/utils/statusCodes';

/**
 * WebDAV 文件系统服务
 */
export class WebDAVFileService {
  // ReturnType<typeof createClient>  ts会自动推断createClient的返回值;
  private client: WebDAVClient | null = null;
  private credentials: { username: string; password: string; serverUrl: string } | null = null;
  private isBrowser = getDeviceInfo().isBrowser;

  /**
   * 确保已连接
   */
  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new CodeError(statusCode.NEED_CONNECT_SERVER)
    }
  }
  /**
   * 初始化 WebDAV 客户端
   */
  async connect(serverUrl: string, username: string, password: string): Promise<boolean> {
    const client = createClient({
      baseUrl: serverUrl,
      username,
      password,
      authType: 'basic',
      _fetch: this.isBrowser ? undefined : fetch as any,
    });
    if (!client) return false;
    // 测试连接是否有效
    const exists = await client.exists(serverUrl, true);
    if (exists) {
      this.credentials = { serverUrl, username, password };
      this.client = client;
      return true;
    } else {
      return false;
    }
  }

  async testConnection(serverUrl: string, username: string, password: string): Promise<boolean> {
    const client = new WebDAVClient({
      baseUrl: serverUrl,
      username,
      password,
      authType: 'basic',
      _fetch: this.isBrowser ? undefined : fetch as any,
    });
    const exists = await client.exists(serverUrl, true);
    if (exists) {
      return true;
    }
    return false;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.client !== null;
  }

  /**
   * 获取当前连接信息
   */
  getConnectionInfo() {
    return this.credentials;
  }

  /**
   * 读取文件内容
   */
  async readFile(fileInfo: Pick<FileEntry, 'path'>): Promise<ArrayBuffer> {
    this.ensureConnected()
    const content = await this.client!.getFileContents(fileInfo.path, { format: 'binary' });
    return content as ArrayBuffer;
  }
  async readTextFile(fileInfo: Pick<FileEntry, 'path'>): Promise<string> {
    this.ensureConnected()
    const content = await this.client!.getFileContents(fileInfo.path, { format: 'text' });
    return content as string;
  }
  /**
   * 写入文件内容
   */
  async writeTextFile(fileInfo: Pick<FileEntry, 'path'>, content: string): Promise<void> {
    this.ensureConnected()
    await this.client!.putFileContents(fileInfo.path, content);
  }

  /**
   * 创建新文件
   */
  async createFile(fileInfo: Pick<FileEntry, 'path'>): Promise<void> {
    this.ensureConnected()
    await this.writeTextFile(fileInfo, '');
  }

  /**
   * 删除文件或目录
   */
  async delete(fileInfo: Pick<FileEntry, 'path' | 'isDir'>): Promise<void> {
    this.ensureConnected()
    await this.client!.delete(fileInfo.path, { isDir: fileInfo.isDir });
  }

  /**
   * 重命名文件或目录
   */
  async rename(oldFileInfo: Pick<FileEntry, 'path' | 'isDir'>, newPath: string): Promise<void> {
    this.ensureConnected()
    await this.client!.move(oldFileInfo.path, newPath, { isDir: oldFileInfo.isDir });
  }

  /**
   * 复制文件
   */
  async copyFile(source: Pick<FileEntry, 'path'>, destination: string): Promise<void> {
    this.ensureConnected()
    await this.client!.copyFile(source.path, destination);
  }

  /**
   * 检查文件或目录是否存在
   */
  async exists(fileInfo: Pick<FileEntry, 'path' | 'isDir'>): Promise<boolean> {
    this.ensureConnected()
    return await this.client!.exists(fileInfo.path, fileInfo.isDir);
  }
  async getStat(fileInfo: Pick<AppFileInfo, 'path' | 'isDir'>): Promise<AppFileInfo> {
    this.ensureConnected()
    const stats = await this.client!.stat(fileInfo.path, { isDir: fileInfo.isDir }) as FileStat;
    return this.mapToAppFileInfo(fileInfo.path, stats);
  }

  async readDirectory(fileInfo: Pick<FileEntry, 'path'>, recursive = true): Promise<FileEntry> {
    this.ensureConnected()
    // 获取目录基本信息
    const dirStat = await this.client!.stat(fileInfo.path, { isDir: true }) as FileStat;
    // 转换为应用数据结构
    const dirEntry = this.mapToAppFileInfo(fileInfo.path, dirStat);
    dirEntry.children = [];
    // 如果需要递归，则进行递归读取
    if (recursive) {
      await this.recursiveReadDirectory(dirEntry, fileInfo.path);
    } else {
      // 非递归只需读取当前目录内容
      const contents = await this.client!.getDirectoryContents(fileInfo.path) as FileStat[];
      dirEntry.children = contents.map(item => {
        const path = httpJoin(fileInfo.path, item.basename);
        return this.mapToAppFileInfo(path, item)
      }
      );
    }
    return dirEntry;
  }

  private async recursiveReadDirectory(dirEntry: FileEntry, path: string): Promise<void> {
    try {
      // 确保使用已转换的路径获取目录内容
      const contents = await this.client!.getDirectoryContents(path) as FileStat[];

      // 处理目录中的每一项
      dirEntry.children = await Promise.all(
        contents.map(async (item) => {
          const childPath = httpJoin(path, item.basename);
          const childEntry = this.mapToAppFileInfo(childPath, item);
          // 如果是目录，则递归处理
          if (item.isDir) {
            childEntry.children = [];
            await this.recursiveReadDirectory(childEntry, childEntry.path);
          }
          return childEntry;
        })
      );
    } catch (error) {
      console.error(`Failed to read directory ${dirEntry.path}:`, error);
      dirEntry.children = [];
    }
  }
  /**
   * 创建目录
   */
  async createDirectory(fileInfo: Pick<FileEntry, 'path'>, recursive: boolean = false): Promise<void> {
    this.ensureConnected()
    await this.client!.createDirectory(fileInfo.path, { recursive });
  }
  /**
   * TODO：大文件流式/分块上传和下载
   * @param fileInfo 
   * @param file 
   */
  async writeFile(fileInfo: Pick<FileEntry, 'path'>, file: File | Blob | ArrayBuffer): Promise<void> {
    this.ensureConnected()
    // 将 File 对象转换为 ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    if (file instanceof File || file instanceof Blob) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file as ArrayBuffer;
    }
    // 上传到 WebDAV 服务器
    await this.client!.putFileContents(
      fileInfo.path,
      arrayBuffer,
      {
        overwrite: true,  // 覆盖已存在的文件
        contentLength: true
      }
    );
  }


  /**
   * 将 WebDAV 的 FileStat 映射到应用的 AppFileInfo 类型
   */
  private mapToAppFileInfo(
    path: string,
    stats: FileStat
  ): FileEntry {
    return {
      path: path,
      name: stats.basename,
      lastModified: new Date(stats.lastmod).getTime(),
      storageLocation: 'webdav',
      isDir: stats.isDir,
      size: stats.size,
      readonly: false,
      hidden: false,
      children: stats.isDir ? [] : undefined,
      version: stats.etag ?? undefined,
    };
  }
  async watchFileChange(fileInfo: Pick<FileEntry, 'path'>, callback: () => void) {
    const checkChanges = async () => {
      // 获取文件属性（包含 ETag）
      callback()
    }
    setTimeout(checkChanges, 1000)
  }
}

export const webdavFileService = new WebDAVFileService();