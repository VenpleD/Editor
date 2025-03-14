import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { ResolvedPos } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

class Utils {
  static findCutBefore(pos: ResolvedPos): ResolvedPos | null {
    if (!pos.parent.type.spec.isolating) {
      for (var i = pos.depth - 1; i >= 0; i--) {
        if (pos.index(i) > 0) {
          return pos.doc.resolve(pos.before(i + 1))
        };
        if (pos.node(i).type.spec.isolating) break;
      }
    }
    return null;
  }
  static findNodeWith(state: EditorState, className: String) {
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
  static getNodeContent(view: EditorView, pos: ResolvedPos) {
    let content: string | null = null;
    content = view.state.doc.textBetween(pos.start(), pos.end(), "");
    return content
  }
}

export default Utils;