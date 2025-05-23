import { Platform as _Platform } from '@tauri-apps/plugin-os';

// 导出应用类型供直接导入使用
export type StorageLocation = 'local' | 'webdav';
export enum ViewMode {
  WYSIWYG = 'wysiwyg',      // 所见即所得（What You See Is What You Get）
  READONLY = 'readonly',    // 只读
  SPLIT = 'split',          // 分栏（编辑与预览分屏）
  SOURCE = 'source'         // 源码模式（纯文本编辑）
}
export type FileStatus = 'saved' | 'modified' | 'error';
export type Platform = 'browser' | _Platform


export type SidePanel = 'fileTree' | 'outline' | 'history';
// ============== 文件系统相关 ==============
export interface AppFileInfo {
  path: string; // 绝对路径
  rootPath?: string;    // 根路径，如 "/projects"
  relativePath?: string; // 相对路径
  name: string; // 文件名
  lastModified: number; // 最后修改时间
  storageLocation: StorageLocation; // 存储位置
  isDir: boolean; // 是否是目录
  size?: number; // 大小
  readonly?: boolean; // 是否只读
  hidden?: boolean; // 是否隐藏
  isRoot?: boolean; // 是否是根目录
  version?: string; // 版本号/etag/md5
}

export interface FileEntry extends AppFileInfo {
  children?: FileEntry[];
}

// 文件系统核心类型
export interface FileSystemState {
  expandedPaths: string[]; // 展开的目录路径
  fileTree: Map<string, FileEntry>; // 文件树
  treeRoot: Record<string, AppFileInfo>; // 根目录路径
  currentPath?: string;  //未启用
  selectedFile?: string; // 未启用
  loading: boolean;
}

// ============== 版本控制 ==============
export interface VersionInfo {
  id: string;
  createdAt: number;
  message?: string;
}

export interface RecentFile {
  path: string;
  storageLocation: StorageLocation;
  isDir: boolean;
  lastOpened: number;             // 最后打开时间
  pinned?: boolean;               // 是否固定
}
// 编辑器会话状态
export interface OutlineItem {
  id: string
  text: string
  level: number
  pos: number
  children?: OutlineItem[]
}

export enum TabType {
  Image = 'image',
  Markdown = 'markdown',
  PDF = 'pdf',
  Unknown = 'unknown',
  Welcome = 'welcome',
}
export interface EditorSession {
  viewMode: ViewMode;
  version: number;
  unsaved: boolean;
}
// 标签页状态
export interface EditorTab {
  id: string;
  type: TabType
  title: string;
  isPinned: boolean;
  edit?: EditorSession; // 关联EditorSession
  filePath?: string;
}

// ============== 窗口管理 ==============
export interface SidebarState {
  width: number;
  visible: boolean;
  activePanel: SidePanel;
}
export interface WindowState {
  id: string; // 窗口唯一ID
  title: string; // 窗口标题
  url: string; // 窗口URL
  sidebar: SidebarState; // 侧边栏状态
  lastAccessed?: number; // 最后访问时间戳
  showSettingsModal: boolean
  findReplace: {
    show: boolean,
    showReplace: boolean,
  },
  showTableSelect: boolean;
}