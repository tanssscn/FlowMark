// src/config/menus.ts
import { useFileTree } from '@/composable/useFileTree'
import { useTabStore } from '@/stores/tabStore'
import { useWindowStore } from '@/stores/windowStore'
import { milkdownManager } from '@/services/milkdownManager'
import i18n from '@/i18n/index'
import { windowRouter } from '@/services/routerService'
import { useEdit } from '@/composable/useEdit'
import { useWindowRoute } from '@/composable/useWindowRoute'
import { useRecentStore } from '@/stores/recentStore'
import { ViewMode } from '@/types/appTypes'
import { HotKey } from '@/utils/hotkeys'
const { t } = i18n.global

export interface MenuConfig extends HotKey {
  name: string,
  submenu?: MenuConfig[]
  enabled?: boolean,
  checked?: boolean,
  icon?: string,
}
export const useMenuConfig = (): MenuConfig[] => {
  const { openFolder, openFile } = useFileTree()
  const { clearCache } = useWindowRoute()
  const { saveAsFile } = useEdit()
  const recentStore = useRecentStore();
  const tabStore = useTabStore()
  const windowStore = useWindowStore()
  const fileMenus: MenuConfig[] = [
    {
      name: t('menu.FileMenu.newWindow'),
      action: () => {
        windowRouter.openInNewWindow({ path: '/new', name: 'new' })
      },
      shortcut: 'CommandOrControl+Shift+N'
    },
    {
      name: t('menu.FileMenu.openFile'),
      action: () => {
        openFile()
      },
      shortcut: 'CommandOrControl+O'
    },
    {
      name: t('menu.FileMenu.openFolder'),
      action: () => {
        openFolder()
      },
      shortcut: 'CommandOrControl+Shift+O'
    },
    {
      id: 'separator',
      name: t('menu.separator'),
    },
    {
      name: t('menu.FileMenu.save'),
      action: () => {
        milkdownManager.saveFile()
      },
      shortcut: 'CommandOrControl+S'
    },
    {
      name: t('menu.FileMenu.saveAs'),
      action: () => {
        saveAsFile()
      },
      shortcut: 'CommandOrControl+Shift+S'
    },
    {
      id: 'recent-files',
      name: t('menu.FileMenu.recentFiles'),
      submenu: [
        {
          id: 'clear-recent-files',
          name: t('menu.FileMenu.clearRecentFiles'),
          action: () => {
            recentStore.clearAll()
          }
        }
      ]
    },
    {
      name: t('menu.FileMenu.export'),
      action: 'export',
      submenu: [
        {
          name: t('menu.FileMenu.exportHtml'), action: () => {
            milkdownManager.exportHtml()
          }
        },
        {
          name: t('menu.FileMenu.exportPdf'), action: () => {
            window.print()
          }
        },
      ]
    },
    {
      id: 'separator',
      name: t('menu.separator'),
    },
    {
      name: t('settings.label'),
      shortcut: 'CommandOrControl+,',
      action: () => {
        windowStore.switchSettingsModal(true)
      },
    },
    {
      id: 'separator',
      name: t('menu.separator'),
    },
    {
      id: 'clear-cache',
      name: t('menu.FileMenu.clearCache'),
      action: () => {
        clearCache()
      }
    }
  ]

  const editMenus: MenuConfig[] = [
    {
      name: t('menu.EditMenu.undo'), action: () => {
        milkdownManager.undo()
      }, shortcut: 'CommandOrControl+Z'
    },
    {
      name: t('menu.EditMenu.redo'), action: () => {
        milkdownManager.redo()
      }, shortcut: 'CommandOrControl+Shift+Z'
    },
    {
      id: 'separator',
      name: t('menu.separator'),
    },
    {
      name: t('menu.EditMenu.find'), action: () => {
        windowStore.setFindReplace({ show: true, showReplace: false })
      }, shortcut: 'CommandOrControl+F'
    },
    {
      name: t('menu.EditMenu.replace'), action: () => {
        windowStore.setFindReplace({ show: true, showReplace: true })
      }, shortcut: 'CommandOrControl+R'
    }
  ]
  const formatMenus: MenuConfig[] = [
    {
      id: 'heading',
      name: t('menu.FormatMenu.heading'),
      submenu: [
        {
          id: 'heading1',
          name: t('menu.FormatMenu.heading1'),
          shortcut: 'CommandOrControl+1',
          action: () => {
            milkdownManager.setHeading(1)
          }
        },
        {
          id: 'heading2',
          name: t('menu.FormatMenu.heading2'),
          shortcut: 'CommandOrControl+2',
          action: () => {
            milkdownManager.setHeading(2)
          }
        },
        {
          id: 'heading3',
          name: t('menu.FormatMenu.heading3'),
          shortcut: 'CommandOrControl+3',
          action: () => {
            milkdownManager.setHeading(3)
          }
        },
        {
          id: 'heading4',
          name: t('menu.FormatMenu.heading4'),
          shortcut: 'CommandOrControl+4',
          action: () => {
            milkdownManager.setHeading(4)
          }
        },
        {
          id: 'heading5',
          name: t('menu.FormatMenu.heading5'),
          shortcut: 'CommandOrControl+5',
          action: () => {
            milkdownManager.setHeading(5)
          }
        },
        {
          id: 'heading6',
          name: t('menu.FormatMenu.heading6'),
          shortcut: 'CommandOrControl+6',
          action: () => {
            milkdownManager.setHeading(6)
          }
        }, {
          id: 'no-heading',
          name: t('menu.FormatMenu.noHeading'),
          shortcut: 'CommandOrControl+0',
          action: () => {
            milkdownManager.turnIntoText()
          }
        }
      ]
    },
    {
      id: 'blockquote',
      name: t('menu.FormatMenu.blockquote'),
      shortcut: 'CommandOrControl+Shift+B',
      action: () => {
        milkdownManager.blockquote()
      }
    },
    {
      id: 'ordered-list',
      name: t('menu.FormatMenu.orderedList'),
      shortcut: 'CommandOrControl+Shift+L',
      action: () => {
        milkdownManager.orderedList()
      }
    },
    {
      id: 'unordered-list',
      name: t('menu.FormatMenu.unorderedList'),
      shortcut: 'CommandOrControl+Shift+U',
      action: () => {
        milkdownManager.unorderedList()
      }
    },
    {
      id: 'code-block',
      name: t('menu.FormatMenu.codeBlock'),
      shortcut: 'CommandOrControl+Shift+K',
      action: () => {
        milkdownManager.createCodeBlock()
      }
    },
    {
      id: 'inline-code',
      name: t('menu.FormatMenu.inlineCode'),
      shortcut: 'CommandOrControl+Shift+C',
      action: () => {
        milkdownManager.toggleInlineCode()
      }
    },
    {
      id: 'insert-hr',
      name: t('menu.FormatMenu.divider'),
      shortcut: 'CommandOrControl+Shift+H',
      action: () => {
        milkdownManager.insertHr()
      }
    }, {
      id: 'toggle-italic',
      name: t('menu.FormatMenu.italic'),
      shortcut: 'CommandOrControl+I',
      action: () => {
        milkdownManager.toggleItalic()
      }
    }, {
      id: 'toggle-strong',
      name: t('menu.FormatMenu.bold'),
      shortcut: 'CommandOrControl+B',
      action: () => {
        milkdownManager.toggleStrong()
      }
    }, {
      id: 'toggle-link',
      name: t('menu.FormatMenu.link'),
      shortcut: 'CommandOrControl+K',
      action: () => {
        milkdownManager.toggleLink()
      }
    }, {
      id: 'insert-table',
      name: t('menu.FormatMenu.table'),
      shortcut: 'CommandOrControl+Shift+T',
      action: () => {
        windowStore.state.showTableSelect = true
      }
    },
  ]
  const viewMenus: MenuConfig[] = [
    {
      id: 'sidebar-toggle',
      name: t('menu.ViewMenu.sidebar'),
      checked: windowStore.windowState.sidebar.visible,
      action: () => {
        windowStore.toggleSidebar()
      },
      shortcut: 'CommandOrControl+B'
    }, {
      id: 'view-mode',
      name: t('menu.ViewMenu.viewMode'),
      submenu: [
        {
          id: 'wysiwyg',
          name: t('settings.editor.defaultView.wysiwyg'),
          enabled: tabStore.activeSession !== undefined,
          checked: tabStore.activeSession?.viewMode === ViewMode.WYSIWYG,
          action: () => {
            if (tabStore.activeSession) {
              tabStore.switchViewMode(tabStore.activeId!, ViewMode.WYSIWYG)
            }
          },
        },
        {
          id: 'readonly',
          name: t('settings.editor.defaultView.readonly'),
          enabled: tabStore.activeSession !== undefined,
          checked: tabStore.activeSession?.viewMode === ViewMode.READONLY,
          action: () => {
            if (tabStore.activeSession) {
              tabStore.switchViewMode(tabStore.activeId!, ViewMode.READONLY)
            }
          },
        }, {
          id: 'split',
          name: t('settings.editor.defaultView.split'),
          enabled: tabStore.activeSession !== undefined,
          checked: tabStore.activeSession?.viewMode === 'split',
          action: () => {
            if (tabStore.activeSession) {
              tabStore.switchViewMode(tabStore.activeId!, ViewMode.SPLIT)
            }
          }
        }, {
          id: 'source',
          name: t('settings.editor.defaultView.source'),
          enabled: tabStore.activeSession !== undefined,
          checked: tabStore.activeSession?.viewMode === ViewMode.SOURCE,
          action: () => {
            if (tabStore.activeSession) {
              tabStore.switchViewMode(tabStore.activeId!, ViewMode.SOURCE)
            }
          }
        }
      ]
    },
    {
      id: 'close-tab',
      name: t('menu.ViewMenu.closeTab'),
      shortcut: 'CommandOrControl+W',
      action: () => {
        if (!tabStore?.activeId) return
        tabStore.closeTab(tabStore.activeId)
      }
    }
  ]
  const fileMenu: MenuConfig = { id: 'file', name: t('menu.file'), submenu: fileMenus }
  const editMenu: MenuConfig = { id: 'edit', name: t('menu.edit'), submenu: editMenus }
  const formatMenu: MenuConfig = { id: 'format', name: t('menu.format'), submenu: formatMenus }
  const viewMenu: MenuConfig = { id: 'view', name: t('menu.view'), submenu: viewMenus }
  return [fileMenu, editMenu, formatMenu, viewMenu]
}