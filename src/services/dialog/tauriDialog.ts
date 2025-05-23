import { ElementPlatform } from "./browserDialog";
import { DialogPlatform, MessageBoxOptions, NotificationType, NotifyOptions } from "./type"
import { confirm, message } from '@tauri-apps/plugin-dialog';

export class TauriPlatform implements DialogPlatform {
  private elementPlatform: ElementPlatform = new ElementPlatform()
  async notify(options: NotifyOptions): Promise<void> {
    await this.elementPlatform.notify(options)
  }

  async alert(options: MessageBoxOptions): Promise<void> {
    await message(options.message, {
      title: options.title,
      kind: this.mapNotificationType(options.type),
    })
  }

  async confirm(options: MessageBoxOptions): Promise<boolean> {
    const result = await confirm(options.message, {
      title: options.title,
      kind: this.mapNotificationType(options.type),
      okLabel: options.confirmButtonText,
      cancelLabel: options.cancelButtonText
    })
    return result
  }

  async prompt(options: MessageBoxOptions): Promise<string | null> {
    return this.elementPlatform.prompt(options)
  }

  private mapNotificationType(type?: NotificationType): 'info' | 'warning' | 'error' {
    switch (type) {
      case 'success': return 'info'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'info'
    }
  }
}