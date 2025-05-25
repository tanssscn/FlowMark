import { getDeviceInfo } from '@/services/deviceService';
import { macMenu } from './macMenu';
import { createTauriMenu, menuWatch } from './createMenu';
import { windowsMenu } from './windowsMenu';

let unwatch: () => void = () => { };
export async function initTauriMenu() {
  const platform = getDeviceInfo().type
  switch (platform) {
    case 'macos':
      unwatch = await macMenu()
      break
    case 'windows':
      unwatch = await windowsMenu()
      break
    default:
      const menu = await createTauriMenu(platform)
      unwatch = menuWatch(menu)
      break
  }
}
export async function rebuildMenu() {
  unwatch()
  initTauriMenu()
}