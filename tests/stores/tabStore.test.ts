import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTabStore } from '@/stores/tabStore'

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn().mockReturnValue({
    state: {
      editor: {
        defaultView: 'wysiwyg',
      },
    },
  }),
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('mock-id'),
}))

vi.mock('@/services/persistService', () => ({
  restoreApp: {
    restoreLastSession: vi.fn().mockReturnValue({ getResult: () => null }),
  },
  RestoreApp: vi.fn().mockImplementation(() => ({
    restoreLastSession: vi.fn().mockReturnValue({ getResult: () => null }),
  })),
}))

describe('tabStore', () => {
  let store: ReturnType<typeof useTabStore>

  beforeEach(() => {
    vi.clearAllMocks()
    store = useTabStore()
    store.closeTab()
  })

  describe('openInTab', () => {
    it('should create new tab for file', () => {
      const tab = store.openInTab({ filePath: '/test/file.md' })

      expect(tab).toBeDefined()
      expect(tab?.filePath).toBe('/test/file.md')
      expect(tab?.title).toBe('file.md')
      expect(tab?.edit).toBeDefined()
    })

    it('should reuse existing tab', () => {
      store.openInTab({ filePath: '/test/file.md' })
      const originalTab = store.currentTab

      const tab = store.openInTab({ filePath: '/test/file.md' })

      expect(tab).toBe(originalTab)
    })

    it('should open file with pinned option', () => {
      const tab = store.openInTab({ filePath: '/test/file.md', isPinned: true })

      expect(tab?.isPinned).toBe(true)
    })

    it('should update existing tab when switching files', () => {
      store.openInTab({ filePath: '/test/file1.md' })
      const tab = store.openInTab({ filePath: '/test/file2.md' })

      expect(tab?.filePath).toBe('/test/file2.md')
      expect(tab?.title).toBe('file2.md')
    })
  })

  describe('closeTab', () => {
    it('should clear current tab', () => {
      store.openInTab({ filePath: '/test/file.md' })
      expect(store.currentTab).toBeDefined()

      store.closeTab()

      expect(store.currentTab).toBeUndefined()
    })
  })

  describe('isCurrentTabByFilePath', () => {
    it('should return true when path matches', () => {
      store.openInTab({ filePath: '/test/file.md' })

      const result = store.isCurrentTabByFilePath('/test/file.md')

      expect(result).toBe(true)
    })

    it('should return false when path does not match', () => {
      store.openInTab({ filePath: '/test/file.md' })

      const result = store.isCurrentTabByFilePath('/test/other.md')

      expect(result).toBe(false)
    })

    it('should return false when no tab is open', () => {
      const result = store.isCurrentTabByFilePath('/test/file.md')

      expect(result).toBe(false)
    })
  })

  describe('openWelcomeTab', () => {
    it('should open welcome tab', () => {
      store.openWelcomeTab()

      expect(store.currentTab).toBeDefined()
      expect(store.currentTab?.title).toBe('欢迎使用')
      expect(store.currentTab?.type).toBe('welcome')
    })
  })

  describe('unsave', () => {
    it('should mark tab as unsaved', () => {
      store.openInTab({ filePath: '/test/file.md' })

      store.unsave()

      expect(store.currentTab?.edit?.unsaved).toBe(true)
      expect(store.currentTab?.edit?.version).toBe(1)
    })

    it('should increment version on unsave', () => {
      store.openInTab({ filePath: '/test/file.md' })
      store.unsave()
      const version1 = store.currentTab?.edit?.version

      store.unsave()

      expect(store.currentTab?.edit?.version).toBe(version1! + 1)
    })

    it('should do nothing when no tab', () => {
      store.unsave()
    })
  })

  describe('save', () => {
    it('should mark tab as saved', () => {
      store.openInTab({ filePath: '/test/file.md' })
      store.unsave()

      store.save(1)

      expect(store.currentTab?.edit?.unsaved).toBe(false)
    })

    it('should not mark as saved when version mismatch', () => {
      store.openInTab({ filePath: '/test/file.md' })
      store.unsave()

      store.save(0)

      expect(store.currentTab?.edit?.unsaved).toBe(true)
    })
  })

  describe('switchViewMode', () => {
    it('should change view mode', () => {
      store.openInTab({ filePath: '/test/file.md' })

      store.switchViewMode('preview')

      expect(store.currentTab?.edit?.viewMode).toBe('preview')
    })

    it('should do nothing when no tab', () => {
      store.switchViewMode('preview')
    })
  })

  describe('updateOutline', () => {
    it('should update outline for tab', () => {
      store.openInTab({ filePath: '/test/file.md' })
      const outline = [{ id: 'h1', label: 'Heading', start: 0, end: 10 }]

      store.updateOutline('mock-id', outline)

      expect(store.outline.outline).toEqual(outline)
      expect(store.outline.tabId).toBe('mock-id')
    })
  })

  describe('updatePath', () => {
    it('should update file path', () => {
      store.openInTab({ filePath: '/test/old.md' })

      store.updatePath('/test/old.md', '/test/new.md')

      expect(store.currentTab?.filePath).toBe('/test/new.md')
      expect(store.currentTab?.title).toBe('new.md')
    })

    it('should update path when old path matches', () => {
      store.openInTab({ filePath: '/test/old.md' })

      store.updatePath('/test/old.md', '/new/new.md')

      expect(store.currentTab?.filePath).toBe('/new/new.md')
      expect(store.currentTab?.title).toBe('new.md')
    })

    it('should do nothing when new path is null', () => {
      store.openInTab({ filePath: '/test/file.md' })

      store.updatePath('/test/file.md', null)

      expect(store.currentTab?.filePath).toBe('/test/file.md')
    })

    it('should do nothing when path does not match', () => {
      store.openInTab({ filePath: '/test/file.md' })

      store.updatePath('/other/path.md', '/test/new.md')

      expect(store.currentTab?.filePath).toBe('/test/file.md')
    })
  })

  describe('activeSession', () => {
    it('should return current session', () => {
      store.openInTab({ filePath: '/test/file.md' })

      expect(store.activeSession).toBe(store.currentTab?.edit)
    })

    it('should return undefined when no tab', () => {
      expect(store.activeSession).toBeUndefined()
    })
  })
})
