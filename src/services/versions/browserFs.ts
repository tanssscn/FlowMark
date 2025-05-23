import fs, { PromisifiedFS } from '@isomorphic-git/lightning-fs';
import { FileSystemAdapter } from "./type";
import { join } from 'pathe';
export class BrowserFs implements FileSystemAdapter {
  private fs: PromisifiedFS;
  constructor() {
    this.fs = new fs('history').promises;
  }
  private getAbsolutePath(path: string): string {
    return join('/', path);
  }
  public async exists(path: string): Promise<boolean> {
    try {
      path = this.getAbsolutePath(path);
      const data = await this.fs.stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }
  public async readFile(path: string): Promise<string> {
    path = this.getAbsolutePath(path);
    const data = await this.fs.readFile(path);
    return data.toString();
  }
  public async writeFile(path: string, content: string): Promise<void> {
    try {
      path = this.getAbsolutePath(path);
      await this.fs.writeFile(path, content);
    } catch (e) {

    }
  }
  public async unlink(path: string): Promise<void> {
    try {
      path = this.getAbsolutePath(path);
      await this.fs.unlink(path);
    } catch (e) {

    }
  }
  public async mkdir(path: string, options?: { recursive: boolean }): Promise<void> {
    path = this.getAbsolutePath(path);
    try {
      if (options && options.recursive) {
        // 手动实现递归创建文件夹
        const paths = path.split('/');
        let currentPath = '';
        for (let i = 0; i < paths.length; i++) {
          currentPath += paths[i] + '/';
          try {
            await this.fs.stat(currentPath);
          } catch (e) {
            await this.fs.mkdir(currentPath);
          }
        }
      } else {
        await this.fs.mkdir(path);
      }
    } catch (e) {

    }
  }
  public async rmdir(path: string): Promise<void> {
    path = this.getAbsolutePath(path);
    try {
      await this.fs.rmdir(path);
    } catch (e) {

    }
  }
}