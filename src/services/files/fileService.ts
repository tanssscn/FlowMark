import type { FileEntry, AppFileInfo, StorageLocation } from '@/types/app-types.ts';
import { localFileService } from './local/localFileService';
import { webdavFileService } from '@/services/files/webdav/webdavFileService';

/**
 * 统一文件系统服务
 */
export class FileService {
  /**
   * 根据存储位置获取对应的文件服务
   */
  private getService(location: StorageLocation) {
    return location === 'local' ? localFileService : webdavFileService;
  }

  /**
   * 读取文件内容
   */
  async readFile(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation'>): Promise<ArrayBuffer> {
    return await this.getService(fileInfo.storageLocation).readFile(fileInfo);
  }
  async  readTextFile(fileInfo: Pick<AppFileInfo, 'path' |'storageLocation'>): Promise<string> {
    return await this.getService(fileInfo.storageLocation).readTextFile(fileInfo);
  }

  /**
   * 写入文件内容
   */
  async writeTextFile(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation'>, content: string): Promise<void> {
    await this.getService(fileInfo.storageLocation).writeTextFile(fileInfo, content);
  }

  /**
   * 删除文件或目录
   */
  async delete(fileInfo: Pick<AppFileInfo, 'path' | 'isDir' | 'storageLocation'>): Promise<void> {
    await this.getService(fileInfo.storageLocation).delete(fileInfo);
  }

  /**
   * 重命名文件或目录
   */
  async rename(oldFileInfo: Pick<AppFileInfo, 'path' | 'storageLocation' | 'isDir'>, newPath: string): Promise<void> {
    await this.getService(oldFileInfo.storageLocation).rename(oldFileInfo, newPath);
  }

  /**
   * 复制文件
   */
  async copyFile(source: Pick<AppFileInfo, 'path' | 'storageLocation'>, destination: string): Promise<void> {
    await this.getService(source.storageLocation).copyFile(source, destination);
  }

  /**
   * 检查文件或目录是否存在
   */
  async exists(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation' | 'isDir'>): Promise<boolean> {
    return await this.getService(fileInfo.storageLocation).exists(fileInfo);
  }
  async getStat(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation' | 'isDir'>): Promise<AppFileInfo> {
    return await this.getService(fileInfo.storageLocation).getStat(fileInfo);
  }
  /**
   * 读取目录内容
   */
  async readDirectory(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation'>): Promise<FileEntry> {
    return await this.getService(fileInfo.storageLocation).readDirectory(fileInfo);
  }
  /**
 * 创建新文件/目录
 */
  async create(fileInfo: Pick<FileEntry, 'path' | 'storageLocation' | 'isDir'>, recursive?: boolean): Promise<void> {
    if (fileInfo.isDir) {
      await this.getService(fileInfo.storageLocation).createDirectory(fileInfo,recursive);
    } else {
      await this.getService(fileInfo.storageLocation).createFile(fileInfo);
    }
  }
  async writeFile(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation'>, file: File|Blob|ArrayBuffer): Promise<void> {
    await this.getService(fileInfo.storageLocation).writeFile(fileInfo, file);
  }

  /**
   * 打开文件保存对话框 (仅本地)
   */
  async saveFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string | null> {
    return await localFileService.saveFileDialog(options);
  }
  async watchFileChange(fileInfo: Pick<AppFileInfo, 'path' | 'storageLocation'>, callback: () => void) {
    return await this.getService(fileInfo.storageLocation).watchFileChange(fileInfo, callback);
  }
  /**
   * 跨存储平台复制文件或目录
   * @param source 源文件信息
   */
  async copyAcrossStorage(
    source: Pick<AppFileInfo, 'path' | 'storageLocation' | 'isDir'>,
    target: Pick<AppFileInfo, 'path' | 'storageLocation'>,
  ): Promise<void> {
    // 如果源和目标存储位置相同，直接使用原生复制方法
    if (source.storageLocation === target.storageLocation) {
      return this.getService(source.storageLocation).copyFile(source, target.path);
    }

    const sourceService = this.getService(source.storageLocation);
    const targetService = this.getService(target.storageLocation);

    if (source.isDir) {
      // 处理目录复制
      await targetService.createDirectory(target);
      // 递归复制目录内容
      const entries = await sourceService.readDirectory(source);
      for (const entry of entries.children ?? []) {
        const destPath = `${target.path}/${entry.name}`;
        await this.copyAcrossStorage(
          entry,
          { path: destPath, storageLocation: target.storageLocation },
        );
      }
    } else {
      // 处理文件复制
      const content = await sourceService.readFile(source);
      await targetService.writeFile(
        target,
        content
      );
    }
  }

  /**
   * 跨存储平台移动文件或目录
   * @param source 源文件信息
   * @param destination 目标路径
   * @param destinationLocation 目标存储位置
   */
  async moveAcrossStorage(
    source: Pick<AppFileInfo, 'path' | 'storageLocation' | 'isDir'>,
    target: Pick<AppFileInfo, 'path' | 'storageLocation'>,
  ): Promise<void> {
    // 如果源和目标存储位置相同，直接使用原生移动方法
    if (source.storageLocation === target.storageLocation) {
      return this.getService(source.storageLocation).rename(source, target.path);
    }

    // 先复制到新位置
    await this.copyAcrossStorage(source, target);

    // 然后删除原文件
    await this.getService(source.storageLocation).delete(source);
  }
}

export const fileService = new FileService();