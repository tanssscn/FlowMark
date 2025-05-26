import { nanoid } from "nanoid";
import { nowFormatDate } from "./formatUtil";
import { fetch } from '@tauri-apps/plugin-http';
import { fileService } from "@/services/files/fileService";
import {
  filename,
} from "pathe/utils";
import { getDirname, getJoin } from "./pathUtil";
import { MilkdownEditorInstance } from "@/components/editor/composable/milkdownEditor";
import type { AppFileInfo } from "@/types/appTypes";

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

const networkImage = 'original';

export const handlePaste = async (event: ClipboardEvent, editor: MilkdownEditorInstance) => {
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

  event.preventDefault();

  // 处理每个粘贴项
  for (const item of clipboardItems) {
    if (item.kind === 'string' && item.type === 'text/plain') {
      // 处理纯文本
      // item.getAsString(async (text) => {
      // this.insertContent(text);
      // });
    } else if (item.kind === 'string' && item.type === 'text/html') {
      // 处理HTML内容
      item.getAsString(async (html) => {
        await handleHtmlPaste(html, editor);
      });
    } else if (item.kind === 'file' && item.type.includes('image')) {
      // 处理图片文件
      const blob = item.getAsFile();
      const fileInfo = editor.getFileInfo();
      if (blob && fileInfo) {
        const imgUrl = await uploadImage(blob, fileInfo);
        editor.insertImage(imgUrl);
      }
    }
  }
  
}

const handleHtmlPaste = async (html: string, editor: MilkdownEditorInstance) => {
  const fileInfo = editor.getFileInfo();
  if (!fileInfo) return;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  if (images.length === 0) {
    // 没有图片，直接插入文本
    const text = doc.body.textContent || '';
    // this.insertContent(text);
    return;
  }

  // 处理每个图片
  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src) continue;

    if (src.startsWith('data:')) {
      // 处理base64图片
      const blob = dataUrlToBlob(src);
      const imgUrl = await uploadImage(blob, fileInfo);
      editor.insertImage(imgUrl);
    } else if (networkImage === 'original') {
      // 使用原始网络图片链接
      // this.insertContent(`![image](${src})`);
    } else {
      // 上传网络图片
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const imgUrl = await uploadImage(blob, fileInfo);
        editor.insertImage(imgUrl);
      } catch (error) {
        console.error('下载网络图片失败:', error);
        // this.insertContent(`![image](${src})`); // 失败时回退到原始链接
      }
    }
  }

  // 插入其他文本内容
  const textNodes: string[] = [];
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node.textContent || '');
    }
  });
  if (textNodes.length > 0) {
    // this.insertContent(textNodes.join(' '));
  }
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

export const uploadImage = async (file: Blob | File, fileInfo: AppFileInfo): Promise<string> => {
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
  const imgUrl = getJoin(dirInfo.path, imgName);
  console.log(imgUrl, file)
  await fileService.writeFile({
    path: imgUrl,
    storageLocation: dirInfo.storageLocation,
  }, file);
  return imgUrl;
}

