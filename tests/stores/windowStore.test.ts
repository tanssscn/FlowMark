import { describe, it, expect, beforeEach } from 'vitest'
import { useWindowStore } from '@/stores/windowStore'

describe('windowStore', () => {
  let store: ReturnType<typeof useWindowStore>

  beforeEach(() => {
    store = useWindowStore()
    store.state.sidebar.visible = true
    store.state.sidebar.width = 280
    store.state.sidebar.activePanel = 'fileTree'
    store.state.showSettingsModal = false
    store.state.findReplace.show = false
    store.state.findReplace.showReplace = false
    store.state.showTableSelect = false
  })

  describe('toggleSidebar', () => {
    it('should toggle sidebar visibility', () => {
      expect(store.state.sidebar.visible).toBe(true)

      store.toggleSidebar()

      expect(store.state.sidebar.visible).toBe(false)

      store.toggleSidebar()

      expect(store.state.sidebar.visible).toBe(true)
    })
  })

  describe('switchSettingsModal', () => {
    it('should show settings modal', () => {
      store.switchSettingsModal(true)

      expect(store.state.showSettingsModal).toBe(true)
    })

    it('should hide settings modal', () => {
      store.switchSettingsModal(true)
      store.switchSettingsModal(false)

      expect(store.state.showSettingsModal).toBe(false)
    })
  })

  describe('setFindReplace', () => {
    it('should set find replace options', () => {
      store.setFindReplace({ show: true, showReplace: false })

      expect(store.state.findReplace.show).toBe(true)
      expect(store.state.findReplace.showReplace).toBe(false)
    })

    it('should update only specified options', () => {
      store.setFindReplace({ show: true })

      expect(store.state.findReplace.show).toBe(true)
      expect(store.state.findReplace.showReplace).toBe(false)
    })

    it('should set showReplace option', () => {
      store.setFindReplace({ showReplace: true })

      expect(store.state.findReplace.showReplace).toBe(true)
    })
  })

  describe('setSidebarWidth', () => {
    it('should set sidebar width within bounds', () => {
      store.setSidebarWidth(300)

      expect(store.state.sidebar.width).toBe(300)
    })

    it('should clamp width to minimum', () => {
      store.setSidebarWidth(100)

      expect(store.state.sidebar.width).toBe(200)
    })

    it('should clamp width to maximum', () => {
      store.setSidebarWidth(500)

      expect(store.state.sidebar.width).toBe(400)
    })
  })

  describe('resizeSidebar', () => {
    it('should set sidebar width directly', () => {
      store.resizeSidebar(350)

      expect(store.state.sidebar.width).toBe(350)
    })
  })

  describe('switchSidebarPanel', () => {
    it('should switch to fileTree panel', () => {
      store.switchSidebarPanel('fileTree')

      expect(store.state.sidebar.activePanel).toBe('fileTree')
    })

    it('should switch to outline panel', () => {
      store.switchSidebarPanel('outline')

      expect(store.state.sidebar.activePanel).toBe('outline')
    })

    it('should switch to version panel', () => {
      store.switchSidebarPanel('version')

      expect(store.state.sidebar.activePanel).toBe('version')
    })
  })

  describe('state', () => {
    it('should have default window state', () => {
      expect(store.state.id).toBe('')
      expect(store.state.title).toBe('')
      expect(store.state.url).toBe('')
      expect(store.state.sidebar.width).toBe(280)
      expect(store.state.sidebar.visible).toBe(true)
      expect(store.state.sidebar.activePanel).toBe('fileTree')
    })
  })
})
