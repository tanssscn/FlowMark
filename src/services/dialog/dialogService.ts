import type { DialogPlatform, MessageBoxOptions, NotifyOptions } from './type'
import { TauriPlatform } from './tauriDialog'
import { ElementPlatform } from './browserDialog'
import i18n from '@/i18n'
import { ErrorStatus } from '../codeService'
import { getDeviceInfo } from '../deviceService'
const { t } = i18n.global

class DialogService {
  private platform: DialogPlatform
  private queue: NotifyOptions[] = []
  private isProcessing = false
  private isMobile: boolean

  constructor() {
    // 根据环境选择平台
    this.platform = this.detectPlatform()
    this.isMobile = getDeviceInfo().isMobile
  }

  private detectPlatform(): DialogPlatform {
    // @ts-ignore
    if (window.__TAURI__) {
      return new TauriPlatform()
    }
    return new ElementPlatform()
  }

  private applyMobilePosition(options: NotifyOptions): NotifyOptions {
    if (this.isMobile && !options.position) {
      return { ...options, position: 'bottom-right' }
    }
    return options
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const options = this.queue.shift()!

    try {
      await this.platform.notify(options)
    } catch (error) {
      console.error('Notification failed:', error)
    } finally {
      this.isProcessing = false
      setTimeout(() => this.processQueue(), 300)
    }
  }

  private addToQueue(options: NotifyOptions) {
    this.queue.push(this.applyMobilePosition(options))
    this.processQueue()
  }

  // 公共方法
  async notify(options: NotifyOptions) {
    this.addToQueue(options)
  }

  async alert(options: MessageBoxOptions) {
    return this.platform.alert({
      confirmButtonText: options.confirmButtonText || t('common.confirm'),
      ...options
    })
  }

  async confirm(options: MessageBoxOptions): Promise<boolean> {
    return this.platform.confirm({
      confirmButtonText: options.confirmButtonText || t('common.confirm'),
      cancelButtonText: options.cancelButtonText || t('common.cancel'),
      ...options
    })
  }

  async prompt(options: MessageBoxOptions) {
    return this.platform.prompt({
      confirmButtonText: options.confirmButtonText || t('common.confirm'),
      cancelButtonText: options.cancelButtonText || t('common.cancel'),
      ...options
    })
  }

  // 快捷方法
  success(message?: string, title?: string) {
    this.notify({ message: message || t('common.success'), title, type: 'success' })
  }

  warning(message: string, title?: string) {
    this.notify({ message, title, type: 'warning' })
  }

  error(message: string, title?: string) {
    this.notify({ message, title, type: 'error' })
  }

  info(message: string, title?: string) {
    this.notify({ message, title, type: 'info' })
  }
  notifyError(error: ErrorStatus) {
    this.error(`${error.message}${error.detail ? `(${error.detail})` : ''}`)
  }
}

export const dialogService = new DialogService()