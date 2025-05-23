import { MilkdownEditorInstance } from "@/components/editor/composable/milkdownEditor";
import { FindOptions, FindResult } from "@/components/editor/composable/types";


export class MilkdownEditorManager {
  private static instance: MilkdownEditorManager;
  private editors: Map<string, MilkdownEditorInstance> = new Map();
  private currentEditorId: string | undefined = undefined;

  private constructor() { }

  public static getInstance(): MilkdownEditorManager {
    if (!MilkdownEditorManager.instance) {
      MilkdownEditorManager.instance = new MilkdownEditorManager();
    }
    return MilkdownEditorManager.instance;
  }

  public getEditor(id: string): MilkdownEditorInstance | undefined {
    return this.editors.get(id);
  }
  public setEditor(id: string, editor: MilkdownEditorInstance): void {
    this.editors.set(id, editor);
    editor.activate();
  }
  public removeEditor(id: string): void {
    if (this.currentEditorId === id) {
      this.currentEditorId = undefined;
    }
    this.editors.get(id)?.destroy();
    this.editors.delete(id);
  }
  public setActiveEditor(id: string | undefined): void {
    if (this.currentEditorId === id) return;

    // Deactivate current editor
    if (this.currentEditorId) {
      this.editors.get(this.currentEditorId)?.deactivate();
    }

    // Activate new editor
    this.currentEditorId = id;
    if (id) {
      const editor = this.editors.get(id);
      if (editor) {
        editor.activate();
      }
    }
  }

  public getActiveEditor(): MilkdownEditorInstance | undefined {
    if (!this.currentEditorId) return undefined;
    return this.editors.get(this.currentEditorId);
  }

  public undo(): void {
    this.getActiveEditor()?.undo();
  }

  public redo(): void {
    this.getActiveEditor()?.redo();
  }
  public cut(): void {
    this.getActiveEditor()?.cut();
  }
  public copy(): void {
    this.getActiveEditor()?.copy();
  }
  public paste(): void {
    this.getActiveEditor()?.paste();
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