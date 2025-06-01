import { fileService } from "@/services/files/fileService";
import { Editor } from "@milkdown/kit/core";
import { getHTML } from "@milkdown/utils";

export const exportHtml = async (editor: Editor) => {
    const html = editor.action(getHTML());
    const contentHtml = `
    <div class="ProseMirror">
      ${html}
    </div>
    `
  // 获取 Milkdown 主题样式
  const themeStyles = getEditorStyles();
  // 构建完整 HTML 文档
  const completeHTML = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>导出文档</title>
    <style>
      /* Milkdown 主题样式 */
      ${themeStyles}
    </style>
  </head>
  <body class="milkdown">
    ${contentHtml}
  </body>
  </html>`;
  // 处理文件保存
  fileService.saveFileDialog({
    title: '导出 HTML 文件',
    filters: [{ name: 'HTML 文件', extensions: ['html'] }],
  }).then(async (file) => {
    if (!file) return;
    await fileService.writeTextFile(
      { path: file, storageLocation: 'local' },
      completeHTML
    );
  });
}

// 获取编辑器当前样式
const getEditorStyles = (): string => {
  // 获取所有样式表
  const stylesheets = Array.from(document.styleSheets);
  let cssText = '';

  for (const sheet of stylesheets) {
    try {
      // 只收集 Milkdown 相关样式
      if (sheet.href && !sheet.href.includes('milkdown')) continue;

      const rules = Array.from(sheet.cssRules || []);
      for (const rule of rules) {
        // 收集所有与 milkdown 相关的规则
        if (rule.cssText.includes('milkdown') ||
          rule.cssText.includes('ProseMirror')) {
          cssText += rule.cssText + '\n';
        }
      }
    } catch (e) {
      console.warn('无法读取样式表:', e);
    }
  }

  // 添加关键 CSS 变量
  cssText += `
        :root {
          ${getCSSVariables()}
        }
      `;

  return cssText;
}


// 获取当前 CSS 变量
const getCSSVariables = (): string => {
  const style = getComputedStyle(document.documentElement);
  const variables = [];

  // 收集所有以 -- 开头的变量
  for (let i = 0; i < style.length; i++) {
    const name = style[i];
    if (name.startsWith('--')) {
      variables.push(`${name}: ${style.getPropertyValue(name)};`);
    }
  }

  return variables.join('\n');
}