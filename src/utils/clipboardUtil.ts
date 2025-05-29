import { nanoid } from "nanoid";
import { nowFormatDate } from "./formatUtil";
import { fileService } from "@/services/files/fileService";
import { filename } from "pathe/utils";
import { getDirname, getJoin, getRelative } from "./pathUtil";
import { MilkdownEditorInstance } from "@/components/editor/composable/milkdownEditor";
import type { AppFileInfo } from "@/types/appTypes";
import { useSettingsStore } from '@/stores/settingsStore.ts';
import { ExternImagePathOptions, ImagePathTypeOptions } from "@/types/appSettingsConst";

function getImageExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg'
  };
  return extensions[mimeType] || 'png';
}

export const handlePaste = async (event: ClipboardEvent, editor: MilkdownEditorInstance, externImagePathOptions = ExternImagePathOptions.KEEP) => {
  const clipboardItems = event.clipboardData?.items || [];
  let hasImage = false;
  // 检查是否有图片
  for (const item of clipboardItems) {
    if (item.type.includes('image')) {
      hasImage = true;
      break;
    }
  }
  // 没有图片则允许默认行为
  if (!hasImage) return;
  event.preventDefault()
  event.stopImmediatePropagation(); // 阻止后续同类型监听器执行
  const settingsStore = useSettingsStore();

  // 处理每个粘贴项,网络图片同时有text/html和file类型
  let existsImageUrl = false;
  const fileInfo = editor.getFileInfo();
  if (!fileInfo) return;
  for (const item of clipboardItems) {
    if (item.kind === 'string' && item.type === 'text/html' && settingsStore.state.file.image.externImagePathOptions === ExternImagePathOptions.KEEP) {
      // 处理HTML内容
      console.log('处理HTML')
      existsImageUrl = true;
      // getAsString 是异步的
      item.getAsString(async (html) => {
        const image = handleHtmlPaste(html);
        if (image?.src instanceof Blob) {
          image.src = await uploadImage(image.src, fileInfo);
        }
        if (typeof image?.src === 'string') {
          editor.insertImage(image.src, image.alt, image.title);
        }
      });
    } else if (item.kind === 'file' && item.type.includes('image')) {
      if (existsImageUrl) continue;
      // 处理图片文件
      console.log('处理图片文件')
      const src = item.getAsFile();
      if (src) {
        const url = await uploadImage(src, fileInfo);
        editor.insertImage(url);
      }
    }
  }
}

const handleHtmlPaste = (html: string): { src: string | Blob, alt?: string, title?: string } | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  for (const img of images) {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt');
    const title = img.getAttribute('title');
    if (!src) continue;
    if (src.startsWith('data:')) {
      // 处理base64图片
      const blob = dataUrlToBlob(src);
      return {
        src: blob,
        alt: alt ?? '',
        title: title ?? ''
      };
    } else {
      return {
        src,
        alt: alt ?? '',
        title: title ?? ''
      };
    }
  }
  return null;
}

const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}
/**
 * TODO: 上传图片返回的路径类型
 * @param file 
 * @param fileInfo 
 * @param imagePathTypeOptions : 图片路径类型，默认是相对路径
 * @returns 
 */
export const uploadImage = async (file: Blob | File, fileInfo: AppFileInfo): Promise<string> => {
  const settingsStore = useSettingsStore();
  const dirInfo = Object.assign({}, fileInfo);
  dirInfo.isDir = true;
  dirInfo.path = getJoin(getDirname(dirInfo.path), `${filename(dirInfo.name)}.assets`);
  const exists = await fileService.exists(dirInfo);
  if (!exists) {
    console.log('创建目录')
    await fileService.create(dirInfo);
  }
  console.log(file.type)
  const imgName = `${nowFormatDate('YYYYMMDDHHmmss').value}-${nanoid(4)}` + '.' + getImageExtension(file.type);
  let imgUrl = getJoin(dirInfo.path, imgName);
  await fileService.writeFile({
    path: imgUrl,
    storageLocation: dirInfo.storageLocation,
  }, file);
  // 根据 imagePathTypeOptions 返回不同类型路径
  if (settingsStore.state.file.image.imagePathTypeOptions === ImagePathTypeOptions.RELATIVE) {
    imgUrl = getRelative(fileInfo.path, imgUrl); // 需要你定义这个函数
  }
  return imgUrl; // 需要你定义这个函数
}

