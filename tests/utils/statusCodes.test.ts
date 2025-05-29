import { describe, it, expect } from 'vitest'
import { statusCode, isStatusCodeError, isUserError, isSystemError, isConditionalError, isSuccess } from '@/utils/statusCodes'
import { ErrorStatus } from '@/services/codeService'

describe('statusCodes', () => {
  describe('statusCode constants', () => {
    it('should have correct success code', () => {
      expect(statusCode.SUCCESS.code).toBe(2000)
    })

    it('should have correct error codes', () => {
      expect(statusCode.UNKNOWN_ERROR.code).toBe(5000)
      expect(statusCode.SYSTEM_ERROR.code).toBe(6000)
    })
  })

  describe('type guards', () => {
    const successError = new ErrorStatus(statusCode.SUCCESS)
    const userError = new ErrorStatus(statusCode.INVALID_CREDENTIALS)
    const systemError = new ErrorStatus(statusCode.SYSTEM_ERROR)
    const conditionalError = new ErrorStatus(statusCode.UNKNOWN_ERROR)
    const nonCodeError = new Error('Regular error')

    it('isStatusCodeError should identify CodeError', () => {
      expect(isStatusCodeError(successError)).toBe(true)
      expect(isStatusCodeError(nonCodeError)).toBe(false)
    })

    it('isUserError should identify user errors', () => {
      expect(isUserError(userError)).toBe(true)
      expect(isUserError(systemError)).toBe(false)
    })

    it('isSystemError should identify system errors', () => {
      expect(isSystemError(systemError)).toBe(true)
      expect(isSystemError(userError)).toBe(false)
    })

    it('isConditionalError should identify conditional errors', () => {
      expect(isConditionalError(conditionalError)).toBe(true)
      expect(isConditionalError(userError)).toBe(false)
    })

    it('isSuccess should identify success codes', () => {
      expect(isSuccess(successError)).toBe(true)
      expect(isSuccess(userError)).toBe(false)
    })
  })
})