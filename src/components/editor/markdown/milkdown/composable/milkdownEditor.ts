import { useEditor } from "@milkdown/vue";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { useSettingsStore } from "@/stores/settingsStore";
import { ListenerManager } from '@milkdown/plugin-listener'
import type { Ctx } from '@milkdown/ctx'
import { commandsCtx, Editor, editorViewCtx } from "@milkdown/kit/core";
import { useEdit } from "@/composable/useEdit";
import {
  createCodeBlockCommand, insertHrCommand, insertImageCommand,
  toggleEmphasisCommand, toggleInlineCodeCommand, toggleStrongCommand,
  turnIntoTextCommand, wrapInBlockquoteCommand, wrapInBulletListCommand,
  wrapInHeadingCommand, wrapInOrderedListCommand
}
  from '@milkdown/preset-commonmark';
import { callCommand, replaceAll } from '@milkdown/utils';
import type { AppFileInfo, OutlineItem } from "@/types/appTypes";
import { indentConfig, type IndentConfigOptions } from '@milkdown/plugin-indent'
import { historyKeymap, redoCommand, undoCommand } from "@milkdown/plugin-history";
import { TextSelection } from "@milkdown/prose/state";
import type { FindResult, IMilkdownEditor } from "../../types";
import { getDeviceInfo } from "@/services/deviceService";
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import { useFileStore } from "@/stores/fileStore";
import { useDebounceFn } from '@vueuse/core';
import type { AppSettings } from "@/types/appSettings";
import { closeImageSource, createFileInnerSrc } from "@/utils/pathUtil";
import { uploadImage } from "@/utils/clipboardUtil";
import { useTabStore } from "@/stores/tabStore";
import { type Ref, watch } from "vue";
import { searchPlugin, searchPluginKey } from "../../plugins/find/composable/searchPlugin";
import { languages } from '@codemirror/language-data'
import { mermaidLanguageSupport, mermaidPreviewer } from "../../plugins/mermaid/mermaidConfig";
import { exportHtml } from "../../plugins/export/exportHtml";

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
          [CrepeFeature.CodeMirror]: {
            languages: this.getCodeMirrorLanguage(),
            renderPreview: this.getRenderPreview()
          }
        }
      });
      this.crepe = crepe;
      this.autoSave();
      crepe.editor.use(searchPlugin).config((ctx) => {
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
  private getCodeMirrorLanguage() {
    if (this.settingsStore.state.markdown.extensions.enableMermaid) {
      languages.push(mermaidLanguageSupport)
    }
    return languages
  }
  private getRenderPreview() {
    if (this.settingsStore.state.markdown.extensions.enableMermaid) {
      return mermaidPreviewer
    }
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
  public async updateSettings(newSettings: any): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...newSettings };

    // Check if emoji setting changed
    if (newSettings.markdown.extends.enableEmoji !== oldSettings?.markdown?.extends?.enableEmoji) {
      const { emoji } = await import('@milkdown/plugin-emoji');
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
    exportHtml(this.editor);
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
    this.editor?.action(callCommand(createCodeBlockCommand.key, 'text'));
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
  public insertTable(row: number, col: number) {
    this.editor?.action(callCommand(insertTableCommand.key, { row: row || 3, col: col || 3 }));
  }
  // 删除线
  public toggleStrikethrough() {
    this.editor?.action(callCommand(toggleStrikethroughCommand.key))
  }
}
