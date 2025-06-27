import { Plugin } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';

const ImagePlugin = new Plugin({
    props: {
        handleKeyDown(view, event) {
            const { state, dispatch } = view;
            const { selection } = state;
            if (event.key !== 'Backspace' && event.key !== 'Delete') return false;
            if (!selection.empty) return false;

            const { $from } = selection;
            if ($from.parentOffset === 0 && $from.depth > 0) {
                const paraStart = $from.before($from.depth);
                if (paraStart === 0) return false;
                const prevNodeEnd = paraStart - 1;
                const $prev = state.doc.resolve(prevNodeEnd);

                if ($prev.depth === 0) {
                    let reulst = false;
                    // 直接遍历 doc 的子节点
                    state.doc.forEach((node: ProseMirrorNode, pos) => {
                        if (pos <= prevNodeEnd && prevNodeEnd < pos + node.nodeSize) {
                            if (node && node.type.name === 'imageContainer') {
                                const tr = state.tr.delete(pos, pos + node.nodeSize);
                                dispatch(tr.scrollIntoView());
                                reulst = true;
                            }
                        }
                    });
                    return reulst;
                } else {
                    const prevNodeStart = $prev.start($prev.depth);
                    const prevNode = state.doc.nodeAt(prevNodeStart);
                    if (prevNode && prevNode.type.name === 'imageContainer') {
                        const tr = state.tr.delete(prevNodeStart, prevNodeStart + prevNode.nodeSize);
                        dispatch(tr.scrollIntoView());
                        return true;
                    }
                }
            }
            return false;
        }
    }
});

export default ImagePlugin;