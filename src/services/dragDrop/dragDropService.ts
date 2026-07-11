import { getDeviceInfo } from '../deviceService';
import { browserDragDrop, type DropHandler } from './browserDragDrop';
import { tauriDragDrop } from './tauriDragDrop';

export type DragHandler = () => void;

export class DragDropService {
  private handler: DropHandler | null = null;
  private enterHandler: DragHandler | null = null;
  private leaveHandler: DragHandler | null = null;

  private getService() {
    const deviceInfo = getDeviceInfo();
    return deviceInfo.isBrowser ? browserDragDrop : tauriDragDrop;
  }

  async init(
    handler: DropHandler,
    enterHandler?: DragHandler,
    leaveHandler?: DragHandler
  ): Promise<void> {
    this.handler = handler;
    this.enterHandler = enterHandler || null;
    this.leaveHandler = leaveHandler || null;
    await this.getService().init(
      (paths) => { this.handler?.(paths); },
      () => { this.enterHandler?.(); },
      () => { this.leaveHandler?.(); }
    );
  }

  destroy(): void {
    this.getService().destroy();
    this.handler = null;
    this.enterHandler = null;
    this.leaveHandler = null;
  }
}

export const dragDropService = new DragDropService();

export type { DropHandler };
