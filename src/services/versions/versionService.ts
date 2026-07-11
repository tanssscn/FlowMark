import type { FileSystemAdapter } from './type';
import { getDeviceInfo } from '../deviceService';
import { BrowserFs } from './browserFs';
import { TauriFsClient } from './localFs';
import type { VersionInfo } from '@/types/appTypes';
import { customAlphabet } from 'nanoid';
import { getExtname, getJoin } from '@/utils/pathUtil';
const fileSafeAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';
const nanoid = customAlphabet(fileSafeAlphabet, 6);

interface VersionHistory {
  source: string;
  entries: VersionInfo[];
}

/**
* 文件版本管理器
*/
export class VersionService {
  private fs: FileSystemAdapter;
  private metadataFileName = 'metadata.json';
  private rootPath = 'history';
  constructor(
  ) {
    if (getDeviceInfo().isBrowser) {
      this.fs = new BrowserFs()
    } else {
      this.fs = new TauriFsClient()
    }
    this.fs.exists(this.rootPath).then(res => {
      if (!res) {
        this.fs.mkdir(this.rootPath)
      }
    })
  }

  /**
   * 获取文件的版本目录路径
   */
  private async getVersionDir(filePath: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(filePath))
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 17);
    const versionDir = getJoin(this.rootPath, hashHex);
    if (!await this.fs.exists(versionDir)) {
      await this.fs.mkdir(versionDir)
    }
    return versionDir;
  }
  private async getMetaFilePath(filePath: string): Promise<string> {
    const versionDir = await this.getVersionDir(filePath);
    console.log(versionDir, this.metadataFileName)
    return `${versionDir}/${this.metadataFileName}`;
  }
  /**
   * 生成版本ID (使用时间戳+随机字符串)
   */
  private generateVersionId(path: string): string {
    return `${nanoid()}${getExtname(path)}`
  }
  private async getVersionFilePath(filePath: string, versionId: string): Promise<string> {
    const versionDir = await this.getVersionDir(filePath);
    return `${versionDir}/${versionId}`;
  }
  /**
   * 加载元数据
   */
  private async loadMetadata(filePath: string): Promise<VersionHistory> {
    const metadataPath = await this.getMetaFilePath(filePath);

    try {
      if (await this.fs.exists(metadataPath)) {
        const content = await this.fs.readFile(metadataPath);
        return JSON.parse(content.toString());
      }
    } catch (error) {
      console.error(`Failed to load metadata for ${filePath}:`, error);
    }
    const newMetadata: VersionHistory = { source: filePath, entries: [] };
    this.saveMetadata(filePath, newMetadata);
    return newMetadata;
  }
  private async saveMetadata(filePath: string, metadata: VersionHistory): Promise<void> {
    const metadataPath = await this.getMetaFilePath(filePath);
    const content = JSON.stringify(metadata);
    console.log(metadataPath, content)
    await this.fs.writeFile(metadataPath, content);
  }
  /**
   * 创建新版本
   */
  public async createVersion(options: {
    filePath: string,
    content: string,
    message?: string,
    maxNum?: number,
  }): Promise<VersionInfo[]> {
    const { filePath, content, message, maxNum } = options;
    const versionId = this.generateVersionId(filePath);
    const versionFile = await this.getVersionFilePath(filePath, versionId);
    const metadata = await this.loadMetadata(filePath);

    // 添加新版本信息
    const newVersion: VersionInfo = {
      id: versionId,
      createdAt: new Date().getTime(),
      message: message,
    };

    metadata.entries.push(newVersion);
    if (maxNum && metadata.entries.length > maxNum) {
      const numToDelete = metadata.entries.splice(0, metadata.entries.length - maxNum);
      await Promise.all(numToDelete.map(v =>
        this.getVersionFilePath(filePath, v.id).then((path) => this.fs.unlink(path))
      ));
    }
    await this.fs.writeFile(versionFile, content);
    await this.saveMetadata(filePath, metadata);

    return metadata.entries;
  }

  /**
   * 获取文件的所有版本
   */
  public async listVersions(filePath: string, depth?: number): Promise<VersionInfo[]> {
    const metadata = await this.loadMetadata(filePath);
    console.log(metadata.entries, filePath)
    return metadata.entries
  }

  /**
   * 获取特定版本的内容
   */
  public async getVersion(filePath: string, versionId: string): Promise<string | null> {
    const metadata = await this.loadMetadata(filePath);
    const version = metadata.entries.find(v => v.id === versionId);

    if (!version) {
      return null;
    }

    const versionFile = await this.getVersionFilePath(filePath, versionId);

    try {
      return await this.fs.readFile(versionFile);
    } catch (error) {
      console.error(`Failed to read version ${versionId}:`, error);
      return null;
    }
  }

  /**
   * 删除特定版本
   */
  public async deleteVersion(filePath: string, versionId: string): Promise<VersionInfo[]> {
    const metadata = await this.loadMetadata(filePath);
    const versionIndex = metadata.entries.findIndex(v => v.id === versionId);

    if (versionIndex === -1) {
      return metadata.entries;
    }

    // 立即删除文件
    try {
      const versionFile = await this.getVersionFilePath(filePath, versionId);
      await this.fs.unlink(versionFile);
    } catch (error) {
      console.error(`Failed to delete version file ${versionId}:`, error);
    }

    // 从元数据中移除
    metadata.entries.splice(versionIndex, 1);
    await this.saveMetadata(filePath, metadata);

    return metadata.entries;
  }
  /**
   * 删除所有版本
   */
  public async deleteVersions(filePath: string): Promise<void> {
    const metadata = await this.loadMetadata(filePath);
    await Promise.all(metadata.entries.map(v =>
      this.getVersionFilePath(filePath, v.id).then((path) => this.fs.unlink(path))
    ));
    await this.saveMetadata(filePath, { source: filePath, entries: [] });
  }

}
export const versionService = new VersionService();