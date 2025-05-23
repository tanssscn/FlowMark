import { windowRouter } from "@/services/routerService";
import { createTauriMenu, menuWatch } from "./createMenu";

export async function macMenu() {
  const window = windowRouter.getCurrentWindow();
  let cleanup: () => void = () => { };

  if (window) {
    const handleFocus = async () => {
      cleanup(); // 清理之前的监听
      cleanup = await onWindowFocused(); // 更新为新的清理函数
    };

    window.listen('tauri://focus', handleFocus);

    const isFocused = await window.isFocused();
    if (isFocused) await handleFocus();

    window.listen('tauri://blur', () => cleanup());
  }

  return () => cleanup(); // 返回的清理函数始终有效
}

async function onWindowFocused(): Promise<() => void> {
  // 处理窗口激活事件
  const menu = await createTauriMenu();
  const unMenuWatch = menuWatch(menu);
  return unMenuWatch;
}