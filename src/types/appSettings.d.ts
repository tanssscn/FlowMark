import { ViewMode } from './appTypes';
import { ExternImagePathOptions, ImagePathTypeOptions } from './appSettings'
export type ConflictResolution = 'ask' | 'overwrite' | 'keep_both';
export type TabBehavior = 'new_tab' | 'replace_tab';
export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'en-US' | 'zh-CN' | 'system';

export type ImagePathTypeOptions = typeof ImagePathTypeOptions[keyof typeof ImagePathTypeOptions];
export type ExternImagePathOptions = typeof ExternImagePathOptions[keyof typeof ExternImagePathOptions];
// ============== 应用设置 ==============
// 常规设置
export interface GeneralSettings {
  language: Language;
  conflictResolution: ConflictResolution; // 冲突解决策略
  restoreLastSession: boolean;
}
// 外观 设置
export interface AppearanceSettings {
  tabBehavior: TabBehavior;
  fontSize: number;
  theme: ThemeMode;
}
// 文件设置
export interface SaveSettings {
  autoSave: boolean;
  autoSaveInterval: number;
}
export interface ImageSettings {
  imagePathTypeOptions: ImagePathTypeOptions; // 绝对路径
  externImagePathOptions: ExternImagePathOptions; // 保留原路径
}
export interface HistorySettings {
  autoSave: boolean; // 是否记录历史
  autoSaveInterval: number; // 自动记录间隔
  maxNum: number; // 最大历史记录数
}
export interface FileSettings {
  save: SaveSettings;
  history: HistorySettings;
  image: ImageSettings;
}
// 编辑器设置
export interface FontSettings {
  fontFamily: string; // 字体
  lineHeight: number; // 行高
  lineWidth: number; // 行宽(字符数)
}
export interface IndentSettings {
  indentUnit: number; // 缩进单位
  useTab: boolean; // 使用Tab缩进
}

export interface EditorSettings {
  font: FontSettings;
  indent: IndentSettings;
  defaultView: ViewMode;
}
// Markdown 设置
export interface CodeBlockSettings {
  syntaxHighlighting: boolean,
  lineNumbers: boolean,
}
export interface ExtendsSettings {
  enableMermaid: boolean; // 图表支持
  enableEmoji: boolean; // Emoji支持
}
export interface MarkdownSettings {
  tocDepth: number[]; // 目录深度
  codeBlock: CodeBlockSettings; // 代码块设置
  extends: ExtendsSettings; // 扩展功能设置
}
// WebDAV 设置
export interface WebDAVSettings {
  serverUrl: string;
  username: string;
  password: string;
  autoConnect: boolean; // 自动同步
}
export interface Command {
  name: string;
  shortcut: string;
}
// 快捷键设置
export interface KeymapSettings {
  commands: Command[];
}
export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  file: FileSettings;
  editor: EditorSettings;
  markdown: MarkdownSettings;
  webdav: WebDAVSettings;
  keymap: KeymapSettings;
}

