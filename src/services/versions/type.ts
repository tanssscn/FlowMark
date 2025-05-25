import { AppFileInfo } from "@/types/appTypes";

/**
 * 文件系统操作接口，由客户端实现
 */
export interface FileSystemAdapter {
  /**
   * 检查文件/目录是否存在
   */
  exists(path: string): Promise<boolean>;

  /**
   * 读取文件内容
   */
  readFile(path: string): Promise<string>;

  /**
   * 写入文件内容
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * 删除文件
   */
  unlink(path: string): Promise<void>;

  /**
   * 创建目录
   */
  mkdir(path: string, options?: { recursive: boolean }): Promise<void>;

  /**
   * 删除目录
   */
  rmdir(path: string): Promise<void>;

}
