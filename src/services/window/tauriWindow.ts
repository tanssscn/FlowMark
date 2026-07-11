import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getAllWebviews } from '@tauri-apps/api/webview';
import { getCurrentWindow, Theme, Window } from "@tauri-apps/api/window"

function getUniqueName(name: string, existingNames: string[]): string {
  const pattern = /^(.*?)(_(\d+))?$/;
  const match = pattern.exec(name);
  const baseName = match![1];
  const existingSuffix = match![3] ? parseInt(match![3], 10) : 0;

  let newName = name;
  let counter = existingSuffix + 1;

  while (existingNames.includes(newName)) {
    newName = `${baseName}_${counter}`;
    counter++;
  }

  return newName;
}

export class TauriWindow {
  getCurrentWindow(): Window {
    return getCurrentWindow();
  }

  async setTheme(theme: string | null): Promise<void> {
    await getCurrentWindow().setTheme(theme as Theme | null);
  }

  async openWindow(title: string, url: string): Promise<Window | WebviewWindow | null> {
    const titles = (await getAllWebviews()).map(w => w.label)
    const uniqueTitle = getUniqueName(title, titles);
    try {
      const webview = new WebviewWindow(uniqueTitle, {
        dragDropEnabled: false,
        url: url,
      });
      webview.once('tauri://created', function () {
        console.log('webview created');
      });
      webview.once('tauri://error', function (e) {
        console.error('webview creation error:', e);
      });
      return webview as unknown as Window;
    } catch (error) {
      console.error('打开Tauri窗口失败:', error);
      return null;
    }
  }

  getCurrentRoute(): {
    path: string;
    query: Record<string, string>;
    fullPath: string;
  } {
    const { pathname, search } = window.location;
    const query = this.parseQueryString(search);
    return {
      path: pathname,
      query,
      fullPath: pathname + search
    };
  }

  async setWindowTitle(title: string): Promise<void> {
    await getCurrentWindow().setTitle(title);
  }

  async getWindowTitle(): Promise<string> {
    return await getCurrentWindow().title();
  }

  async isMainWindow(): Promise<boolean> {
    const title = await getCurrentWindow().title();
    return title === "FlowMark";
  }

  private parseQueryString(queryString: string): Record<string, string> {
    return Object.fromEntries(
      new URLSearchParams(queryString).entries()
    );
  }
}

export const tauriWindow = new TauriWindow();
