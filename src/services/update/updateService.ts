import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

/**
 * TODO:菜单检查更新按钮
 */
class UpdateService {
  private currentUpdate: Update | null = null;

  async getCurrentVersion(): Promise<string> {
    return await getVersion();
  }
  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    latestVersion: string;
    update: Update | null;
  }> {
    const update = await check();
    console.log(update)
    this.currentUpdate = update;
    if (update) {
      return {
        hasUpdate: true,
        latestVersion: update.version,
        update
      };
    }
    return {
      hasUpdate: false,
      latestVersion: '',
      update: null
    };
  }

  async downloadAndInstall(
    onProgress: (progress: number) => void
  ): Promise<void> {
    if (!this.currentUpdate) {
      throw new Error('No update available');
    }
    let downloaded = 0;
    let contentLength = 0;
    await this.currentUpdate.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength || 0;
          onProgress(0);
          break;
        case 'Progress':
          downloaded += event.data.chunkLength || 0;
          const progress = contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0;
          onProgress(progress);
          break;
        case 'Finished':
          onProgress(100);
          break;
      }
    });
    await relaunch();
  }
}

export const updateService = new UpdateService();