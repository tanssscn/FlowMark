import { ElNotification, ElMessageBox } from 'element-plus'
import type { DialogPlatform, MessageBoxOptions, NotifyOptions } from './type'

export class ElementPlatform implements DialogPlatform {
  async notify(options: NotifyOptions): Promise<void> {
    ElNotification({
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 4500,
      position: options.position || 'top-right',
      onClick: options.onClick
    })
  }

  async alert(options: MessageBoxOptions): Promise<void> {
    await ElMessageBox.alert(options.message, options.title || '', {
      type: options.type || 'info',
      confirmButtonText: options.confirmButtonText
    })
  }

  async confirm(options: MessageBoxOptions): Promise<boolean> {
    try {
      await ElMessageBox.confirm(options.message, options.title || '', {
        type: options.type || 'info',
        confirmButtonText: options.confirmButtonText,
        cancelButtonText: options.cancelButtonText,
        showCancelButton: options.showCancelButton !== false
      })
      return true
    } catch {
      return false
    }
  }

  async prompt(options: MessageBoxOptions): Promise<string | null> {
    try {
      const result = await ElMessageBox.prompt(options.message,options.title || '',options)
      return result.value
    } catch {
      return null
    }
  }
}