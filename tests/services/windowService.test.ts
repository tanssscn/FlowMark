import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { windowServer } from '@/services/window/windowService'

vi.mock('@/services/deviceService', () => ({
  getDeviceInfo: vi.fn(),
}))

vi.mock('@/services/window/browserWindow', () => ({
  browserWindow: {
    openWindow: vi.fn(),
    getCurrentRoute: vi.fn(),
    setWindowTitle: vi.fn(),
    getWindowTitle: vi.fn(),
    isMainWindow: vi.fn(),
    getCurrentWindow: vi.fn(),
    setTheme: vi.fn(),
  },
}))

vi.mock('@/services/window/tauriWindow', () => ({
  tauriWindow: {
    openWindow: vi.fn(),
    getCurrentRoute: vi.fn(),
    setWindowTitle: vi.fn(),
    getWindowTitle: vi.fn(),
    isMainWindow: vi.fn(),
    getCurrentWindow: vi.fn(),
    setTheme: vi.fn(),
  },
}))

import { getDeviceInfo } from '@/services/deviceService'
import { browserWindow } from '@/services/window/browserWindow'
import { tauriWindow } from '@/services/window/tauriWindow'

describe('windowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('browser environment', () => {
    beforeEach(() => {
      vi.mocked(getDeviceInfo).mockReturnValue({ isBrowser: true } as any)
    })

    it('should open file in new window', async () => {
      await windowServer.openInNewWindow({ path: '/test/path', name: 'test.md' })
      expect(browserWindow.openWindow).toHaveBeenCalledWith('test.md', '/test/path')
    })

    it('should open window', () => {
      windowServer.openWindow('title', 'url')
      expect(browserWindow.openWindow).toHaveBeenCalledWith('title', 'url')
    })

    it('should get current route', () => {
      windowServer.getCurrentRoute()
      expect(browserWindow.getCurrentRoute).toHaveBeenCalled()
    })

    it('should set window title', async () => {
      await windowServer.setWindowTitle('New Title')
      expect(browserWindow.setWindowTitle).toHaveBeenCalledWith('New Title')
    })

    it('should get window title', async () => {
      vi.mocked(browserWindow.getWindowTitle).mockResolvedValue('Current Title')
      const title = await windowServer.getWindowTitle()
      expect(title).toBe('Current Title')
    })

    it('should check if main window', async () => {
      vi.mocked(browserWindow.isMainWindow).mockResolvedValue(true)
      const isMain = await windowServer.isMainWindow()
      expect(isMain).toBe(true)
    })

    it('should get current window', () => {
      windowServer.getCurrentWindow()
      expect(browserWindow.getCurrentWindow).toHaveBeenCalled()
    })

    it('should set theme', async () => {
      await windowServer.setTheme('dark')
      expect(browserWindow.setTheme).toHaveBeenCalledWith('dark')
    })
  })

  describe('tauri environment', () => {
    beforeEach(() => {
      vi.mocked(getDeviceInfo).mockReturnValue({ isBrowser: false } as any)
    })

    it('should open file in new window', async () => {
      await windowServer.openInNewWindow({ path: '/test/path', name: 'test.md' })
      expect(tauriWindow.openWindow).toHaveBeenCalledWith('test.md', '/test/path')
    })

    it('should open window', () => {
      windowServer.openWindow('title', 'url')
      expect(tauriWindow.openWindow).toHaveBeenCalledWith('title', 'url')
    })

    it('should set window title', async () => {
      await windowServer.setWindowTitle('New Title')
      expect(tauriWindow.setWindowTitle).toHaveBeenCalledWith('New Title')
    })

    it('should set theme', async () => {
      await windowServer.setTheme(null)
      expect(tauriWindow.setTheme).toHaveBeenCalledWith(null)
    })
  })
})
