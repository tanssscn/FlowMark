import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import { computed, reactive, readonly, ref } from 'vue';
import { restoreApp, RestoreApp } from '@/services/persistService';
import { getFilename } from '@/utils/pathUtil';
import type { EditorSession, EditorTab, OutlineItem, ViewMode } from '@/types/appTypes';
import { TabType } from '@/types/appTypes';
import { enableEditTab, getTabType } from '@/utils/fileUtil';
import { useSettingsStore } from './settingsStore';

export const useTabStore = defineStore('tab', () => {
  const settingsStore = useSettingsStore()
  const currentTab = ref<EditorTab | undefined>();
  const outlineState = reactive({
    tabId: '',
    outline: [] as OutlineItem[]
  })
  // 获取当前活动session
  const currentSession = computed(() => {
    return currentTab.value?.edit;
  });
  const createSession = (): EditorSession => {
    const session: EditorSession = {
      viewMode: settingsStore.state.editor.defaultView,
      unsaved: false,
      version: 0,
    };
    return session;
  }
  // 操作方法
  const actions = {
    unsave() {
      if (!currentTab.value?.edit) return;
      currentTab.value.edit.unsaved = true;
      currentTab.value.edit.version += 1;
    },
    save(version: number) {
      if (!currentTab.value?.edit) return;
      if (currentTab.value.edit.version === version) {
        currentTab.value.edit.unsaved = false;
      }
    },
    switchViewMode(mode: ViewMode) {
      if (currentTab.value?.edit) {
        currentTab.value.edit.viewMode = mode;
      }
    },
    updateOutline(id: string, _outline: OutlineItem[]) {
      outlineState.tabId = id;
      outlineState.outline = _outline;
    },
    // 打开新tab
    openInTab(options: {
      filePath: string, isPinned?: boolean
    }) {
      const { filePath, isPinned } = options;
      // 如果已经打开，则切换到tab
      const existingTab = actions.isCurrentTabByFilePath(filePath);
      if (existingTab) {
        return currentTab.value;
      }
      const fileType = getTabType(filePath)
      const session = enableEditTab(fileType) ? createSession() : undefined;
      if (currentTab.value) {
        currentTab.value.edit = session;
        currentTab.value.filePath = filePath;
        currentTab.value.title = getFilename(filePath);
        currentTab.value.type = fileType;
        currentTab.value.isPinned = isPinned ?? false;
        return currentTab.value;
      }
      const tabId = nanoid(7);
      currentTab.value = {
        id: tabId,
        type: fileType,
        filePath: filePath,
        title: getFilename(filePath),
        isPinned: isPinned ?? false,
        edit: session,
      };
      return currentTab.value;
    },
    closeTab() {
      if (!currentTab.value) return;
      currentTab.value = undefined;
    },
    isCurrentTabByFilePath(filePath: string): boolean {
      return currentTab.value?.filePath === filePath;
    },
    openWelcomeTab() {
      const welcomeTab = { title: '欢迎使用', id: "welcome", type: TabType.Welcome } as EditorTab;
      currentTab.value = welcomeTab;
    },
    updatePath(oldPath: string, newPath: string | null) {
      if (currentTab.value?.filePath?.startsWith(oldPath)) {
        if (newPath === null) {
          // actions.closeTab()
        } else {
          currentTab.value.filePath = newPath;
          const title = getFilename(currentTab.value.filePath)
          currentTab.value.title = title
        }
      }
    }
  };
  return {
    state: readonly(currentTab),
    outline: readonly(outlineState),
    currentTab,
    ...actions,
    activeSession: currentSession,
  };
}, {
  // https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/config.html
  persist: {
    beforeHydrate: (ctx) => {
      restoreApp.restoreLastSession(undefined, () => {
        ctx.store.$state = {} // 清空恢复的数据
      })
    },
    storage: {
      getItem: (key) => {
        // 条件判断：例如仅允许特定环境读取
        return new RestoreApp().restoreLastSession(() => {
          return localStorage.getItem(key)
        }).getResult()
      },
      setItem: (key, value) => {
        // 条件判断：例如仅允许特定环境存储
        return restoreApp.restoreLastSession(() => {
          localStorage.setItem(key, value)
        })
      },
    },
    serializer: {
      serialize: (state) => {
        return JSON.stringify({ currentTab: state.currentTab })
      },
      deserialize: (saved) => {
        const parsed = JSON.parse(saved)
        return { currentTab: parsed.currentTab };
      }
    },
  }
});