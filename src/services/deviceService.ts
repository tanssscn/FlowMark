import type { Platform } from '@/types/appTypes';
import { platform } from '@tauri-apps/plugin-os';

type DeviceType = 'desktop' | 'mobile';

class DeviceDetector {
  private static instance: DeviceDetector;
  private _type: Platform;
  private _deviceType: DeviceType;

  private constructor() {
    // 私有构造函数防止外部实例化
    // @ts-ignore
    if (window.__TAURI__) {
      const currentPlatform = platform();
      this._type = currentPlatform;
      this._deviceType = (currentPlatform === 'android' || currentPlatform === 'ios') ? 'mobile' : 'desktop';
    } else {
      this._type = 'browser';
      this._deviceType = this.detectBrowserMobile() ? 'mobile' : 'desktop';
    }
  }

  /**
   * 检测浏览器是否为移动端
   * 综合判断：userAgent + 触摸支持 + 屏幕宽度
   */
  private detectBrowserMobile(): boolean {
    const ua = navigator.userAgent;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // iPad 桌面模式 UA 中不含 iPad/Mobile，但支持触摸
    const isIPad = /Macintosh/i.test(ua) && isTouch;
    return isMobileUA || isIPad;
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
      isMobile: this._deviceType === 'mobile',
      isDesktop: this._deviceType === 'desktop',
      deviceType: this._deviceType,
    };
  }
}

// 获取设备信息的便捷方法
export const getDeviceInfo = (): {
  type: Platform,
  isBrowser: boolean,
  isMobile: boolean,
  isDesktop: boolean,
  deviceType: DeviceType,
} => {
  return DeviceDetector.getInstance().getDeviceInfo();
};
