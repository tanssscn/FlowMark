import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatDate, nowFormatDate, formatFileSize } from '@/utils/formatUtil'

vi.mock('@/i18n', () => ({
  getCurrentLanguage: vi.fn().mockReturnValue('en'),
}))

describe('formatUtil', () => {
  describe('formatDate', () => {
    it('should format date correctly with YYYY-MM-DD', () => {
      const timestamp = 1672531200000
      const formatted = formatDate(timestamp, 'YYYY-MM-DD')
      expect(formatted.value).toBe('2023-01-01')
    })

    it('should format date correctly with YYYY-MM-DD HH:mm:ss', () => {
      const timestamp = 1672531200000
      const formatted = formatDate(timestamp, 'YYYY-MM-DD HH:mm:ss')
      expect(formatted.value).toMatch(/^2023-01-01 \d{2}:\d{2}:\d{2}$/)
    })

    it('should format date correctly with HH:mm', () => {
      const timestamp = 1672531200000
      const formatted = formatDate(timestamp, 'HH:mm')
      expect(formatted.value).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should format date correctly with mm:ss', () => {
      const timestamp = 1672531200000
      const formatted = formatDate(timestamp, 'mm:ss')
      expect(formatted.value).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should format date correctly with YYYYMMDDHHmmss', () => {
      const timestamp = 1672531200000
      const formatted = formatDate(timestamp, 'YYYYMMDDHHmmss')
      expect(formatted.value).toMatch(/^\d{14}$/)
    })

    it('should handle zero timestamp', () => {
      const timestamp = 0
      const formatted = formatDate(timestamp, 'YYYY-MM-DD')
      expect(formatted.value).toBe('1970-01-01')
    })

    it('should handle negative timestamp', () => {
      const timestamp = -86400000
      const formatted = formatDate(timestamp, 'YYYY-MM-DD')
      expect(formatted.value).toBe('1969-12-31')
    })
  })

  describe('nowFormatDate', () => {
    it('should return reactive date value', () => {
      const formatted = nowFormatDate('YYYY-MM-DD')
      expect(typeof formatted.value).toBe('string')
      expect(formatted.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return reactive date value with time', () => {
      const formatted = nowFormatDate('YYYY-MM-DD HH:mm:ss')
      expect(typeof formatted.value).toBe('string')
      expect(formatted.value).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
      expect(formatFileSize(1099511627776)).toBe('1 TB')
    })

    it('should format with decimal places', () => {
      expect(formatFileSize(1500)).toBe('1.46 KB')
      expect(formatFileSize(1550000)).toBe('1.48 MB')
    })

    it('should handle negative bytes', () => {
      expect(formatFileSize(-1)).toBe('-1 B')
    })

    it('should handle large numbers', () => {
      expect(formatFileSize(1125899906842624)).toBe('1024 TB')
    })

    it('should handle small numbers', () => {
      expect(formatFileSize(1)).toBe('1 B')
      expect(formatFileSize(100)).toBe('100 B')
    })
  })
})
