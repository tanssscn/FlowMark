import { defineStore } from 'pinia';
import type { SidePanel, WindowState } from '@/types/app-types.ts';
import { reactive } from 'vue';

export const useWindowStore = defineStore('window', () => {
  const windowState = reactive<WindowState>({
    id: '',
    title: '',
    url: '',
    sidebar: {
      width: 280,
      visible: true,
      activePanel: 'fileTree'
    },
    showSettingsModal: false,
    findReplace: {
      show: false,
      showReplace: false,
    },
    showTableSelect: false
  });

  const actions = {
    toggleSidebar() {
      windowState.sidebar.visible = !windowState.sidebar.visible;
    },
    switchSettingsModal(visible: boolean) {
      windowState.showSettingsModal = visible;
    },
    setFindReplace(options: { show?: boolean, showReplace?: boolean }) {
      console.log(options)
      windowState.findReplace = { ...windowState.findReplace, ...options }
    },
    setSidebarWidth(width: number) {
      windowState.sidebar.width = Math.max(200, Math.min(400, width));
    },

    resizeSidebar(width: number) {
      windowState.sidebar.width = width;
    },

    switchSidebarPanel(panel: SidePanel) {
      windowState.sidebar.activePanel = panel;
    },
  };

  return {
    state: windowState,
    windowState,
    ...actions
  };
}, {
  persist: {
    pick: ['state.sidebar'],
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        return JSON.stringify(state)
      },
      deserialize: (saved) => {
        // 反序列化时，直接赋值给 `settings`（不修改 `state`）
        return JSON.parse(saved)
      },
    }
  }
});