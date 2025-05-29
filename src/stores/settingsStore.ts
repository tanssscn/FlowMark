import type { AppSettings, TabBehavior, ThemeMode } from '@/types/appSettings';
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
    tabBehavior: 'new_tab',
    fontSize: 16,
    theme: 'system'
  },
  file: {
    save: {
      autoSave: true,
      autoSaveInterval: 3 // 3 seconds
    },
    history: {
      autoSave: true,
      autoSaveInterval: 1, // 1 minute
      maxNum: 50
    },
    image: {
      imagePathTypeOptions: "relative",
      externImagePathOptions: "keep"
    }
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
    extends: {
      enableMermaid: true,
      enableEmoji: true
    }
  },
  webdav: {
    serverUrl: '',
    username: '',
    password: '',
    autoConnect: false,
  },
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

  // Get current tab behavior
  const currentTabBehavior = computed<TabBehavior>(() => {
    return settings.appearance.tabBehavior;
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
    }
  };

  return {
    state: readonly(settings),
    settings,
    currentTheme,
    currentTabBehavior,
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