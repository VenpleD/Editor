import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { ResolvedPos } from "prosemirror-model";

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
  static findNodeWith(view: EditorView, className: String) {
    let resultNode: Node | null = null;
    let resultPos: number = -1;
    view.state.doc.descendants((node: Node, pos: number) => {
      if (node.type.name === className) {
        resultNode = node;
        resultPos = pos;
      }
    });
    return { node: resultNode, pos: resultPos };
  }
  static getNodeContent(view: EditorView, pos: ResolvedPos) {
    let content: string | null = null;
    content = view.state.doc.textBetween(pos.start(), pos.end(), "");
    return content
  }
}

export default Utils;