import { vi } from 'vitest'
import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'

// Initialize Pinia for store testing
setActivePinia(createPinia())

// Mock global objects
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock window.matchMedia
global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)' ? false : true,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock i18n
vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
  getCurrentLanguage: () => 'en',
}))