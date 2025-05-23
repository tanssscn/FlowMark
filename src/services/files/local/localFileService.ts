import { browserFileService } from './browserFileService';
import { getDeviceInfo } from '@/services/deviceService';
import type { AppFileInfo, FileEntry } from '@/types/app-types.ts';
import { tauriLocalFileService } from './tauriLocalFileService';
// 代理实现
export class LocalFileService {
  private _isBrowser = getDeviceInfo().isBrowser;
  private _fileService = this._isBrowser ? browserFileService : tauriLocalFileService;

  private getService() {
    return this._fileService
  }

  async readFile(fileInfo: Pick<FileEntry, 'path'>): Promise<ArrayBuffer> {
    return await this.getService().readFile(fileInfo);
  }
  async readTextFile(fileInfo: Pick<FileEntry, 'path'>): Promise<string> {
    return await this.getService().readTextFile(fileInfo);
  }

  async writeTextFile(fileInfo: Pick<FileEntry, 'path'>, content: string): Promise<void> {
    return await this.getService().writeTextFile(fileInfo, content);
  }

  async createFile(fileInfo: Pick<FileEntry, 'path'>): Promise<void> {
    return await this.getService().createFile(fileInfo);
  }

  async delete(fileInfo: Pick<FileEntry, 'path' | 'isDir'>): Promise<void> {
    return await this.getService().delete(fileInfo);
  }

  async rename(oldFileInfo: Pick<FileEntry, 'path'>, newPath: string): Promise<void> {
    return await this.getService().rename(oldFileInfo, newPath);
  }

  async copyFile(source: Pick<FileEntry, 'path'>, destination: string): Promise<void> {
    return await this.getService().copyFile(source, destination);
  }

  async exists(fileInfo: Pick<FileEntry, 'path'>): Promise<boolean> {
    return await this.getService().exists(fileInfo);
  }

  async readDirectory(fileInfo: Pick<FileEntry, 'path'>): Promise<FileEntry> {
    return await this.getService().readDirectory(fileInfo);
  }

  async createDirectory(fileInfo: Pick<FileEntry, 'path'>, recursive: boolean = false): Promise<void> {
    return await this.getService().createDirectory(fileInfo, recursive);
  }
  async getStat(fileInfo: Pick<AppFileInfo, 'path'>): Promise<AppFileInfo> {
    return await this.getService().getStat(fileInfo);
  }

  async openFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
  }): Promise<string[] | string | null> {
    if (this._isBrowser) {
      return null;
    }
    return await tauriLocalFileService.openFileDialog(options);
  }

  async saveFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string | null> {
    return await this.getService().saveFileDialog(options);
  }
  /**
  * 打开文件选择对话框
  */
  async openLocalFile(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
  }): Promise<FileEntry | null> {
    return await this.getService().openFile(options);
  }

  async writeFile(fileInfo: Pick<FileEntry, 'path'>, file: File|Blob|ArrayBuffer): Promise<void> {
    return await this.getService().writeFile(fileInfo, file);
  }
  async openPathInFinder(path: string) {
    return await this.getService().openPathInFinder(path);
  }
  async watchFileChange(fileInfo: Pick<FileEntry, 'path'>, callback: () => void) {
    return await this.getService().watchFileChange(fileInfo, callback);
  }
}

export const localFileService = new LocalFileService();