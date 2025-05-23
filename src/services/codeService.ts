import { logService } from "./logger/loggerService";

// statusCodes.ts
export interface StatusCode {
  code: number;
  message: string;
}

export class CodeError extends Error {
  public readonly code: number;
  public readonly message: string;
  public readonly detail?: string;

  constructor(statusCode: StatusCode, detail?: string) {
    super(statusCode.message);
    this.code = statusCode.code;
    this.message = statusCode.message;
    this.detail = detail;
    // 保持正确的原型链
    Object.setPrototypeOf(this, CodeError.prototype);
  }
  writeLog() {
    logService.error(`${this.message} ${this.detail}`);
  }
  // 添加toJSON方法方便序列化
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      stack: this.stack,
      detail: this.detail
    };
  }
}

