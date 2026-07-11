import { MilkdownEditorInstance } from "@/components/editor/markdown/milkdown/composable/milkdownEditor";
import type { FindOptions, FindResult } from "@/components/editor/markdown/types";
import { t } from "src/i18n";


export class MilkdownEditorManager {
  private static instance: MilkdownEditorManager;
  private editor: MilkdownEditorInstance | undefined = undefined;
  private currentEditorId: string | undefined = undefined;

  private constructor() { }

  public static getInstance(): MilkdownEditorManager {
    if (!MilkdownEditorManager.instance) {
      MilkdownEditorManager.instance = new MilkdownEditorManager();
    }
    return MilkdownEditorManager.instance;
  }

  public getEditor(id: string): MilkdownEditorInstance | undefined {
    if (id === this.currentEditorId) {
      return this.editor
    }
  }
  public setEditor(id: string, editor: MilkdownEditorInstance): void {
    if (id === this.currentEditorId && this.editor) {
    } else {
      this.editor = editor;
      this.currentEditorId = id;
    }
    this.editor.activate();
  }
  /**
   * 创建一个新的编辑器实例
   * @param id - 编辑器的唯一标识符
   * @param content - 编辑器的初始内容
   * @returns 创建的编辑器实例
   */
  public createEditor(id: string, content: string): MilkdownEditorInstance {
    const editor = new MilkdownEditorInstance(id, content);
    this.setEditor(id, editor);
    return editor;
  }
  public removeEditor(id: string): void {
    if (this.currentEditorId !== id) {
      return;
    }
    this.currentEditorId = undefined;
    this.editor?.destroy();
    this.editor = undefined;
  }
  public destroyEditor(): void {
    this.removeEditor(this.currentEditorId || '');
  }
  public setActiveEditor(id: string | undefined): void {
    if (this.currentEditorId === id) return;

    // Deactivate current editor
    if (this.currentEditorId) {
      this.editor?.deactivate();
    }

    // Activate new editor
    this.currentEditorId = id;
    if (id && this.editor) {
      console.log("activate editor", id);
      this.editor?.activate();
    }
  }

  public getActiveEditor(): MilkdownEditorInstance | undefined {
    return this.getEditor(this.currentEditorId || '');
  }
  public updateId(oldId: string, newId: string): void {
    if (oldId === newId || oldId != this.currentEditorId) return;
    this.getEditor(oldId)?.updateId(newId);
    this.currentEditorId = newId;
  }
  public undo(): void {
    this.getActiveEditor()?.undo();
  }

  public redo(): void {
    this.getActiveEditor()?.redo();
  }
  public find(text: string, options: FindOptions): FindResult | undefined {
    return this.getActiveEditor()?.find(text, options);
  }
  public scrollToMatch(direction: 'next' | 'previous'): number | undefined {
    return this.getActiveEditor()?.scrollToMatch(direction);
  }
  public replaceAllMatches(replacement: string): FindResult | undefined {
    return this.getActiveEditor()?.replaceAllMatches(replacement);
  }
  public replace(replaceText: string): FindResult | undefined {
    return this.getActiveEditor()?.replaceCurrentMatch(replaceText);
  }
  public exportHtml(): void {
    this.getActiveEditor()?.exportHtml();
  }
  public getContent(): string | undefined {
    return this.getActiveEditor()?.getContent();
  }
  public scrollTo(id: string): void {
    console.log(id, this.getContent())
    this.getActiveEditor()?.scrollTo(id);
  }
  public updateContent(content: string): void {
    this.getActiveEditor()?.updateContent(content);
  }
  public saveFile() {
    this.getActiveEditor()?.saveFile();
  }
  public setHeading(level: number) {
    this.getActiveEditor()?.setHeadings(level);
  }
  public turnIntoText() {
    this.getActiveEditor()?.turnIntoText();
  }
  public blockquote() {
    this.getActiveEditor()?.blockquote();
  }
  public orderedList() {
    this.getActiveEditor()?.orderedList();
  }
  public unorderedList() {
    this.getActiveEditor()?.unorderedList();
  }
  public createCodeBlock() {
    this.getActiveEditor()?.createCodeBlock();
  }
  public toggleInlineCode() {
    this.getActiveEditor()?.toggleInlineCode();
  }
  public insertHr() {
    this.getActiveEditor()?.insertHr();
  }
  public toggleItalic() {
    this.getActiveEditor()?.toggleItalic();
  }
  public toggleStrong() {
    this.getActiveEditor()?.toggleStrong();
  }
  public toggleLink() {
    this.getActiveEditor()?.toggleLink();
  }
  public insertTable(rows: number, cols: number) {
    this.getActiveEditor()?.insertTable(rows, cols);
  }
  public toggleStrikethrough() {
    this.getActiveEditor()?.toggleStrikethrough();
  }
  public insertText(text: string) {
    this.getActiveEditor()?.insertText(text);
  }
  public insertImage(src: string, alt?: string, title?: string) {
    this.getActiveEditor()?.insertImage(src, alt, title);
  }
}

export const milkdownManager = MilkdownEditorManager.getInstance();