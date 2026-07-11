import { describe, it, expect } from 'vitest'
import { statusCode, isStatusCodeError, isUserError, isSystemError, isConditionalError, isSuccess, isEqualStatusCode } from '@/utils/statusCodes'
import { ErrorStatus } from '@/services/codeService'

describe('statusCodes', () => {
  describe('statusCode constants', () => {
    it('should have correct success code', () => {
      expect(statusCode.SUCCESS.code).toBe(2000)
      expect(statusCode.SUCCESS.message).toBe('notify.success.label')
    })

    it('should have correct user error codes', () => {
      expect(statusCode.UNSUPPORTED_OPERATION.code).toBe(4000)
      expect(statusCode.INVALID_CREDENTIALS.code).toBe(4005)
      expect(statusCode.NEED_CONNECT_SERVER.code).toBe(4006)
    })

    it('should have correct conditional error codes', () => {
      expect(statusCode.UNKNOWN_ERROR.code).toBe(5000)
      expect(statusCode.NOT_FOUND.code).toBe(5001)
    })

    it('should have correct system error codes', () => {
      expect(statusCode.SYSTEM_ERROR.code).toBe(6000)
      expect(statusCode.FORBIDDEN.code).toBe(6001)
      expect(statusCode.FILE_EXITS.code).toBe(6002)
      expect(statusCode.FILE_NOT_FOUND.code).toBe(6004)
      expect(statusCode.TYPE_ERROR.code).toBe(6005)
      expect(statusCode.FILE_HANDLE_NOT_FOUND.code).toBe(6006)
      expect(statusCode.BROWSER_FILE_SYSTEM_ERROR.code).toBe(6007)
      expect(statusCode.AUTHEN_ERROR_NEED_USERNAME_PASSWORD.code).toBe(6008)
      expect(statusCode.WEBDAV_REQUEST_FAILED.code).toBe(6009)
      expect(statusCode.INVALID_RESPONSE.code).toBe(6010)
    })
  })

  describe('isStatusCodeError', () => {
    it('should identify ErrorStatus instances', () => {
      const successError = new ErrorStatus(statusCode.SUCCESS)
      const userError = new ErrorStatus(statusCode.INVALID_CREDENTIALS)
      expect(isStatusCodeError(successError)).toBe(true)
      expect(isStatusCodeError(userError)).toBe(true)
    })

    it('should reject regular errors', () => {
      const nonCodeError = new Error('Regular error')
      expect(isStatusCodeError(nonCodeError)).toBe(false)
    })

    it('should reject non-error values', () => {
      expect(isStatusCodeError(null)).toBe(false)
      expect(isStatusCodeError(undefined)).toBe(false)
      expect(isStatusCodeError('string')).toBe(false)
      expect(isStatusCodeError(123)).toBe(false)
      expect(isStatusCodeError({})).toBe(false)
    })
  })

  describe('isEqualStatusCode', () => {
    it('should return true when codes match', () => {
      const error = new ErrorStatus(statusCode.INVALID_CREDENTIALS)
      expect(isEqualStatusCode(error, statusCode.INVALID_CREDENTIALS)).toBe(true)
    })

    it('should return false when codes do not match', () => {
      const error = new ErrorStatus(statusCode.INVALID_CREDENTIALS)
      expect(isEqualStatusCode(error, statusCode.SYSTEM_ERROR)).toBe(false)
    })

    it('should return false for non-ErrorStatus', () => {
      const regularError = new Error('Regular error')
      expect(isEqualStatusCode(regularError, statusCode.SYSTEM_ERROR)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isEqualStatusCode(null, statusCode.SYSTEM_ERROR)).toBe(false)
      expect(isEqualStatusCode(undefined, statusCode.SYSTEM_ERROR)).toBe(false)
    })
  })

  describe('isUserError', () => {
    it('should identify user errors (4xxx)', () => {
      expect(isUserError(new ErrorStatus(statusCode.UNSUPPORTED_OPERATION))).toBe(true)
      expect(isUserError(new ErrorStatus(statusCode.INVALID_CREDENTIALS))).toBe(true)
      expect(isUserError(new ErrorStatus(statusCode.NEED_CONNECT_SERVER))).toBe(true)
    })

    it('should reject non-user errors', () => {
      expect(isUserError(new ErrorStatus(statusCode.SUCCESS))).toBe(false)
      expect(isUserError(new ErrorStatus(statusCode.UNKNOWN_ERROR))).toBe(false)
      expect(isUserError(new ErrorStatus(statusCode.SYSTEM_ERROR))).toBe(false)
    })

    it('should reject non-ErrorStatus', () => {
      expect(isUserError(new Error('Regular error'))).toBe(false)
      expect(isUserError(null)).toBe(false)
    })
  })

  describe('isSystemError', () => {
    it('should identify system errors (6xxx)', () => {
      expect(isSystemError(new ErrorStatus(statusCode.SYSTEM_ERROR))).toBe(true)
      expect(isSystemError(new ErrorStatus(statusCode.FORBIDDEN))).toBe(true)
      expect(isSystemError(new ErrorStatus(statusCode.FILE_EXITS))).toBe(true)
      expect(isSystemError(new ErrorStatus(statusCode.FILE_NOT_FOUND))).toBe(true)
      expect(isSystemError(new ErrorStatus(statusCode.TYPE_ERROR))).toBe(true)
    })

    it('should reject non-system errors', () => {
      expect(isSystemError(new ErrorStatus(statusCode.SUCCESS))).toBe(false)
      expect(isSystemError(new ErrorStatus(statusCode.UNSUPPORTED_OPERATION))).toBe(false)
      expect(isSystemError(new ErrorStatus(statusCode.UNKNOWN_ERROR))).toBe(false)
    })

    it('should reject non-ErrorStatus', () => {
      expect(isSystemError(new Error('Regular error'))).toBe(false)
      expect(isSystemError(null)).toBe(false)
    })
  })

  describe('isConditionalError', () => {
    it('should identify conditional errors (5xxx)', () => {
      expect(isConditionalError(new ErrorStatus(statusCode.UNKNOWN_ERROR))).toBe(true)
      expect(isConditionalError(new ErrorStatus(statusCode.NOT_FOUND))).toBe(true)
    })

    it('should reject non-conditional errors', () => {
      expect(isConditionalError(new ErrorStatus(statusCode.SUCCESS))).toBe(false)
      expect(isConditionalError(new ErrorStatus(statusCode.UNSUPPORTED_OPERATION))).toBe(false)
      expect(isConditionalError(new ErrorStatus(statusCode.SYSTEM_ERROR))).toBe(false)
    })

    it('should reject non-ErrorStatus', () => {
      expect(isConditionalError(new Error('Regular error'))).toBe(false)
      expect(isConditionalError(null)).toBe(false)
    })
  })

  describe('isSuccess', () => {
    it('should identify success codes (< 3000)', () => {
      expect(isSuccess(new ErrorStatus(statusCode.SUCCESS))).toBe(true)
    })

    it('should reject non-success codes', () => {
      expect(isSuccess(new ErrorStatus(statusCode.UNSUPPORTED_OPERATION))).toBe(false)
      expect(isSuccess(new ErrorStatus(statusCode.UNKNOWN_ERROR))).toBe(false)
      expect(isSuccess(new ErrorStatus(statusCode.SYSTEM_ERROR))).toBe(false)
    })

    it('should reject non-ErrorStatus', () => {
      expect(isSuccess(new Error('Regular error'))).toBe(false)
      expect(isSuccess(null)).toBe(false)
    })
  })
})
