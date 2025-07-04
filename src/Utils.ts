import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { ResolvedPos } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

interface FindNodeResult {
  node: Node | null;
  pos: ResolvedPos | null;
  posIndex: number; // 节点前的位置所以|<p></p>
}

class Utils {
  static findCutBefore(pos: ResolvedPos): ResolvedPos | null {
    if (!pos.parent.type.spec.isolating) {
      for (var i = pos.depth - 1; i >= 0; i--) {
        let indexObj = pos.index(i)
        if (indexObj > 0) {
          return pos.doc.resolve(pos.before(i + 1))
        };
        if (pos.node(i).type.spec.isolating) break;
      }
    }
    return null;
  }
  static findCurrentNode(pos: ResolvedPos): ResolvedPos | null {
    if (!pos.parent.type.spec.isolating) {
      for (var i = pos.depth - 1; i >= 0; i--) {
        let indexObj = pos.index(i)
        if (indexObj > 0) {
          return pos.doc.resolve(pos.start(i))
        };
        if (pos.node(i).type.spec.isolating) break;
      }
    }
    return null;
  }
  static findNodeWith(state: EditorState, className: String): FindNodeResult {
    let resultNode: Node | null = null;
    let resultPos: ResolvedPos | null = null;
    let resultPosIndex: number = -1;
    state.doc.descendants((node: Node, pos: number) => {
      let tempResolvePos = state.doc.resolve(pos);
      if (node.type.name === className) {
        resultNode = node;
        resultPosIndex = pos;
        resultPos = tempResolvePos;
      }
    });
    return { node: resultNode, pos: resultPos, posIndex: resultPosIndex };
  }
  static findNextNode(state: EditorState, currentNode: Node): FindNodeResult {
    let resultNode: Node | null = null;
    let resultPos: ResolvedPos | null = null;
    let resultPosIndex: number = -1;
    let needNext = false;
    state.doc.descendants((node: Node, pos: number) => {
      let tempResolvePos = state.doc.resolve(pos);
      if (node === currentNode) {
        needNext = true;
        return; // 找到当前节点后，继续查找下一个节点
      }
      if (needNext) {
        resultNode = node;
        resultPosIndex = pos;
        resultPos = tempResolvePos;
        needNext = false; // 只获取下一个节点
      }
    });
    return { node: resultNode, pos: resultPos, posIndex: resultPosIndex };
  }
  static lastNodeWith(state: EditorState): FindNodeResult {
    let resultNode: Node | null = null;
    let resultPos: ResolvedPos | null = null;
    let resultPosIndex: number = -1;
    state.doc.descendants((node: Node, pos: number, parent: Node | null, index: number) => {
      let tempResolvePos = state.doc.resolve(pos);
      resultNode = node;
      resultPosIndex = pos;
      resultPos = tempResolvePos;
    });
    return { node: resultNode, pos: resultPos, posIndex: resultPosIndex };
  }
  static getNodeContent(view: EditorView, pos: ResolvedPos) {
    let content: string | null = null;
    content = view.state.doc.textBetween(pos.start(), pos.end(), "");
    return content
  }

  static getCurrentTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }
}

export default Utils;