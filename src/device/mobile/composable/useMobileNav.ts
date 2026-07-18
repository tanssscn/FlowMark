import { ref, readonly } from 'vue'

export type MobilePage = 'home' | 'editor' | 'settings'
export type MobilePanel = 'outline' | 'version' | null

// 全局导航状态（单例）
const currentPage = ref<MobilePage>('home')
const activePanel = ref<MobilePanel>(null)
// 页面历史栈，用于返回
const pageStack = ref<MobilePage[]>(['home'])

function navigateTo(page: MobilePage) {
  if (currentPage.value === page) return
  pageStack.value.push(page)
  currentPage.value = page
}

function navigateBack() {
  if (pageStack.value.length > 1) {
    pageStack.value.pop()
    currentPage.value = pageStack.value[pageStack.value.length - 1]
  }
}

function openPanel(panel: MobilePanel) {
  activePanel.value = panel
}

function closePanel() {
  activePanel.value = null
}

function togglePanel(panel: Exclude<MobilePanel, null>) {
  if (activePanel.value === panel) {
    activePanel.value = null
  } else {
    activePanel.value = panel
  }
}

export function useMobileNav() {
  return {
    currentPage: readonly(currentPage),
    activePanel: readonly(activePanel),
    navigateTo,
    navigateBack,
    openPanel,
    closePanel,
    togglePanel,
  }
}
