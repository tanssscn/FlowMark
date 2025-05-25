import { useEditor } from "@milkdown/vue";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { useSettingsStore } from "@/stores/settingsStore";
import { ListenerManager } from '@milkdown/plugin-listener'
import type { Ctx } from '@milkdown/ctx'
import { commandsCtx, Editor, editorViewCtx } from "@milkdown/kit/core";
import { useEdit } from "@/composable/useEdit";
import { createCodeBlockCommand, insertHrCommand, insertImageCommand, toggleEmphasisCommand, toggleInlineCodeCommand, toggleStrongCommand, turnIntoTextCommand, wrapInBlockquoteCommand, wrapInBulletListCommand, wrapInHeadingCommand, wrapInOrderedListCommand } from '@milkdown/preset-commonmark';
import { callCommand, getHTML, replaceAll } from '@milkdown/utils';
import { fileService } from "@/services/files/fileService";
import { AppFileInfo, OutlineItem } from "@/types/appTypes";
import { emoji } from '@milkdown/plugin-emoji';
import { indentConfig, IndentConfigOptions } from '@milkdown/plugin-indent'
import { historyKeymap, redoCommand, undoCommand } from "@milkdown/plugin-history";
import { TextSelection } from "@milkdown/prose/state";
import { searchPlugin, searchPluginKey } from "./searchPlugin";
import { FindResult, IMilkdownEditor } from "./types";
import { getDeviceInfo } from "@/services/deviceService";
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import { codeBlockMemory, codeBlockMemoryPluginKey } from "./codeLangMemory";
import { useFileStore } from "@/stores/fileStore";
import { useDebounceFn } from '@vueuse/core';
import { AppSettings } from "@/types/appSettings";
import { closeImageSource, createFileInnerSrc } from "@/utils/pathUtil";
import { uploadImage } from "@/utils/clipboardUtil";
import { useTabStore } from "@/stores/tabStore";
import { Ref, watch } from "vue";

/**
 * TODO：图像块在客户端不一致
 */
export class MilkdownEditorInstance implements IMilkdownEditor {
  public id: string;
  public editor: Editor | null = null;
  private crepe: Crepe | null = null;
  public settings: AppSettings | any;
  private settingsStore = useSettingsStore();
  private useEdit = useEdit();
  private isActive = false;
  private imageList: string[] = []
  private tabStore = useTabStore()
  private editorReturn: ReturnType<typeof useEditor>;

  isBrowser = getDeviceInfo().isBrowser;
  fileStore = useFileStore()

  public updateId(id: string): void {
    this.id = id;
    this.useEdit.readFileByTabId(id).then((content) => {
      this.updateContent(content);
    });
  }
  public loading(): Ref<boolean> {
    return this.editorReturn.loading;
  }
  /**
 * 等待 ref 变量变为 true (回调函数版本)
 * @param ref 要监听的 ref 变量
 * @param callback 变为 true 时的回调
 * @param timeout 超时时间(毫秒)，默认不超时
 */
  public onloaded(
    callback: () => void,
  ) { // 返回取消函数
    // 如果已经是 true，直接调用回调
    if (!this.loading().value) {
      callback();
      return;
    }
    // 监听 ref 变化
    watch(this.loading(), (value) => {
      if (value) {
        callback();
      }
    }, { once: true });
  }
  constructor(id: string, content: string) {
    this.id = id;
    this.settings = { ...this.settingsStore.state };
    this.editorReturn = useEditor((root) => {
      const crepe = new Crepe({
        root,
        defaultValue: content,
        features: {
          [CrepeFeature.Latex]: this.settings.markdown.extends.enableMath,
        },
        featureConfigs: {
          [CrepeFeature.ImageBlock]: {
            proxyDomURL: async (url: string) => {
              const fileInfo = this.getFileInfo()!
              url = await createFileInnerSrc(fileInfo, url);
              this.imageList.push(url)
              return url;
            },

            onUpload: async (file: File) => {
              const url = await uploadImage(file, this.getFileInfo()!);
              console.log(url)
              return url;
            },
            // inlineOnUpload: async (file: File) => {
            //   const url = await uploadImage(file, this.getFileInfo()!);
            //   console.log(url)
            //   return url;
            // },
            // blockOnUpload: async (file: File) => {
            //   const url = await this.handlePastedImage(file);
            //   return url;
            // },
          },
          [CrepeFeature.CodeMirror]: {}
        }
      });
      this.crepe = crepe;
      this.autoSave();
      crepe.editor.use(searchPlugin).use(codeBlockMemory).config((ctx) => {
        ctx.set(historyKeymap.key, {
          // Remap to one shortcut.
          Undo: "Mod-z",
          // Remap to multiple shortcuts.
          Redo: ["Mod-y", "Shift-Mod-z"],
        });
      })
      this.editor = crepe.editor;
      return crepe;
    });
  }
  private _save = useDebounceFn((newContent: string) => {
    this.useEdit.saveFile(this.id, newContent);
  }, this.settingsStore.state.file.save.autoSaveInterval * 1000)
  private _updateTOC = useDebounceFn((markdown: string) => {
    this.updateTOC();
    this.tabStore.unsave(this.id);
    if (this.settingsStore.state.file.save.autoSave) {
      this._save(markdown);
    }
  }, 1000)
  private autoSave() {
    if (!this.crepe) return;
    this.crepe.on((api: ListenerManager) => {
      api.markdownUpdated((ctx: Ctx, markdown: string, prevMarkdown: string) => {
        this._updateTOC(markdown);
      });
    });
  }
  public saveFile() {
    const content = this.crepe?.getMarkdown();
    if (content === undefined) return;
    this.useEdit.saveFile(this.id, content);
  }
  public destroy(): void {
    this.editor?.destroy();
    this.imageList.forEach(url => closeImageSource(url))
  }

  public undo(): void {
    console.log('undo');
    if (this.editor) {
      this.editor.action(callCommand(undoCommand.key));
    }
  }

  public redo(): void {
    if (this.editor) {
      this.editor.action(callCommand(redoCommand.key));
    }
  }

  public cut(): void {
    if (this.editor) {
      this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { state } = view

        // 先执行复制
        this.copy()

        // 删除选区内容
        const tr = state.tr.deleteSelection()
        view.dispatch(tr)
      })
    }
  }

  public copy(): void {
    if (this.editor) {
      // 无格式化内容
      // const view = this.editor.action((ctx) => ctx.get(editorViewCtx))
      // if (!view || !view.state.selection.empty) {
      //   const text = view.state.doc.textBetween(
      //     view.state.selection.from,
      //     view.state.selection.to,
      //     '\n'
      //   )
      //   navigator.clipboard.writeText(text)
      // }

      // this.editor.action((ctx) => {
      //   const view = ctx.get(editorViewCtx)
      //   const node = view.state.doc.copy(view.state.selection.content().content)
      //   // 检查有效选区
      //   if (!view || !view.state.selection.empty) {
      //     const serializer = ctx.get(serializerCtx)
      //     const markdown = serializer(node)
      //     console.log('版本',markdown)
      //     // 写入剪贴板
      //     navigator.clipboard.writeText(markdown)
      //   }
      // })
    }
  }

  public async paste(): Promise<void> {
    if (this.editor) {
      // const text = await navigator.clipboard.readText()
      // this.editor.action((ctx) => {
      //   const view = ctx.get(editorViewCtx)
      //   const { state } = view
      //   // 删除选区内容
      //   let tr = state.tr.deleteSelection()
      //   const { from } = state.selection
      //   // 创建事务插入文本
      //   console.log(text)
      //   tr.insertText(text, from)
      //   view.dispatch(tr)
      // })
    }
  }

  public find(text: string, options: {
    matchCase: false,
    wholeWord: false,
    regex: false
  }): FindResult {
    let result = { count: 0, currentIndex: -1 };
    if (this.editor) {
      this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        view.dispatch(
          view.state.tr.setMeta(searchPluginKey, {
            action: 'search',
            searchTerm: text,
            options
          })
        );
        const state = searchPluginKey.getState(view.state);
        result = {
          count: state?.matches?.length || 0,
          currentIndex: state?.currentIndex ?? -1
        };
      });
    }
    return result;
  }

  replaceCurrentMatch(replacement: string): FindResult {
    let result = { count: 0, currentIndex: -1 };
    if (!this.editor) return result;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const state = view.state;
      const searchState = searchPluginKey.getState(state);
      if (!searchState) return;
      const index = searchState.currentIndex;
      const match = searchState?.matches[index];
      if (!searchState?.searchTerm) return;
      const tr = state.tr.replaceWith(
        match.from,
        match.to,
        state.schema.text(replacement)
      );
      view.dispatch(tr);
      result = this.find(searchState.searchTerm, searchState.options);
    })
    return result;
  }

  replaceAllMatches(replacement: string): FindResult {
    let result = { count: 0, currentIndex: -1 };
    if (!this.editor) return result;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const searchState = searchPluginKey.getState(view.state);
      if (!searchState?.searchTerm) return;
      const decorations = searchState.decorations.find();
      if (decorations.length === 0) return;
      let tr = view.state.tr;
      // 需要从后往前替换以避免位置变化
      decorations
        .slice()
        .reverse()
        .forEach(decoration => {
          tr = tr.replaceWith(
            decoration.from,
            decoration.to,
            view.state.schema.text(replacement)
          );
        });
      view.dispatch(tr);
      result = this.find(searchState.searchTerm, searchState.options);
    });
    return result;
  }
  scrollToMatch(direction: 'next' | 'previous'): number {
    let newIndex = -1;
    if (!this.editor) return newIndex;
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const pluginState = searchPluginKey.getState(view.state);

      if (!pluginState?.initialized || pluginState.matches.length === 0) {
        return newIndex;
      }
      view.dispatch(
        view.state.tr.setMeta(searchPluginKey, {
          action: 'navigate',
          direction: direction
        })
      );
      const newState = searchPluginKey.getState(view.state);
      newIndex = newState?.currentIndex ?? -1;

      const match = pluginState.matches[newIndex];
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, match.from)
      );
      view.dispatch(tr);

      // 使用原生DOM API滚动到匹配位置
      const node = view.domAtPos(match.from).node;
      if (node instanceof HTMLElement) {
        node.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    });
    return newIndex;
  }

  public getContent(): string {
    return this.crepe?.getMarkdown() ?? '';
  }
  public insertText(text: string): void {
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state } = view
      const { from } = state.selection
      const tr = state.tr.insertText(text, from)
      tr.insertText(text, from)
      view.dispatch(tr)
    });
  }
  public insertImage(src: string, alt?: string, title?: string): void {
    this.editor?.action((ctx) => {
      const commands = ctx.get(commandsCtx);
      commands.call(
        insertImageCommand.key,
        {
          src: src,
          alt: alt,
          title: title
        }
      );
    });
  }
  public updateSettings(newSettings: any): void {
    const oldSettings = this.settings;
    this.settings = { ...newSettings };

    // Check if emoji setting changed
    if (newSettings.markdown.extends.enableEmoji !== oldSettings?.markdown?.extends?.enableEmoji) {
      if (newSettings.markdown.extends.enableEmoji) {
        this.editor?.use(emoji);
      } else {
        this.editor?.remove(emoji);
      }
    }

    // Check if indent settings changed
    if (newSettings.editor.indent.useTab !== oldSettings?.editor?.indent?.useTab ||
      newSettings.editor.indent.indentUnit !== oldSettings?.editor?.indent?.indentUnit) {
      this.editor?.action((ctx) => {
        ctx.set(indentConfig.key, {
          type: newSettings.editor.indent.useTab ? 'tab' : 'space',
          size: newSettings.editor.indent.indentUnit,
        } as IndentConfigOptions);
      });
    }
  }

  public updateTOC(): void {
    if (!this.isActive) return
    const items: OutlineItem[] = [];
    const view = this.editor?.action((ctx) => ctx.get(editorViewCtx));
    if (!view) return;

    const stack: { item: OutlineItem; children: OutlineItem[] }[] = [];

    view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && this.settingsStore.state.markdown.tocDepth.includes(node.attrs.level)) {
        const newItem: OutlineItem = {
          id: node.attrs.id || `heading-${pos}`,
          text: node.textContent,
          level: node.attrs.level,
          pos: pos,
          children: []
        };

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (newItem.level > top.item.level) {
            top.children.push(newItem);
            stack.push({ item: newItem, children: newItem.children! });
            return;
          } else {
            stack.pop();
          }
        }

        items.push(newItem);
        stack.push({ item: newItem, children: newItem.children! });
      }
    });
    this.tabStore.updateOutline(this.id, items);
    console.log(items)
  }

  public activate(): void {
    this.checkSettingsUpdate();
    this.isActive = true;
    this.updateTOC();
  }

  public deactivate(): void {
    this.isActive = false;
  }
  public getFileInfo(): AppFileInfo | undefined {
    return this.fileStore.get(this.tabStore.state[this.id].filePath!);
  }

  public scrollTo(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  public async updateContent(content: string): Promise<void> {
    this.editor?.action((ctx) => {
      replaceAll(content, false)(ctx)
    })
  }

  private checkSettingsUpdate(): void {
    const currentSettings = { ...this.settingsStore.state };
    if (JSON.stringify(currentSettings) !== JSON.stringify(this.settings)) {
      this.updateSettings(currentSettings);
    }
  }

  public async exportHtml() {
    if (!this.editor) return;
    await this.editor.action(async (ctx) => {
      // 获取当前内容 HTML
      const contentHTML = getHTML()(ctx);

      // 获取 Milkdown 主题样式
      const themeStyles = await this.getEditorStyles();

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
      
      /* 基础样式增强 */
      .milkdown {
        padding: 20px;
        background: var(--background, #fff);
        color: var(--text, #333);
      }
      .ProseMirror {
        outline: none;
      }
      /* 确保图片等资源使用绝对路径 */
      img {
        max-width: 100%;
      }
    </style>
  </head>
  <body class="milkdown">
    <div class="editor">
      ${contentHTML}
    </div>
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
    });
  }

  // 获取编辑器当前样式
  private async getEditorStyles(): Promise<string> {
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
        ${this.getCSSVariables()}
      }
    `;

    return cssText;
  }

  // 获取当前 CSS 变量
  private getCSSVariables(): string {
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
  public setHeadings(level: number) {
    this.editor?.action(callCommand(wrapInHeadingCommand.key, level));
  }
  public turnIntoText(): void {
    this.editor?.action(callCommand(turnIntoTextCommand.key));
  }
  public blockquote(): void {
    this.editor?.action(callCommand(wrapInBlockquoteCommand.key));
  }
  /**
   * Keymap for list item node.
   * `<Enter>`: Split the current list item.
   * `<Tab>/<Mod-]>`: Sink the current list item.
   * `<Shift-Tab>/<Mod-[>`: Lift the current list item.
   */
  public orderedList(): void {
    this.editor?.action(callCommand(wrapInOrderedListCommand.key));
  }
  public unorderedList(): void {
    this.editor?.action(callCommand(wrapInBulletListCommand.key));
  }
  /**
   * TODO：设置默认的代码块语言
   * @param language 
   * @param code 
   */
  public createCodeBlock(): void {
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const state = view.state;
      const langState = codeBlockMemoryPluginKey.getState(state);
      this.editor?.action(callCommand(createCodeBlockCommand.key, langState?.lastLanguage || 'text'));
    })
  }
  /**
   * 行内代码块
   */
  public toggleInlineCode() {
    this.editor?.action(callCommand(toggleInlineCodeCommand.key))
  }
  // insertHrCommand
  public insertHr() {
    this.editor?.action(callCommand(insertHrCommand.key));
  }
  // 斜体
  public toggleItalic() {
    this.editor?.action(callCommand(toggleEmphasisCommand.key))
  }
  public toggleStrong() {
    this.editor?.action(callCommand(toggleStrongCommand.key))
  }
  /**
   * also updateLinkCommand
   */
  public toggleLink() {
    this.editor?.action(callCommand(toggleStrongCommand.key))
  }
  /**
   * moveRowCommand `: $Command`
   * moveColCommand `: $Command`
   * selectRowCommand `: $Command`
   * selectColCommand `: $Command`
   */
  public insertTable(row: number, col: number) {
    this.editor?.action(callCommand(insertTableCommand.key, { row: row || 3, col: col || 3 }));
  }
  // 删除线
  public toggleStrikethrough() {
    this.editor?.action(callCommand(toggleStrikethroughCommand.key))
  }
}
