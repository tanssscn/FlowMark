// isomorphic-git 无法访问到 本地文件系统
import {
  readTextFile,
  writeTextFile,
  remove,
  mkdir,
  BaseDirectory,
  exists,
} from '@tauri-apps/plugin-fs';
import { FileSystemAdapter } from './type';

const baseDir = BaseDirectory.AppData;
export class TauriFsClient implements FileSystemAdapter {
  public async exists(path: string): Promise<boolean> {
    return await exists(path, { baseDir: baseDir });
  }
  public async readFile(path: string): Promise<string> {
    return await readTextFile(path, { baseDir: baseDir });
  }
  public async writeFile(path: string, content: string): Promise<void> {
    await writeTextFile(path, content, { baseDir: baseDir });
  }
  public async unlink(path: string): Promise<void> {
    await remove(path, { baseDir: baseDir });
  }
  public async mkdir(path: string, options?: { recursive: boolean }): Promise<void> {
    await mkdir(path, { baseDir: baseDir });
  }
  public async rmdir(path: string): Promise<void> {
    await remove(path, { baseDir: baseDir });
  }
}
