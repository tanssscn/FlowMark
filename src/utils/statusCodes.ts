import i18n from "@/i18n";
import { CodeError, StatusCode } from "@/services/codeService";
const { t } = i18n.global
// statusCode.ts
export const statusCode = {
  // 成功码 (虽然是错误类，但有时也需要表示成功状态)
  SUCCESS: {
    code: 2000,
    message: t('notify.success.ok')
  },
  // UserError (4xxx)
  UNSUPPORTED_OPERATION: {
    code: 4000,
    message: t('notify.errors.unsupportedOperation')
  },
  INVALID_CREDENTIALS: {
    code: 4005,
    message: t('notify.errors.invalidCredentials')
  },
  NEED_CONNECT_SERVER: {
    code: 4006,
    message: t('notify.errors.needConnectServer')
  },
  // CONDITIONAL_ERROR (5xxx)
  UNKNOWN_ERROR: {
    code: 5000,
    message: t('notify.errors.unknownError')
  },
  NOT_FOUND: {
    code: 5001,
    message: t('notify.errors.notFound')
  },
  // SystemError (6xxx)不进行UI展示，后续不需要I18n
  SYSTEM_ERROR: {
    code: 6000,
    message: t('notify.errors.SystemError')
  },
  FORBIDDEN: {
    code: 6001,
    message: t('notify.errors.forbidden')
  },
  FILE_EXITS: {
    code: 6002,
    message: t('notify.errors.fileExists')
  },
  FILE_NOT_FOUND: {
    code: 6004,
    message: t('notify.errors.fileNotFound')
  },
  TYPE_ERROR: {
    code: 6005,
    message: "type error"
  },
  FILE_HANDLE_NOT_FOUND: {
    code: 6006,
    message: "file handle not found"
  },
  BROWSER_FILE_SYSTEM_ERROR: {
    code: 6007,
    message: "browser file system error"
  },
  AUTHEN_ERROR_NEED_USERNAME_PASSWORD: {
    code: 6008,
    message: "authen error need username password"
  },
  WEBDAV_REQUEST_FAILED: {
    code: 6009,
    message: "webdav request failed"
  },
  INVALID_RESPONSE: {
    code: 6010,
    message: "invalid response"
  },
} as const;

/**
 * 类型谓词：error is CodeError 是一个返回布尔值的函数，它的作用是告诉 TypeScript："如果这个函数返回 true，则 error 变量的类型就是 CodeError"。
 * @param error 
 * @returns 
 */
export function isStatusCodeError(error: unknown): error is CodeError {
  return error instanceof CodeError;
}

export function isEqualStatusCode(statusCode: StatusCode | unknown, targetStatusCode: StatusCode): boolean {
  if (isStatusCodeError(statusCode)) {
    return statusCode.code === targetStatusCode.code;
  }
  return false;
}

export function isUserError(error: unknown): error is CodeError {
  // 这里可以写一些业务逻辑判断是否是用户错误
  if (isStatusCodeError(error)) {
    return error.code >= 4000 && error.code < 5000;
  }
  return false;
}

export function isSystemError(error: unknown): error is CodeError {
  // 这里可以写一些业务逻辑判断是否是系统错误
  if (isStatusCodeError(error)) {
    return error.code >= 6000 && error.code < 7000;
  }
  return false;
}

export function isConditionalError(error: unknown): error is CodeError {
  if (isStatusCodeError(error)) {
    return error.code >= 5000 && error.code < 6000;
  }
  return false;
}
export function isSuccess(error: unknown): error is CodeError {
  if (isStatusCodeError(error)) {
    return error.code < 3000;
  }
  return false;
}