import type { AppSettings, Language, ThemeMode } from '@/types/appSettings';
import { windowRouter } from "./routerService";

function getSettings(): AppSettings | undefined {
  const settingsStr = localStorage.getItem('settings')
  // 从存储中读取主题设置
  if (settingsStr) {
    try {
      const settingsData = JSON.parse(settingsStr)
      return settingsData
    } catch (parseError) {
      console.error('Error parsing settings:', parseError)
    }
  }
}
export class RestoreApp {
  private result: any;
  private _isNewWindow: boolean;

  constructor() {
    const { fullPath } = windowRouter.getCurrentRoute()
    this._isNewWindow = (fullPath === '/new')
  }
  isNewWindow(): boolean {
    return this._isNewWindow
  }
  isRestoreLastSession(): boolean {
    const settings = getSettings()
    if (!this._isNewWindow && settings && settings.general.restoreLastSession) {
      return true
    }
    return false
  }
  restoreLastSession(callback?: () => any, falseCallback?: () => any): RestoreApp {
    if (this._isNewWindow) {
      falseCallback ? falseCallback() : null
      return this;
    }
    const settings = getSettings()
    if (settings && settings.general.restoreLastSession) {
      this.result = callback ? callback() : null
      return this;
    }
    falseCallback ? falseCallback() : null
    return this;
  }
  getResult(): any {
    return this.result
  }
}

export const restoreApp = new RestoreApp();


export class ThemeManager {
  // 设置主题
  initTheme() {
    try {
      const settingsData = getSettings()
      if (settingsData) {
        this.applyTheme(settingsData.appearance.theme)
      } else {
        // 如果没有设置，使用系统主题
        this.applyTheme('system')
      }
    } catch (e) {
      this.applyTheme('system')
    }
  }

  // 应用主题
  async applyTheme(theme: ThemeMode) {
    if (theme === 'system') {
      console.log("system theme")
      // 应用系统主题
      const systemTheme = windowRouter.getCurrentWindow()
      if (systemTheme) {
        await systemTheme.setTheme(null)
      }
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    // Set Element Plus dark mode
    windowRouter.getCurrentWindow()?.setTheme(theme)
    document.documentElement.classList.remove(theme === 'dark' ? 'light' : 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    document.querySelector('html')?.classList.add(theme)
  }
}
export const themeManager = new ThemeManager()

export function getSettingsLanguage(): Language {
  const settingsData = getSettings()
  if (settingsData) {
    return settingsData.general.language
  }
  return 'system'
}