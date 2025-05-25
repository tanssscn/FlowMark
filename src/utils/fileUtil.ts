import { CodeError } from '@/services/codeService';
import { getDeviceInfo } from '@/services/deviceService';
import { Platform, StorageLocation, TabType } from '@/types/app-types.ts';
import { basename } from 'pathe';
import { statusCode } from './statusCodes';
/**
 * 判断是否应该忽略的文件（跨平台实现）
 * @param filename 文件名（不含路径）
 * @param platform 平台类型
 */
export function ignoreHiddenFiles(
  filename: string,
  platform: Platform = getDeviceInfo().type,
  location: StorageLocation = 'local'
): boolean {
  // 通用忽略规则（所有平台）
  const universalIgnorePatterns = [
    /^\./,          // 所有点开头的文件
    /^~/,           // 临时文件（如 ~$example.docx）
    /\.tmp$/i,      // 临时文件
    /\.bak$/i,      // 备份文件
    /^npm-debug\.log$/i,
  ];
  // 平台特定忽略规则
  const platformSpecificPatterns: Partial<Record<typeof platform, RegExp[]>> = {
    windows: [
      /^Thumbs\.db$/i,    // Windows 缩略图数据库
      /^desktop\.ini$/i,   // Windows 桌面配置
      /^ehthumbs\.db$/i,
    ],
    macos: [
      /^\.DS_Store$/i,     // macOS 目录元数据
      /^\._.*$/,           // macOS 资源派生文件
      /^\.Spotlight-/i,
      /^\.Trashes/i,
      /^\.fseventsd/i,
    ],
    linux: [
      /^\.directory$/i,    // KDE 目录配置
      /^\.Trash-/i,
    ],
  };
  const localIgnorePatterns: Record<typeof location, RegExp[]> = {
    webdav: [
      /^\.well-known$/i,
      /^\.htaccess$/i,
    ],
    local: [
    ]
  }


  // 合并规则
  const allPatterns = [
    ...universalIgnorePatterns,
    ...(platformSpecificPatterns[platform] || []),
    ...(localIgnorePatterns[location] || [])
  ];

  return allPatterns.some(pattern => pattern.test(filename));
}

/**
 * 过滤文件条目列表（通用实现）
 * @param entries 文件条目数组
 * @param platform 平台类型
 */
export async function filterFileEntries<T extends { name: string }>(
  entries: T[],
  platform?: Platform,
  location?: StorageLocation
): Promise<T[]> {
  const filtered = await Promise.all(
    entries.map(async entry => {
      // 获取纯文件名（不含路径）
      const filename = await basename(entry.name);
      return ignoreHiddenFiles(filename, platform, location) ? null : entry;
    })
  );
  return filtered.filter(Boolean) as T[];
}


const fileExtensions: Record<TabType, string[]> = {
  [TabType.Image]: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
  [TabType.Markdown]: ['md', 'markdown'],
  [TabType.PDF]: ['pdf'],
  [TabType.Welcome]: ['welcome'],
  [TabType.Unknown]: []
};

export function getTabType(fileName: string): TabType {
  const fileExtension = fileName.toLowerCase().split('.').pop();
  if (!fileExtension) {
    return TabType.Unknown;
  }

  // 遍历所有文件类型，查找该扩展名是否匹配
  for (const [type, extensions] of Object.entries(fileExtensions)) {
    if ((extensions as string[]).includes(fileExtension)) {
      return type as TabType;
    }
  }

  return TabType.Unknown;
}

export function enableEditTab(tabType: TabType): boolean {
  if (tabType === TabType.Markdown || tabType === TabType.Unknown) {
    return true
  }
  return false
}

export function calculateDataLength(data: string | ArrayBuffer): number {
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return (<ArrayBuffer>data).byteLength;
  } else if (typeof data === "string") {
    return data.length;
  }
  throw new CodeError(statusCode.TYPE_ERROR);
}