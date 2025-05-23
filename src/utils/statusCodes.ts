import i18n from "@/i18n";
import { CodeError, StatusCode } from "@/services/codeService";
const { t } = i18n.global

// statusCode.ts
export const statusCode = {
  // 成功码 (虽然是错误类，但有时也需要表示成功状态)
  SUCCESS: {
    code: 2000,
    message: '操作成功'
  },
  // UserError (4xxx)
  UNSUPPORTED_OPERATION: {
    code: 4000,
    message: '不支持的操作'
  },
  VERSION_CREATE_ERROR: {
    code: 4001,
    message: '版本创建失败'
  },
  VERSION_DELETE_ERROR: {
    code: 4002,
    message: '版本删除失败'
  },
  VERSION_NOT_FOUND: {
    code: 4003,
    message: '版本不存在'
  },
  VERSION_OPERATION_NOT_SUPPORTED: {
    code: 4004,
    message: '版本操作不支持'
  },
  INVALID_CREDENTIALS: {
    code: 4005,
    message: '用户名或密码错误'
  },
  NEED_CONNECT_SERVER: {
    code: 4006,
    message: '需要连接服务器'
  },
  // CONDITIONAL_ERROR (5xxx)
  UNKNOWN_ERROR: {
    code: 5000,
    message: '未知错误'
  },
  NOT_FOUND: {
    code: 5001,
    message: '资源不存在'
  },
  WEB_DAV_PATH_ERROR: {
    code: 5002,
    message: 'webdav请求路径错误'
  },
  // SystemError (6xxx)
  SYSTEM_ERROR: {
    code: 6000,
    message: '系统错误'
  },
  FORBIDDEN: {
    code: 6001,
    message: '禁止访问'
  },
  FILE_EXITS: {
    code: 6002,
    message: '文件已存在'
  },
  FILE_NOT_FOUND: {
    code: 6004,
    message: '文件不存在'
  },
  TYPE_ERROR: {
    code: 6005,
    message: '类型错误'
  },
  FILE_HANDLE_NOT_FOUND: {
    code: 6006,
    message: '文件句柄不存在'
  },
  BROWSER_FILE_SYSTEM_ERROR: {
    code: 6007,
    message: '浏览器文件系统错误'
  },
  AUTHEN_ERROR_NEED_USERNAME_PASSWORD: {
    code: 6008,
    message: '需要用户名和密码'
  },
  WEBDAV_REQUEST_FAILED: {
    code: 6009,
    message: 'webdav请求失败'
  },
  INVALID_RESPONSE: {
    code: 6010,
    message: '无效的响应'
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