import type { DragHandler } from './dragDropService';

export type DropHandler = (paths: string[]) => void;

/**
 * 基于 HTML5 Drag and Drop 的拖放实现，浏览器环境与 Tauri 环境
 * （窗口配置 dragDropEnabled=false）共用。
 *
 * 必须区分两种拖拽：
 * 1. 页面内部拖拽（例如文件树 el-tree 的节点拖拽）：拖拽从页面内发起，
 *    document 上会先收到 dragstart 事件。这类事件不能拦截，否则页面自身
 *    的拖拽功能会失效。
 * 2. 从操作系统拖入的外部文件：document 不会收到 dragstart，且
 *    dataTransfer.types 包含 'Files'。
 */
export class BrowserDragDrop {
  /**
   * 拖拽进行中时浏览器会按固定间隔（约 350ms）重复派发 dragover。
   * 若超过该间隔仍未收到新的 dragover，说明拖拽已经结束：
   * 用户按 ESC 取消、或拖到窗口外释放时不会派发 drop / dragleave，
   * 只能靠这个看门狗收起拖放指示层，否则动画会一直残留。
   */
  private static readonly DRAG_IDLE_TIMEOUT = 800;

  private dropHandler: DropHandler | null = null;
  private enterHandler: DragHandler | null = null;
  private leaveHandler: DragHandler | null = null;
  private isInternalDrag = false;
  private dragIdleTimer: ReturnType<typeof setTimeout> | null = null;

  init(handler: DropHandler, enterHandler?: DragHandler, leaveHandler?: DragHandler): void {
    this.dropHandler = handler;
    this.enterHandler = enterHandler || null;
    this.leaveHandler = leaveHandler || null;
    document.addEventListener('dragstart', this.handleDragStart);
    document.addEventListener('dragend', this.handleDragEnd);
    document.addEventListener('dragenter', this.handleDragEnter);
    document.addEventListener('dragover', this.handleDragOver);
    document.addEventListener('dragleave', this.handleDragLeave);
    document.addEventListener('drop', this.handleDrop);
  }

  destroy(): void {
    document.removeEventListener('dragstart', this.handleDragStart);
    document.removeEventListener('dragend', this.handleDragEnd);
    document.removeEventListener('dragenter', this.handleDragEnter);
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('dragleave', this.handleDragLeave);
    document.removeEventListener('drop', this.handleDrop);
    this.stopIdleWatchdog();
    this.isInternalDrag = false;
    this.dropHandler = null;
    this.enterHandler = null;
    this.leaveHandler = null;
  }

  /**
   * 仅当拖拽来自操作系统且携带文件时才视为外部拖放。
   * 注意：dragenter/dragover 阶段浏览器出于安全考虑 files 列表可能为空，
   * 因此需要通过 types 中是否包含 'Files' 判断。
   */
  private isExternalFileDrag = (event: DragEvent): boolean => {
    if (this.isInternalDrag) return false;
    const types = event.dataTransfer?.types;
    if (!types) return false;
    return Array.from(types).includes('Files');
  };

  private handleDragStart = (): void => {
    this.isInternalDrag = true;
  };

  private handleDragEnd = (): void => {
    this.isInternalDrag = false;
    this.stopIdleWatchdog();
  };

  private handleDragEnter = (event: DragEvent): void => {
    if (this.isExternalFileDrag(event)) {
      event.preventDefault();
      this.enterHandler?.();
      this.startIdleWatchdog();
    }
  };

  private handleDragOver = (event: DragEvent): void => {
    if (this.isExternalFileDrag(event)) {
      // 必须阻止默认行为，浏览器才允许在此处 drop
      event.preventDefault();
      // 指示层可能已被看门狗收起（如环境未按间隔派发 dragover），此处兜底恢复
      this.enterHandler?.();
      this.startIdleWatchdog();
    }
  };

  private handleDragLeave = (event: DragEvent): void => {
    if (!this.isExternalFileDrag(event)) return;
    // relatedTarget 为空且坐标归零表示拖拽已离开文档窗口，
    // 避免在文档内元素间移动时指示层闪烁
    const leftWindow = event.relatedTarget === null && event.clientX === 0 && event.clientY === 0;
    if (leftWindow) {
      this.stopIdleWatchdog();
      this.leaveHandler?.();
    }
  };

  private handleDrop = (event: DragEvent): void => {
    if (!this.isExternalFileDrag(event)) return;
    event.preventDefault();
    this.stopIdleWatchdog();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0 || !this.dropHandler) {
      this.leaveHandler?.();
      return;
    }
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      // 部分 WebView 运行时（Electron 等）会在 File 上附带绝对路径
      const file = files[i] as File & { path?: string };
      paths.push(file.path || file.name);
    }
    this.dropHandler(paths);
  };

  /** 收到 dragover 时重置计时；超时未再收到即视为拖拽已结束（取消/在窗口外释放） */
  private startIdleWatchdog = (): void => {
    this.stopIdleWatchdog();
    this.dragIdleTimer = setTimeout(() => {
      this.dragIdleTimer = null;
      this.leaveHandler?.();
    }, BrowserDragDrop.DRAG_IDLE_TIMEOUT);
  };

  private stopIdleWatchdog = (): void => {
    if (this.dragIdleTimer !== null) {
      clearTimeout(this.dragIdleTimer);
      this.dragIdleTimer = null;
    }
  };
}

export const browserDragDrop = new BrowserDragDrop();
