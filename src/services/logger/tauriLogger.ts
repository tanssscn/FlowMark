import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log'
import { ILogger } from "./type";

export class tauriLog implements ILogger{
  info(message: string) {
    info(message);
  }
  debug(message: string) {
    debug(message);
  }
  warn(message: string) {
    warn(message)
  }
  error(message: string) {
    error(message);
  }
  trace(message: string) {
    trace(message)
  }
}