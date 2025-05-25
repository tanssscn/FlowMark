import { createTauriMenu, menuWatch } from "./createMenu"
import { useMenuConfig, MenuConfig } from '../composable/menuConfig';
import { addHotkey } from "@/utils/hotkeys";

function createHotkey(configs: MenuConfig[]) {
    configs.forEach(config => {
        addHotkey(config)
        if (config.submenu) {
            createHotkey(config.submenu)
        }
    });
}
export async function windowsMenu() {
    const menu = await createTauriMenu('windows')
    const menuConfig = useMenuConfig()
    createHotkey(menuConfig)
    return menuWatch(menu)
}