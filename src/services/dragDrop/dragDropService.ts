import { browserDragDrop, type DropHandler } from './browserDragDrop';

export type DragHandler = () => void;

/**
 * 全局拖放服务。
 *
 * Tauri 主窗口与新建窗口均配置 dragDropEnabled=false：
 * - 禁用后操作系统不再拦截 webview 的 HTML5 拖放，页面内部拖拽（文件树）可正常工作；
 * - 外部文件的拖入同样走标准 HTML5 事件。
 * 因此浏览器与 Tauri 统一使用 HTML5 实现。
 */
export class DragDropService {
  private handler: DropHandler | null = null;
  private enterHandler: DragHandler | null = null;
  private leaveHandler: DragHandler | null = null;

  async init(
    handler: DropHandler,
    enterHandler?: DragHandler,
    leaveHandler?: DragHandler
  ): Promise<void> {
    this.handler = handler;
    this.enterHandler = enterHandler || null;
    this.leaveHandler = leaveHandler || null;
    browserDragDrop.init(
      (paths) => { this.handler?.(paths); },
      () => { this.enterHandler?.(); },
      () => { this.leaveHandler?.(); }
    );
  }

  destroy(): void {
    browserDragDrop.destroy();
    this.handler = null;
    this.enterHandler = null;
    this.leaveHandler = null;
  }
}

export const dragDropService = new DragDropService();

export type { DropHandler };
