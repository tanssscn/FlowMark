import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore, defaultSettings } from '@/stores/settingsStore'

describe('settingsStore', () => {
  let store: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    store = useSettingsStore()
    store.resetSettings()
  })

  describe('initial state', () => {
    it('should have default settings', () => {
      expect(store.state.general.language).toBe('system')
      expect(store.state.appearance.theme).toBe('system')
      expect(store.state.file.save.autoSave).toBe(true)
      expect(store.state.editor.defaultView).toBe('wysiwyg')
    })
  })

  describe('currentTheme', () => {
    it('should return configured theme', () => {
      store.settings.appearance.theme = 'dark'

      expect(store.currentTheme).toBe('dark')
    })

    it('should return light when system prefers light', () => {
      store.state.appearance.theme = 'system'

      expect(store.currentTheme).toBe('light')
    })
  })

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      store.state.general.language = 'en'
      store.state.appearance.theme = 'dark'
      store.state.file.save.autoSave = false

      store.resetSettings()

      expect(store.state.general.language).toBe(defaultSettings.general.language)
      expect(store.state.appearance.theme).toBe(defaultSettings.appearance.theme)
      expect(store.state.file.save.autoSave).toBe(defaultSettings.file.save.autoSave)
    })
  })

  describe('resetGeneral', () => {
    it('should reset general settings', () => {
      store.state.general.language = 'en'
      store.state.general.restoreLastSession = false

      store.resetGeneral()

      expect(store.state.general).toEqual(defaultSettings.general)
    })
  })

  describe('resetAppearance', () => {
    it('should reset appearance settings', () => {
      store.state.appearance.fontSize = 20
      store.state.appearance.theme = 'dark'

      store.resetAppearance()

      expect(store.state.appearance).toEqual(defaultSettings.appearance)
    })
  })

  describe('resetFile', () => {
    it('should reset file settings', () => {
      store.state.file.save.autoSave = false
      store.state.file.history.maxNum = 100

      store.resetFile()

      expect(store.state.file).toEqual(defaultSettings.file)
    })
  })

  describe('resetEditor', () => {
    it('should reset editor settings', () => {
      store.state.editor.font.fontFamily = 'Arial'
      store.state.editor.defaultView = 'preview'

      store.resetEditor()

      expect(store.state.editor).toEqual(defaultSettings.editor)
    })
  })

  describe('resetMarkdown', () => {
    it('should reset markdown settings', () => {
      store.state.markdown.codeBlock.lineNumbers = true
      store.state.markdown.extensions.enableMermaid = false

      store.resetMarkdown()

      expect(store.state.markdown).toEqual(defaultSettings.markdown)
    })
  })

  describe('resetKeymap', () => {
    it('should reset keymap settings', () => {
      store.state.keymap.commands = []

      store.resetKeymap()

      expect(store.state.keymap).toEqual(defaultSettings.keymap)
    })
  })

  describe('resetWebdav', () => {
    it('should reset webdav settings', () => {
      store.state.webdav = [{ url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }]

      store.resetWebdav()

      expect(store.state.webdav).toEqual(defaultSettings.webdav)
    })
  })

  describe('addWebdavAccount', () => {
    it('should add new webdav account', () => {
      const account = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }

      const result = store.addWebdavAccount(account)

      expect(result).toStrictEqual(account)
      expect(store.state.webdav.length).toBe(1)
      expect(store.state.webdav[0]).toStrictEqual(account)
    })

    it('should not add duplicate account', () => {
      const account = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }
      store.addWebdavAccount(account)

      const result = store.addWebdavAccount(account)

      expect(result).toBe(account)
      expect(store.state.webdav.length).toBe(1)
    })
  })

  describe('isExistedWebdavAccount', () => {
    it('should return true for existing account', () => {
      const account = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }
      store.addWebdavAccount(account)

      const result = store.isExistedWebdavAccount(account)

      expect(result).toBe(true)
    })

    it('should return false for non-existing account', () => {
      const account = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }

      const result = store.isExistedWebdavAccount(account)

      expect(result).toBe(false)
    })
  })

  describe('updateWebdavAccount', () => {
    it('should update existing account', () => {
      const oldAccount = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }
      store.addWebdavAccount(oldAccount)

      const result = store.updateWebdavAccount(oldAccount, { showInFileTree: false })

      expect(result.showInFileTree).toBe(false)
      expect(store.state.webdav[0].showInFileTree).toBe(false)
    })

    it('should not update to duplicate account', () => {
      const account1 = { url: 'http://test1', username: 'user', password: 'pass', showInFileTree: true }
      const account2 = { url: 'http://test2', username: 'user2', password: 'pass', showInFileTree: true }
      store.addWebdavAccount(account1)
      store.addWebdavAccount(account2)

      const result = store.updateWebdavAccount(account1, { url: 'http://test2', username: 'user2' })

      expect(result).toStrictEqual(account1)
      expect(store.state.webdav[0]).toStrictEqual(account1)
    })
  })

  describe('setWebdavShowInFileTree', () => {
    it('should update showInFileTree flag', () => {
      const account = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }
      store.addWebdavAccount(account)

      store.setWebdavShowInFileTree(account, false)

      expect(store.state.webdav[0].showInFileTree).toBe(false)
    })
  })

  describe('removeWebdavAccount', () => {
    it('should remove webdav account', () => {
      const account = { url: 'http://test', username: 'user', password: 'pass', showInFileTree: true }
      store.addWebdavAccount(account)

      store.removeWebdavAccount(account)

      expect(store.state.webdav.length).toBe(0)
    })
  })
})
