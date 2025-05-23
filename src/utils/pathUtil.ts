import { basename, dirname, extname, isAbsolute, join } from 'pathe';
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { fileService } from '@/services/files/fileService';
import { AppFileInfo } from '@/types/app-types';
import { CodeError } from '@/services/codeService';
import { statusCode } from './statusCodes';
import { isRelativePath, isSameOrigin } from './fileUtil';

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
    if (isSameOrigin(fileInfo.path, url)) {
      console.log("url is same origin")
      const content = await fileService.readFile({ ...fileInfo, path: url })
      return URL.createObjectURL(new Blob([content]))
    }
    console.log("url is not same origin")
  }
  return url;
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

export function calculateDataLength(data: string | ArrayBuffer): number {
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return (<ArrayBuffer>data).byteLength;
  } else if (typeof data === "string") {
    return data.length;
  }
  throw new CodeError(statusCode.TYPE_ERROR);
}

/**
 * 专为 HTTP/HTTPS 路径设计的 join 方法
 * @param {...string} parts 要连接的路径部分
 * @returns {string} 连接后的规范化路径
 */
export function httpJoin(...parts: string[]): string {
  if (parts.length === 0) return '';

  // 处理第一个部分（可能包含协议和域名）
  let result = parts[0].replace(/\/+$/, ''); // 移除末尾的斜杠

  // 处理后续部分
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].replace(/^\/+|\/+$/g, ''); // 移除开头和结尾的斜杠

    if (part) {
      // 如果当前部分包含查询参数或哈希，直接拼接
      if (part.includes('?') || part.includes('#')) {
        result += '/' + part;
        break; // 查询参数或哈希后的部分不再处理
      }

      result += '/' + part;
    }
  }

  // 处理协议后的双斜杠（如 http:// → http:/）
  result = result.replace(/(https?:)\/+/g, '$1//');

  // 确保路径中不包含多个连续的斜杠（除了协议部分）
  result = result.replace(/([^:])\/+/g, '$1/');

  return result;
}
export function getJoin(...parts: string[]): string {
  if (isAbsolute(parts[0])) {
    return join(...parts)
  }
  return httpJoin(...parts)
}

/**
 * 获取网络路径相对于根路径的相对路径
 * @param {string} baseUrl 根路径（如 "https://example.com/api"）
 * @param {string} fullUrl 完整路径（如 "https://example.com/api/v1/users"）
 * @returns {string} 相对路径（如 "v1/users"），如果不是子路径则返回空字符串
 */
export function relativeHttpPath(baseUrl: string, fullUrl: string): string | null {
  // 规范化路径：移除结尾的斜杠
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedFull = fullUrl.replace(/\/+$/, '');

  // 检查是否是相同协议和域名
  if (!normalizedFull.startsWith(normalizedBase)) {
    return '';
  }

  // 获取相对部分
  const relativePart = normalizedFull.slice(normalizedBase.length);

  // 检查是否是直接子路径（以/开头且不包含../）
  if (relativePart === '' || relativePart.startsWith('/')) {
    return relativePart.slice(1); // 移除开头的/
  }

  return null;
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
export function normalizedPath(path: string): string {
  return path.replace(/\/+$/, '');
}