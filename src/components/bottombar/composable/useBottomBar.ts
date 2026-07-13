import { computed } from 'vue'
import { useWindowStore } from '@/stores/windowStore'
import { useI18n } from 'vue-i18n'
import type { SidePanel } from '@/types/appTypes'
import { rebuildMenu } from '@/components/header/composable/client/tauriMenu'

export function useBottomBar() {
  const { t } = useI18n()
  const uiStore = useWindowStore()

  const activePanel = computed(() => uiStore.state.sidebar.activePanel)

  const panels = computed(() => [
    { name: 'fileTree' as SidePanel, label: t('fileTree.label'), icon: 'Folder' },
    { name: 'outline' as SidePanel, label: t('outline.label'), icon: 'List' },
    { name: 'history' as SidePanel, label: t('version.label'), icon: 'Clock' }
  ])

  const switchPanel = (panel: SidePanel) => {
    if (panel === activePanel.value) {
      uiStore.toggleSidebar()
      rebuildMenu()
    } else {
      uiStore.switchSidebarPanel(panel)
    }
  }

  return {
    activePanel,
    panels,
    switchPanel
  }
}
