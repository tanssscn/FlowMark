import { Editor } from "@milkdown/kit/core";
import { DecorationSet } from '@milkdown/prose/view';

export interface FindOptions {
  matchCase: false,
  wholeWord: false,
  regex: false
}
// Manager class to handle multiple editor instances
export interface IMilkdownEditor {
  id: string;
  editor: Editor | null;
  settings: any;
  getContent: () => string;
  async updateContent: (content: string) => Promise<void>;
}
export interface FindResult {
  count: number
  currentIndex: number
}