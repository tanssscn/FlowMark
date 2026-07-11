import type { AppSettings, ThemeMode, WebDAVSettings } from '@/types/appSettings';
import { ViewMode } from '@/types/appTypes';
import { defineStore } from 'pinia';
import { computed, reactive, readonly } from 'vue';

export const defaultSettings: AppSettings = {
  general: {
    language: 'system',
    conflictResolution: 'ask',
    restoreLastSession: true,
  },
  appearance: {
    fontSize: 16,
    theme: 'system'
  },
  file: {
    save: {
      autoSave: true,
      autoSaveInterval: 1 // 3 seconds
    },
    history: {
      autoSave: true,
      autoSaveInterval: 1, // 1 minute
      maxNum: 50
    },
    image: {
      imagePathTypeOptions: "relative",
      externImagePathOptions: "keep"
    },
    defaultFileExtension: 'md',
  },
  editor: {
    font: {
      fontFamily: "Helvetica Neue, Arial, sans-serif",
      lineHeight: 1.6,
      lineWidth: 80
    },
    indent: {
      indentUnit: 2,
      useTab: false
    },
    defaultView: ViewMode.WYSIWYG
  },
  markdown: {
    tocDepth: [1, 2, 3],
    codeBlock: {
      syntaxHighlighting: true,
      lineNumbers: false,
    },
    extensions: {
      enableMermaid: true,
      enableEmoji: true
    }
  },
  webdav: [],
  keymap: {
    commands: [
      {
        name: 'find',
        shortcut: 'CommandOrControl+F',
      },
    ]
  }
};

export const useSettingsStore = defineStore('settings', () => {
  const settings = reactive<AppSettings>({
    ...structuredClone(defaultSettings),
  } as AppSettings);

  // Get current theme (resolves 'system' to actual theme)
  const currentTheme = computed<Exclude<ThemeMode, 'system'>>(() => {
    if (settings.appearance.theme !== 'system') {
      return settings.appearance.theme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const actions = {
    // Reset all settings to defaults
    resetSettings() {
      Promise.allSettled([
        this.resetGeneral(),
        this.resetAppearance(),
        this.resetFile(),
        this.resetEditor(),
        this.resetMarkdown(),
        this.resetKeymap(),
        this.resetWebdav()
      ])
    },
    resetGeneral() {
      settings.general = structuredClone(defaultSettings.general);
    },
    resetAppearance() {
      settings.appearance = structuredClone(defaultSettings.appearance);
    },
    resetFile() {
      settings.file = structuredClone(defaultSettings.file);
    },
    resetEditor() {
      settings.editor = structuredClone(defaultSettings.editor);
    },
    resetMarkdown() {
      settings.markdown = structuredClone(defaultSettings.markdown);
    },
    resetKeymap() {
      settings.keymap = structuredClone(defaultSettings.keymap);
    },
    resetWebdav() {
      console.log(defaultSettings.webdav)
      settings.webdav = structuredClone(defaultSettings.webdav);
    },
    updateWebdavAccount(oldAccount: WebDAVSettings, newAccount: Partial<WebDAVSettings>): WebDAVSettings {
      const account = { ...oldAccount, ...newAccount }
      if ((account.url !== oldAccount.url || oldAccount.username !== account.username) && this.isExistedWebdavAccount(account)) {
        return oldAccount;
      }
      settings.webdav.splice(settings.webdav.indexOf(oldAccount), 1, account);
      return account;
    },
    setWebdavShowInFileTree(oldAccount: WebDAVSettings, show: boolean) {
      const account = { ...oldAccount, showInFileTree: show }
      this.updateWebdavAccount(oldAccount, account)
    },
    addWebdavAccount(account: WebDAVSettings): WebDAVSettings {
      if (this.isExistedWebdavAccount(account)) {
        return account;
      }
      settings.webdav.push(account);
      return account;
    },
    isExistedWebdavAccount(account: WebDAVSettings) {
      return settings.webdav.some(acc => acc.url === account.url && acc.username === account.username && acc.password === account.password);
    },
    removeWebdavAccount(account: WebDAVSettings) {
      settings.webdav.splice(settings.webdav.indexOf(account), 1);
    },
  };

  return {
    state: readonly(settings),
    settings,
    currentTheme,
    ...actions
  };
}, {
  persist: {
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        return JSON.stringify(state.settings);
      },
      deserialize: (saved) => {
        // Merge saved settings with defaults (saved settings take precedence)
        return {
          settings: {
            ...structuredClone(defaultSettings),
            ...JSON.parse(saved)
          }
        };
      },
    },
    afterHydrate: (ctx) => {
      const storageKey = ctx.store.$id;
      const storedData = localStorage.getItem(storageKey);

      // If no data in storage (first load), force write defaults
      if (!storedData) {
        ctx.store.$persist();
      }

      // Migration logic can go here if needed
      // For example, checking for old settings structure and converting
    },
  }
});