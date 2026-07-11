<script setup lang="ts">
import { useWindowStore } from '@/stores/windowStore';
import { useMenuConfig, type MenuConfig } from './composable/menuConfig'
import { ref, watch } from 'vue';
import { useTabStore } from '@/stores/tabStore';
import { useRecentStore } from '@/stores/recentFileStore.ts';
import { useFile } from '@/composable/useFile.ts';
import { getCurrentLanguage } from '@/i18n';
import SubMenu from './SubMenu.vue'
const windowStore = useWindowStore()
const tabStore = useTabStore()
const recentStore = useRecentStore();
const { openRecentFile } = useFile()

const menuData = ref(useMenuConfig())
watch(getCurrentLanguage, () => {
  menuData.value = useMenuConfig()
})

function findMenuById(menus: MenuConfig[], id: string): MenuConfig | undefined {
  for (const menu of menus) {
    if (menu.id === id) {
      return menu
    }
    if (menu.submenu) {
      const found = findMenuById(menu.submenu, id)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

const subOpen = (menuId: string) => {
  switch (menuId) {
    case 'recent-files': {
      const menuItems = recentStore.state.map(file => {
        return {
          id: file.path,
          name: file.path,
          action: () => {
            openRecentFile({
              path: file.path,
              storageLocation: file.storageLocation,
              isDir: file.isDir
            })
          }
        }
      })
      const recentFilesMenu = findMenuById(menuData.value, 'recent-files')
      if (recentFilesMenu) {
        recentFilesMenu.submenu = [...menuItems, ...[findMenuById(menuData.value, 'clear-recent-files')!]]
      }
      break
    }
    case 'view': {
      const sidebarToggleMenu = findMenuById(menuData.value, 'sidebar-toggle')
      const viewModeMenu = findMenuById(menuData.value, 'view-mode')
      if (sidebarToggleMenu) {
        sidebarToggleMenu.checked = windowStore.windowState.sidebar.visible
      }
      if (viewModeMenu) {
        viewModeMenu.enabled = tabStore.activeSession !== undefined
      }
      break
    }
    case 'view-mode': {
      const viewModeMenu = findMenuById(menuData.value, 'view-mode')
      viewModeMenu?.submenu?.forEach(item => {
        item.enabled = tabStore.activeSession !== undefined
        item.checked = item.id === tabStore.activeSession?.viewMode
      })
      break
    }
    default:
      break
  }
}
</script>

<template>
  <el-menu mode="horizontal" :unique-opened="true" @open="subOpen">
    <template v-for="(menus, index) in menuData" :key="index">
      <SubMenu :label="menus.name" :id="menus.id" :submenu="menus.submenu" />
    </template>
  </el-menu>
</template>
<style lang="css" scoped>
.el-menu--horizontal {
  --el-menu-horizontal-height: 36px;
}
</style>
