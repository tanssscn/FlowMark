export class BrowserWindow {
    openWindow(title: string, url: string): WindowProxy | null {
        const newWindow = window.open(url, title || '_blank');
        if (!newWindow) {
            console.error('弹出窗口被浏览器阻止，请检查浏览器设置');
            return null;
        }
        return newWindow;
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

    setWindowTitle(title: string): void {
        document.title = title;
    }

    async getWindowTitle(): Promise<string> {
        return new Promise((resolve) => {
            resolve(document.title);
        });
    }

    async isMainWindow(): Promise<boolean> {
        return new Promise((resolve) => {
            resolve(true);
        });
    }

    getCurrentWindow(): null {
        return null;
    }

    setTheme(_theme: string | null): void {
    }

    private parseQueryString(queryString: string): Record<string, string> {
        return Object.fromEntries(
            new URLSearchParams(queryString).entries()
        );
    }
}

export const browserWindow = new BrowserWindow();
