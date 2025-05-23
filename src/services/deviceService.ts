import { Platform } from '@/types/app-types.ts';
import { platform } from '@tauri-apps/plugin-os';

class DeviceDetector {
  private static instance: DeviceDetector;
  private _type: Platform;

  private constructor() {
    // 私有构造函数防止外部实例化
    // @ts-ignore
    if (window.__TAURI__) {
      const currentPlatform = platform();
      this._type = currentPlatform;
    } else {
      this._type = 'browser';
    }
  }

  public static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  public getDeviceInfo() {
    return {
      type: this._type,
      isBrowser: this._type === 'browser',
    };
  }
}

// 获取设备信息的便捷方法
export const getDeviceInfo = (): { type: Platform, isBrowser: boolean } => {
  return DeviceDetector.getInstance().getDeviceInfo();
};