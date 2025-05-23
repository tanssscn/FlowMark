import type { AppFileInfo, VersionInfo } from '@/types/app-types.ts';
import { versionService } from '@/services/versions/versionService';
import { milkdownManager } from '@/services/milkdownManager';
import { useSettingsStore } from '@/stores/settingsStore';
export interface VersionContextMenuState{
  visible: boolean;
  version: VersionInfo;
  path: string;
  x: number;
  y: number;
}
export function useVersion() {
  const settingsStore = useSettingsStore()

  // 恢复版本
  async function restoreVersion(versionId: string, fileInfo: AppFileInfo, content?: string,) {
    try {
      if (!content) {
        content = await versionService.getVersion(
          fileInfo.path,
          versionId
        ) || '';
      }
      milkdownManager.updateContent(content || '');
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  }
  // 保存版本
  async function saveVersion(fileInfo: AppFileInfo, content: string, message?: string): Promise<VersionInfo[]> {
    return await versionService.createVersion({
      filePath: fileInfo.path,
      content,
      message: message,
      maxNum: settingsStore.state.file.history.maxNum,
    });
  }

  return {
    saveVersion,
    restoreVersion,
  };
}