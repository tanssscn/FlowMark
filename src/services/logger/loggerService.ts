import { getDeviceInfo } from "../deviceService";
import { BrowserLogger } from "./browserLogger";
import { tauriLog } from "./tauriLogger";
import type { ILogger } from "./type";

class LoggerService implements ILogger {
  private logger;
  constructor() {
    if (getDeviceInfo().isBrowser) {
      this.logger = new BrowserLogger();
    } else {
      this.logger = new tauriLog();
    }
  }
  info(message: string): void {
    this.logger.info(message)
  }
  debug(message: string): void {
    this.logger.debug(message)
  }
  warn(message: string): void {
    this.logger.warn(message)
  }
  trace(message: string): void {
    this.logger.trace(message)
  }
  error(message: string): void {
    this.logger.error(message)
  }
}

export const logService = new LoggerService();
