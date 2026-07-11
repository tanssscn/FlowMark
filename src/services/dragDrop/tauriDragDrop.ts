import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { DropHandler } from './browserDragDrop';
import type { DragHandler } from './dragDropService';

export class TauriDragDrop {
  private dropHandler: DropHandler | null = null;
  private enterHandler: DragHandler | null = null;
  private leaveHandler: DragHandler | null = null;
  private unlistenDrop: UnlistenFn | null = null;
  private unlistenEnter: UnlistenFn | null = null;
  private unlistenLeave: UnlistenFn | null = null;

  async init(handler: DropHandler, enterHandler?: DragHandler, leaveHandler?: DragHandler): Promise<void> {
    this.dropHandler = handler;
    this.enterHandler = enterHandler || null;
    this.leaveHandler = leaveHandler || null;

    this.unlistenDrop = await listen('tauri://drag-drop', (event) => {
      const paths = (event.payload as { paths: string[] })?.paths || [];
      this.dropHandler?.(paths);
    });

    this.unlistenEnter = await listen('tauri://drag-enter', () => {
      this.enterHandler?.();
    });

    this.unlistenLeave = await listen('tauri://drag-leave', () => {
      this.leaveHandler?.();
    });
  }

  destroy(): void {
    if (this.unlistenDrop) {
      this.unlistenDrop();
      this.unlistenDrop = null;
    }
    if (this.unlistenEnter) {
      this.unlistenEnter();
      this.unlistenEnter = null;
    }
    if (this.unlistenLeave) {
      this.unlistenLeave();
      this.unlistenLeave = null;
    }
    this.dropHandler = null;
    this.enterHandler = null;
    this.leaveHandler = null;
  }
}

export const tauriDragDrop = new TauriDragDrop();
