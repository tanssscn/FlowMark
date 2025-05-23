import { getDeviceInfo } from '@/services/deviceService';
import { macMenu } from './macMenu';
import { createTauriMenu, menuWatch } from './createMenu';
import i18n from '@/i18n';
const { t } = i18n.global

let unwatch: () => void = () => { };
export async function initTauriMenu() {
  const platform = getDeviceInfo().type
  if (platform === 'macos') {
    unwatch = await macMenu()
  } else {
    const menu = await createTauriMenu()
    unwatch = menuWatch(menu)
  }
}
export async function rebuildMenu() {
  unwatch()
  initTauriMenu()
}