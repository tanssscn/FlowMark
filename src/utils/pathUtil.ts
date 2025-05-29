import { basename, dirname, extname, isAbsolute, join, normalize, relative, sep } from 'pathe';
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { fileService } from '@/services/files/fileService';
import type { AppFileInfo } from '@/types/appTypes';
import { statusCode } from './statusCodes';
import { ErrorStatus } from '@/services/codeService';

export async function createFileInnerSrc(fileInfo: AppFileInfo, url: string): Promise<string> {
  if (!url) return url; // 空路径，用户可能还没有输入完成
  if (fileInfo.storageLocation === 'local') {
    if (isTauri()) {
      if (url.startsWith('file://')) {
        url = url.replace('file://', '');
      }
      if (isRelativePath(url)) {
        url = join(fileInfo.path, url);
      }
      if (isAbsolute(url)) {
        // tauri.conf.json > app.security.csp 
        return convertFileSrc(url);
      }
    }
  } else {
    if (isRelativePath(url)) {
      url = getJoin(fileInfo.path, url);
    }
    if (isSameOrigin(fileInfo.path, url)) {
      const content = await fileService.readFile({ ...fileInfo, path: url })
      return URL.createObjectURL(new Blob([content]))
    }
    console.log("url is not same origin")
  }
  return url;
}
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);

    const getOriginWithPort = (u: URL) => {
      const defaultPort = u.protocol === 'http:' ? '80' :
        u.protocol === 'https:' ? '443' : u.port;
      return `${u.protocol}//${u.hostname}:${u.port || defaultPort}`;
    };

    return getOriginWithPort(u1) === getOriginWithPort(u2);
  } catch {
    return false;
  }
}

export async function createFileSrc(fileInfo: AppFileInfo): Promise<string> {
  if (fileInfo.storageLocation === 'local') {
    if (isTauri()) {
      if (isAbsolute(fileInfo.path)) {
        // tauri.conf.json > app.security.csp 
        return convertFileSrc(fileInfo.path);
      }
    }
  } else {
    const content = await fileService.readFile(fileInfo)
    return URL.createObjectURL(new Blob([content]))
  }
  return fileInfo.path;
}

export function closeImageSource(src: string) {
  if (src.startsWith('blob:')) {
    URL.revokeObjectURL(src);
  }
}

export function getJoin(...parts: string[]): string {
  if (parts.length === 0) return '';

  const [first, ...rest] = parts;
  if (isValidURL(first)) {
    const url = new URL(first);
    const path = join(url.pathname, ...rest)
    url.pathname = path;
    return url.toString();
  } else {
    return join(first, ...rest);
  }
}

/**
 * 通用相对路径计算函数，支持HTTP路径和本地文件路径
 * @param baseUrl 基础路径
 * @param fullUrl 完整路径
 * @returns 相对路径，如果不相关则返回null
 */
export function getRelative(baseUrl: string, fullUrl: string): string {
  if (isValidURL(baseUrl) && isValidURL(fullUrl)) {
    const base = new URL(baseUrl);
    const full = new URL(fullUrl);
    if (base.origin !== full.origin) {
      throw new ErrorStatus(statusCode.TYPE_ERROR);
    }
    baseUrl = base.pathname;
    fullUrl = full.pathname;
  }
  return relative(baseUrl, fullUrl);
}
/**
 * 判断目标路径是否是根路径的子路径
 * @param {string} baseUrl 根路径（如 "https://example.com/api"）
 * @param {string} targetUrl 目标路径（如 "https://example.com/api/v1"）
 * @returns {boolean} 如果是子路径返回true，否则返回false
 */
export function isSubPath(baseUrl: string, targetUrl: string): boolean {
  // 规范化路径：移除结尾的斜杠并转为小写（不区分大小写）
  const normalizedBase = baseUrl.replace(/\/+$/, '').toLowerCase();
  const normalizedTarget = targetUrl.replace(/\/+$/, '').toLowerCase();

  // 检查目标路径是否以根路径开头
  if (!normalizedTarget.startsWith(normalizedBase)) {
    return false;
  }

  // 检查是否是直接子路径（根路径后跟/或字符串结束）
  const remaining = normalizedTarget.slice(normalizedBase.length);
  return remaining === '' || remaining.startsWith('/');
}

// 获取父目录路径
export function getDirname(path: string): string {
  if (isAbsolute(path)) {
    return dirname(path);
  }
  return path.replace(/\/[^/]*$/, '');
}
// 获取文件名（不含路径）
export function getFilename(path: string): string {
  if (isAbsolute(path)) {
    return basename(path);
  }
  return normalizedPath(path).replace(/^.*\//, '');
}
// 获取文件名的“主体”部分（不含扩展名）
export function getStem(path: string): string {
  return getFilename(path).replace(/\.\w+$/, '');
}
// 获取文件名的扩展名
export function getExtname(path: string): string {
  if (isAbsolute(path)) {
    return extname(path);
  }
  return `.${getFilename(path).replace(/^.*\./, '')}`;
}
/**
 * 规范化路径：移除结尾的斜杠并转为小写（不区分大小写）
 * @param path 
 * @returns 
 */
export function normalizedPath(path: string): string {
  return path.replace(/\/+$/, '');
}
/**
 * ./ 或../ 开头的路径为相对路径，不能是绝对路径。
 * 不允许的非法字符（如 :, *, ?, ", <, >, | 等）。
 * @param path 要判断的路径
 * @returns 
 */
export function isRelativePath(pathStr: string): boolean {
  // 去除路径字符串两端的空白字符
  const trimmedPath = pathStr.trim();

  // 定义路径中不允许的非法字符
  const illegalChars = /[:*?"<>|]/;

  // 检查路径是否包含非法字符
  if (illegalChars.test(trimmedPath)) {
    return false;
  }
  // 使用 path.isAbsolute 检查路径是否为绝对路径
  if (isAbsolute(trimmedPath) || isValidURL(trimmedPath)) {
    return false;
  }
  return true;
}


export function isValidFilePath(pathStr: string): boolean {
  // 去除路径字符串两端的空白字符
  const trimmedPath = pathStr.trim();

  // 定义路径中不允许的非法字符
  const illegalChars = /[:*?"<>|]/;

  // 检查路径是否包含非法字符
  if (illegalChars.test(trimmedPath)) {
    return false;
  }

  // 检查路径中的每个部分是否符合文件系统命名规则
  const pathParts = trimmedPath.split(sep).filter(part => part !== '');
  for (let part of pathParts) {
    if (illegalChars.test(part)) {
      return false;
    }
  }

  return true;
}

function isValidURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}