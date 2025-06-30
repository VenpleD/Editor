import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

type TransactionCallback = (state: EditorState, view: EditorView) => void;

/// 这个对象添加的回调，是在视图的 dispatchTransaction 浏览器2帧之后回调 方法中执行的
/// 也就是每次有事务发生时，都会执行这些回调
/// 这些回调会在事务被应用后执行，确保可以访问到最新的状态和视图
/// 这些回调只会执行一次，执行后会被清除
/// 这样可以避免重复执行同一个回调
class TransactionCallbackManager {
  private callbacks: Set<TransactionCallback> = new Set();

  add(cb: TransactionCallback) {
    this.callbacks.add(cb);
  }

  runAll(state: EditorState, view: EditorView) {
    const toRun = Array.from(this.callbacks);
    this.callbacks.clear();
    toRun.forEach(cb => cb(state, view));
  }
}

export default new TransactionCallbackManager();