import { vi } from 'vitest'

// Mock global objects
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock i18n
vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
  getCurrentLanguage: () => 'en',
}))