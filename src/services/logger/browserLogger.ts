import type { ILogger } from "./type";

export class BrowserLogger implements ILogger {
  trace(message: string): void {
    console.trace(message);
  }
  debug(message: string): void {
    console.debug(message);
  }
  info(message: string): void {
    console.info(message);
  }
  warn(message: string): void {
    console.warn(message);
  }
  error(message: string): void {
    console.error(message);
  }
}