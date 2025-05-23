import crypto from 'crypto-js';
import { FileSystemAdapter } from './type';
import { getDeviceInfo } from '../deviceService';
import { BrowserFs } from './browserFs';
import { TauriFsClient } from './localFs';
import { VersionInfo } from '@/types/app-types.ts';
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
  private getVersionDir(filePath: string): string {
    const hashHex = crypto.SHA256(filePath).toString().substring(0, 11);
    const versionDir = getJoin(this.rootPath, hashHex);
    this.fs.exists(versionDir).then(res => {
      if (!res) {
        console.log('versionDir', versionDir);
        this.fs.mkdir(versionDir)
      }
    })
    return versionDir;
  }
  private getMetaFilePath(filePath: string): string {
    const versionDir = this.getVersionDir(filePath);
    return `${versionDir}/${this.metadataFileName}`;
  }
  /**
   * 生成版本ID (使用时间戳+随机字符串)
   */
  private generateVersionId(path: string): string {
    return `${nanoid()}${getExtname(path)}`
  }
  private getVersionFilePath(filePath: string, versionId: string): string {
    const versionDir = this.getVersionDir(filePath);
    return `${versionDir}/${versionId}`;
  }
  /**
   * 加载元数据
   */
  private async loadMetadata(filePath: string): Promise<VersionHistory> {
    const metadataPath = this.getMetaFilePath(filePath);

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
    const metadataPath = this.getMetaFilePath(filePath);
    const content = JSON.stringify(metadata);
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
    const versionFile = this.getVersionFilePath(filePath, versionId);
    const metadata = await this.loadMetadata(filePath);

    // 添加新版本信息
    const newVersion: VersionInfo = {
      id: versionId,
      createdAt: new Date().getTime(),
      message: message,
    };

    metadata.entries.push(newVersion);
    if (maxNum && metadata.entries.length > maxNum) {
      const numToDelete = metadata.entries.splice(0, metadata.entries.length - maxNum)
      // 异步删除旧版本文件
      Promise.all(numToDelete.map(v => this.fs.unlink(this.getVersionFilePath(filePath, v.id))));
    }
    console.log(`Creating new version ${versionId} for ${versionFile}`);
    // 保存元数据和版本文件
    await this.fs.writeFile(versionFile, content);
    // 元数据可以异步保存，不影响版本文件
    this.saveMetadata(filePath, metadata);

    return metadata.entries;
  }

  /**
   * 获取文件的所有版本
   */
  public async listVersions(filePath: string, depth?: number): Promise<VersionInfo[]> {
    const metadata = await this.loadMetadata(filePath);
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

    const versionFile = this.getVersionFilePath(filePath, versionId);

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
      const versionFile = this.getVersionFilePath(filePath, versionId);
      await this.fs.unlink(versionFile);
    } catch (error) {
      console.error(`Failed to delete version file ${versionId}:`, error);
    }

    // 从元数据中移除
    metadata.entries.splice(versionIndex, 1);
    await this.saveMetadata(filePath, metadata);

    return metadata.entries;
  }


}
export const versionService = new VersionService();