import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import { computed, reactive, readonly, ref, version } from 'vue';
import { restoreApp, RestoreApp } from '@/services/persistService';
import { TabBehavior } from '@/types/app-settings';
import { getFilename } from '@/utils/pathUtil';
import { EditorSession, EditorTab, OutlineItem, ViewMode } from '@/types/app-types.ts';
import { TabType } from '@/types/app-types.ts';
import { enableEditTab, getTabType } from '@/utils/fileUtil';
import { useSettingsStore } from './settingsStore';

export const useTabStore = defineStore('tab', () => {
  const settingsStore = useSettingsStore()
  const tabState = reactive<Record<string, EditorTab>>({})
  const activeTabId = ref<string | undefined>();
  const outlineState = reactive({
    tabId: '',
    outline: [] as OutlineItem[]
  })
  const activeTab = computed(() => {
    return activeTabId.value ? tabState[activeTabId.value] : undefined;
  })
  // 获取当前活动session
  const activeSession = computed(() => {
    return activeTab.value?.edit;
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
    unsave(id: string) {
      if (!tabState[id].edit) return;
      tabState[id].edit.unsaved = true;
      tabState[id].edit.version += 1;
    },
    save(id: string, version: number) {
      if (!tabState[id].edit) return;
      if (tabState[id].edit.version === version) {
        tabState[id].edit.unsaved = false;
      }
    },
    switchViewMode(id: string, mode: ViewMode) {
      console.log('switch view mode', id, mode)
      if (tabState[id].edit) {
        tabState[id].edit.viewMode = mode;
      }
    },
    updateOutline(id: string, _outline: OutlineItem[]) {
      outlineState.tabId = id;
      outlineState.outline = _outline;
    },
    openInTab(options: {
      tabBehavior: TabBehavior, title?: string
      filePath: string, isPinned?: boolean
    }) {
      const { tabBehavior, title, filePath, isPinned } = options;
      // 如果已经打开，则切换到tab
      const existingTab = actions.getByFilePath(filePath)
      if (existingTab) {
        actions.switchTab(existingTab.id);
        return;
      }
      const fileType = getTabType(filePath)
      const session = enableEditTab(fileType) ? createSession() : undefined;
      if (activeTab.value && tabBehavior === 'replace_tab') {
        activeTab.value.edit = session;
        activeTab.value.filePath = filePath;
        activeTab.value.title = options?.title ?? options.filePath;
        activeTab.value.isPinned = isPinned ?? false;
        return;
      }
      // replace模式但没有可以替换的tab，则新建tab
      const tabId = nanoid(7);
      tabState[tabId] = {
        id: tabId,
        type: fileType,
        filePath: filePath,
        title: options?.title ?? options.filePath,
        isPinned: isPinned ?? false,
        edit: session,
      };
      actions.switchTab(tabId)
    },
    switchTab(newActiveId: string) {
      activeTabId.value = newActiveId;
    },
    closeTab(tabId: string) {
      const tab = tabState[tabId];
      if (!tab) return;
      delete tabState[tabId];
      // 如果是活动tab，则切换到其他tab（比如第一个）
      if (activeTabId.value === tabId) {
        const tabs = Object.values(tabState)
        if (tabs.length > 0) {
          const firstTab = tabs[0];
          actions.switchTab(firstTab.id);
        } else {
          activeTabId.value = undefined;
        }
      }
    },
    getByFilePath(filePath: string): EditorTab | undefined {
      return Object.values(tabState).find(tab => tab.filePath === filePath);
    },
    openWelcomeTab() {
      tabState['welcome'] = { title: '欢迎使用', id: "welcome", type: TabType.Welcome } as EditorTab;
      actions.switchTab('welcome');
    },
    updatePath(oldPath: string, newPath: string | null) {
      Object.values(tabState).forEach(tab => {
        if (tab.filePath?.startsWith(oldPath)) {
          if (newPath === null) {
            actions.closeTab(tab.id)
          } else {
            tab.filePath = tab.filePath.replace(oldPath, newPath)
            const title = getFilename(tab.filePath)
            tab.title = title
          }
        }
      });
    }
  };
  return {
    state: readonly(tabState),
    outline: readonly(outlineState),
    tabState,
    activeId: activeTabId,
    ...actions,
    activeTab,
    activeSession,
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
        return JSON.stringify({ tabState: state.tabState, activeId: state.activeId })
      },
      deserialize: (saved) => {
        const parsed = JSON.parse(saved)
        return { tabState: parsed.tabState, activeId: parsed.activeId };
      }
    },
  }
});