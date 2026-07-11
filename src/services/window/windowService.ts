import { getDeviceInfo } from '../deviceService';
import type { AppFileInfo } from '@/types/appTypes';
import { browserWindow } from './browserWindow';
import { tauriWindow } from './tauriWindow';

export class WindowServer {
  private getService() {
    const deviceInfo = getDeviceInfo();
    return deviceInfo.isBrowser ? browserWindow : tauriWindow;
  }
  async openInNewWindow(fileInfo: Pick<AppFileInfo, 'path' | 'name'>) {
    await this.getService().openWindow(fileInfo.name, fileInfo.path);
  }

  openWindow(title: string, url: string) {
    return this.getService().openWindow(title, url);
  }

  getCurrentRoute() {
    return this.getService().getCurrentRoute();
  }

  async setWindowTitle(title: string) {
    await this.getService().setWindowTitle(title);
  }

  async getWindowTitle(): Promise<string> {
    return await this.getService().getWindowTitle();
  }

  async isMainWindow(): Promise<boolean> {
    return await this.getService().isMainWindow();
  }

  getCurrentWindow() {
    return this.getService().getCurrentWindow();
  }

  async setTheme(theme: string | null) {
    await this.getService().setTheme(theme);
  }
}
export const windowServer = new WindowServer()