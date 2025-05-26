import { describe, it, expect } from 'vitest'
import { formatDate, nowFormatDate, formatFileSize } from '@/utils/formatUtil'

describe('formatUtil', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const timestamp = 1672531200000 // 2023-01-01 00:00:00 UTC
      const formatted = formatDate(timestamp, 'YYYY-MM-DD')
      expect(formatted.value).toBe('2023-01-01')
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
  })
})