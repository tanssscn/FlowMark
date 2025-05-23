<!-- src/components/header/AppMenu.vue -->
<script setup lang="ts">
import { useWindowStore } from '@/stores/windowStore';
import { useMenuConfig } from './menuConfig'
import SubMenu from './SubMenu.vue';
import { ref, watch } from 'vue';
import { useTabStore } from '@/stores/tabStore';
import { useRecentStore } from '@/stores/recentStore';
import { useFileTree } from '@/composable/useFileTree';
import { getCurrentLanguage } from '@/i18n';
const windowStore = useWindowStore()
const tabStore = useTabStore()
const recentStore = useRecentStore();
const { openRecentFile } = useFileTree()

const menuData = ref(useMenuConfig())
watch(getCurrentLanguage,()=>{
  menuData.value = useMenuConfig()
})
const subOpen = (index: string) => {
  console.log(index)
  switch (index) {
    case 'recent-files':
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
      if (menuData.value[0].submenu && menuData.value[0].submenu[5]) {
        menuData.value[0].submenu[5].submenu = menuItems
      }
      break;
    case 'view':
      if (menuData.value[2].submenu && menuData.value[2].submenu[0]) {
        menuData.value[2].submenu[0].checked = windowStore.windowState.sidebar.visible
        menuData.value[2].submenu[1].enabled = tabStore.activeSession !== undefined
      } break;
    case 'view-mode':
      if (menuData.value[2].submenu && menuData.value[2].submenu[1]) {
        menuData.value[2].submenu[1].submenu?.forEach((item, index) => {
          console.log(item.id)
          item.enabled = tabStore.activeSession !== undefined
          item.checked = item.id === tabStore.activeSession?.viewMode
        })
      }
      break;
    default:
      break;
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
  --el-menu-horizontal-height: 50px;
}
</style>