import type { DragHandler } from './dragDropService';

export type DropHandler = (paths: string[]) => void;

export class BrowserDragDrop {
  private dropHandler: DropHandler | null = null;
  private enterHandler: DragHandler | null = null;
  private leaveHandler: DragHandler | null = null;

  init(handler: DropHandler, enterHandler?: DragHandler, leaveHandler?: DragHandler): void {
    this.dropHandler = handler;
    this.enterHandler = enterHandler || null;
    this.leaveHandler = leaveHandler || null;
    document.addEventListener('dragenter', this.handleDragEnter);
    document.addEventListener('dragover', this.handleDragOver);
    document.addEventListener('dragleave', this.handleDragLeave);
    document.addEventListener('drop', this.handleDrop);
  }

  destroy(): void {
    document.removeEventListener('dragenter', this.handleDragEnter);
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('dragleave', this.handleDragLeave);
    document.removeEventListener('drop', this.handleDrop);
    this.dropHandler = null;
    this.enterHandler = null;
    this.leaveHandler = null;
  }

  private handleDragEnter = (event: DragEvent): void => {
    if (event.dataTransfer?.files.length) {
      event.preventDefault();
      this.enterHandler?.();
    }
  };

  private handleDragOver = (event: DragEvent): void => {
    if (event.dataTransfer?.files.length) {
      event.preventDefault();
    }
  };

  private handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    this.leaveHandler?.();
  };

  private handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0 || !this.dropHandler) {
      return;
    }
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      paths.push(files[i].name);
    }
    this.dropHandler(paths);
  };
}

export const browserDragDrop = new BrowserDragDrop();
