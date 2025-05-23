
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getDeviceInfo } from './deviceService';
import { AppFileInfo } from '@/types/app-types.ts';
import { getAllWebviews } from '@tauri-apps/api/webview';
import { Window } from "@tauri-apps/api/window"

function getUniqueName(name: string, existingNames: string[]): string {
  const pattern = /^(.*?)(_(\d+))?$/;
  const match = pattern.exec(name);
  const baseName = match![1]; // 基础名字（去掉后缀的部分）
  const existingSuffix = match![3] ? parseInt(match![3], 10) : 0;

  let newName = name;
  let counter = existingSuffix + 1;

  while (existingNames.includes(newName)) {
    newName = `${baseName}_${counter}`;
    counter++;
  }

  return newName;
}
const deviceInfo = getDeviceInfo();
export class WindowRouter {
  public constructor() {
  }
  getCurrentWindow(): Window | null {
    if (deviceInfo.isBrowser) {
      return null
    } else {
      return Window.getCurrent()
    }
  }
  async isMainWindow() {
    if (!deviceInfo.isBrowser) {
      const title = await this.getCurrentWindow()?.title()
      console.log(title)
      if (title === "FlowMark") {
        return true
      }
    }
  }

  /**
   * 在新窗口中打开URL
   * @param url 要打开的URL
   * @param options 窗口配置选项
   * @returns 新窗口的引用或null
   */

  async openInNewWindow(fileInfo: Pick<AppFileInfo, 'path' | 'name'>) {
    await this.openWindow(fileInfo.name, fileInfo.path)
  }
  async openWindow(title: string, url: string): Promise<Window | WebviewWindow | WindowProxy | null> {
    if (deviceInfo.isBrowser) {
      // 浏览器环境使用 window.open
      return this.openBrowserWindow(title, url);
    } else {
      // Tauri 环境使用窗口 API
      return this.openTauriWindow(title, url);
    }
  }

  /**
   * 获取当前窗口的路由信息
   * @returns 包含路径和查询参数的对象
   */
  getCurrentRoute(): {
    path: string;
    query: Record<string, string>;
    fullPath: string;
  } {
    return this.getBrowserRoute();
  }

  // --- 私有方法 ---

  private openBrowserWindow(target: string, url: string): WindowProxy | null {
    const newWindow = window.open(url, target || '_blank');

    if (!newWindow) {
      console.error('弹出窗口被浏览器阻止，请检查浏览器设置');
      return null;
    }

    return newWindow;
  }

  private async openTauriWindow(title: string, url: string): Promise<Window | WebviewWindow | null> {
    const titles = (await getAllWebviews()).map(w => w.label)
    const uniqueTitle = getUniqueName(title, titles);
    try {
      const webview = new WebviewWindow(uniqueTitle, {
        dragDropEnabled: false,
        url: url,
      });
      // const webview = new WebviewWindow(uniqueTitle, {url:'https://element-plus.org/zh-CN/component/tree.html',});
      webview.once('tauri://created', function () {
        console.log('webview created');
        // webview successfully created
      });
      webview.once('tauri://error', function (e) {
        console.error('webview creation error:', e);
        // an error happened creating the webview
      });
      return webview as unknown as Window;
    } catch (error) {
      console.error('打开Tauri窗口失败:', error);
      return null;
    }

  }

  private getBrowserRoute() {
    const { pathname, search } = window.location;
    const query = this.parseQueryString(search);

    return {
      path: pathname,
      query,
      fullPath: pathname + search
    };
  }

  private parseQueryString(queryString: string): Record<string, string> {
    return Object.fromEntries(
      new URLSearchParams(queryString).entries()
    );
  }

}

export const windowRouter = new WindowRouter();