// types/notification.ts
export type NotificationType = 'success' | 'warning' | 'info' | 'error'

export interface NotifyOptions {
  title?: string
  message: string
  type?: NotificationType
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  onClick?: () => void
}
export interface MessageBoxOptions {
  title?: string
  message: string
  type?: NotificationType
  confirmButtonText?: string
  cancelButtonText?: string
  showCancelButton?: boolean,
  inputValidator?: (value: string) => boolean|string
  inputPattern?: RegExp,
  inputErrorMessage?: string
}

export interface DialogPlatform {
  notify(options: NotifyOptions): Promise<void>
  alert(options: MessageBoxOptions): Promise<void>
  confirm(options: MessageBoxOptions): Promise<boolean>
  prompt(options: MessageBoxOptions): Promise<string | null>
}