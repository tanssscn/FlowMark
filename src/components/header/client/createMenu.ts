import { Menu, MenuItem, Submenu, CheckMenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { MenuConfig, useMenuConfig } from '../menuConfig';
import { computed, watch } from 'vue';
import { useTabStore } from '@/stores/tabStore'
import { useWindowStore } from '@/stores/windowStore';
import { useRecentStore } from '@/stores/recentStore';
import { useFileTree } from '@/composable/useFileTree';
import i18n from '@/i18n';
import { Platform } from '@/types/app-types';
const { t } = i18n.global

/**
 * 将 MenuConfig 转换为 Tauri 菜单
 * @param configs 菜单配置对象 { [menuName: string]: MenuConfig[] }
 */

export function menuWatch(menu: Menu | undefined): () => void {
  const tabStore = useTabStore()
  const windowStore = useWindowStore()
  const recentStore = useRecentStore();
  const { openRecentFile } = useFileTree()

  const isActiveSession = computed(() => {
    return tabStore.activeSession !== undefined;
  })
  // 监听viewmode视图
  const unwatchViewMode = watch(() => [isActiveSession, tabStore.activeSession?.viewMode], () => {
    menu?.get('view').then(viewItem => {
      if (viewItem instanceof Submenu) {
        viewItem.get('view-mode').then(viewModeItem => {
          if (viewModeItem instanceof Submenu) {
            viewModeItem.setEnabled(isActiveSession.value)
            viewModeItem.items().then(items => {
              items.forEach(item => {
                if (item instanceof CheckMenuItem) {
                  item.setChecked(item.id === tabStore.activeSession?.viewMode)
                  item.setEnabled(isActiveSession.value)
                }
              })
            })
          }
        })
      }
    });
  }, { immediate: true });
  // 监听侧边栏
  const unwatchSidebar = watch(() => windowStore.windowState.sidebar.visible, (visible) => {
    menu?.get('view').then(viewItem => {
      if (viewItem instanceof Submenu) {
        viewItem.get('toggle-sidebar').then(toggleSidebarItem => {
          if (toggleSidebarItem instanceof CheckMenuItem) {
            toggleSidebarItem.setChecked(visible)
          }
        })
      }
    });
  });
  const unwatchRecentFiles = watch(recentStore.state, () => {
    const menuItems: (Submenu | MenuItem | CheckMenuItem | PredefinedMenuItem)[] = []
    recentStore.state.forEach(async file => {
      await createMenuItem({
        id: file.path,
        name: file.path,
        action: () => {
          openRecentFile({
            path: file.path,
            storageLocation: file.storageLocation,
            isDir: file.isDir
          })
        }
      }).then(menuItem => {
        menuItems.push(menuItem)
      })
    })
    menu?.get('file').then(fileItem => {
      if (fileItem instanceof Submenu) {
        fileItem.get('recent-files').then(recentFilesItem => {
          if (recentFilesItem instanceof Submenu) {
            recentFilesItem.items().then(items => {
              items.forEach(item => {
                fileItem.remove(item)
              })
              menuItems.forEach(item => {
                recentFilesItem.append(item)
              })
            })
          }
        })
      }
    })
  }, { immediate: true })
  return () => {
    unwatchViewMode()
    unwatchSidebar()
    unwatchRecentFiles()
  }
}
export async function createTauriMenu(platform:Platform): Promise<Menu | undefined> {
  const menuConfig = useMenuConfig()
  const menuItems = await createSubmenu(menuConfig);
  const systemMenu = await Menu.default();
  const items = []
  const systemMenuItems = await systemMenu.items();
  for (const item of systemMenuItems) {
    const text = await item.text();
    if (text === 'FlowMark') {
      items.push(item)
    }
  }

  for (const item of menuItems) {
    items.push(item)
  }

  const menu = await Menu.new({ items: items })
  if(platform === 'windows' || platform === 'linux'){
    await menu.setAsWindowMenu()
  }else if (platform === 'macos') {
    await menu.setAsAppMenu()
  }
  return menu;
}

/**
 * 递归创建子菜单
 */
async function createSubmenu(items: MenuConfig[]): Promise<(Submenu | MenuItem | CheckMenuItem | PredefinedMenuItem)[]> {
  return await Promise.all(
    items.map(async item => {
      if (item.submenu) {
        let menuItems: (Submenu | MenuItem | CheckMenuItem | PredefinedMenuItem)[] = await createSubmenu(item.submenu);
        if (item.id === 'edit') {
          menuItems = [...await preMenu(), ...menuItems]
        }
        return Submenu.new({
          id: item.id,
          text: item.name,
          items: menuItems,
          enabled: item.enabled !== false,
        });
      } else {
        return await createMenuItem(item);
      }
    })
  );
}

/**
 * 创建菜单项
 */
async function createMenuItem(config: MenuConfig): Promise<MenuItem | CheckMenuItem | PredefinedMenuItem> {
  const baseOptions = {
    id: config.id,
    text: config.name,
    enabled: config.enabled !== false,
    accelerator: config.shortcut,
    action: typeof config.action === 'function'
      ? config.action
      : undefined
  };

  if (config.checked !== undefined) {
    return await CheckMenuItem.new({
      ...baseOptions,
      checked: config.checked
    });
  } else if (config.id === 'separator') {
    return await PredefinedMenuItem.new({
      ...baseOptions,
      item: 'Separator'
    });
  }
  return await MenuItem.new(baseOptions);
}

const preMenu = async () => {
  // const undo = await PredefinedMenuItem.new({
  //   text: t('menu.EditMenu.undo'),
  //   item: 'Undo',
  // });
  // const redo = await PredefinedMenuItem.new({
  //   text: t('menu.EditMenu.redo'),
  //   item: 'Redo',
  // });
  const copy = await PredefinedMenuItem.new({
    text: t('menu.EditMenu.copy'),
    item: 'Copy',
  });
  const paste = await PredefinedMenuItem.new({
    text: t('menu.EditMenu.paste'),
    item: 'Paste',
  });
  const cut = await PredefinedMenuItem.new({
    text: t('menu.EditMenu.cut'),
    item: 'Cut',
  });
  const selectALL = await PredefinedMenuItem.new({
    text: t('menu.EditMenu.selectAll'),
    item: 'SelectAll',
  });
  const separator = await PredefinedMenuItem.new({
    text: t('menu.separator'),
    item: 'Separator',
  });

  return [copy, paste, cut,selectALL ,separator]
}