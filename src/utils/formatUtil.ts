import { getCurrentLanguage } from '@/i18n';
import { useDateFormat, UseDateFormatReturn, useNow } from '@vueuse/core'
type DateFormat = "YYYY-MM-DD HH:mm:ss" | "YYYYMMDDHHmmss" | "YYYY-MM-DD" | "HH:mm:ss" | "HH:mm" | "mm:ss" | "mm";
// 格式化日期
export const formatDate = (timestamp: number, formatStr: DateFormat): UseDateFormatReturn => {
  return useDateFormat(new Date(timestamp), formatStr, { locales: getCurrentLanguage() });
};

export const nowFormatDate = (formatStr: DateFormat): UseDateFormatReturn => {
  return useDateFormat(useNow(), formatStr);
};

// 格式化文件大小
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}